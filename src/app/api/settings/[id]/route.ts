import { requireAdmin } from '@/lib/server/auth'
import { json, db, now } from '@/lib/server/db'

export async function PUT(request: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    admin_phone_number?: string
    app_name?: string
    app_domain?: string
  } | null

  const database = db()
  const existing = await database
    .prepare('SELECT id FROM settings WHERE id = ?')
    .bind(ctx.params.id)
    .first()
  if (!existing) return json({ error: 'Settings not found' }, { status: 404 })

  const row = await database
    .prepare('SELECT * FROM settings WHERE id = ?')
    .bind(ctx.params.id)
    .first<{
      id: string
      admin_phone_number: string | null
      app_name: string | null
      app_domain: string | null
      created_at: string
      updated_at: string
    }>()

  const ts = now()
  await database
    .prepare(
      'UPDATE settings SET admin_phone_number = ?, app_name = ?, app_domain = ?, updated_at = ? WHERE id = ?'
    )
    .bind(
      body?.admin_phone_number ?? row?.admin_phone_number ?? '',
      body?.app_name ?? row?.app_name ?? 'Bazaf',
      body?.app_domain ?? row?.app_domain ?? '',
      ts,
      ctx.params.id
    )
    .run()

  return json({
    settings: {
      id: ctx.params.id,
      admin_phone_number: body?.admin_phone_number ?? row?.admin_phone_number ?? '',
      app_name: body?.app_name ?? row?.app_name ?? 'Bazaf',
      app_domain: body?.app_domain ?? row?.app_domain ?? '',
      created_at: row?.created_at ?? '',
      updated_at: ts
    }
  })
}