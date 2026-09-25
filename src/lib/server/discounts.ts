import {
  IProductDiscount,
  IProductDiscountInput,
  TProductDiscountType
} from '@/interfaces/discount'
import { now, uuid } from '@/lib/server/db'

export interface DiscountRow {
  id: string
  product_id: string
  name: string | null
  type: string
  value: number
  min_quantity: number
  start_date: string | null
  end_date: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export const mapDiscountRow = (row: DiscountRow): IProductDiscount => ({
  id: row.id,
  productId: row.product_id,
  name: row.name ?? '',
  type: (row.type === 'fixed' ? 'fixed' : 'percentage') as TProductDiscountType,
  value: row.value ?? 0,
  minQuantity: row.min_quantity ?? 1,
  startDate: row.start_date ?? null,
  endDate: row.end_date ?? null,
  isActive: (row.is_active ?? 1) === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

export const loadDiscountsForProducts = async (
  database: D1Database,
  productIds: string[]
): Promise<Map<string, IProductDiscount[]>> => {
  const map = new Map<string, IProductDiscount[]>()
  const unique = Array.from(new Set(productIds.filter(Boolean)))
  for (let i = 0; i < unique.length; i += 90) {
    const batch = unique.slice(i, i + 90)
    const placeholders = batch.map(() => '?').join(',')
    const { results } = await database
      .prepare(
        `SELECT * FROM product_discounts WHERE product_id IN (${placeholders})
         ORDER BY min_quantity ASC, created_at ASC`
      )
      .bind(...batch)
      .all<DiscountRow>()
    for (const row of results) {
      const list = map.get(row.product_id) || []
      list.push(mapDiscountRow(row))
      map.set(row.product_id, list)
    }
  }
  return map
}

export const loadDiscountsForProduct = async (
  database: D1Database,
  productId: string
): Promise<IProductDiscount[]> => {
  const map = await loadDiscountsForProducts(database, [productId])
  return map.get(productId) || []
}

const normalizeDiscount = (
  input: IProductDiscountInput
): IProductDiscountInput | null => {
  const type: TProductDiscountType =
    input.type === 'fixed' ? 'fixed' : 'percentage'
  const rawValue = Number(input.value)
  if (!Number.isFinite(rawValue) || rawValue <= 0) return null
  const value = type === 'percentage' ? Math.min(rawValue, 100) : rawValue
  const minQuantity = Math.max(1, Math.round(Number(input.minQuantity) || 1))
  return {
    name: (input.name || '').trim(),
    type,
    value,
    minQuantity,
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    isActive: input.isActive !== false
  }
}

export const replaceProductDiscounts = async (
  database: D1Database,
  productId: string,
  inputs: IProductDiscountInput[] | undefined
) => {
  if (!Array.isArray(inputs)) return
  await database
    .prepare('DELETE FROM product_discounts WHERE product_id = ?')
    .bind(productId)
    .run()

  const ts = now()
  for (const input of inputs) {
    const normalized = normalizeDiscount(input)
    if (!normalized) continue
    await database
      .prepare(
        `INSERT INTO product_discounts
           (id, product_id, name, type, value, min_quantity, start_date, end_date, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        uuid(),
        productId,
        normalized.name || null,
        normalized.type,
        normalized.value,
        normalized.minQuantity,
        normalized.startDate,
        normalized.endDate,
        normalized.isActive ? 1 : 0,
        ts,
        ts
      )
      .run()
  }
}
