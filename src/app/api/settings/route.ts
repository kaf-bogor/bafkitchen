import { requireAdmin } from '@/lib/server/auth'
import { json, db, now, uuid } from '@/lib/server/db'

interface SettingsRow {
  id: string
  admin_phone_number: string | null
  app_name: string | null
  app_domain: string | null
  created_at: string
  updated_at: string
}

const transformSettings = (row: SettingsRow) => ({
  id: row.id,
  admin_phone_number: row.admin_phone_number ?? '',
  app_name: row.app_name ?? 'BAF Kitchen',
  app_domain: row.app_domain ?? '',
  created_at: row.created_at ?? '',
  updated_at: row.updated_at ?? ''
})

export async function GET() {
  const row = await db()
    .prepare('SELECT * FROM settings ORDER BY created_at DESC LIMIT 1')
    .first<SettingsRow>()
  return json({ settings: row ? transformSettings(row) : null })
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as {
    admin_phone_number?: string
    app_name?: string
    app_domain?: string
  } | null

  const ts = now()
  const id = uuid()
  await db()
    .prepare(
      `INSERT INTO settings (id, admin_phone_number, app_name, app_domain, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body?.admin_phone_number ?? '',
      body?.app_name ?? 'BAF Kitchen',
      body?.app_domain ?? '',
      ts,
      ts
    )
    .run()

  return json(
    {
      settings: {
        id,
        admin_phone_number: body?.admin_phone_number ?? '',
        app_name: body?.app_name ?? 'BAF Kitchen',
        app_domain: body?.app_domain ?? '',
        created_at: ts,
        updated_at: ts
      }
    },
    { status: 201 }
  )
}