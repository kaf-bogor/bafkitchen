import { getSession, requireAdmin } from '@/lib/server/auth'
import { json, db, now, parseJson } from '@/lib/server/db'
import {
  generateInvoiceForOrder,
  mapInvoiceRow,
  type InvoiceRow
} from '@/lib/server/invoices'

export async function GET(request: Request) {
  const session = await getSession(request)
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  let vendorId = url.searchParams.get('vendorId') || ''

  // Non-admin users can only access invoices containing their own vendor's items.
  if (session.role !== 'admin') {
    const vendor = await db()
      .prepare(
        'SELECT id FROM vendors WHERE user_id = ? AND is_active = 1 LIMIT 1'
      )
      .bind(session.uid)
      .first<{ id: string }>()
    if (!vendor) return json({ invoices: [] })
    vendorId = vendor.id
  }

  const results = (
    await db()
      .prepare('SELECT * FROM invoices ORDER BY created_at DESC')
      .all<InvoiceRow>()
  ).results

  let invoices = results.map((row) =>
    mapInvoiceRow(row, vendorId ? { vendorId } : undefined)
  )

  if (vendorId) {
    invoices = invoices.filter(
      (invoice) =>
        invoice.vendorId === vendorId ||
        invoice.items.some(
          (item) => (item as { vendorId?: string }).vendorId === vendorId
        )
    )
  }

  return json({ invoices })
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    orderId?: string
  } | null
  if (!body?.orderId)
    return json({ error: 'orderId is required' }, { status: 400 })

  const database = db()
  const order = await database
    .prepare('SELECT id, status, activities FROM orders WHERE id = ?')
    .bind(body.orderId)
    .first<{ id: string; status: string; activities: string }>()
  if (!order) return json({ error: 'Order not found' }, { status: 404 })

  try {
    const invoice = await generateInvoiceForOrder(body.orderId)

    if (
      order.status !== 'Invoice Issued' &&
      order.status !== 'Invoice Settled'
    ) {
      const activities = parseJson<Record<string, unknown>[]>(
        order.activities,
        []
      )
      const ts = now()
      activities.push({
        userId: auth.uid,
        userEmail: auth.email,
        userName: auth.name ?? auth.email,
        action: 'Invoice diterbitkan',
        fromStatus: order.status,
        toStatus: 'Invoice Issued',
        notes: '',
        timestamp: ts,
        createdAt: ts
      })
      await database
        .prepare(
          'UPDATE orders SET status = ?, activities = ?, updated_at = ? WHERE id = ?'
        )
        .bind('Invoice Issued', JSON.stringify(activities), ts, body.orderId)
        .run()
    }

    return json({ invoice }, { status: 201 })
  } catch (error) {
    return json({ error: (error as Error).message }, { status: 400 })
  }
}
