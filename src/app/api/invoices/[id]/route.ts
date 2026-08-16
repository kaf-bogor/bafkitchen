import { requireAdmin } from '@/lib/server/auth'
import { json, db, parseJson } from '@/lib/server/db'

const transformInvoiceRow = (row: {
  id: string
  invoice_number: string | null
  order_id: string | null
  vendor_id: string | null
  vendor_name: string | null
  total_amount: number
  status: string
  due_date: string | null
  issued_date: string | null
  settled_date: string | null
  items: string
  customer: string
  commission: string | null
  created_at: string
  updated_at: string
}) => ({
  id: row.id,
  invoiceNumber: row.invoice_number ?? '',
  orderId: row.order_id ?? '',
  vendorId: row.vendor_id ?? '',
  vendorName: row.vendor_name ?? '',
  totalAmount: row.total_amount,
  status: row.status,
  dueDate: row.due_date ?? new Date().toISOString(),
  issuedDate: row.issued_date ?? new Date().toISOString(),
  settledDate: row.settled_date ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items: parseJson(row.items, []),
  customer: parseJson(row.customer, {}),
  commission: row.commission ? parseJson(row.commission, null) : undefined
})

export async function GET(_request: Request, ctx: { params: { id: string } }) {
  const row = await db()
    .prepare('SELECT * FROM invoices WHERE id = ?')
    .bind(ctx.params.id)
    .first<Parameters<typeof transformInvoiceRow>[0]>()
  if (!row) return json({ error: 'Invoice not found' }, { status: 404 })
  return json({ invoice: transformInvoiceRow(row) })
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
    .first<Parameters<typeof transformInvoiceRow>[0]>()
  return json({ invoice: row ? transformInvoiceRow(row) : null })
}