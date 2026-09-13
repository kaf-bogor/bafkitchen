import { requireAdmin } from '@/lib/server/auth'
import { json, db, now, parseJson } from '@/lib/server/db'
import { generateInvoicesForOrder } from '@/lib/server/invoices'

export async function PUT(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    status?: string
    notes?: string
    proofUrl?: string
    proofKey?: string
  } | null

  const newStatus = body?.status
  if (!newStatus) return json({ error: 'Status is required' }, { status: 400 })

  const database = db()
  const row = await database
    .prepare('SELECT * FROM orders WHERE id = ?')
    .bind(ctx.params.id)
    .first<{
      id: string
      status: string
      activities: string
      updated_at: string
    }>()
  if (!row) return json({ error: 'Order not found' }, { status: 404 })

  const previousStatus = row.status
  const activities = parseJson<Record<string, unknown>[]>(row.activities, [])
  const ts = now()

  const newActivity = {
    userId: auth.uid,
    userEmail: auth.email,
    userName: auth.name ?? auth.email,
    action: 'Status pesanan diperbarui',
    fromStatus: previousStatus,
    toStatus: newStatus,
    notes: body?.notes || '',
    proofUrl: body?.proofUrl?.trim() || '',
    proofKey: body?.proofKey?.trim() || '',
    timestamp: ts,
    createdAt: ts
  }

  const proofUrl = body?.proofUrl?.trim()
  if (proofUrl) {
    await database
      .prepare(
        'UPDATE orders SET status = ?, activities = ?, payment_proof_url = ?, payment_proof_key = ?, updated_at = ? WHERE id = ?'
      )
      .bind(
        newStatus,
        JSON.stringify([...activities, newActivity]),
        proofUrl,
        body?.proofKey?.trim() || null,
        ts,
        ctx.params.id
      )
      .run()
  } else {
    await database
      .prepare('UPDATE orders SET status = ?, activities = ?, updated_at = ? WHERE id = ?')
      .bind(newStatus, JSON.stringify([...activities, newActivity]), ts, ctx.params.id)
      .run()
  }

  let invoices: Record<string, unknown>[] | undefined
  if (newStatus === 'Invoice Issued') {
    try {
      invoices = await generateInvoicesForOrder(ctx.params.id)
    } catch (error) {
      return json(
        { error: `Order updated but invoice generation failed: ${(error as Error).message}` },
        { status: 500 }
      )
    }
  }

  return json({ success: true, invoices })
}