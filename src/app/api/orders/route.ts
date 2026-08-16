import { json, db, now, uuid, parseJson } from '@/lib/server/db'
import { generateOrderId } from '@/utils/orderIdGenerator'

interface ProductOrder {
  id: number
  quantity: number
  productId: string
  product: {
    id: string
    name: string
    imageUrl: string
    priceBase: number
    price: number
    vendor: { id: string; name: string } | null
  }
}

interface CartItem {
  id: string
  name: string
  imageUrl?: string
  priceBase?: number
  price?: number
  quantity?: number
  vendor?: { id: string; name: string }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const dateStart = url.searchParams.get('dateStart')
  const dateEnd = url.searchParams.get('dateEnd')

  let statement: D1PreparedStatement
  if (dateStart && dateEnd) {
    const start = new Date(dateStart).toISOString()
    const end = new Date(dateEnd).toISOString()
    statement = db()
      .prepare(
        'SELECT * FROM orders WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC'
      )
      .bind(start, end)
  } else {
    statement = db().prepare('SELECT * FROM orders ORDER BY created_at DESC')
  }

  const { results } = await statement.all<{
    id: string
    order_number: string | null
    product_orders: string
    total: number
    customer: string
    status: string
    store: string
    vendors: string
    channel: string | null
    payment: string | null
    cashier: string | null
    activities: string
    created_at: string
    updated_at: string
  }>()

  return json({
    orders: results.map((row) => ({
      id: row.id,
      orderNumber: row.order_number ?? `BAF-${row.id.slice(-8)}`,
      productOrders: parseJson(row.product_orders, []),
      total: row.total,
      customer: parseJson(row.customer, {}),
      status: row.status,
      store: parseJson(row.store, { name: 'Baf Kitchen' }),
      vendors: parseJson(row.vendors, []),
      channel: row.channel ?? undefined,
      payment: row.payment ? parseJson(row.payment, null) : undefined,
      cashier: row.cashier ?? undefined,
      activities: parseJson(row.activities, []),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    items?: CartItem[]
    orderer?: {
      name?: string
      phoneNumber?: string
      namaSantri?: string
      kelas?: string
      notes?: string
    }
    totalPrice?: number
  } | null

  if (!body?.items?.length) return json({ error: 'Cart is empty' }, { status: 400 })

  const productOrders: ProductOrder[] = body.items.map((item, index) => {
    const value = item as CartItem & { priceBase?: number; price?: number }
    return {
      id: index + 1,
      quantity: item.quantity || 0,
      productId: item.id || '',
      product: {
        id: item.id || '',
        name: item.name || '',
        imageUrl: item.imageUrl || '',
        priceBase: value.priceBase || 0,
        price: value.price || 0,
        vendor: item.vendor ? { id: item.vendor.id, name: item.vendor.name } : null
      }
    }
  })

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
  const id = uuid()
  const orderNumber = generateOrderId()
  const customer = {
    name: body.orderer?.name || '',
    phoneNumber: body.orderer?.phoneNumber || '',
    namaSantri: body.orderer?.namaSantri || '',
    kelas: body.orderer?.kelas || '',
    notes: body.orderer?.notes || ''
  }

  await db()
    .prepare(
      `INSERT INTO orders (id, order_number, product_orders, total, customer, status, store, vendors, channel, payment, cashier, activities, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?)`
    )
    .bind(
      id,
      orderNumber,
      JSON.stringify(productOrders),
      body.totalPrice || 0,
      JSON.stringify(customer),
      'Payment Pending',
      JSON.stringify({ name: 'Baf Kitchen' }),
      JSON.stringify(Array.from(vendorMap.values())),
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
    store: { name: 'Baf Kitchen' },
    vendors: Array.from(vendorMap.values()),
    status: 'Payment Pending'
  })
}