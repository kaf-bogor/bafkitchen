import { requireAdmin } from '@/lib/server/auth'
import { json } from '@/lib/server/db'
import { generateVendorPeriodInvoice } from '@/lib/server/invoices'

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    vendorId?: string
    periodStart?: string
    periodEnd?: string
    dueDate?: string
    groupBy?: 'product' | 'order'
  } | null

  if (!body?.vendorId) {
    return json({ error: 'vendorId is required' }, { status: 400 })
  }
  if (!body?.periodStart || !body?.periodEnd) {
    return json(
      { error: 'periodStart dan periodEnd wajib diisi' },
      { status: 400 }
    )
  }
  if (body.periodStart > body.periodEnd) {
    return json(
      { error: 'Tanggal mulai tidak boleh melebihi tanggal selesai' },
      { status: 400 }
    )
  }

  try {
    const invoice = await generateVendorPeriodInvoice({
      vendorId: body.vendorId,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      dueDate: body.dueDate,
      groupBy: body.groupBy === 'order' ? 'order' : 'product'
    })
    return json({ invoice }, { status: 201 })
  } catch (error) {
    return json({ error: (error as Error).message }, { status: 400 })
  }
}
