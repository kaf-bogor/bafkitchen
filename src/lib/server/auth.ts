import { json } from '@/lib/server/db'

export interface SessionUser {
  uid: string
  email: string
  name: string | null
  role: string
}

const SESSION_COOKIE = 'bazaf_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function base64UrlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? encoder.encode(data) : data
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const buffer = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function secretKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function signJwt(payload: Record<string, unknown>): Promise<string> {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64UrlEncode(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })
  )
  const data = `${header}.${body}`
  const key = await secretKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return `${data}.${base64UrlEncode(new Uint8Array(sig))}`
}

export async function verifyJwt<T = Record<string, unknown>>(
  token: string
): Promise<T | null> {
  const secret = process.env.AUTH_SECRET
  if (!secret) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const key = await secretKey(secret)
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecode(sig),
    encoder.encode(`${header}.${body}`)
  )
  if (!valid) return null
  try {
    const payload = JSON.parse(decoder.decode(base64UrlDecode(body))) as T & {
      exp?: number
      iat?: number
    }
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export interface SessionPayload {
  uid: string
  email: string
  name: string | null
  role: string
  exp: number
}

export function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get('cookie')
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map((c) => {
      const eq = c.indexOf('=')
      const key = eq > -1 ? c.slice(0, eq).trim() : c.trim()
      const value = eq > -1 ? c.slice(eq + 1).trim() : ''
      return [key, decodeURIComponent(value)]
    })
  )
}

export async function getSession(request: Request): Promise<SessionUser | null> {
  const cookies = parseCookies(request)
  const token = cookies[SESSION_COOKIE]
  if (!token) return null
  const payload = await verifyJwt<SessionPayload>(token)
  if (!payload || !payload.uid) return null
  return {
    uid: payload.uid,
    email: payload.email,
    name: payload.name,
    role: payload.role
  }
}

export async function createSessionCookie(user: SessionUser): Promise<string> {
  const token = await signJwt({
    uid: user.uid,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  })
  const isProd = process.env.NODE_ENV === 'production'
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${
    isProd ? '; Secure' : ''
  }`
}

export const clearSessionCookie = () =>
  `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`

export const requireAuth = async (
  request: Request
): Promise<SessionUser | Response> => {
  const session = await getSession(request)
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 })
  return session
}

export const requireAdmin = async (
  request: Request
): Promise<SessionUser | Response> => {
  const session = await getSession(request)
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'admin') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }
  return session
}

// --- Password hashing (PBKDF2-SHA256) ---

const PBKDF2_ITERATIONS = 100_000

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    ),
    256
  )
  return `${base64UrlEncode(salt)}.${base64UrlEncode(new Uint8Array(derived))}`
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltB64, hashB64] = stored.split('.')
  if (!saltB64 || !hashB64) return false
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: base64UrlDecode(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    ),
    256
  )
  const expected = base64UrlEncode(new Uint8Array(derived))
  const actual = hashB64
  const actualBytes = base64UrlDecode(actual)
  const expectedBytes = base64UrlDecode(expected)
  if (actualBytes.length !== expectedBytes.length) return false
  let diff = 0
  for (let i = 0; i < actualBytes.length; i++) diff |= actualBytes[i] ^ expectedBytes[i]
  return diff === 0
}

export { SESSION_COOKIE }