import { json, db, now } from '@/lib/server/db'
import { generateOrderId, generateOrderNumber } from '@/lib/server/orderNumber'

interface CartItem {
  id: string
  name: string
  imageUrl?: string
  priceBase?: number
  price?: number
  quantity?: number
  vendor?: { id: string; name: string }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    items?: CartItem[]
    totalPrice?: number
    customerName?: string
    notes?: string
    payment?: { method?: string; tendered?: number; change?: number }
    cashierName?: string
  } | null

  if (!body?.items?.length)
    return json({ error: 'Cart is empty' }, { status: 400 })

  const productOrders = body.items.map((item, index) => ({
    id: index + 1,
    quantity: item.quantity || 0,
    productId: item.id || '',
    product: {
      id: item.id || '',
      name: item.name || '',
      imageUrl: item.imageUrl || '',
      priceBase: item.priceBase || 0,
      price: item.price || 0,
      vendor: item.vendor
        ? { id: item.vendor.id, name: item.vendor.name }
        : null
    }
  }))

  const vendorMap = new Map<string, { id: string; name: string }>()
  productOrders.forEach((po) => {
    if (po.product.vendor && !vendorMap.has(po.product.vendor.id)) {
      vendorMap.set(po.product.vendor.id, {
        id: po.product.vendor.id,
        name: po.product.vendor.name
      })
    }
  })

  const ts = now()
  const id = await generateOrderId()
  const orderNumber = await generateOrderNumber()
  const customer = {
    name: body.customerName || 'Walk-in Customer',
    phoneNumber: '-',
    namaSantri: '-',
    kelas: '-',
    notes: body.notes || ''
  }
  const payment = {
    method: body.payment?.method || '',
    tendered: body.payment?.tendered || 0,
    change: body.payment?.change || 0
  }

  await db()
    .prepare(
      `INSERT INTO orders (id, order_number, product_orders, total, customer, status, store, vendors, channel, payment, cashier, activities, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      orderNumber,
      JSON.stringify(productOrders),
      body.totalPrice || 0,
      JSON.stringify(customer),
      'Payment Confirmed',
      JSON.stringify({ name: 'Bazaf' }),
      JSON.stringify(Array.from(vendorMap.values())),
      'pos',
      JSON.stringify(payment),
      body.cashierName || '',
      JSON.stringify([]),
      ts,
      ts
    )
    .run()

  return json({
    id,
    orderNumber,
    total: body.totalPrice || 0,
    createdAt: ts,
    updatedAt: ts,
    customerId: '',
    customer,
    productOrders,
    store: { name: 'Bazaf' },
    vendors: Array.from(vendorMap.values()),
    status: 'Payment Confirmed',
    channel: 'pos',
    payment
  })
}
