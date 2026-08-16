import { requireAdmin } from '@/lib/server/auth'
import { json, db, now } from '@/lib/server/db'

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

export async function GET(_request: Request, ctx: { params: { id: string } }) {
  const database = db()
  const row = await database
    .prepare('SELECT * FROM categories WHERE id = ?')
    .bind(ctx.params.id)
    .first<CategoryRow>()
  if (!row) return json({ error: 'Category does not exist' }, { status: 404 })

  let vendor: Record<string, unknown> | null = null
  if (row.vendor_id) {
    const v = await database
      .prepare('SELECT * FROM vendors WHERE id = ?')
      .bind(row.vendor_id)
      .first<VendorRow>()
    if (v) {
      vendor = {
        id: v.id,
        name: v.name,
        email: v.email ?? '',
        isActive: v.is_active === 1,
        userId: v.user_id ?? '',
        createdAt: v.created_at,
        updatedAt: v.updated_at
      }
    }
  }

  return json({
    category: {
      id: row.id,
      name: row.name,
      vendorId: row.vendor_id ?? '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      vendor
    }
  })
}

export async function PUT(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    name?: string
    vendorId?: string
  } | null
  const name = body?.name?.trim()
  if (!name) return json({ error: 'Name is required' }, { status: 400 })

  const database = db()
  const existing = await database
    .prepare('SELECT id FROM categories WHERE id = ?')
    .bind(ctx.params.id)
    .first()
  if (!existing) return json({ error: 'Category does not exist' }, { status: 404 })

  if (body?.vendorId) {
    const vendor = await database
      .prepare('SELECT id FROM vendors WHERE id = ? AND is_active = 1')
      .bind(body.vendorId)
      .first()
    if (!vendor) return json({ error: 'Vendor does not exist or is inactive' }, { status: 400 })
  }

  await database
    .prepare('UPDATE categories SET name = ?, vendor_id = ?, updated_at = ? WHERE id = ?')
    .bind(name, body?.vendorId ?? null, now(), ctx.params.id)
    .run()

  return json({
    category: {
      id: ctx.params.id,
      name,
      vendorId: body?.vendorId ?? ''
    }
  })
}