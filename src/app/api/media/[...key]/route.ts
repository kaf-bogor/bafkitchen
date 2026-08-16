import { env } from 'cloudflare:workers'

import { json } from '@/lib/server/db'

export async function GET(request: Request, ctx: { params: { key: string[] } }) {
  const key = ctx.params.key.join('/')
  if (!key) return json({ error: 'Not found' }, { status: 404 })

  try {
    const object = await env.BUCKET.get(key)
    if (!object) return json({ error: 'Not found' }, { status: 404 })

    const contentType = object.httpMetadata?.contentType ?? 'application/octet-stream'
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch {
    return json({ error: 'Not found' }, { status: 404 })
  }
}