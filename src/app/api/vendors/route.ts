import { requireAdmin } from '@/lib/server/auth'
import { json, db, now, uuid } from '@/lib/server/db'

const transformVendor = (row: {
  id: string
  name: string
  email: string | null
  is_active: number
  user_id: string | null
  created_at: string
  updated_at: string
}) => ({
  id: row.id,
  name: row.name,
  email: row.email ?? '',
  isActive: row.is_active === 1,
  userId: row.user_id ?? '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const includeInactive = url.searchParams.get('includeInactive') === '1'
  const nameFilter = url.searchParams.get('name')

  let query = 'SELECT * FROM vendors'
  const conditions: string[] = []
  const params: unknown[] = []

  if (nameFilter) {
    conditions.push('name = ?')
    params.push(nameFilter)
    conditions.push('is_active = 1')
  } else if (!includeInactive) {
    conditions.push('is_active = 1')
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')
  query += ' ORDER BY created_at DESC'

  const database = db()
  let { results } = await database
    .prepare(query)
    .bind(...params)
    .all<{
      id: string
      name: string
      email: string | null
      is_active: number
      user_id: string | null
      created_at: string
      updated_at: string
    }>()

  // Backward-compatible fallback: if no active vendors exist, return everything
  if (!includeInactive && !nameFilter && results.length === 0) {
    ;({ results } = await database
      .prepare('SELECT * FROM vendors ORDER BY created_at DESC')
      .all<{
        id: string
        name: string
        email: string | null
        is_active: number
        user_id: string | null
        created_at: string
        updated_at: string
      }>())
  }

  return json({ vendors: results.map(transformVendor) })
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    name?: string
    email?: string
  } | null
  const name = body?.name?.trim()
  if (!name) return json({ error: 'Name is required' }, { status: 400 })

  const ts = now()
  const id = uuid()
  await db()
    .prepare(
      `INSERT INTO vendors (id, name, email, is_active, user_id, created_at, updated_at)
       VALUES (?, ?, ?, 1, NULL, ?, ?)`
    )
    .bind(id, name, body?.email?.trim() ?? null, ts, ts)
    .run()

  return json(
    {
      vendor: {
        id,
        name,
        email: body?.email?.trim() ?? '',
        isActive: true,
        userId: '',
        createdAt: ts,
        updatedAt: ts
      }
    },
    { status: 201 }
  )
}