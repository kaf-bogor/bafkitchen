import { db } from '@/lib/server/db'

export interface SessionVendor {
  id: string
  name: string
}

export const getVendorForUser = async (
  uid: string
): Promise<SessionVendor | null> =>
  db()
    .prepare(
      'SELECT id, name FROM vendors WHERE user_id = ? AND is_active = 1 LIMIT 1'
    )
    .bind(uid)
    .first<SessionVendor>()
