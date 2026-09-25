import { db, now, uuid, parseJson } from '@/lib/server/db'

interface ProductOrder {
  id: number | string
  quantity: number
  productId?: string
  product?: {
    id: string
    name: string
    price: number
    priceBase?: number
    vendor?: { id: string; name: string } | null
    store?: { id: string; name: string }
  }
}

interface OrderRow {
  id: string
  order_number: string | null
  product_orders: string
  vendors: string
  customer: string
  created_at: string
}

export interface InvoiceRow {
  id: string
  invoice_number: string | null
  order_id: string | null
  vendor_id: string | null
  vendor_name: string | null
  total_amount: number
  status: string
  due_date: string | null
  issued_date: string | null
  settled_date: string | null
  items: string
  customer: string
  created_at: string
  updated_at: string
  type?: string | null
  period_start?: string | null
  period_end?: string | null
  order_ids?: string | null
}

const DEFAULT_DUE_DAYS = 30

const generateInvoiceNumber = async (prefix = 'INV'): Promise<string> => {
  const nowDate = new Date()
  const month = String(nowDate.getMonth() + 1).padStart(2, '0')
  const year = String(nowDate.getFullYear()).slice(-2)
  const suffix = `${month}-${year}`

  const seqStart = prefix.length + 2
  const seqLength = `length(invoice_number) - ${prefix.length + 6}`

  const row = await db()
    .prepare(
      `SELECT MAX(CAST(substr(invoice_number, ${seqStart}, ${seqLength}) AS INTEGER)) AS maxseq
       FROM invoices
       WHERE invoice_number LIKE ?`
    )
    .bind(`${prefix}-%${suffix}`)
    .first<{ maxseq: number | null }>()

  const next = (row?.maxseq ?? 0) + 1

  return `${prefix}-${String(next).padStart(3, '0')}${suffix}`
}

export const mapInvoiceRow = (
  row: InvoiceRow,
  options?: { vendorId?: string }
) => {
  const items = parseJson<Record<string, unknown>[]>(row.items, [])
  const vendorId = options?.vendorId

  let vendorTotal: number | undefined
  if (vendorId) {
    if (row.vendor_id === vendorId) {
      vendorTotal = row.total_amount
    } else {
      vendorTotal = items.reduce((sum, item) => {
        return item.vendorId === vendorId
          ? sum + Number(item.totalPrice || 0)
          : sum
      }, 0)
    }
  }

  return {
    id: row.id,
    invoiceNumber: row.invoice_number ?? '',
    type: row.type === 'vendor_period' ? 'vendor_period' : 'transaction',
    orderId: row.order_id ?? '',
    vendorId: row.vendor_id ?? '',
    vendorName: row.vendor_name ?? '',
    totalAmount: row.total_amount,
    status: row.status,
    dueDate: row.due_date ?? new Date().toISOString(),
    issuedDate: row.issued_date ?? new Date().toISOString(),
    settledDate: row.settled_date ?? undefined,
    periodStart: row.period_start ?? undefined,
    periodEnd: row.period_end ?? undefined,
    orderIds: parseJson<Record<string, unknown>[]>(row.order_ids, []),
    vendorTotal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
    customer: parseJson<Record<string, unknown>>(row.customer, {})
  }
}

/**
 * Create the single transaction invoice for an order. Items keep their own
 * vendor so multi-vendor orders are covered by one invoice.
 * Idempotent: returns the existing invoice if one was already issued.
 */
export async function generateInvoiceForOrder(orderId: string) {
  const existing = await db()
    .prepare(
      `SELECT * FROM invoices WHERE order_id = ? AND type = 'transaction' LIMIT 1`
    )
    .bind(orderId)
    .first<InvoiceRow>()
  if (existing) return mapInvoiceRow(existing)

  const row = await db()
    .prepare('SELECT * FROM orders WHERE id = ?')
    .bind(orderId)
    .first<OrderRow>()
  if (!row) throw new Error('Order not found')

  const productOrders = parseJson<ProductOrder[]>(row.product_orders, [])
  const orderVendors = parseJson<{ id: string; name: string }[]>(
    row.vendors,
    []
  )
  const customer = parseJson<Record<string, string>>(row.customer, {})

  const items = productOrders.map((productOrder) => {
    const product = productOrder.product
    const vendor =
      product?.vendor || (orderVendors.length ? orderVendors[0] : undefined)
    const unitPrice = product?.price ?? 0
    const quantity = productOrder.quantity ?? 0
    return {
      productId: productOrder.productId || product?.id || '',
      productName: product?.name || '',
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      vendorId: vendor?.id || '',
      vendorName: vendor?.name || ''
    }
  })

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const ts = now()
  const id = uuid()
  const invoiceNumber = await generateInvoiceNumber('INV')
  const dueDate = new Date(
    Date.now() + DEFAULT_DUE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  const customerInfo = {
    name: customer?.name ?? '',
    phoneNumber: customer?.phoneNumber ?? '',
    namaSantri: customer?.namaSantri ?? '',
    kelas: customer?.kelas ?? ''
  }

  await db()
    .prepare(
      `INSERT INTO invoices (id, invoice_number, order_id, vendor_id, vendor_name, total_amount, status, due_date, issued_date, settled_date, items, customer, commission, type, period_start, period_end, order_ids, created_at, updated_at)
       VALUES (?, ?, ?, '', '', ?, 'Issued', ?, ?, NULL, ?, ?, NULL, 'transaction', NULL, NULL, '[]', ?, ?)`
    )
    .bind(
      id,
      invoiceNumber,
      orderId,
      totalAmount,
      dueDate,
      ts,
      JSON.stringify(items),
      JSON.stringify(customerInfo),
      ts,
      ts
    )
    .run()

  const created = await db()
    .prepare('SELECT * FROM invoices WHERE id = ?')
    .bind(id)
    .first<InvoiceRow>()

  return mapInvoiceRow(created as InvoiceRow)
}

export interface VendorPeriodParams {
  vendorId: string
  periodStart: string
  periodEnd: string
  dueDate?: string
  groupBy: 'product' | 'order'
}

interface VendorPeriodItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  vendorId: string
  vendorName: string
  orderNumber?: string
  orderCount: number
}

/**
 * Create a consolidated invoice for one vendor over a date range.
 * Aggregates every non-cancelled order that contains items of the vendor.
 */
export async function generateVendorPeriodInvoice(params: VendorPeriodParams) {
  const { vendorId, periodStart, periodEnd, dueDate, groupBy } = params

  const vendor = await db()
    .prepare('SELECT id, name FROM vendors WHERE id = ?')
    .bind(vendorId)
    .first<{ id: string; name: string }>()
  const vendorName = vendor?.name || 'Vendor'

  const startIso = new Date(`${periodStart}T00:00:00`).toISOString()
  const endIso = new Date(`${periodEnd}T23:59:59.999`).toISOString()

  const orders = (
    await db()
      .prepare(
        `SELECT * FROM orders
         WHERE created_at >= ? AND created_at <= ? AND status != 'Cancelled'
         ORDER BY created_at ASC`
      )
      .bind(startIso, endIso)
      .all<OrderRow>()
  ).results

  const productMap = new Map<string, VendorPeriodItem>()
  const orderLines: VendorPeriodItem[] = []
  const sourceOrders: { id: string; orderNumber: string; createdAt: string }[] =
    []
  let totalAmount = 0

  for (const order of orders) {
    const productOrders = parseJson<ProductOrder[]>(order.product_orders, [])
    const orderVendors = parseJson<{ id: string; name: string }[]>(
      order.vendors,
      []
    )
    let orderSubtotal = 0
    let orderQty = 0

    for (const productOrder of productOrders) {
      const product = productOrder.product
      const itemVendor =
        product?.vendor || (orderVendors.length ? orderVendors[0] : undefined)
      const itemVendorId = itemVendor?.id || ''
      if (itemVendorId !== vendorId) continue

      const qty = productOrder.quantity || 0
      const price = product?.price || 0
      const lineTotal = qty * price
      orderSubtotal += lineTotal
      orderQty += qty

      const productId = productOrder.productId || product?.id || 'unknown'
      const entry =
        productMap.get(productId) ||
        ({
          productId,
          productName: product?.name || '',
          quantity: 0,
          unitPrice: price,
          totalPrice: 0,
          vendorId,
          vendorName,
          orderCount: 0
        } satisfies VendorPeriodItem)
      entry.quantity += qty
      entry.totalPrice += lineTotal
      entry.orderCount += 1
      productMap.set(productId, entry)
    }

    if (orderQty > 0) {
      totalAmount += orderSubtotal
      sourceOrders.push({
        id: order.id,
        orderNumber: order.order_number || order.id.slice(0, 8),
        createdAt: order.created_at
      })
      orderLines.push({
        productId: '',
        productName: `Order ${order.order_number || order.id.slice(0, 8)}`,
        quantity: orderQty,
        unitPrice: 0,
        totalPrice: orderSubtotal,
        vendorId,
        vendorName,
        orderNumber: order.order_number || order.id.slice(0, 8),
        orderCount: 1
      })
    }
  }

  const items =
    groupBy === 'order' ? orderLines : Array.from(productMap.values())

  if (!items.length) {
    throw new Error('Tidak ada transaksi vendor pada rentang tanggal ini')
  }

  const ts = now()
  const id = uuid()
  const invoiceNumber = await generateInvoiceNumber('INVP')
  const due = dueDate
    ? new Date(`${dueDate}T23:59:59.999`).toISOString()
    : new Date(
        Date.now() + DEFAULT_DUE_DAYS * 24 * 60 * 60 * 1000
      ).toISOString()

  await db()
    .prepare(
      `INSERT INTO invoices (id, invoice_number, order_id, vendor_id, vendor_name, total_amount, status, due_date, issued_date, settled_date, items, customer, commission, type, period_start, period_end, order_ids, created_at, updated_at)
       VALUES (?, ?, '', ?, ?, ?, 'Issued', ?, ?, NULL, ?, '{}', NULL, 'vendor_period', ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      invoiceNumber,
      vendorId,
      vendorName,
      totalAmount,
      due,
      ts,
      JSON.stringify(items),
      startIso,
      endIso,
      JSON.stringify(sourceOrders),
      ts,
      ts
    )
    .run()

  const created = await db()
    .prepare('SELECT * FROM invoices WHERE id = ?')
    .bind(id)
    .first<InvoiceRow>()

  return mapInvoiceRow(created as InvoiceRow)
}
