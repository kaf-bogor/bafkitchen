import { requireAdmin } from '@/lib/server/auth'
import { json, db, now, parseJson } from '@/lib/server/db'

export async function PUT(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    proofUrl?: string
    proofKey?: string
  } | null

  const proofUrl = body?.proofUrl?.trim()
  if (!proofUrl) return json({ error: 'proofUrl is required' }, { status: 400 })
  const proofKey = body?.proofKey?.trim() || null

  const database = db()
  const row = await database
    .prepare('SELECT id, activities FROM orders WHERE id = ?')
    .bind(ctx.params.id)
    .first<{ id: string; activities: string }>()
  if (!row) return json({ error: 'Order not found' }, { status: 404 })

  const ts = now()
  const activities = parseJson<Record<string, unknown>[]>(row.activities, [])
  const activity = {
    userId: auth.uid,
    userEmail: auth.email,
    userName: auth.name ?? auth.email,
    action: 'Bukti pembayaran diperbarui',
    fromStatus: '',
    toStatus: '',
    notes: '',
    proofUrl,
    proofKey: proofKey ?? '',
    timestamp: ts,
    createdAt: ts
  }

  await database
    .prepare(
      'UPDATE orders SET payment_proof_url = ?, payment_proof_key = ?, activities = ?, updated_at = ? WHERE id = ?'
    )
    .bind(
      proofUrl,
      proofKey,
      JSON.stringify([...activities, activity]),
      ts,
      ctx.params.id
    )
    .run()

  return json({
    success: true,
    paymentProofUrl: proofUrl,
    paymentProofKey: proofKey ?? ''
  })
}
