import { requireAdmin } from '@/lib/server/auth'
import { json } from '@/lib/server/db'
import { loadPurchasesByProduct } from '@/lib/server/purchases'

export async function GET(_request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(_request)
  if (auth instanceof Response) return auth

  const purchases = await loadPurchasesByProduct(ctx.params.id)
  return json({ purchases })
}
