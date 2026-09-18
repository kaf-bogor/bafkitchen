import {
  IStockOpname,
  IStockOpnameFilters,
  IStockOpnameItem
} from '@/interfaces/stockOpname'
import { db, parseJson } from '@/lib/server/db'

export interface StockOpnameRow {
  id: string
  opname_number: string | null
  opname_date: string
  note: string | null
  status: string
  filters: string
  total_products: number
  total_difference: number
  finalized_at: string | null
  created_at: string
  updated_at: string
}

export interface StockOpnameItemRow {
  id: string
  opname_id: string
  product_id: string
  product_name: string | null
  sku: string | null
  unit: string | null
  system_stock: number
  counted_stock: number | null
  difference: number | null
  note: string | null
  created_at: string
  updated_at: string
}

/**
 * Human-readable, per-month sequential opname number.
 * Format: OP-<sequence 3 digits><MM><YY>
 * Example: OP-0010926 (opname #1, September 2026)
 */
export const generateOpnameNumber = async (): Promise<string> => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)
  const suffix = `${month}${year}`

  const row = await db()
    .prepare(
      `SELECT MAX(CAST(substr(opname_number, 4, length(opname_number) - 7) AS INTEGER)) AS maxseq
       FROM stock_opnames
       WHERE opname_number LIKE ?`
    )
    .bind(`OP-%${suffix}`)
    .first<{ maxseq: number | null }>()

  const next = (row?.maxseq ?? 0) + 1
  return `OP-${String(next).padStart(3, '0')}${suffix}`
}

export const transformStockOpnameItem = (
  row: StockOpnameItemRow
): IStockOpnameItem => ({
  id: row.id,
  opnameId: row.opname_id,
  productId: row.product_id,
  productName: row.product_name ?? '',
  sku: row.sku ?? '',
  unit: row.unit ?? '',
  systemStock: row.system_stock ?? 0,
  countedStock: row.counted_stock ?? null,
  difference: row.difference ?? null,
  note: row.note ?? '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

export const transformStockOpname = (
  row: StockOpnameRow,
  items?: IStockOpnameItem[]
): IStockOpname => {
  let filters: IStockOpnameFilters = {}
  try {
    filters = JSON.parse(row.filters || '{}')
  } catch {
    filters = {}
  }

  return {
    id: row.id,
    opnameNumber: row.opname_number ?? '',
    opnameDate: row.opname_date,
    note: row.note ?? '',
    status: row.status === 'finalized' ? 'finalized' : 'draft',
    filters,
    totalProducts: row.total_products ?? 0,
    totalDifference: row.total_difference ?? 0,
    finalizedAt: row.finalized_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(items ? { items } : {})
  }
}

export const loadOpnameItems = async (
  opnameId: string
): Promise<IStockOpnameItem[]> => {
  const { results } = await db()
    .prepare(
      'SELECT * FROM stock_opname_items WHERE opname_id = ? ORDER BY product_name ASC'
    )
    .bind(opnameId)
    .all<StockOpnameItemRow>()
  return results.map(transformStockOpnameItem)
}

export interface OpnameProductRow {
  id: string
  name: string
  sku: string | null
  unit: string | null
  stock: number
  vendor: string | null
  channels: string | null
}

/**
 * Products matching the opname filters, ordered by name. Mirrors the product
 * list filtering (vendor, channel, in-stock, categories).
 */
export const fetchOpnameProducts = async (
  filters: IStockOpnameFilters
): Promise<OpnameProductRow[]> => {
  const database = db()
  const { results } = await database
    .prepare(
      'SELECT id, name, sku, unit, stock, vendor, channels FROM products ORDER BY name ASC'
    )
    .all<OpnameProductRow>()
  let rows = results

  if (filters.vendorId) {
    rows = rows.filter(
      (row) =>
        parseJson<{ id?: string } | null>(row.vendor, null)?.id === filters.vendorId
    )
  }

  if (filters.channel) {
    rows = rows.filter((row) =>
      (row.channels || 'pos')
        .split(',')
        .map((c) => c.trim())
        .includes(filters.channel as string)
    )
  }

  if (filters.inStock) {
    rows = rows.filter((row) => (row.stock ?? 0) > 0)
  }

  if (filters.categoryIds?.length) {
    const ids = filters.categoryIds.slice(0, 20)
    const placeholders = ids.map(() => '?').join(',')
    const { results: categoryRows } = await database
      .prepare(
        `SELECT DISTINCT product_id FROM product_categories WHERE category_id IN (${placeholders})`
      )
      .bind(...ids)
      .all<{ product_id: string }>()
    const productIds = new Set(categoryRows.map((row) => row.product_id))
    rows = rows.filter((row) => productIds.has(row.id))
  }

  return rows
}
