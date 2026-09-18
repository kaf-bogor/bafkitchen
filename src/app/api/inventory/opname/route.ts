import { IStockOpnameFilters } from '@/interfaces/stockOpname'
import { requireAdmin } from '@/lib/server/auth'
import { db, json, now, uuid } from '@/lib/server/db'
import {
  fetchOpnameProducts,
  generateOpnameNumber,
  transformStockOpname,
  type StockOpnameRow
} from '@/lib/server/stockOpname'

const sanitizeFilters = (
  filters: IStockOpnameFilters | undefined
): IStockOpnameFilters => {
  if (!filters || typeof filters !== 'object') return {}
  const result: IStockOpnameFilters = {}
  if (filters.vendorId) result.vendorId = String(filters.vendorId)
  if (filters.channel) result.channel = String(filters.channel)
  if (filters.inStock) result.inStock = true
  if (Array.isArray(filters.categoryIds) && filters.categoryIds.length) {
    result.categoryIds = filters.categoryIds
      .map((id) => String(id))
      .filter(Boolean)
      .slice(0, 20)
  }
  return result
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const { results } = await db()
    .prepare('SELECT * FROM stock_opnames ORDER BY created_at DESC')
    .all<StockOpnameRow>()

  return json({ opnames: results.map((row) => transformStockOpname(row)) })
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    opnameDate?: string
    note?: string
    filters?: IStockOpnameFilters
  } | null

  const filters = sanitizeFilters(body?.filters)
  const products = await fetchOpnameProducts(filters)
  if (!products.length) {
    return json(
      { error: 'Tidak ada produk yang cocok dengan filter' },
      { status: 400 }
    )
  }

  const database = db()
  const ts = now()
  const opnameId = uuid()
  const opnameNumber = await generateOpnameNumber()
  const opnameDate = body?.opnameDate || ts

  const statements: D1PreparedStatement[] = [
    database
      .prepare(
        `INSERT INTO stock_opnames (id, opname_number, opname_date, note, status, filters, total_products, total_difference, finalized_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'draft', ?, ?, 0, NULL, ?, ?)`
      )
      .bind(
        opnameId,
        opnameNumber,
        opnameDate,
        body?.note?.trim() || '',
        JSON.stringify(filters),
        products.length,
        ts,
        ts
      )
  ]

  for (const product of products) {
    statements.push(
      database
        .prepare(
          `INSERT INTO stock_opname_items (id, opname_id, product_id, product_name, sku, unit, system_stock, counted_stock, difference, note, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, '', ?, ?)`
        )
        .bind(
          uuid(),
          opnameId,
          product.id,
          product.name || '',
          product.sku || '',
          product.unit || '',
          product.stock ?? 0,
          ts,
          ts
        )
    )
  }

  await database.batch(statements)

  const row = await database
    .prepare('SELECT * FROM stock_opnames WHERE id = ?')
    .bind(opnameId)
    .first<StockOpnameRow>()

  return json(
    { opname: row ? transformStockOpname(row) : null },
    { status: 201 }
  )
}
