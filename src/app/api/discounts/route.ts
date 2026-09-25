import { requireAuth } from '@/lib/server/auth'
import { json, db, parseJson } from '@/lib/server/db'
import { mapDiscountRow, type DiscountRow } from '@/lib/server/discounts'
import { getVendorForUser } from '@/lib/server/vendors'

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) return auth

  const database = db()
  const { results: productRows } = await database
    .prepare('SELECT id, name, vendor FROM products')
    .all<{ id: string; name: string; vendor: string | null }>()

  let allowedIds: Set<string> | null = null
  if (auth.role !== 'admin') {
    const vendor = await getVendorForUser(auth.uid)
    if (!vendor) return json({ discounts: [] })
    allowedIds = new Set(
      productRows
        .filter(
          (p) =>
            parseJson<{ id?: string } | null>(p.vendor, null)?.id === vendor.id
        )
        .map((p) => p.id)
    )
  }

  const productMap = new Map(
    productRows.map((p) => [p.id, { id: p.id, name: p.name }])
  )

  const { results } = await database
    .prepare('SELECT * FROM product_discounts ORDER BY created_at DESC')
    .all<DiscountRow>()

  const discounts = results
    .filter((row) => !allowedIds || allowedIds.has(row.product_id))
    .map((row) => ({
      ...mapDiscountRow(row),
      product: productMap.get(row.product_id) || null
    }))

  return json({ discounts })
}
