import { getSession, requireAdmin } from '@/lib/server/auth'
import { json, db } from '@/lib/server/db'
import { mapInvoiceRow, type InvoiceRow } from '@/lib/server/invoices'

export async function GET(request: Request, ctx: { params: { id: string } }) {
  const session = await getSession(request)
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 })

  const row = await db()
    .prepare('SELECT * FROM invoices WHERE id = ?')
    .bind(ctx.params.id)
    .first<InvoiceRow>()
  if (!row) return json({ error: 'Invoice not found' }, { status: 404 })

  // Non-admins can only view invoices containing their own vendor's items.
  if (session.role !== 'admin') {
    const vendor = await db()
      .prepare('SELECT id FROM vendors WHERE user_id = ? AND is_active = 1 LIMIT 1')
      .bind(session.uid)
      .first<{ id: string }>()
    const mapped = mapInvoiceRow(row, vendor ? { vendorId: vendor.id } : undefined)
    const belongs =
      vendor &&
      (mapped.vendorId === vendor.id ||
        mapped.items.some(
          (item) => (item as { vendorId?: string }).vendorId === vendor.id
        ))
    if (!belongs) return json({ error: 'Forbidden' }, { status: 403 })
    return json({ invoice: mapped })
  }

  return json({ invoice: mapInvoiceRow(row) })
}

export async function PUT(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    status?: string
    settledDate?: string
  } | null
  if (!body?.status) return json({ error: 'Status is required' }, { status: 400 })

  const database = db()
  const existing = await database
    .prepare('SELECT id FROM invoices WHERE id = ?')
    .bind(ctx.params.id)
    .first()
  if (!existing) return json({ error: 'Invoice not found' }, { status: 404 })

  const ts = new Date().toISOString()
  if (body.status === 'Settled' && body.settledDate) {
    await database
      .prepare('UPDATE invoices SET status = ?, settled_date = ?, updated_at = ? WHERE id = ?')
      .bind(body.status, new Date(body.settledDate).toISOString(), ts, ctx.params.id)
      .run()
  } else {
    await database
      .prepare('UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?')
      .bind(body.status, ts, ctx.params.id)
      .run()
  }

  const row = await database
    .prepare('SELECT * FROM invoices WHERE id = ?')
    .bind(ctx.params.id)
    .first<InvoiceRow>()
  return json({ invoice: row ? mapInvoiceRow(row) : null })
}
