import { db } from '@/lib/server/db'

/**
 * Human-readable, per-month sequential order number.
 * Format: BZ-<sequence 3-4 digits><MM><YY>
 * Example: BZ-0010926 (order #1, September 2026)
 */
export const generateOrderNumber = async (): Promise<string> => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)
  const suffix = `${month}${year}`

  const row = await db()
    .prepare(
      `SELECT MAX(CAST(substr(order_number, 4, length(order_number) - 7) AS INTEGER)) AS maxseq
       FROM orders
       WHERE order_number LIKE ?`
    )
    .bind(`BZ-%${suffix}`)
    .first<{ maxseq: number | null }>()

  const next = (row?.maxseq ?? 0) + 1

  return `BZ-${String(next).padStart(3, '0')}${suffix}`
}
