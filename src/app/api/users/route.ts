import { requireAdmin } from '@/lib/server/auth'
import { json, db, now, uuid } from '@/lib/server/db'

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const { results } = await db()
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.phone_number, u.created_at, u.updated_at, u.last_sign_in_at,
              (SELECT v.id FROM vendors v WHERE v.user_id = u.id AND v.is_active = 1 LIMIT 1) AS vendor_id,
              (SELECT v.name FROM vendors v WHERE v.user_id = u.id AND v.is_active = 1 LIMIT 1) AS vendor_name
       FROM users u
       ORDER BY u.created_at DESC`
    )
    .all<{
      id: string
      name: string | null
      email: string
      role: string
      phone_number: string | null
      created_at: string
      updated_at: string
      last_sign_in_at: string | null
      vendor_id: string | null
      vendor_name: string | null
    }>()

  return json({
    users: results.map((u) => ({
      id: u.id,
      name: u.name ?? '',
      email: u.email,
      role: u.role,
      phoneNumber: u.phone_number,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      lastSignInAt: u.last_sign_in_at,
      vendorId: u.vendor_id,
      vendorName: u.vendor_name
    }))
  })
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    name?: string
    email?: string
    role?: string
    phoneNumber?: string
  } | null

  const name = body?.name?.trim()
  const email = body?.email?.trim().toLowerCase()
  if (!name || !email)
    return json({ error: 'Name and email are required' }, { status: 400 })

  const database = db()
  const existing = await database
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first()
  if (existing)
    return json(
      { error: 'A user with this email already exists' },
      { status: 409 }
    )

  const ts = now()
  const id = uuid()
  await database
    .prepare(
      `INSERT INTO users (id, name, email, role, phone_number, photo_url, password_hash, created_at, updated_at, last_sign_in_at)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, NULL)`
    )
    .bind(
      id,
      name,
      email,
      body?.role ?? 'user',
      body?.phoneNumber ?? null,
      ts,
      ts
    )
    .run()

  return json(
    {
      user: {
        id,
        name,
        email,
        role: body?.role ?? 'user',
        phoneNumber: body?.phoneNumber ?? null,
        createdAt: ts,
        updatedAt: ts,
        lastSignInAt: null
      }
    },
    { status: 201 }
  )
}
