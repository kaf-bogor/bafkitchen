import { createSessionCookie } from '@/lib/server/auth'
import { json, db, now, uuid } from '@/lib/server/db'

interface GoogleTokenInfo {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
  picture?: string
  aud?: string
}

const verifyGoogleToken = async (token: string): Promise<GoogleTokenInfo | null> => {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
    )
    if (!res.ok) return null
    const info = (await res.json()) as GoogleTokenInfo
    if (!info.email) return null
    return info
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    googleToken?: string
  } | null
  if (!body?.googleToken) return json({ error: 'Missing token' }, { status: 400 })

  const info = await verifyGoogleToken(body.googleToken)
  if (!info) return json({ error: 'Invalid Google token' }, { status: 401 })

  const ts = now()
  const database = db()

  const existing = await database
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(info.email)
    .first<{
      id: string
      name: string | null
      role: string
      photo_url: string | null
    }>()

  let userId: string
  let role: string

  if (existing) {
    userId = existing.id
    role = existing.role
    const name = info.name ?? existing.name ?? null
    const photoUrl = info.picture ?? existing.photo_url ?? null
    await database
      .prepare(
        'UPDATE users SET name = COALESCE(?, name), photo_url = COALESCE(?, photo_url), last_sign_in_at = ? WHERE id = ?'
      )
      .bind(name, photoUrl, ts, userId)
      .run()
  } else {
    userId = uuid()
    role =
      info.email && info.email === process.env.BOOTSTRAP_ADMIN_EMAIL
        ? 'admin'
        : 'customer'
    await database
      .prepare(
        `INSERT INTO users (id, name, email, role, phone_number, photo_url, password_hash, created_at, updated_at, last_sign_in_at)
         VALUES (?, ?, ?, ?, NULL, ?, NULL, ?, ?, ?)`
      )
      .bind(
        userId,
        info.name ?? null,
        info.email,
        role,
        info.picture ?? null,
        ts,
        ts,
        ts
      )
      .run()
  }

  const cookie = await createSessionCookie({
    uid: userId,
    email: info.email,
    name: info.name ?? existing?.name ?? null,
    role
  })

  return json(
    {
      user: {
        uid: userId,
        displayName: info.name ?? existing?.name ?? null,
        email: info.email,
        photoURL: info.picture ?? null,
        role
      }
    },
    { headers: { 'Set-Cookie': cookie } }
  )
}
