import { getSession } from '@/lib/server/auth'
import { json, db, now, parseJson } from '@/lib/server/db'
import { generateOrderId, generateOrderNumber } from '@/lib/server/orderNumber'

interface ProductOrder {
  id: number
  quantity: number
  productId: string
  notes?: string
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
  notes?: string
  vendor?: { id: string; name: string }
}

export async function GET(request: Request) {
  const session = await getSession(request)
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const dateStart = url.searchParams.get('dateStart')
  const dateEnd = url.searchParams.get('dateEnd')
  let vendorId = url.searchParams.get('vendorId')

  // Non-admins can only see orders that include their own vendor.
  if (session.role !== 'admin') {
    const vendor = await db()
      .prepare('SELECT id FROM vendors WHERE user_id = ? AND is_active = 1 LIMIT 1')
      .bind(session.uid)
      .first<{ id: string }>()
    if (!vendor) return json({ orders: [] })
    vendorId = vendor.id
  }

  const conditions: string[] = []
  const params: unknown[] = []
  if (dateStart && dateEnd) {
    conditions.push('created_at >= ?', 'created_at <= ?')
    params.push(new Date(dateStart).toISOString(), new Date(dateEnd).toISOString())
  }
  if (vendorId) {
    conditions.push('vendors LIKE ?')
    params.push(`%"id":"${vendorId}"%`)
  }

  let query = 'SELECT * FROM orders'
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')
  query += ' ORDER BY created_at DESC'

  const { results } = await db()
    .prepare(query)
    .bind(...params)
    .all<{
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
      fulfillment_date: string | null
      payment_proof_url: string | null
      payment_proof_key: string | null
      created_at: string
      updated_at: string
    }>()

  return json({
    orders: results.map((row) => ({
      id: row.id,
      orderNumber: row.order_number ?? `BZ-${row.id.slice(-8)}`,
      productOrders: parseJson(row.product_orders, []),
      total: row.total,
      customer: parseJson(row.customer, {}),
      status: row.status,
      store: parseJson(row.store, { name: 'Bazaf' }),
      vendors: parseJson(row.vendors, []),
      channel: row.channel ?? undefined,
      payment: row.payment ? parseJson(row.payment, null) : undefined,
      cashier: row.cashier ?? undefined,
      activities: parseJson(row.activities, []),
      fulfillmentDate: row.fulfillment_date ?? undefined,
      paymentProofUrl: row.payment_proof_url ?? undefined,
      paymentProofKey: row.payment_proof_key ?? undefined,
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
      notes?: string
    }
    totalPrice?: number
    channel?: string
    fulfillmentDate?: string | null
  } | null

  if (!body?.items?.length) return json({ error: 'Cart is empty' }, { status: 400 })

  const productOrders: ProductOrder[] = body.items.map((item, index) => {
    const value = item as CartItem & { priceBase?: number; price?: number }
    return {
      id: index + 1,
      quantity: item.quantity || 0,
      productId: item.id || '',
      notes: item.notes || '',
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
  const id = await generateOrderId()
  const orderNumber = await generateOrderNumber()
  const customer = {
    name: body.orderer?.name || '',
    phoneNumber: body.orderer?.phoneNumber || '',
    notes: body.orderer?.notes || ''
  }

  const activities = [
    {
      userId: '',
      userEmail: '',
      userName: body.orderer?.name || 'Pelanggan',
      action: 'Pesanan dibuat',
      fromStatus: '',
      toStatus: 'Payment Pending',
      notes: '',
      timestamp: ts,
      createdAt: ts
    }
  ]

  await db()
    .prepare(
      `INSERT INTO orders (id, order_number, product_orders, total, customer, status, store, vendors, channel, payment, cashier, activities, fulfillment_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)`
    )
    .bind(
      id,
      orderNumber,
      JSON.stringify(productOrders),
      body.totalPrice || 0,
      JSON.stringify(customer),
      'Payment Pending',
      JSON.stringify({ name: 'Bazaf' }),
      JSON.stringify(Array.from(vendorMap.values())),
      body.channel === 'preorder' ? 'preorder' : 'pos',
      JSON.stringify(activities),
      body.fulfillmentDate ?? null,
      ts,
      ts
    )
    .run()

  return json({
    id,
    orderNumber,
    total: body.totalPrice || 0,
    channel: body.channel === 'preorder' ? 'preorder' : 'pos',
    fulfillmentDate: body.fulfillmentDate ?? null,
    createdAt: ts,
    updatedAt: ts,
    customerId: '',
    customer,
    productOrders,
    store: { name: 'Bazaf' },
    vendors: Array.from(vendorMap.values()),
    status: 'Payment Pending'
  })
}