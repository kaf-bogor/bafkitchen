import { env } from 'cloudflare:workers'

import { requireAdmin, requireAuth } from '@/lib/server/auth'
import { json, db, now, parseJson } from '@/lib/server/db'
import { getVendorForUser } from '@/lib/server/vendors'

import type { ProductRow } from '../route'

const DEFAULT_VENDOR = {
  id: 'bazaf',
  name: 'Bazaf',
  userId: '',
  isActive: false,
  createdAt: '',
  updatedAt: ''
}

interface CategoryRow {
  id: string
  name: string
}

export async function GET(_request: Request, ctx: { params: { id: string } }) {
  const database = db()
  const row = await database
    .prepare('SELECT * FROM products WHERE id = ?')
    .bind(ctx.params.id)
    .first<ProductRow>()
  if (!row) return json({ error: 'Product not found' }, { status: 404 })

  const { results } = await database
    .prepare(
      `SELECT c.id, c.name FROM product_categories pc
       JOIN categories c ON c.id = pc.category_id
       WHERE pc.product_id = ?`
    )
    .bind(ctx.params.id)
    .all<CategoryRow>()

  const storedVendor = parseJson<{ id?: string; name?: string } | null>(row.vendor, null)
  const vendor =
    storedVendor ?? DEFAULT_VENDOR

  return json({
    product: {
      id: row.id,
      name: row.name,
      sku: row.sku ?? '',
      unit: row.unit || 'pcs',
      isActive: (row.is_active ?? 1) === 1,
      priceBase: row.price_base ?? 0,
      price: row.price,
      stock: row.stock ?? 0,
      description: row.description ?? '',
      imageUrl: row.image_url ?? '',
      availability: row.availability || 'ready',
      preorderStart: row.preorder_start ?? null,
      preorderEnd: row.preorder_end ?? null,
      channels: (row.channels || 'pos').split(',').filter(Boolean),
      availabilityType: row.availability_type || 'always',
      weeklyDays: parseJson<number[]>(row.weekly_days, []),
      specificDates: parseJson<string[]>(row.specific_dates, []),
      preorderLeadDays: row.preorder_lead_days ?? null,
      preorderCutoffTime: row.preorder_cutoff_time ?? null,
      preorderMinQty: row.preorder_min_qty ?? null,
      preorderMaxQty: row.preorder_max_qty ?? null,
      preorderCapacity: row.preorder_capacity ?? null,
      fulfillmentType: row.fulfillment_type || 'takeaway',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      vendor,
      categories: results
    }
  })
}

export async function PUT(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    name?: string
    sku?: string
    unit?: string
    isActive?: boolean
    priceBase?: number
    price?: number
    stock?: number | null
    vendor?: { id: string; name: string }
    categoryIds?: string[]
    description?: string
    imageUrl?: string
    imageKey?: string
    availability?: string
    preorderStart?: string | null
    preorderEnd?: string | null
    channels?: string[]
    availabilityType?: string
    weeklyDays?: number[]
    specificDates?: string[]
    preorderLeadDays?: number | null
    preorderCutoffTime?: string | null
    preorderMinQty?: number | null
    preorderMaxQty?: number | null
    preorderCapacity?: number | null
    fulfillmentType?: string
  } | null

  const database = db()
  const existing = await database
    .prepare('SELECT * FROM products WHERE id = ?')
    .bind(ctx.params.id)
    .first<ProductRow>()
  if (!existing) return json({ error: 'Product not found' }, { status: 404 })
  if (!body?.name) return json({ error: 'Name is required' }, { status: 400 })

  const isAdmin = auth.role === 'admin'
  let approvalStatus = existing.approval_status || 'approved'
  if (!isAdmin) {
    const vendor = await getVendorForUser(auth.uid)
    const existingVendor = parseJson<{ id?: string } | null>(existing.vendor, null)
    if (!vendor || existingVendor?.id !== vendor.id) {
      return json({ error: 'Forbidden' }, { status: 403 })
    }
    // Vendor edits need to be re-approved by an admin.
    approvalStatus = 'pending'
  }

  const categoryIds = body.categoryIds ?? []
  const availability = body.availability === 'preorder' ? 'preorder' : 'ready'
  const preorderStart = availability === 'preorder' ? (body.preorderStart ?? null) : null
  const preorderEnd = availability === 'preorder' ? (body.preorderEnd ?? null) : null
  const channels = body.channels?.length ? body.channels : ['pos']
  const availabilityType = body.availabilityType || existing.availability_type || 'always'

  // Delete the old R2 object if the image was replaced
  const oldKey = existing.image_key
  const newKey = body.imageKey ?? existing.image_key
  if (oldKey && newKey && oldKey !== newKey && env.BUCKET) {
    try {
      await env.BUCKET.delete(oldKey)
    } catch {
      // Non-fatal: orphaned object
    }
  }

  await database
    .prepare(
      `UPDATE products SET
         name = ?, sku = ?, unit = ?, is_active = ?, price_base = ?, price = ?, stock = ?, vendor = ?, category_ids = ?,
         description = ?, image_url = ?, image_key = ?, availability = ?, preorder_start = ?, preorder_end = ?,
         channels = ?, availability_type = ?, weekly_days = ?, specific_dates = ?,
         preorder_lead_days = ?, preorder_cutoff_time = ?, preorder_min_qty = ?, preorder_max_qty = ?, preorder_capacity = ?,
         fulfillment_type = ?, approval_status = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      body.name,
      body.sku ?? existing.sku,
      body.unit || existing.unit || 'pcs',
      body.isActive === false ? 0 : existing.is_active ?? 1,
      body.priceBase ?? existing.price_base,
      body.price ?? existing.price,
      body.stock ?? existing.stock,
      body.vendor ? JSON.stringify(body.vendor) : existing.vendor,
      JSON.stringify(categoryIds),
      body.description ?? existing.description,
      body.imageUrl ?? existing.image_url,
      newKey,
      availability,
      preorderStart,
      preorderEnd,
      channels.join(','),
      availabilityType,
      availabilityType === 'weekly' ? JSON.stringify(body.weeklyDays ?? []) : null,
      availabilityType === 'specific' ? JSON.stringify(body.specificDates ?? []) : null,
      body.preorderLeadDays ?? existing.preorder_lead_days,
      body.preorderCutoffTime ?? existing.preorder_cutoff_time,
      body.preorderMinQty ?? existing.preorder_min_qty,
      body.preorderMaxQty ?? existing.preorder_max_qty,
      body.preorderCapacity ?? existing.preorder_capacity,
      body.fulfillmentType || existing.fulfillment_type || 'takeaway',
      approvalStatus,
      now(),
      ctx.params.id
    )
    .run()

  await database
    .prepare('DELETE FROM product_categories WHERE product_id = ?')
    .bind(ctx.params.id)
    .run()
  for (const cid of categoryIds) {
    await database
      .prepare('INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)')
      .bind(ctx.params.id, cid)
      .run()
  }

  const row = await database
    .prepare('SELECT * FROM products WHERE id = ?')
    .bind(ctx.params.id)
    .first<ProductRow>()
  const { results } = await database
    .prepare(
      `SELECT c.id, c.name FROM product_categories pc
       JOIN categories c ON c.id = pc.category_id
       WHERE pc.product_id = ?`
    )
    .bind(ctx.params.id)
    .all<CategoryRow>()
  const storedVendor = parseJson(row?.vendor ?? null, null)
  return json({
    product: row
      ? {
          id: row.id,
          name: row.name,
          sku: row.sku ?? '',
          unit: row.unit || 'pcs',
          isActive: (row.is_active ?? 1) === 1,
          priceBase: row.price_base ?? 0,
          price: row.price,
          stock: row.stock ?? 0,
          description: row.description ?? '',
          imageUrl: row.image_url ?? '',
          availability: row.availability || 'ready',
          preorderStart: row.preorder_start ?? null,
          preorderEnd: row.preorder_end ?? null,
          channels: (row.channels || 'pos').split(',').filter(Boolean),
          availabilityType: row.availability_type || 'always',
          weeklyDays: parseJson<number[]>(row.weekly_days, []),
          specificDates: parseJson<string[]>(row.specific_dates, []),
          preorderLeadDays: row.preorder_lead_days ?? null,
          preorderCutoffTime: row.preorder_cutoff_time ?? null,
          preorderMinQty: row.preorder_min_qty ?? null,
          preorderMaxQty: row.preorder_max_qty ?? null,
          preorderCapacity: row.preorder_capacity ?? null,
          fulfillmentType: row.fulfillment_type || 'takeaway',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          vendor: storedVendor ?? DEFAULT_VENDOR,
          categories: results
        }
      : null
  })
}

const ALLOWED_CHANNELS = ['pos', 'online', 'preorder']

export async function PATCH(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    price?: number
    priceBase?: number
    stock?: number | null
    isActive?: boolean
    channels?: string[]
    approvalStatus?: string
  } | null
  if (!body) return json({ error: 'Invalid body' }, { status: 400 })

  const sets: string[] = []
  const params: unknown[] = []

  if (body.price !== undefined) {
    sets.push('price = ?')
    params.push(body.price)
  }
  if (body.priceBase !== undefined) {
    sets.push('price_base = ?')
    params.push(body.priceBase)
  }
  if (body.stock !== undefined) {
    sets.push('stock = ?')
    params.push(body.stock ?? 0)
  }
  if (body.isActive !== undefined) {
    sets.push('is_active = ?')
    params.push(body.isActive ? 1 : 0)
  }
  if (body.channels !== undefined) {
    const channels = (body.channels || []).filter((c) =>
      ALLOWED_CHANNELS.includes(c)
    )
    sets.push('channels = ?')
    params.push((channels.length ? channels : ['pos']).join(','))
  }
  if (body.approvalStatus !== undefined) {
    if (!['pending', 'approved', 'rejected'].includes(body.approvalStatus)) {
      return json({ error: 'Invalid approval status' }, { status: 400 })
    }
    sets.push('approval_status = ?')
    params.push(body.approvalStatus)
  }

  if (!sets.length) {
    return json({ error: 'No fields to update' }, { status: 400 })
  }

  const database = db()
  const existing = await database
    .prepare('SELECT id FROM products WHERE id = ?')
    .bind(ctx.params.id)
    .first()
  if (!existing) return json({ error: 'Product not found' }, { status: 404 })

  sets.push('updated_at = ?')
  params.push(now())

  await database
    .prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...params, ctx.params.id)
    .run()

  return json({ id: ctx.params.id })
}

export async function DELETE(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const database = db()
  const existing = await database
    .prepare('SELECT image_key FROM products WHERE id = ?')
    .bind(ctx.params.id)
    .first<{ image_key: string | null }>()

  await database.prepare('DELETE FROM product_categories WHERE product_id = ?').bind(ctx.params.id).run()
  await database.prepare('DELETE FROM products WHERE id = ?').bind(ctx.params.id).run()

  if (existing?.image_key && env.BUCKET) {
    try {
      await env.BUCKET.delete(existing.image_key)
    } catch {
      // Non-fatal
    }
  }

  return json({ id: ctx.params.id })
}