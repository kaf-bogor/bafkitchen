import { requireAdmin } from '@/lib/server/auth'
import { json, db, now, uuid, parseJson } from '@/lib/server/db'

interface ProductRow {
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

const transformScheduleRow = (row: {
  id: string
  date: string
  products: string
  created_at: string
  updated_at: string
}) => ({
  id: row.id,
  date: row.date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  products: parseJson(row.products, [])
})

async function loadProductResponse(database: D1Database, productId: string) {
  const row = await database
    .prepare('SELECT * FROM products WHERE id = ?')
    .bind(productId)
    .first<ProductRow>()
  if (!row) return null

  const { results } = await database
    .prepare(
      `SELECT c.id, c.name FROM product_categories pc
       JOIN categories c ON c.id = pc.category_id
       WHERE pc.product_id = ?`
    )
    .bind(productId)
    .all<{ id: string; name: string }>()

  const storedVendor = parseJson<{ id?: string; name?: string } | null>(row.vendor, null)
  return {
    id: row.id,
    name: row.name,
    priceBase: row.price_base ?? 0,
    price: row.price,
    stock: row.stock ?? 0,
    description: row.description ?? '',
    imageUrl: row.image_url ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vendor: storedVendor ?? DEFAULT_VENDOR,
    categories: results
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')

  const database = db()
  let results: { id: string; date: string; products: string; created_at: string; updated_at: string }[]
  if (start && end) {
    results = (
      await database
        .prepare('SELECT * FROM schedules WHERE date >= ? AND date <= ? ORDER BY date ASC')
        .bind(new Date(start).toISOString(), new Date(end).toISOString())
        .all<{ id: string; date: string; products: string; created_at: string; updated_at: string }>()
    ).results
  } else {
    results = (
      await database
        .prepare('SELECT * FROM schedules ORDER BY date ASC')
        .all<{ id: string; date: string; products: string; created_at: string; updated_at: string }>()
    ).results
  }

  return json({ schedules: results.map(transformScheduleRow) })
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    productId?: string
    date?: string
  } | null

  if (!body?.productId || !body.date) {
    return json({ error: 'productId and date are required' }, { status: 400 })
  }

  const database = db()
  const productData = await loadProductResponse(database, body.productId)
  if (!productData) return json({ error: 'Product not found' }, { status: 404 })

  const targetDate = new Date(body.date)
  const dateStart = new Date(targetDate)
  dateStart.setHours(0, 0, 0, 0)
  const dateEnd = new Date(targetDate)
  dateEnd.setHours(23, 59, 59, 999)

  const ts = now()
  const existing = await database
    .prepare('SELECT * FROM schedules WHERE date >= ? AND date <= ? ORDER BY date ASC LIMIT 1')
    .bind(dateStart.toISOString(), dateEnd.toISOString())
    .first<{ id: string; date: string; products: string; created_at: string; updated_at: string }>()

  if (existing) {
    const existingProducts = parseJson<unknown[]>(existing.products, [])
    if (
      existingProducts.some(
        (p) => (p as { id?: string })?.id === body.productId
      )
    ) {
      return json({ error: 'Product is already scheduled for this date' }, { status: 409 })
    }
    const updatedProducts = [...existingProducts, productData]
    await database
      .prepare('UPDATE schedules SET products = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(updatedProducts), ts, existing.id)
      .run()
    return json({
      schedule: {
        id: existing.id,
        date: body.date,
        createdAt: existing.created_at,
        updatedAt: ts,
        products: updatedProducts
      }
    })
  }

  const id = uuid()
  await database
    .prepare(
      'INSERT INTO schedules (id, date, products, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, targetDate.toISOString(), JSON.stringify([productData]), ts, ts)
    .run()

  return json(
    {
      schedule: {
        id,
        date: body.date,
        createdAt: ts,
        updatedAt: ts,
        products: [productData]
      }
    },
    { status: 201 }
  )
}