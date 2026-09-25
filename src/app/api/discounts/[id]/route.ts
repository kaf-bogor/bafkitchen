import { requireAuth } from '@/lib/server/auth'
import { json, db, now, parseJson } from '@/lib/server/db'
import { mapDiscountRow, type DiscountRow } from '@/lib/server/discounts'
import { getVendorForUser } from '@/lib/server/vendors'

async function authorize(
  database: D1Database,
  request: Request,
  discountId: string
) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) return auth

  const row = await database
    .prepare('SELECT * FROM product_discounts WHERE id = ?')
    .bind(discountId)
    .first<DiscountRow>()
  if (!row) return json({ error: 'Discount not found' }, { status: 404 })

  if (auth.role !== 'admin') {
    const vendor = await getVendorForUser(auth.uid)
    const product = await database
      .prepare('SELECT vendor FROM products WHERE id = ?')
      .bind(row.product_id)
      .first<{ vendor: string | null }>()
    const productVendor = parseJson<{ id?: string } | null>(
      product?.vendor ?? null,
      null
    )
    if (!vendor || productVendor?.id !== vendor.id) {
      return json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return row
}

export async function PATCH(request: Request, ctx: { params: { id: string } }) {
  const database = db()
  const auth = await authorize(database, request, ctx.params.id)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    name?: string
    type?: string
    value?: number
    minQuantity?: number
    startDate?: string | null
    endDate?: string | null
    isActive?: boolean
  } | null
  if (!body) return json({ error: 'Invalid body' }, { status: 400 })

  const sets: string[] = []
  const params: unknown[] = []

  if (body.name !== undefined) {
    sets.push('name = ?')
    params.push(body.name || null)
  }
  if (body.type !== undefined) {
    sets.push('type = ?')
    params.push(body.type === 'fixed' ? 'fixed' : 'percentage')
  }
  if (body.value !== undefined) {
    sets.push('value = ?')
    params.push(Math.max(0, Number(body.value) || 0))
  }
  if (body.minQuantity !== undefined) {
    sets.push('min_quantity = ?')
    params.push(Math.max(1, Math.round(Number(body.minQuantity) || 1)))
  }
  if (body.startDate !== undefined) {
    sets.push('start_date = ?')
    params.push(body.startDate || null)
  }
  if (body.endDate !== undefined) {
    sets.push('end_date = ?')
    params.push(body.endDate || null)
  }
  if (body.isActive !== undefined) {
    sets.push('is_active = ?')
    params.push(body.isActive ? 1 : 0)
  }

  if (!sets.length)
    return json({ error: 'No fields to update' }, { status: 400 })

  sets.push('updated_at = ?')
  params.push(now())

  await database
    .prepare(`UPDATE product_discounts SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...params, ctx.params.id)
    .run()

  const updated = await database
    .prepare('SELECT * FROM product_discounts WHERE id = ?')
    .bind(ctx.params.id)
    .first<DiscountRow>()

  return json({ discount: updated ? mapDiscountRow(updated) : null })
}

export async function DELETE(
  request: Request,
  ctx: { params: { id: string } }
) {
  const database = db()
  const auth = await authorize(database, request, ctx.params.id)
  if (auth instanceof Response) return auth

  await database
    .prepare('DELETE FROM product_discounts WHERE id = ?')
    .bind(ctx.params.id)
    .run()

  return json({ id: ctx.params.id })
}
