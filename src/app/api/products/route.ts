import { requireAdmin } from '@/lib/server/auth'
import { json, db, now, uuid, parseJson } from '@/lib/server/db'

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
  created_at: string
  updated_at: string
}

const DEFAULT_VENDOR = {
  id: 'baf-kitchen',
  name: 'Baf Kitchen',
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
  priceBase: row.price_base ?? 0,
  price: row.price,
  stock: row.stock ?? 0,
  description: row.description ?? '',
  imageUrl: row.image_url ?? '',
  availability: row.availability || 'ready',
  preorderStart: row.preorder_start ?? null,
  preorderEnd: row.preorder_end ?? null,
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
  if (storedVendor?.id && storedVendor.id !== 'baf-kitchen') {
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
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    name?: string
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
  } | null

  if (!body || !body.name) return json({ error: 'Name is required' }, { status: 400 })

  const ts = now()
  const id = uuid()
  const database = db()
  const categoryIds = body.categoryIds ?? []
  const availability = body.availability === 'preorder' ? 'preorder' : 'ready'

  await database
    .prepare(
      `INSERT INTO products (id, name, price_base, price, stock, vendor, category_ids, description, image_url, image_key, availability, preorder_start, preorder_end, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.name,
      body.priceBase ?? null,
      body.price ?? 0,
      body.stock ?? 0,
      body.vendor ? JSON.stringify(body.vendor) : null,
      JSON.stringify(categoryIds),
      body.description ?? '',
      body.imageUrl ?? '',
      body.imageKey ?? null,
      availability,
      availability === 'preorder' ? (body.preorderStart ?? null) : null,
      availability === 'preorder' ? (body.preorderEnd ?? null) : null,
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