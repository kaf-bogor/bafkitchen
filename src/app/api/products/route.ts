import { getSession, requireAuth } from '@/lib/server/auth'
import { json, db, now, uuid, parseJson } from '@/lib/server/db'
import { getVendorForUser } from '@/lib/server/vendors'

export interface ProductRow {
  id: string
  name: string
  price_base: number | null
  price: number
  stock: number
  vendor: string | null
  category_ids: string | null
  description: string | null
  image_url: string | null
  image_key: string | null
  availability: string
  preorder_start: string | null
  preorder_end: string | null
  sku: string | null
  unit: string
  is_active: number
  channels: string
  availability_type: string
  weekly_days: string | null
  specific_dates: string | null
  preorder_lead_days: number | null
  preorder_cutoff_time: string | null
  preorder_min_qty: number | null
  preorder_max_qty: number | null
  preorder_capacity: number | null
  fulfillment_type: string
  approval_status: string
  created_at: string
  updated_at: string
}

const DEFAULT_VENDOR = {
  id: 'bazaf',
  name: 'Bazaf',
  userId: '',
  isActive: false,
  createdAt: '',
  updatedAt: ''
}

const transformProduct = (
  row: ProductRow,
  categories: { id: string; name: string }[],
  vendor?: Record<string, unknown> | null
) => ({
  id: row.id,
  name: row.name,
  sku: row.sku ?? '',
  unit: row.unit || 'pcs',
  isActive: (row.is_active ?? 1) === 1,
  priceBase: row.price_base ?? 0,
  price: row.price,
  stock: row.stock ?? 0,
  description: row.description ?? '',
  imageUrl: row.image_url ?? '',
  availability: row.availability || 'ready',
  preorderStart: row.preorder_start ?? null,
  preorderEnd: row.preorder_end ?? null,
  channels: (row.channels || 'pos').split(',').filter(Boolean),
  availabilityType: row.availability_type || 'always',
  weeklyDays: parseJson<number[]>(row.weekly_days, []),
  specificDates: parseJson<string[]>(row.specific_dates, []),
  preorderLeadDays: row.preorder_lead_days ?? null,
  preorderCutoffTime: row.preorder_cutoff_time ?? null,
  preorderMinQty: row.preorder_min_qty ?? null,
  preorderMaxQty: row.preorder_max_qty ?? null,
  preorderCapacity: row.preorder_capacity ?? null,
  fulfillmentType: row.fulfillment_type || 'takeaway',
  approvalStatus: row.approval_status || 'approved',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  vendor: vendor ?? parseJson<Record<string, unknown> | null>(row.vendor, null) ?? DEFAULT_VENDOR,
  categories
})

async function loadCategories(database: D1Database, productId: string) {
  const { results } = await database
    .prepare(
      `SELECT c.id, c.name FROM product_categories pc
       JOIN categories c ON c.id = pc.category_id
       WHERE pc.product_id = ?`
    )
    .bind(productId)
    .all<{ id: string; name: string }>()
  return results
}

async function loadVendor(
  database: D1Database,
  row: ProductRow
): Promise<Record<string, unknown> | null | undefined> {
  const storedVendor = parseJson<{ id?: string; name?: string } | null>(row.vendor, null)
  if (storedVendor?.id && storedVendor.id !== 'bazaf') {
    const v = await database
      .prepare('SELECT * FROM vendors WHERE id = ?')
      .bind(storedVendor.id)
      .first()
    if (v) return v as Record<string, unknown>
  }
  return storedVendor ?? null
}

async function replaceProductCategories(
  database: D1Database,
  productId: string,
  categoryIds: string[]
) {
  await database.prepare('DELETE FROM product_categories WHERE product_id = ?').bind(productId).run()
  const stmt = database.prepare(
    'INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)'
  )
  for (const categoryId of categoryIds) {
    await stmt.bind(productId, categoryId).run()
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const categoryFilter = url.searchParams.get('categoryIds')
  const vendorFilter = url.searchParams.get('vendorId')
  const availabilityFilter = url.searchParams.get('availability')
  const channelFilter = url.searchParams.get('channel')
  const database = db()

  let productRows: ProductRow[] = []
  if (categoryFilter) {
    const ids = categoryFilter.split(',').filter(Boolean).slice(0, 10)
    const rows: ProductRow[] = []
    for (const id of ids) {
      const { results } = await database
        .prepare(
          `SELECT * FROM products WHERE id IN (
             SELECT product_id FROM product_categories WHERE category_id = ?
           )`
        )
        .bind(id)
        .all<ProductRow>()
      rows.push(...results)
    }
    const seen = new Set<string>()
    productRows = rows.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
  } else {
    const { results } = await database
      .prepare('SELECT * FROM products ORDER BY created_at DESC')
      .all<ProductRow>()
    productRows = results
  }

  if (vendorFilter) {
    const vendorId = decodeURIComponent(vendorFilter)
    productRows = productRows.filter((row) => {
      const storedVendor = parseJson<{ id?: string } | null>(row.vendor, null)
      return storedVendor?.id === vendorId
    })
  }

  if (availabilityFilter) {
    productRows = productRows.filter(
      (row) => (row.availability || 'ready') === availabilityFilter
    )
  }

  if (channelFilter) {
    productRows = productRows.filter((row) =>
      (row.channels || 'pos').split(',').includes(channelFilter)
    )
  }

  // Visibility rules
  const session = await getSession(request)
  if (!session) {
    // Public storefront: only approved and active products
    productRows = productRows.filter(
      (row) =>
        (row.approval_status || 'approved') === 'approved' &&
        (row.is_active ?? 1) === 1
    )
  } else if (session.role !== 'admin') {
    // Vendor: only their own products (any approval status)
    const vendor = await getVendorForUser(session.uid)
    productRows = vendor
      ? productRows.filter(
          (row) =>
            parseJson<{ id?: string } | null>(row.vendor, null)?.id === vendor.id
        )
      : []
  }

  productRows.sort((a, b) => {
    const aAvailability = a.availability || 'ready'
    const bAvailability = b.availability || 'ready'
    if (aAvailability !== bAvailability) {
      return aAvailability === 'ready' ? -1 : 1
    }
    return a.created_at < b.created_at ? 1 : -1
  })

  const products = await Promise.all(
    productRows.map(async (row) => {
      const [categories, vendor] = await Promise.all([
        loadCategories(database, row.id),
        loadVendor(database, row)
      ])
      return transformProduct(row, categories, vendor)
    })
  )

  return json({ products })
}

export async function POST(request: Request) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    name?: string
    sku?: string
    unit?: string
    isActive?: boolean
    priceBase?: number
    price?: number
    stock?: number | null
    vendor?: { id: string; name: string }
    categoryIds?: string[]
    description?: string
    imageUrl?: string
    imageKey?: string
    availability?: string
    preorderStart?: string | null
    preorderEnd?: string | null
    channels?: string[]
    availabilityType?: string
    weeklyDays?: number[]
    specificDates?: string[]
    preorderLeadDays?: number | null
    preorderCutoffTime?: string | null
    preorderMinQty?: number | null
    preorderMaxQty?: number | null
    preorderCapacity?: number | null
    fulfillmentType?: string
  } | null

  if (!body || !body.name) return json({ error: 'Name is required' }, { status: 400 })

  const database = db()
  const isAdmin = auth.role === 'admin'

  // Vendors may only submit products for their own vendor, and they need approval.
  let vendorPayload = body.vendor ?? null
  let approvalStatus = 'approved'
  if (!isAdmin) {
    const vendor = await getVendorForUser(auth.uid)
    if (!vendor) {
      return json({ error: 'Akun belum tertaut ke vendor' }, { status: 403 })
    }
    vendorPayload = { id: vendor.id, name: vendor.name }
    approvalStatus = 'pending'
  }

  const ts = now()
  const id = uuid()
  const categoryIds = body.categoryIds ?? []
  const availability = body.availability === 'preorder' ? 'preorder' : 'ready'
  const channels = body.channels?.length ? body.channels : ['pos']
  const availabilityType = body.availabilityType || 'always'

  await database
    .prepare(
      `INSERT INTO products (id, name, sku, unit, is_active, price_base, price, stock, vendor, category_ids, description, image_url, image_key, availability, preorder_start, preorder_end, channels, availability_type, weekly_days, specific_dates, preorder_lead_days, preorder_cutoff_time, preorder_min_qty, preorder_max_qty, preorder_capacity, fulfillment_type, approval_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.name,
      body.sku ?? null,
      body.unit || 'pcs',
      body.isActive === false ? 0 : 1,
      body.priceBase ?? null,
      body.price ?? 0,
      body.stock ?? 0,
      vendorPayload ? JSON.stringify(vendorPayload) : null,
      JSON.stringify(categoryIds),
      body.description ?? '',
      body.imageUrl ?? '',
      body.imageKey ?? null,
      availability,
      availability === 'preorder' ? (body.preorderStart ?? null) : null,
      availability === 'preorder' ? (body.preorderEnd ?? null) : null,
      channels.join(','),
      availabilityType,
      availabilityType === 'weekly' ? JSON.stringify(body.weeklyDays ?? []) : null,
      availabilityType === 'specific' ? JSON.stringify(body.specificDates ?? []) : null,
      body.preorderLeadDays ?? null,
      body.preorderCutoffTime ?? null,
      body.preorderMinQty ?? null,
      body.preorderMaxQty ?? null,
      body.preorderCapacity ?? null,
      body.fulfillmentType || 'takeaway',
      approvalStatus,
      ts,
      ts
    )
    .run()

  if (categoryIds.length) await replaceProductCategories(database, id, categoryIds)

  const row = await database
    .prepare('SELECT * FROM products WHERE id = ?')
    .bind(id)
    .first<ProductRow>()
  const [categories, vendor] = await Promise.all([
    loadCategories(database, id),
    row ? loadVendor(database, row) : Promise.resolve(null)
  ])
  return json({ product: row ? transformProduct(row, categories, vendor) : null }, { status: 201 })
}