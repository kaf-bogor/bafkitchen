import { requireAdmin } from '@/lib/server/auth'
import { json, db, now, uuid } from '@/lib/server/db'

interface CategoryRow {
  id: string
  name: string
  vendor_id: string | null
  created_at: string
  updated_at: string
}

interface VendorRow {
  id: string
  name: string
  email: string | null
  is_active: number
  user_id: string | null
  created_at: string
  updated_at: string
}

const transformVendor = (row: VendorRow) => ({
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
  const vendorName = url.searchParams.get('vendorName')
  const database = db()

  let vendorFilterId: string | null = null
  if (vendorName) {
    const vendor = await database
      .prepare('SELECT * FROM vendors WHERE name = ? AND is_active = 1')
      .bind(vendorName)
      .first<VendorRow>()
    if (!vendor) return json({ categories: [] })
    vendorFilterId = vendor.id
  }

  const { results } = await database
    .prepare('SELECT * FROM categories')
    .all<CategoryRow>()

  const categories: Record<string, unknown>[] = []
  for (const row of results) {
    if (vendorFilterId && row.vendor_id !== vendorFilterId) continue
    let vendor: Record<string, unknown> | null = null
    if (row.vendor_id) {
      const v = await database
        .prepare('SELECT * FROM vendors WHERE id = ?')
        .bind(row.vendor_id)
        .first<VendorRow>()
      if (v && v.is_active === 1) vendor = transformVendor(v)
    }
    categories.push({
      id: row.id,
      name: row.name,
      vendorId: row.vendor_id ?? '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      vendor
    })
  }

  return json({ categories })
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    name?: string
    vendorId?: string
  } | null
  const name = body?.name?.trim()
  if (!name) return json({ error: 'Name is required' }, { status: 400 })
  if (!body?.vendorId) return json({ error: 'Vendor is required' }, { status: 400 })

  const database = db()
  const vendor = await database
    .prepare('SELECT * FROM vendors WHERE id = ? AND is_active = 1')
    .bind(body.vendorId)
    .first<VendorRow>()
  if (!vendor) return json({ error: 'Vendor does not exist or is inactive' }, { status: 400 })

  const ts = now()
  const id = uuid()
  await database
    .prepare(
      'INSERT INTO categories (id, name, vendor_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, name, body.vendorId, ts, ts)
    .run()

  return json(
    { category: { id, name, vendorId: body.vendorId, createdAt: ts, updatedAt: ts } },
    { status: 201 }
  )
}