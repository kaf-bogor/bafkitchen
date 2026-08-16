import { requireAdmin } from '@/lib/server/auth'
import { json, db, now, parseJson } from '@/lib/server/db'

export async function DELETE(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const url = new URL(request.url)
  const productId = url.searchParams.get('productId')

  const database = db()
  const row = await database
    .prepare('SELECT * FROM schedules WHERE id = ?')
    .bind(ctx.params.id)
    .first<{ id: string; products: string }>()
  if (!row) return json({ error: 'Schedule not found' }, { status: 404 })

  if (productId) {
    const products = parseJson<{ id?: string }[]>(row.products, [])
    const updatedProducts = products.filter((p) => p.id !== productId)
    if (updatedProducts.length === 0) {
      await database.prepare('DELETE FROM schedules WHERE id = ?').bind(ctx.params.id).run()
    } else {
      await database
        .prepare('UPDATE schedules SET products = ?, updated_at = ? WHERE id = ?')
        .bind(JSON.stringify(updatedProducts), now(), ctx.params.id)
        .run()
    }
  } else {
    await database.prepare('DELETE FROM schedules WHERE id = ?').bind(ctx.params.id).run()
  }

  return json({
    message: 'deleted',
    deletedProductSchedule: {
      id: ctx.params.id,
      productId: productId ?? '',
      scheduleId: ctx.params.id
    }
  })
}