import { requireAdmin } from '@/lib/server/auth'
import { json, db, now } from '@/lib/server/db'

interface VendorRow {
  id: string
  name: string
  email: string | null
  type: string | null
  is_active: number
  user_id: string | null
  created_at: string
  updated_at: string
}

const transformVendor = (row: VendorRow) => ({
  id: row.id,
  name: row.name,
  email: row.email ?? '',
  type: row.type ?? 'bazaf',
  isActive: row.is_active === 1,
  userId: row.user_id ?? '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

export async function GET(_request: Request, ctx: { params: { id: string } }) {
  const row = await db()
    .prepare('SELECT * FROM vendors WHERE id = ?')
    .bind(ctx.params.id)
    .first<VendorRow>()
  if (!row) return json({ error: 'Vendor not found' }, { status: 404 })
  return json({ vendor: transformVendor(row) })
}

export async function PUT(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    name?: string
    userId?: string
    type?: string
  } | null
  const name = body?.name
  if (!name) return json({ error: 'Name is required' }, { status: 400 })

  await db()
    .prepare(
      'UPDATE vendors SET name = ?, user_id = ?, type = COALESCE(?, type), updated_at = ? WHERE id = ?'
    )
    .bind(name, body?.userId?.trim() ?? null, body?.type ?? null, now(), ctx.params.id)
    .run()

  const row = await db()
    .prepare('SELECT * FROM vendors WHERE id = ?')
    .bind(ctx.params.id)
    .first<VendorRow>()
  if (!row) return json({ error: 'Vendor not found' }, { status: 404 })
  return json({ vendor: transformVendor(row) })
}

export async function DELETE(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  await db()
    .prepare('UPDATE vendors SET is_active = 0, updated_at = ? WHERE id = ?')
    .bind(now(), ctx.params.id)
    .run()
  return json({ id: ctx.params.id })
}
