import { json, db, parseJson } from '@/lib/server/db'

export async function GET(_request: Request, ctx: { params: { id: string } }) {
  const row = await db()
    .prepare('SELECT * FROM orders WHERE id = ?')
    .bind(ctx.params.id)
    .first<{
      id: string
      order_number: string | null
      product_orders: string
      total: number
      customer: string
      status: string
      store: string
      vendors: string
      channel: string | null
      payment: string | null
      cashier: string | null
      activities: string
      created_at: string
      updated_at: string
    }>()
  if (!row) return json({ error: 'Order not found' }, { status: 404 })

  return json({
    order: {
      id: row.id,
      orderNumber: row.order_number ?? `BAF-${row.id.slice(-8)}`,
      productOrders: parseJson(row.product_orders, []),
      total: row.total,
      customer: parseJson(row.customer, {}),
      status: row.status,
      store: parseJson(row.store, { name: 'Baf Kitchen' }),
      vendors: parseJson(row.vendors, []),
      channel: row.channel ?? undefined,
      payment: row.payment ? parseJson(row.payment, null) : undefined,
      cashier: row.cashier ?? undefined,
      activities: parseJson(row.activities, []),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  })
}