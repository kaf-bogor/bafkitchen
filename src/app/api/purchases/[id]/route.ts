import { ICreatePurchaseItemInput } from '@/interfaces/purchase'
import { requireAdmin } from '@/lib/server/auth'
import { db, json, now, uuid } from '@/lib/server/db'
import {
  loadPurchaseItems,
  PurchaseItemRow,
  PurchaseRow,
  transformPurchase
} from '@/lib/server/purchases'

interface UpdatePurchaseBody {
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

const aggregateQty = (items: ICreatePurchaseItemInput[]) => {
  const map = new Map<string, number>()
  for (const item of items) {
    map.set(item.productId, (map.get(item.productId) ?? 0) + item.qty)
  }
  return map
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const { id } = await params
  const database = db()
  const row = await database
    .prepare('SELECT * FROM purchases WHERE id = ?')
    .bind(id)
    .first<PurchaseRow>()
  if (!row)
    return json({ error: 'Nota pembelian tidak ditemukan' }, { status: 404 })

  const items = await loadPurchaseItems(id)
  return json({ purchase: transformPurchase(row, items) })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const { id } = await params
  const database = db()
  const existing = await database
    .prepare('SELECT * FROM purchases WHERE id = ?')
    .bind(id)
    .first<PurchaseRow>()
  if (!existing)
    return json({ error: 'Nota pembelian tidak ditemukan' }, { status: 404 })

  const body = (await request
    .json()
    .catch(() => null)) as UpdatePurchaseBody | null
  const items = sanitizeItems(body?.items)
  if (!items.length) {
    return json({ error: 'Tambahkan minimal satu produk' }, { status: 400 })
  }

  const { results: oldItemRows } = await database
    .prepare('SELECT * FROM purchase_items WHERE purchase_id = ?')
    .bind(id)
    .all<PurchaseItemRow>()

  const oldQtyByProduct = new Map<string, number>()
  for (const item of oldItemRows) {
    oldQtyByProduct.set(
      item.product_id,
      (oldQtyByProduct.get(item.product_id) ?? 0) + (item.qty ?? 0)
    )
  }

  const productIds = Array.from(
    new Set([...items.map((item) => item.productId), ...oldQtyByProduct.keys()])
  )
  const placeholders = productIds.map(() => '?').join(',')
  const { results: productRows } = await database
    .prepare(`SELECT id, name FROM products WHERE id IN (${placeholders})`)
    .bind(...productIds)
    .all<{ id: string; name: string }>()
  const productMap = new Map(productRows.map((row) => [row.id, row]))

  const missing = items
    .map((item) => item.productId)
    .filter((productId) => !productMap.has(productId))
  if (missing.length) {
    return json({ error: 'Produk tidak ditemukan' }, { status: 400 })
  }

  const ts = now()
  const purchaseDate = body?.purchaseDate || existing.purchase_date
  const totalCost = items.reduce(
    (sum, item) => sum + item.qty * item.costPrice,
    0
  )

  const statements: D1PreparedStatement[] = []

  statements.push(
    database
      .prepare(
        `UPDATE purchases
         SET supplier = ?, purchase_date = ?, note = ?, total_cost = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(
        body?.supplier?.trim() ?? existing.supplier ?? '',
        purchaseDate,
        body?.note?.trim() ?? existing.note ?? '',
        totalCost,
        ts,
        id
      )
  )

  // Reverse the stock previously added by this purchase, then remove its lines.
  for (const [productId, qty] of oldQtyByProduct) {
    statements.push(
      database
        .prepare(
          'UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?'
        )
        .bind(qty, ts, productId)
    )
  }
  statements.push(
    database
      .prepare(
        'DELETE FROM stock_batches WHERE purchase_item_id IN (SELECT id FROM purchase_items WHERE purchase_id = ?)'
      )
      .bind(id)
  )
  statements.push(
    database
      .prepare('DELETE FROM purchase_items WHERE purchase_id = ?')
      .bind(id)
  )

  for (const item of items) {
    const itemId = uuid()
    const product = productMap.get(item.productId)
    statements.push(
      database
        .prepare(
          `INSERT INTO purchase_items (id, purchase_id, product_id, product_name, qty, cost_price, sell_price, subtotal, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          itemId,
          id,
          item.productId,
          product?.name ?? '',
          item.qty,
          item.costPrice,
          item.sellPrice,
          item.qty * item.costPrice,
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

  const newQtyByProduct = aggregateQty(items)
  for (const [productId, qty] of newQtyByProduct) {
    const latest = items.filter((item) => item.productId === productId).pop()
    statements.push(
      database
        .prepare(
          `UPDATE products
           SET stock = stock + ?, price_base = ?, price = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(
          qty,
          latest?.costPrice ?? 0,
          latest?.sellPrice ?? 0,
          ts,
          productId
        )
    )
  }

  await database.batch(statements)

  const row = await database
    .prepare('SELECT * FROM purchases WHERE id = ?')
    .bind(id)
    .first<PurchaseRow>()
  const purchaseItems = await loadPurchaseItems(id)

  return json({ purchase: row ? transformPurchase(row, purchaseItems) : null })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const { id } = await params
  const database = db()
  const existing = await database
    .prepare('SELECT * FROM purchases WHERE id = ?')
    .bind(id)
    .first<PurchaseRow>()
  if (!existing)
    return json({ error: 'Nota pembelian tidak ditemukan' }, { status: 404 })

  const { results: itemRows } = await database
    .prepare('SELECT * FROM purchase_items WHERE purchase_id = ?')
    .bind(id)
    .all<PurchaseItemRow>()

  const qtyByProduct = new Map<string, number>()
  for (const item of itemRows) {
    qtyByProduct.set(
      item.product_id,
      (qtyByProduct.get(item.product_id) ?? 0) + (item.qty ?? 0)
    )
  }

  const ts = now()
  const statements: D1PreparedStatement[] = []
  for (const [productId, qty] of qtyByProduct) {
    statements.push(
      database
        .prepare(
          'UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?'
        )
        .bind(qty, ts, productId)
    )
  }
  statements.push(
    database
      .prepare(
        'DELETE FROM stock_batches WHERE purchase_item_id IN (SELECT id FROM purchase_items WHERE purchase_id = ?)'
      )
      .bind(id)
  )
  statements.push(
    database
      .prepare('DELETE FROM purchase_items WHERE purchase_id = ?')
      .bind(id)
  )
  statements.push(
    database.prepare('DELETE FROM purchases WHERE id = ?').bind(id)
  )

  await database.batch(statements)

  return json({ deleted: id })
}
