import {
  createSessionCookie,
  hashPassword,
  verifyPassword
} from '@/lib/server/auth'
import { json, db, now, uuid } from '@/lib/server/db'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string
    password?: string
    isSignUp?: boolean
    role?: string
  } | null

  const email = body?.email?.trim().toLowerCase()
  const password = body?.password

  if (!email || !password)
    return json({ error: 'Email and password are required' }, { status: 400 })
  if (password.length < 8)
    return json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    )

  const database = db()
  const ts = now()

  if (body?.isSignUp) {
    const existing = await database
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first()
    if (existing)
      return json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )

    const userId = uuid()
    const passwordHash = await hashPassword(password)
    const isBootstrapAdmin = email === process.env.BOOTSTRAP_ADMIN_EMAIL
    const requestedRole = isBootstrapAdmin
      ? 'admin'
      : body.role === 'admin'
        ? 'user'
        : body.role ?? 'customer'

    await database
      .prepare(
        `INSERT INTO users (id, name, email, role, phone_number, photo_url, password_hash, created_at, updated_at, last_sign_in_at)
         VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)`
      )
      .bind(userId, email, email, requestedRole, passwordHash, ts, ts, ts)
      .run()

    const cookie = await createSessionCookie({
      uid: userId,
      email,
      name: email,
      role: requestedRole
    })
    return json(
      {
        user: {
          uid: userId,
          displayName: email,
          email,
          photoURL: null,
          role: requestedRole
        }
      },
      { headers: { 'Set-Cookie': cookie } }
    )
  }

  const row = await database
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<{
      id: string
      name: string | null
      role: string
      password_hash: string | null
    }>()

  if (!row || !row.password_hash) {
    return json({ error: 'Invalid email or password' }, { status: 401 })
  }
  const ok = await verifyPassword(password, row.password_hash)
  if (!ok) return json({ error: 'Invalid email or password' }, { status: 401 })

  const isBootstrapAdmin = email === process.env.BOOTSTRAP_ADMIN_EMAIL
  const role = isBootstrapAdmin ? 'admin' : row.role

  await database
    .prepare('UPDATE users SET role = ?, last_sign_in_at = ? WHERE id = ?')
    .bind(role, ts, row.id)
    .run()

  const cookie = await createSessionCookie({
    uid: row.id,
    email,
    name: row.name ?? email,
    role
  })

  return json(
    {
      user: {
        uid: row.id,
        displayName: row.name ?? email,
        email,
        photoURL: null,
        role
      }
    },
    { headers: { 'Set-Cookie': cookie } }
  )
}
