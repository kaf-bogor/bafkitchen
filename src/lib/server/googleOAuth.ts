import { parseCookies } from '@/lib/server/auth'

export const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
export const GOOGLE_TOKENINFO_ENDPOINT = 'https://oauth2.googleapis.com/tokeninfo'
export const OAUTH_STATE_COOKIE = 'bazaf_oauth_state'

export interface GoogleUserInfo {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
  picture?: string
  aud?: string
}

const encoder = new TextEncoder()

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? encoder.encode(input) : input
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const randomToken = (bytes = 32): string =>
  base64UrlEncode(crypto.getRandomValues(new Uint8Array(bytes)))

export const sha256Challenge = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return base64UrlEncode(new Uint8Array(digest))
}

export const googleClientId = (): string => {
  const id = process.env.GOOGLE_CLIENT_ID
  if (!id) throw new Error('GOOGLE_CLIENT_ID is not set')
  return id
}

export const googleClientSecret = (): string => {
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!secret) throw new Error('GOOGLE_CLIENT_SECRET is not set')
  return secret
}

export const googleRedirectUri = (request: Request): string =>
  `${new URL(request.url).origin}/api/auth/google/callback`

interface PkcePair {
  verifier: string
  challenge: string
}

export const createPkcePair = async (): Promise<PkcePair> => {
  const verifier = randomToken(48)
  const challenge = await sha256Challenge(verifier)
  return { verifier, challenge }
}

interface BuildAuthUrlParams {
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
}

export const buildAuthUrl = ({
  clientId,
  redirectUri,
  state,
  codeChallenge
}: BuildAuthUrlParams): string => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'online',
    prompt: 'select_account'
  })
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`
}

export const buildStateCookie = (state: string, verifier: string): string =>
  `${OAUTH_STATE_COOKIE}=${encodeURIComponent(`${state}.${verifier}`)}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`

export const clearStateCookie = () =>
  `${OAUTH_STATE_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`

export interface StoredOAuthState {
  state: string
  verifier: string
}

export const readStoredState = (request: Request): StoredOAuthState | null => {
  const cookies = parseCookies(request)
  const raw = cookies[OAUTH_STATE_COOKIE]
  if (!raw) return null
  const dot = raw.indexOf('.')
  if (dot === -1) return null
  return { state: raw.slice(0, dot), verifier: raw.slice(dot + 1) }
}

interface ExchangeCodeResult {
  id_token?: string
  access_token?: string
  error?: string
  error_description?: string
}

export const exchangeCodeForToken = async ({
  code,
  redirectUri,
  verifier
}: {
  code: string
  redirectUri: string
  verifier: string
}): Promise<string | null> => {
  const body = new URLSearchParams({
    code,
    client_id: googleClientId(),
    client_secret: googleClientSecret(),
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: verifier
  })
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  if (!res.ok) return null
  const data = (await res.json()) as ExchangeCodeResult
  return data.id_token ?? null
}

export const verifyGoogleIdToken = async (
  idToken: string
): Promise<GoogleUserInfo | null> => {
  try {
    const res = await fetch(
      `${GOOGLE_TOKENINFO_ENDPOINT}?id_token=${encodeURIComponent(idToken)}`
    )
    if (!res.ok) return null
    const info = (await res.json()) as GoogleUserInfo
    if (!info.email) return null
    return info
  } catch {
    return null
  }
}
