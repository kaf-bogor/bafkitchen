import { requireAdmin } from '@/lib/server/auth'
import { json, db, now } from '@/lib/server/db'

const ALLOWED = ['pending', 'approved', 'rejected']

export async function PUT(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    status?: string
  } | null
  const status = body?.status
  if (!status || !ALLOWED.includes(status)) {
    return json({ error: 'Invalid approval status' }, { status: 400 })
  }

  const database = db()
  const existing = await database
    .prepare('SELECT id FROM products WHERE id = ?')
    .bind(ctx.params.id)
    .first()
  if (!existing) return json({ error: 'Product not found' }, { status: 404 })

  await database
    .prepare('UPDATE products SET approval_status = ?, updated_at = ? WHERE id = ?')
    .bind(status, now(), ctx.params.id)
    .run()

  return json({ id: ctx.params.id, approvalStatus: status })
}
