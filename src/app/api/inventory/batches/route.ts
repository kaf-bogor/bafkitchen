import { IStockBatch } from '@/interfaces/purchase'
import { requireAdmin } from '@/lib/server/auth'
import { db, json } from '@/lib/server/db'

interface BatchRow {
  id: string
  product_id: string
  product_name: string | null
  product_current_name: string | null
  purchase_id: string
  purchase_number: string | null
  supplier: string | null
  qty_in: number
  qty_remaining: number
  cost_price: number
  sell_price: number
  received_at: string
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const url = new URL(request.url)
  const productId = url.searchParams.get('productId')

  const database = db()
  let query = `
    SELECT sb.id, sb.product_id, pi.product_name, p.name AS product_current_name,
           pi.purchase_id, pur.purchase_number, pur.supplier,
           sb.qty_in, sb.qty_remaining, sb.cost_price, sb.sell_price, sb.received_at
    FROM stock_batches sb
    JOIN purchase_items pi ON pi.id = sb.purchase_item_id
    JOIN purchases pur ON pur.id = pi.purchase_id
    JOIN products p ON p.id = sb.product_id`
  const params: unknown[] = []
  if (productId) {
    query += ' WHERE sb.product_id = ?'
    params.push(productId)
  }
  query += ' ORDER BY sb.received_at DESC, pur.created_at DESC'

  const { results } = await database
    .prepare(query)
    .bind(...params)
    .all<BatchRow>()

  const batches: IStockBatch[] = results.map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name || row.product_current_name || '',
    purchaseId: row.purchase_id,
    purchaseNumber: row.purchase_number ?? '',
    supplier: row.supplier ?? '',
    qtyIn: row.qty_in ?? 0,
    qtyRemaining: row.qty_remaining ?? 0,
    costPrice: row.cost_price ?? 0,
    sellPrice: row.sell_price ?? 0,
    potentialProfit: ((row.sell_price ?? 0) - (row.cost_price ?? 0)) * (row.qty_remaining ?? 0),
    receivedAt: row.received_at
  }))

  const summary = batches.reduce(
    (acc, batch) => {
      acc.totalRemaining += batch.qtyRemaining
      acc.totalValue += batch.costPrice * batch.qtyRemaining
      acc.potentialProfit += batch.potentialProfit
      return acc
    },
    { totalRemaining: 0, totalValue: 0, potentialProfit: 0 }
  )

  return json({ batches, summary })
}
