import {
  buildAuthUrl,
  buildStateCookie,
  createPkcePair,
  googleClientId,
  googleRedirectUri,
  randomToken
} from '@/lib/server/googleOAuth'

const DEFAULT_REDIRECT = '/dashboard/'

export async function GET(request: Request) {
  const url = new URL(request.url)
  let redirect = url.searchParams.get('redirect') ?? DEFAULT_REDIRECT
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    redirect = DEFAULT_REDIRECT
  }

  const { verifier, challenge } = await createPkcePair()
  const state = randomToken(24)
  const googleState = JSON.stringify({ s: state, r: redirect })

  const authUrl = buildAuthUrl({
    clientId: googleClientId(),
    redirectUri: googleRedirectUri(request),
    state: googleState,
    codeChallenge: challenge
  })

  const headers = new Headers({ Location: authUrl })
  headers.append('Set-Cookie', buildStateCookie(state, verifier))
  return new Response(null, { status: 302, headers })
}
