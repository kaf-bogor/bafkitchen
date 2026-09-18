import { requireAdmin } from '@/lib/server/auth'
import { json, db, now } from '@/lib/server/db'
import {
  diffProduct,
  recordProductActivities,
  snapshotProduct
} from '@/lib/server/productActivities'

import type { ProductRow } from '../route'

const ALLOWED_CHANNELS = ['pos', 'online', 'preorder']

interface Fields {
  price?: number
  priceBase?: number
  stock?: number | null
  isActive?: boolean
  channels?: string[]
  approvalStatus?: string
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    items?: { id: string; fields: Fields }[]
  } | null

  const items = (body?.items || []).filter((item) => item?.id && item?.fields)
  if (!items.length) {
    return json({ error: 'No items provided' }, { status: 400 })
  }

  const database = db()
  const ids = items.map((item) => item.id)
  const placeholders = ids.map(() => '?').join(',')

  const { results: beforeRows } = await database
    .prepare(`SELECT * FROM products WHERE id IN (${placeholders})`)
    .bind(...ids)
    .all<ProductRow>()

  let updated = 0

  for (const item of items) {
    const fields = item.fields
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
        continue
      }
      sets.push('approval_status = ?')
      params.push(fields.approvalStatus)
    }

    if (!sets.length) continue

    sets.push('updated_at = ?')
    params.push(now())

    await database
      .prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...params, item.id)
      .run()
    updated++
  }

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

  return json({ updated })
}
