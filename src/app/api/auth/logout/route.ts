import { clearSessionCookie } from '@/lib/server/auth'
import { json } from '@/lib/server/db'

export async function POST() {
  return json({ success: true }, { headers: { 'Set-Cookie': clearSessionCookie() } })
}

// Local dev fallback: allow clearing via GET too
export async function GET() {
  return json({ success: true }, { headers: { 'Set-Cookie': clearSessionCookie() } })
}