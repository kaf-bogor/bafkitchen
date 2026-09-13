import { createSessionCookie } from '@/lib/server/auth'
import { db, now, uuid } from '@/lib/server/db'
import {
  clearStateCookie,
  exchangeCodeForToken,
  googleRedirectUri,
  readStoredState,
  verifyGoogleIdToken
} from '@/lib/server/googleOAuth'

const loginPathFor = (redirect: string) =>
  redirect.toLowerCase().startsWith('/admin') ? '/admin/login' : '/login'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const stored = readStoredState(request)

  let statePayload: { s: string; r: string } | null = null
  try {
    statePayload = JSON.parse(url.searchParams.get('state') ?? '') as {
      s: string
      r: string
    }
  } catch {
    statePayload = null
  }

  const redirect =
    statePayload?.r?.startsWith('/') && !statePayload.r.startsWith('//')
      ? statePayload.r
      : '/dashboard/'

  const fail = (code: string): Response => {
    const location = `${loginPathFor(redirect)}?error=${code}`
    const headers = new Headers({ Location: location })
    headers.append('Set-Cookie', clearStateCookie())
    return new Response(null, { status: 302, headers })
  }

  if (
    !stored ||
    !statePayload ||
    stored.state.length === 0 ||
    stored.state !== statePayload.s
  ) {
    return fail('state')
  }

  if (url.searchParams.get('error')) return fail('access_denied')

  const code = url.searchParams.get('code')
  if (!code) return fail('failed')

  const idToken = await exchangeCodeForToken({
    code,
    redirectUri: googleRedirectUri(request),
    verifier: stored.verifier
  })
  if (!idToken) return fail('failed')

  const info = await verifyGoogleIdToken(idToken)
  if (!info) return fail('failed')

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

  const isBootstrapAdmin = info.email === process.env.BOOTSTRAP_ADMIN_EMAIL

  if (existing) {
    userId = existing.id
    role = isBootstrapAdmin ? 'admin' : existing.role
    const name = info.name ?? existing.name ?? null
    const photoUrl = info.picture ?? existing.photo_url ?? null
    await database
      .prepare(
        'UPDATE users SET name = COALESCE(?, name), photo_url = COALESCE(?, photo_url), role = ?, last_sign_in_at = ? WHERE id = ?'
      )
      .bind(name, photoUrl, role, ts, userId)
      .run()
  } else {
    userId = uuid()
    role = isBootstrapAdmin ? 'admin' : 'customer'
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

  let destination = redirect
  if (role !== 'admin' && redirect.toLowerCase().startsWith('/admin')) {
    destination = '/admin/login?error=not_admin'
  } else if (role === 'admin' && redirect.toLowerCase().startsWith('/dashboard')) {
    destination = '/admin'
  }

  const headers = new Headers({ Location: destination })
  headers.append('Set-Cookie', cookie)
  headers.append('Set-Cookie', clearStateCookie())
  return new Response(null, { status: 302, headers })
}
