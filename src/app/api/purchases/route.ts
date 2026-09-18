import { ICreatePurchaseItemInput } from '@/interfaces/purchase'
import { requireAdmin } from '@/lib/server/auth'
import { db, json, now, uuid } from '@/lib/server/db'
import {
  generatePurchaseNumber,
  loadPurchaseItems,
  PurchaseItemRow,
  PurchaseRow,
  transformPurchase
} from '@/lib/server/purchases'

interface CreatePurchaseBody {
  supplier?: string
  purchaseDate?: string
  note?: string
  items?: ICreatePurchaseItemInput[]
}

const sanitizeItems = (
  items: ICreatePurchaseItemInput[] | undefined
): ICreatePurchaseItemInput[] => {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => ({
      productId: String(item?.productId || ''),
      qty: Math.floor(Number(item?.qty) || 0),
      costPrice: Math.max(0, Number(item?.costPrice) || 0),
      sellPrice: Math.max(0, Number(item?.sellPrice) || 0)
    }))
    .filter((item) => item.productId && item.qty > 0)
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const database = db()
  const { results: purchaseRows } = await database
    .prepare('SELECT * FROM purchases ORDER BY purchase_date DESC, created_at DESC')
    .all<PurchaseRow>()

  const { results: itemRows } = await database
    .prepare('SELECT * FROM purchase_items ORDER BY created_at ASC')
    .all<PurchaseItemRow>()

  const itemsByPurchase = new Map<string, PurchaseItemRow[]>()
  for (const item of itemRows) {
    const list = itemsByPurchase.get(item.purchase_id) || []
    list.push(item)
    itemsByPurchase.set(item.purchase_id, list)
  }

  const purchases = purchaseRows.map((row) => {
    const items = (itemsByPurchase.get(row.id) || []).map((item) => ({
      id: item.id,
      purchaseId: item.purchase_id,
      productId: item.product_id,
      productName: item.product_name ?? '',
      qty: item.qty ?? 0,
      costPrice: item.cost_price ?? 0,
      sellPrice: item.sell_price ?? 0,
      subtotal: item.subtotal ?? 0,
      margin: (item.sell_price ?? 0) - (item.cost_price ?? 0)
    }))
    return transformPurchase(row, items)
  })

  return json({ purchases })
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = (await request.json().catch(() => null)) as CreatePurchaseBody | null
  const items = sanitizeItems(body?.items)
  if (!items.length) {
    return json({ error: 'Tambahkan minimal satu produk' }, { status: 400 })
  }

  const database = db()
  const productIds = Array.from(new Set(items.map((item) => item.productId)))
  const placeholders = productIds.map(() => '?').join(',')
  const { results: productRows } = await database
    .prepare(`SELECT id, name FROM products WHERE id IN (${placeholders})`)
    .bind(...productIds)
    .all<{ id: string; name: string }>()
  const productMap = new Map(productRows.map((row) => [row.id, row]))

  const missing = productIds.filter((id) => !productMap.has(id))
  if (missing.length) {
    return json({ error: 'Produk tidak ditemukan' }, { status: 400 })
  }

  const ts = now()
  const purchaseId = uuid()
  const purchaseNumber = await generatePurchaseNumber()
  const purchaseDate = body?.purchaseDate || ts

  // Aggregate per product so multiple lines of the same product apply once.
  const productTotals = new Map<
    string,
    { qty: number; costPrice: number; sellPrice: number }
  >()
  for (const item of items) {
    const current = productTotals.get(item.productId)
    productTotals.set(item.productId, {
      qty: (current?.qty ?? 0) + item.qty,
      costPrice: item.costPrice,
      sellPrice: item.sellPrice
    })
  }

  const totalCost = items.reduce(
    (sum, item) => sum + item.qty * item.costPrice,
    0
  )

  const statements: D1PreparedStatement[] = []

  statements.push(
    database
      .prepare(
        `INSERT INTO purchases (id, purchase_number, supplier, purchase_date, note, total_cost, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        purchaseId,
        purchaseNumber,
        body?.supplier?.trim() || '',
        purchaseDate,
        body?.note?.trim() || '',
        totalCost,
        ts,
        ts
      )
  )

  for (const item of items) {
    const itemId = uuid()
    const product = productMap.get(item.productId)
    const subtotal = item.qty * item.costPrice
    statements.push(
      database
        .prepare(
          `INSERT INTO purchase_items (id, purchase_id, product_id, product_name, qty, cost_price, sell_price, subtotal, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          itemId,
          purchaseId,
          item.productId,
          product?.name ?? '',
          item.qty,
          item.costPrice,
          item.sellPrice,
          subtotal,
          ts
        )
    )
    statements.push(
      database
        .prepare(
          `INSERT INTO stock_batches (id, product_id, purchase_item_id, qty_in, qty_remaining, cost_price, sell_price, received_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          uuid(),
          item.productId,
          itemId,
          item.qty,
          item.qty,
          item.costPrice,
          item.sellPrice,
          purchaseDate
        )
    )
  }

  for (const [productId, totals] of productTotals) {
    statements.push(
      database
        .prepare(
          `UPDATE products
           SET stock = stock + ?, price_base = ?, price = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(totals.qty, totals.costPrice, totals.sellPrice, ts, productId)
    )
  }

  await database.batch(statements)

  const row = await database
    .prepare('SELECT * FROM purchases WHERE id = ?')
    .bind(purchaseId)
    .first<PurchaseRow>()
  const purchaseItems = await loadPurchaseItems(purchaseId)

  return json(
    { purchase: row ? transformPurchase(row, purchaseItems) : null },
    { status: 201 }
  )
}
