import { env } from 'cloudflare:workers'

import { requireAdmin } from '@/lib/server/auth'
import { json } from '@/lib/server/db'

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return json({ error: 'No file provided' }, { status: 400 })
  }

  const safeName = (file.name || 'image')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80)
  const key = `products/${safeName}_${crypto.randomUUID()}`

  await env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' }
  })

  // Relative URL so it works across dev and deployed hostnames
  const url = `/api/media/${key}`

  return json({ url, key }, { status: 201 })
}
