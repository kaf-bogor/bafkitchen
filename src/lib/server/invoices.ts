import { db, now, uuid } from '@/lib/server/db'

interface ProductOrder {
  id: number | string
  quantity: number
  productId?: string
  product?: {
    id: string
    name: string
    price: number
    vendor?: { id: string; name: string }
    store?: { id: string; name: string }
  }
}

const generateInvoiceNumber = async (): Promise<string> => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)
  const suffix = `${month}-${year}`

  const row = await db()
    .prepare(
      `SELECT MAX(CAST(substr(invoice_number, 5, length(invoice_number) - 9) AS INTEGER)) AS maxseq
       FROM invoices
       WHERE invoice_number LIKE ?`
    )
    .bind(`INV-%${suffix}`)
    .first<{ maxseq: number | null }>()

  const next = (row?.maxseq ?? 0) + 1

  return `INV-${String(next).padStart(3, '0')}${suffix}`
}

/**
 * Group an order's productOrders by vendor and write one invoice per vendor.
 * Mirrors the previous client-side implementation.
 */
export async function generateInvoicesForOrder(orderId: string) {
  const row = await db()
    .prepare('SELECT * FROM orders WHERE id = ?')
    .bind(orderId)
    .first<{
      product_orders: string
      vendors: string
      customer: string
    }>()
  if (!row) throw new Error('Order not found')

  const productOrders: ProductOrder[] = JSON.parse(row.product_orders || '[]')
  const orderVendors: { id: string; name: string }[] = JSON.parse(row.vendors || '[]')
  const customer = JSON.parse(row.customer || '{}')

  const productsByVendor = new Map<string, { productOrder: ProductOrder; vendorId: string; vendorName: string }[]>()

  for (const productOrder of productOrders) {
    let vendorId = 'default-vendor'
    let vendorName = 'Unknown Vendor'

    const product = productOrder.product
    if (product?.vendor?.id) {
      vendorId = product.vendor.id
      vendorName = product.vendor.name
    } else if (product?.vendor?.name) {
      vendorName = product.vendor.name
    } else if (orderVendors.length === 1) {
      vendorId = orderVendors[0].id
      vendorName = orderVendors[0].name
    } else if (product?.store?.name) {
      vendorName = product.store.name
      if (product.store.id) vendorId = product.store.id
    }

    if (!productsByVendor.has(vendorId)) productsByVendor.set(vendorId, [])
    productsByVendor.get(vendorId)?.push({ productOrder, vendorId, vendorName })
  }

  const invoices: Record<string, unknown>[] = []
  const ts = now()

  for (const [vendorId, group] of Array.from(productsByVendor)) {
    const vendorName = group[0]?.vendorName || 'Unknown Vendor'
    const items = group.map(({ productOrder }) => {
      const product = productOrder.product
      const unitPrice = product?.price ?? 0
      const quantity = productOrder.quantity ?? 0
      return {
        productId: productOrder.productId || product?.id || '',
        productName: product?.name || '',
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice
      }
    })
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const invoice = {
      id: uuid(),
      invoiceNumber: await generateInvoiceNumber(),
      orderId,
      vendorId,
      vendorName,
      totalAmount,
      status: 'Issued',
      dueDate,
      issuedDate: ts,
      settledDate: null,
      createdAt: ts,
      updatedAt: ts,
      items,
      customer: {
        name: customer?.name ?? '',
        phoneNumber: customer?.phoneNumber ?? '',
        namaSantri: customer?.namaSantri ?? '',
        kelas: customer?.kelas ?? ''
      }
    }
    await db()
      .prepare(
        `INSERT INTO invoices (id, invoice_number, order_id, vendor_id, vendor_name, total_amount, status, due_date, issued_date, settled_date, items, customer, commission, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL, ?, ?)`
      )
      .bind(
        invoice.id,
        invoice.invoiceNumber,
        invoice.orderId,
        invoice.vendorId,
        invoice.vendorName,
        invoice.totalAmount,
        invoice.status,
        invoice.dueDate,
        invoice.issuedDate,
        JSON.stringify(invoice.items),
        JSON.stringify(invoice.customer),
        invoice.createdAt,
        invoice.updatedAt
      )
      .run()
    invoices.push(invoice)
  }

  return invoices
}