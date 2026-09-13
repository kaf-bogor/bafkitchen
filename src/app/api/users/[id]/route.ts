import { hashPassword, requireAdmin } from '@/lib/server/auth'
import { json, db, now } from '@/lib/server/db'

interface UserRow {
  id: string
  name: string | null
  email: string
  role: string
  phone_number: string | null
  created_at: string
  updated_at: string
  last_sign_in_at: string | null
}

const transformUser = (u: UserRow) => ({
  id: u.id,
  name: u.name ?? '',
  email: u.email,
  role: u.role,
  phoneNumber: u.phone_number,
  createdAt: u.created_at,
  updatedAt: u.updated_at,
  lastSignInAt: u.last_sign_in_at
})

export async function GET(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const row = await db()
    .prepare(
      'SELECT id, name, email, role, phone_number, created_at, updated_at, last_sign_in_at FROM users WHERE id = ?'
    )
    .bind(ctx.params.id)
    .first<UserRow>()
  if (!row) return json({ error: 'User not found' }, { status: 404 })

  return json({ user: transformUser(row) })
}

export async function PUT(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    name?: string
    email?: string
    role?: string
    phoneNumber?: string
    password?: string
  } | null

  const name = body?.name?.trim()
  const email = body?.email?.trim().toLowerCase()
  if (!name || !email) return json({ error: 'Name and email are required' }, { status: 400 })

  const database = db()
  const existing = await database
    .prepare('SELECT id FROM users WHERE id = ?')
    .bind(ctx.params.id)
    .first()
  if (!existing) return json({ error: 'User not found' }, { status: 404 })

  const duplicate = await database
    .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
    .bind(email, ctx.params.id)
    .first()
  if (duplicate)
    return json({ error: 'A user with this email already exists' }, { status: 409 })

  const password = body?.password?.trim()
  if (password) {
    await database
      .prepare(
        'UPDATE users SET name = ?, email = ?, role = ?, phone_number = ?, password_hash = ?, updated_at = ? WHERE id = ?'
      )
      .bind(
        name,
        email,
        body?.role ?? 'user',
        body?.phoneNumber?.trim() || null,
        await hashPassword(password),
        now(),
        ctx.params.id
      )
      .run()
  } else {
    await database
      .prepare(
        'UPDATE users SET name = ?, email = ?, role = ?, phone_number = ?, updated_at = ? WHERE id = ?'
      )
      .bind(
        name,
        email,
        body?.role ?? 'user',
        body?.phoneNumber?.trim() || null,
        now(),
        ctx.params.id
      )
      .run()
  }

  const row = await database
    .prepare(
      'SELECT id, name, email, role, phone_number, created_at, updated_at, last_sign_in_at FROM users WHERE id = ?'
    )
    .bind(ctx.params.id)
    .first<UserRow>()
  if (!row) return json({ error: 'User not found' }, { status: 404 })

  return json({ user: transformUser(row) })
}

export async function DELETE(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  if (auth.uid === ctx.params.id)
    return json({ error: 'You cannot delete your own account' }, { status: 400 })

  const existing = await db()
    .prepare('SELECT id FROM users WHERE id = ?')
    .bind(ctx.params.id)
    .first()
  if (!existing) return json({ error: 'User not found' }, { status: 404 })

  await db().prepare('DELETE FROM users WHERE id = ?').bind(ctx.params.id).run()

  return json({ id: ctx.params.id })
}
