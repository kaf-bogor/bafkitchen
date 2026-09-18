import { requireAdmin } from '@/lib/server/auth'
import { json, db, now } from '@/lib/server/db'
import {
  diffProduct,
  recordProductActivities,
  snapshotProduct
} from '@/lib/server/productActivities'

import type { ProductRow } from '../route'

const ALLOWED_CHANNELS = ['pos', 'online', 'preorder']

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    ids?: string[]
    fields?: {
      price?: number
      priceBase?: number
      stock?: number | null
      isActive?: boolean
      channels?: string[]
      approvalStatus?: string
    }
  } | null

  const ids = (body?.ids || []).filter(Boolean)
  if (!ids.length) return json({ error: 'No ids provided' }, { status: 400 })

  const fields = body?.fields
  if (!fields) return json({ error: 'No fields provided' }, { status: 400 })

  const sets: string[] = []
  const params: unknown[] = []

  if (fields.price !== undefined) {
    sets.push('price = ?')
    params.push(fields.price)
  }
  if (fields.priceBase !== undefined) {
    sets.push('price_base = ?')
    params.push(fields.priceBase)
  }
  if (fields.stock !== undefined) {
    sets.push('stock = ?')
    params.push(fields.stock ?? 0)
  }
  if (fields.isActive !== undefined) {
    sets.push('is_active = ?')
    params.push(fields.isActive ? 1 : 0)
  }
  if (fields.channels !== undefined) {
    const channels = (fields.channels || []).filter((c) =>
      ALLOWED_CHANNELS.includes(c)
    )
    sets.push('channels = ?')
    params.push((channels.length ? channels : ['pos']).join(','))
  }
  if (fields.approvalStatus !== undefined) {
    if (!['pending', 'approved', 'rejected'].includes(fields.approvalStatus)) {
      return json({ error: 'Invalid approval status' }, { status: 400 })
    }
    sets.push('approval_status = ?')
    params.push(fields.approvalStatus)
  }

  if (!sets.length) return json({ error: 'No fields to update' }, { status: 400 })

  sets.push('updated_at = ?')
  params.push(now())

  const database = db()
  const placeholders = ids.map(() => '?').join(',')

  const { results: beforeRows } = await database
    .prepare(`SELECT * FROM products WHERE id IN (${placeholders})`)
    .bind(...ids)
    .all<ProductRow>()

  await database
    .prepare(`UPDATE products SET ${sets.join(', ')} WHERE id IN (${placeholders})`)
    .bind(...params, ...ids)
    .run()

  const { results: afterRows } = await database
    .prepare(`SELECT * FROM products WHERE id IN (${placeholders})`)
    .bind(...ids)
    .all<ProductRow>()

  const beforeMap = new Map(beforeRows.map((row) => [row.id, row]))
  const entries = afterRows
    .filter((row) => beforeMap.has(row.id))
    .map((row) => ({
      productId: row.id,
      changes: diffProduct(
        snapshotProduct(beforeMap.get(row.id) as ProductRow),
        snapshotProduct(row)
      )
    }))

  await recordProductActivities(database, entries, auth)

  return json({ updated: ids.length })
}
