import { requireAdmin } from '@/lib/server/auth'
import { db, json, now } from '@/lib/server/db'
import {
  loadOpnameItems,
  transformStockOpname,
  type StockOpnameRow
} from '@/lib/server/stockOpname'

export async function GET(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const row = await db()
    .prepare('SELECT * FROM stock_opnames WHERE id = ?')
    .bind(ctx.params.id)
    .first<StockOpnameRow>()
  if (!row) return json({ error: 'Opname tidak ditemukan' }, { status: 404 })

  const items = await loadOpnameItems(ctx.params.id)
  return json({ opname: transformStockOpname(row, items) })
}

export async function PUT(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const database = db()
  const row = await database
    .prepare('SELECT id, status FROM stock_opnames WHERE id = ?')
    .bind(ctx.params.id)
    .first<{ id: string; status: string }>()
  if (!row) return json({ error: 'Opname tidak ditemukan' }, { status: 404 })
  if (row.status === 'finalized') {
    return json({ error: 'Opname sudah difinalisasi' }, { status: 400 })
  }

  const body = (await request.json().catch(() => null)) as {
    items?: { id: string; countedStock: number | null; note?: string }[]
  } | null
  const items = Array.isArray(body?.items) ? body.items : []

  const ts = now()
  const statements: D1PreparedStatement[] = []

  for (const item of items) {
    if (!item?.id) continue
    const counted =
      item.countedStock === null || item.countedStock === undefined
        ? null
        : Math.max(0, Math.floor(Number(item.countedStock) || 0))
    statements.push(
      database
        .prepare(
          `UPDATE stock_opname_items
           SET counted_stock = ?,
               difference = CASE WHEN ? IS NULL THEN NULL ELSE ? - system_stock END,
               note = ?,
               updated_at = ?
           WHERE id = ? AND opname_id = ?`
        )
        .bind(
          counted,
          counted,
          counted,
          item.note?.trim() || '',
          ts,
          item.id,
          ctx.params.id
        )
    )
  }

  if (statements.length) {
    await database.batch(statements)
  }

  // Recompute the session's total difference from the stored items.
  const totals = await database
    .prepare(
      `SELECT COUNT(*) AS total, COALESCE(SUM(difference), 0) AS diff
       FROM stock_opname_items WHERE opname_id = ?`
    )
    .bind(ctx.params.id)
    .first<{ total: number; diff: number }>()

  await database
    .prepare(
      'UPDATE stock_opnames SET total_products = ?, total_difference = ?, updated_at = ? WHERE id = ?'
    )
    .bind(totals?.total ?? 0, totals?.diff ?? 0, ts, ctx.params.id)
    .run()

  const updated = await database
    .prepare('SELECT * FROM stock_opnames WHERE id = ?')
    .bind(ctx.params.id)
    .first<StockOpnameRow>()
  const updatedItems = await loadOpnameItems(ctx.params.id)

  return json({
    opname: updated ? transformStockOpname(updated, updatedItems) : null
  })
}

export async function DELETE(
  request: Request,
  ctx: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const database = db()
  const row = await database
    .prepare('SELECT id, status FROM stock_opnames WHERE id = ?')
    .bind(ctx.params.id)
    .first<{ id: string; status: string }>()
  if (!row) return json({ error: 'Opname tidak ditemukan' }, { status: 404 })
  if (row.status === 'finalized') {
    return json(
      { error: 'Opname yang sudah difinalisasi tidak bisa dihapus' },
      { status: 400 }
    )
  }

  await database.batch([
    database
      .prepare('DELETE FROM stock_opname_items WHERE opname_id = ?')
      .bind(ctx.params.id),
    database
      .prepare('DELETE FROM stock_opnames WHERE id = ?')
      .bind(ctx.params.id)
  ])

  return json({ success: true })
}
