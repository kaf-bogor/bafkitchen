import { IPurchase, IPurchaseItem, IProductPurchase } from '@/interfaces/purchase'
import { db } from '@/lib/server/db'

export interface PurchaseRow {
  id: string
  purchase_number: string | null
  supplier: string | null
  purchase_date: string
  note: string | null
  total_cost: number
  created_at: string
  updated_at: string
}

export interface PurchaseItemRow {
  id: string
  purchase_id: string
  product_id: string
  product_name: string | null
  qty: number
  cost_price: number
  sell_price: number
  subtotal: number
  created_at: string
}

/**
 * Human-readable, per-month sequential purchase number.
 * Format: PB-<sequence 3 digits><MM><YY>
 * Example: PB-0010926 (purchase #1, September 2026)
 */
export const generatePurchaseNumber = async (): Promise<string> => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)
  const suffix = `${month}${year}`

  const row = await db()
    .prepare(
      `SELECT MAX(CAST(substr(purchase_number, 4, length(purchase_number) - 7) AS INTEGER)) AS maxseq
       FROM purchases
       WHERE purchase_number LIKE ?`
    )
    .bind(`PB-%${suffix}`)
    .first<{ maxseq: number | null }>()

  const next = (row?.maxseq ?? 0) + 1
  return `PB-${String(next).padStart(3, '0')}${suffix}`
}

export const transformPurchaseItem = (row: PurchaseItemRow): IPurchaseItem => ({
  id: row.id,
  purchaseId: row.purchase_id,
  productId: row.product_id,
  productName: row.product_name ?? '',
  qty: row.qty ?? 0,
  costPrice: row.cost_price ?? 0,
  sellPrice: row.sell_price ?? 0,
  subtotal: row.subtotal ?? 0,
  margin: (row.sell_price ?? 0) - (row.cost_price ?? 0)
})

export const transformPurchase = (
  row: PurchaseRow,
  items: IPurchaseItem[]
): IPurchase => {
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0)
  const totalMargin = items.reduce(
    (sum, item) => sum + item.margin * item.qty,
    0
  )
  return {
    id: row.id,
    purchaseNumber: row.purchase_number ?? '',
    supplier: row.supplier ?? '',
    purchaseDate: row.purchase_date,
    note: row.note ?? '',
    totalCost: row.total_cost ?? 0,
    totalQty,
    totalMargin,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const loadPurchaseItems = async (
  purchaseId: string
): Promise<IPurchaseItem[]> => {
  const { results } = await db()
    .prepare(
      'SELECT * FROM purchase_items WHERE purchase_id = ? ORDER BY created_at ASC'
    )
    .bind(purchaseId)
    .all<PurchaseItemRow>()
  return results.map(transformPurchaseItem)
}

export interface ProductPurchaseRow {
  id: string
  purchase_id: string
  purchase_number: string | null
  supplier: string | null
  purchase_date: string
  qty: number
  cost_price: number
  sell_price: number
  subtotal: number
  created_at: string
}

export const loadPurchasesByProduct = async (
  productId: string
): Promise<IProductPurchase[]> => {
  const { results } = await db()
    .prepare(
      `SELECT pi.id, pi.purchase_id, p.purchase_number, p.supplier, p.purchase_date,
              pi.qty, pi.cost_price, pi.sell_price, pi.subtotal, pi.created_at
       FROM purchase_items pi
       JOIN purchases p ON p.id = pi.purchase_id
       WHERE pi.product_id = ?
       ORDER BY p.purchase_date DESC, pi.created_at DESC`
    )
    .bind(productId)
    .all<ProductPurchaseRow>()

  return results.map((row) => ({
    id: row.id,
    purchaseId: row.purchase_id,
    purchaseNumber: row.purchase_number ?? '',
    supplier: row.supplier ?? '',
    purchaseDate: row.purchase_date,
    qty: row.qty ?? 0,
    costPrice: row.cost_price ?? 0,
    sellPrice: row.sell_price ?? 0,
    subtotal: row.subtotal ?? 0,
    createdAt: row.created_at
  }))
}
