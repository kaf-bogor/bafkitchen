import { env } from 'cloudflare:workers'

import { requireAdmin } from '@/lib/server/auth'
import { json, db, now, parseJson } from '@/lib/server/db'

import type { ProductRow } from '../route'

const DEFAULT_VENDOR = {
  id: 'baf-kitchen',
  name: 'Baf Kitchen',
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
      priceBase: row.price_base ?? 0,
      price: row.price,
      stock: row.stock ?? 0,
      description: row.description ?? '',
      imageUrl: row.image_url ?? '',
      availability: row.availability || 'ready',
      preorderStart: row.preorder_start ?? null,
      preorderEnd: row.preorder_end ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      vendor,
      categories: results
    }
  })
}

export async function PUT(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    name?: string
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
  } | null

  const database = db()
  const existing = await database
    .prepare('SELECT * FROM products WHERE id = ?')
    .bind(ctx.params.id)
    .first<ProductRow>()
  if (!existing) return json({ error: 'Product not found' }, { status: 404 })
  if (!body?.name) return json({ error: 'Name is required' }, { status: 400 })

  const categoryIds = body.categoryIds ?? []
  const availability = body.availability === 'preorder' ? 'preorder' : 'ready'
  const preorderStart = availability === 'preorder' ? (body.preorderStart ?? null) : null
  const preorderEnd = availability === 'preorder' ? (body.preorderEnd ?? null) : null

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
         name = ?, price_base = ?, price = ?, stock = ?, vendor = ?, category_ids = ?,
         description = ?, image_url = ?, image_key = ?, availability = ?, preorder_start = ?, preorder_end = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      body.name,
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
          priceBase: row.price_base ?? 0,
          price: row.price,
          stock: row.stock ?? 0,
          description: row.description ?? '',
          imageUrl: row.image_url ?? '',
          availability: row.availability || 'ready',
          preorderStart: row.preorder_start ?? null,
          preorderEnd: row.preorder_end ?? null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          vendor: storedVendor ?? DEFAULT_VENDOR,
          categories: results
        }
      : null
  })
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