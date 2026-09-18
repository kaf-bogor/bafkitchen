import { requireAdmin } from '@/lib/server/auth'
import { json } from '@/lib/server/db'
import { fetchOpnameProducts } from '@/lib/server/stockOpname'

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const url = new URL(request.url)
  const categoryIds = (url.searchParams.get('categoryIds') || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  const products = await fetchOpnameProducts({
    vendorId: url.searchParams.get('vendorId') || undefined,
    channel: url.searchParams.get('channel') || undefined,
    inStock: url.searchParams.get('inStock') === '1',
    categoryIds
  })

  const items = products.map((product) => ({
    productId: product.id,
    productName: product.name || '',
    sku: product.sku || '',
    unit: product.unit || '',
    systemStock: product.stock ?? 0
  }))

  return json({ items, total: items.length })
}
