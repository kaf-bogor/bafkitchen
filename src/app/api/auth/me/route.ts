import { getSession } from '@/lib/server/auth'
import { json, db } from '@/lib/server/db'

export async function GET(request: Request) {
  const session = await getSession(request)
  if (!session) return json({ user: null })

  const row = await db()
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(session.uid)
    .first<{
      id: string
      name: string | null
      email: string
      role: string
      photo_url: string | null
      phone_number: string | null
    }>()
  if (!row) return json({ user: null })

  const vendor = await db()
    .prepare('SELECT id, name FROM vendors WHERE user_id = ? AND is_active = 1 LIMIT 1')
    .bind(row.id)
    .first<{ id: string; name: string }>()

  return json({
    user: {
      uid: row.id,
      displayName: row.name,
      email: row.email,
      photoURL: row.photo_url,
      phoneNumber: row.phone_number,
      role: row.role,
      vendorId: vendor?.id ?? null,
      vendorName: vendor?.name ?? null
    }
  })
}