import { getSession, requireAdmin } from '@/lib/server/auth'
import { json, db, parseJson } from '@/lib/server/db'
import { generateInvoicesForOrder } from '@/lib/server/invoices'

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
  customer: parseJson(row.customer, {})
})

export async function GET(request: Request) {
  const session = await getSession(request)
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  let vendorId = url.searchParams.get('vendorId')

  // Non-admin users can only access invoices belonging to their own vendor.
  if (session.role !== 'admin') {
    const vendor = await db()
      .prepare('SELECT id FROM vendors WHERE user_id = ? AND is_active = 1 LIMIT 1')
      .bind(session.uid)
      .first<{ id: string }>()
    if (!vendor) return json({ invoices: [] })
    vendorId = vendor.id
  }

  const database = db()
  const results = (
    vendorId
      ? await database
          .prepare('SELECT * FROM invoices WHERE vendor_id = ? ORDER BY created_at DESC')
          .bind(vendorId)
          .all<Parameters<typeof transformInvoiceRow>[0]>()
      : await database
          .prepare('SELECT * FROM invoices ORDER BY created_at DESC')
          .all<Parameters<typeof transformInvoiceRow>[0]>()
  ).results

  return json({ invoices: results.map(transformInvoiceRow) })
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    orderId?: string
  } | null
  if (!body?.orderId) return json({ error: 'orderId is required' }, { status: 400 })

  try {
    const invoices = await generateInvoicesForOrder(body.orderId)
    return json({ invoices }, { status: 201 })
  } catch (error) {
    return json({ error: (error as Error).message }, { status: 400 })
  }
}