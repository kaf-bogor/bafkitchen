import { requireAdmin } from '@/lib/server/auth'
import { db, json, now } from '@/lib/server/db'
import {
  loadOpnameItems,
  transformStockOpname,
  type StockOpnameItemRow,
  type StockOpnameRow
} from '@/lib/server/stockOpname'

export async function POST(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const database = db()
  const row = await database
    .prepare('SELECT * FROM stock_opnames WHERE id = ?')
    .bind(ctx.params.id)
    .first<StockOpnameRow>()
  if (!row) return json({ error: 'Opname tidak ditemukan' }, { status: 404 })
  if (row.status === 'finalized') {
    return json({ error: 'Opname sudah difinalisasi' }, { status: 400 })
  }

  const { results: items } = await database
    .prepare(
      'SELECT * FROM stock_opname_items WHERE opname_id = ? AND counted_stock IS NOT NULL'
    )
    .bind(ctx.params.id)
    .all<StockOpnameItemRow>()

  if (!items.length) {
    return json(
      { error: 'Belum ada stok fisik yang diisi' },
      { status: 400 }
    )
  }

  const ts = now()
  const statements: D1PreparedStatement[] = []

  for (const item of items) {
    statements.push(
      database
        .prepare('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?')
        .bind(item.counted_stock ?? 0, ts, item.product_id)
    )
  }

  const totalDifference = items.reduce(
    (sum, item) => sum + (item.difference ?? 0),
    0
  )

  statements.push(
    database
      .prepare(
        `UPDATE stock_opnames
         SET status = 'finalized', finalized_at = ?, total_difference = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(ts, totalDifference, ts, ctx.params.id)
  )

  await database.batch(statements)

  const updated = await database
    .prepare('SELECT * FROM stock_opnames WHERE id = ?')
    .bind(ctx.params.id)
    .first<StockOpnameRow>()
  const updatedItems = await loadOpnameItems(ctx.params.id)

  return json({
    opname: updated ? transformStockOpname(updated, updatedItems) : null,
    adjusted: items.length
  })
}
