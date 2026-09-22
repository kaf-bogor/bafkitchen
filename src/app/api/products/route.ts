import { getSession, requireAuth } from '@/lib/server/auth'
import { json, db, now, uuid, parseJson } from '@/lib/server/db'
import {
  loadDiscountsForProduct,
  loadDiscountsForProducts,
  replaceProductDiscounts
} from '@/lib/server/discounts'
import { getVendorForUser } from '@/lib/server/vendors'

import type { IProductDiscount, IProductDiscountInput } from '@/interfaces/discount'

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
  activities?: string | null
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
  vendor?: Record<string, unknown> | null,
  discounts: IProductDiscount[] = []
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
  categories,
  discounts
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
  const q = url.searchParams.get('q')
  const inStockFilter = url.searchParams.get('inStock')
  const sortParam = url.searchParams.get('sort')
  const limitParam = url.searchParams.get('limit')
  const offsetParam = url.searchParams.get('offset')
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
      (row.channels || 'pos')
        .split(',')
        .map((c) => c.trim())
        .includes(channelFilter)
    )
  }

  if (q) {
    const needle = q.toLowerCase()
    productRows = productRows.filter(
      (row) =>
        (row.name || '').toLowerCase().includes(needle) ||
        (row.description || '').toLowerCase().includes(needle)
    )
  }

  // Visibility rules
  const session = await getSession(request)
  if (!session) {
    // Public storefront: only approved, active products sold online
    productRows = productRows.filter(
      (row) =>
        (row.approval_status || 'approved') === 'approved' &&
        (row.is_active ?? 1) === 1 &&
        (row.channels || '')
          .split(',')
          .map((c) => c.trim())
          .includes('online')
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

  if (inStockFilter === '1') {
    productRows = productRows.filter((row) => (row.stock ?? 0) > 0)
  }

  productRows.sort((a, b) => {
    switch (sortParam) {
      case 'name_asc':
        return (a.name || '').localeCompare(b.name || '')
      case 'name_desc':
        return (b.name || '').localeCompare(a.name || '')
      case 'price_asc':
        return (a.price || 0) - (b.price || 0)
      case 'price_desc':
        return (b.price || 0) - (a.price || 0)
      case 'stock_desc':
        return (b.stock || 0) - (a.stock || 0)
      case 'stock_asc':
        return (a.stock || 0) - (b.stock || 0)
      default: {
        const aAvailability = a.availability || 'ready'
        const bAvailability = b.availability || 'ready'
        if (aAvailability !== bAvailability) {
          return aAvailability === 'ready' ? -1 : 1
        }
        return a.created_at < b.created_at ? 1 : -1
      }
    }
  })

  const total = productRows.length
  const limit = limitParam
    ? Math.max(1, Math.min(100, Number(limitParam) || 0))
    : 0
  const offset = offsetParam ? Math.max(0, Number(offsetParam) || 0) : 0
  const pageRows =
    limit > 0 ? productRows.slice(offset, offset + limit) : productRows

  // Batch-load categories for the returned page (chunked to respect the
  // bound-parameter limit) — avoids the previous N+1 query per product.
  const categoriesMap = new Map<string, { id: string; name: string }[]>()
  const uniqueIds = Array.from(new Set(pageRows.map((row) => row.id)))
  for (let i = 0; i < uniqueIds.length; i += 90) {
    const batch = uniqueIds.slice(i, i + 90)
    const placeholders = batch.map(() => '?').join(',')
    const { results } = await database
      .prepare(
        `SELECT pc.product_id AS product_id, c.id AS id, c.name AS name
         FROM product_categories pc
         JOIN categories c ON c.id = pc.category_id
         WHERE pc.product_id IN (${placeholders})`
      )
      .bind(...batch)
      .all<{ product_id: string; id: string; name: string }>()
    for (const r of results) {
      const list = categoriesMap.get(r.product_id) || []
      list.push({ id: r.id, name: r.name })
      categoriesMap.set(r.product_id, list)
    }
  }

  // Batch-load vendors once.
  const vendorRows = await database
    .prepare('SELECT * FROM vendors')
    .all<Record<string, unknown> & { id: string }>()
  const vendorMap = new Map(vendorRows.results.map((v) => [v.id, v]))

  const discountsMap = await loadDiscountsForProducts(
    database,
    pageRows.map((row) => row.id)
  )

  const products = pageRows.map((row) => {
    const storedVendor = parseJson<{ id?: string; name?: string } | null>(
      row.vendor,
      null
    )
    let vendor: Record<string, unknown> | null | undefined = storedVendor
    if (storedVendor?.id && storedVendor.id !== 'bazaf') {
      const v = vendorMap.get(storedVendor.id)
      if (v) vendor = v
    }
    return transformProduct(
      row,
      categoriesMap.get(row.id) || [],
      vendor,
      discountsMap.get(row.id) || []
    )
  })

  return json({ products, total })
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
    discounts?: IProductDiscountInput[]
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
  await replaceProductDiscounts(database, id, body.discounts)

  const row = await database
    .prepare('SELECT * FROM products WHERE id = ?')
    .bind(id)
    .first<ProductRow>()
  const [categories, vendor, discounts] = await Promise.all([
    loadCategories(database, id),
    row ? loadVendor(database, row) : Promise.resolve(null),
    loadDiscountsForProduct(database, id)
  ])
  return json(
    { product: row ? transformProduct(row, categories, vendor, discounts) : null },
    { status: 201 }
  )
}