import { useState, useEffect, useCallback } from 'react'

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'

import { EOrderStatus } from '@/constants/order'
import { EInvoiceStatus } from '@/interfaces/invoice'
import { IOrder as IOrderType, IOrderActivity } from '@/interfaces/order'
import { currency } from '@/utils'
import { db } from '@/utils/firebase'

// Fetch single order
const fetchOrder = async (orderId: string): Promise<IOrderType> => {
  const orderDoc = await getDoc(doc(db, 'orders', orderId))
  
  if (!orderDoc.exists()) {
    throw new Error('Order not found')
  }
  
  const data = orderDoc.data() as any
  return {
    id: orderDoc.id,
    orderNumber: data.orderNumber || `BAF-${orderDoc.id.slice(-8)}`, // Fallback for existing orders
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString()
  } as IOrderType
}

// Fetch order activities from order document
const fetchOrderActivities = async (orderId: string): Promise<IOrderActivity[]> => {
  console.log('🔍 Fetching activities for order:', orderId)
  const orderDoc = await getDoc(doc(db, 'orders', orderId))
  
  if (!orderDoc.exists()) {
    console.log('❌ Order not found')
    return []
  }
  
  const data = orderDoc.data()
  const activities = data.activities || []
  
  console.log('📊 Found activities in order:', activities.length)
  
  const processedActivities = activities.map((activity: any, index: number) => {
    console.log('📝 Activity data:', activity)
    return {
      id: `${orderId}-activity-${index}`,
      ...activity,
      timestamp: activity.timestamp?.toDate?.()?.toISOString() || 
                 (activity.timestamp instanceof Date ? activity.timestamp.toISOString() : activity.timestamp) || 
                 new Date().toISOString(),
      createdAt: activity.createdAt?.toDate?.()?.toISOString() || 
                 (activity.createdAt instanceof Date ? activity.createdAt.toISOString() : activity.createdAt) || 
                 new Date().toISOString()
    }
  }) as IOrderActivity[]
  
  // Sort by timestamp descending (newest first)
  processedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
  console.log('✅ Processed activities:', processedActivities.length)
  return processedActivities
}

// Generate invoice number
const generateInvoiceNumber = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `INV-${dateStr}-${randomStr}`
}

// Generate invoices for an order based on vendors
const generateInvoicesForOrder = async (orderId: string, orderData: any) => {
  try {
    console.log('🚀 Starting invoice generation for order:', orderId)
    console.log('📦 Order data:', JSON.stringify(orderData, null, 2))

    // Group products by vendor
    const productsByVendor = new Map<string, any[]>()

    if (orderData.productOrders && Array.isArray(orderData.productOrders)) {
      console.log('📦 Found', orderData.productOrders.length, 'product orders')

      // Get vendor info from product's store data
      for (const productOrder of orderData.productOrders) {
        console.log('🔍 Processing product order:', productOrder)

        let vendorId = 'default-vendor'
        let vendorName = 'Unknown Vendor'

        if (productOrder.product) {
          console.log('📝 Product data:', productOrder.product)

          // First priority: Get vendor directly from product.vendor
          if (productOrder.product.vendor) {
            vendorId = productOrder.product.vendor.id
            vendorName = productOrder.product.vendor.name
            console.log('✅ Found vendor from product.vendor:', vendorName)
          }
          // Second priority: Try to match vendor from order.vendors using product's vendor reference
          else if (orderData.vendors && Array.isArray(orderData.vendors)) {
            console.log('🏪 Order vendors:', orderData.vendors)

            // Try to find vendor by matching some identifier from the product
            let foundVendor = null

            // If product has any vendor reference, try to match it
            if (productOrder.product.vendorId) {
              foundVendor = orderData.vendors.find((v: any) => v.id === productOrder.product.vendorId)
            }

            if (foundVendor) {
              vendorId = foundVendor.id
              vendorName = foundVendor.name
              console.log('✅ Matched vendor from order.vendors:', vendorName)
            } else if (orderData.vendors.length === 1) {
              // Only use the single vendor if there's exactly one vendor in the order
              const vendor = orderData.vendors[0]
              vendorId = vendor.id
              vendorName = vendor.name
              console.log('✅ Using single vendor from order.vendors:', vendorName)
            } else {
              console.warn('⚠️ Could not match product to any specific vendor, multiple vendors available')
            }
          }

          // Fallback: check if product has store info directly
          if (vendorName === 'Unknown Vendor' && productOrder.product.store) {
            if (productOrder.product.store.name) {
              vendorName = productOrder.product.store.name
            }
            if (productOrder.product.store.id) {
              vendorId = productOrder.product.store.id
            }
            console.log('✅ Found vendor name from product.store:', vendorName)
          }
        }

        // Additional fallback: try to get vendor from vendors collection directly
        if (vendorName === 'Unknown Vendor' && vendorId !== 'default-vendor') {
          try {
            console.log('🔍 Fetching vendor data for:', vendorId)
            const vendorDoc = await getDoc(doc(db, 'vendors', vendorId))
            if (vendorDoc.exists()) {
              const vendorData = vendorDoc.data()
              if (vendorData.name) {
                vendorName = vendorData.name
                console.log('✅ Found vendor name from vendors collection:', vendorName)
              }
            }
          } catch (error) {
            console.warn(`Could not fetch vendor ${vendorId}:`, error)
          }
        }

        console.log(`📋 Final vendor info - ID: ${vendorId}, Name: ${vendorName}`)

        if (!productsByVendor.has(vendorId)) {
          productsByVendor.set(vendorId, [])
        }

        productsByVendor.get(vendorId)?.push({
          ...productOrder,
          vendorId,
          vendorName
        })
      }
    }

    console.log('📊 Products grouped by vendor:')
    Array.from(productsByVendor.entries()).forEach(([vendorId, products]) => {
      console.log(`  📍 Vendor: ${products[0]?.vendorName} (ID: ${vendorId})`)
      console.log(`     Products: ${products.length}`)
      products.forEach((product, index) => {
        console.log(`     ${index + 1}. ${product.product?.name || 'Unknown Product'} (Qty: ${product.quantity})`)
      })
    })

    if (productsByVendor.size === 0) {
      console.error('❌ No products were grouped by vendor - this will result in no invoices!')
      return
    }

    console.log(`🎯 Will generate ${productsByVendor.size} invoices (one per vendor)`)
    
    // Generate invoices for each vendor
    const invoicePromises = []
    
    for (const [vendorId, products] of Array.from(productsByVendor)) {
      const vendorName = products[0]?.vendorName || 'Unknown Vendor'
      const items = products.map(product => ({
        productId: product.productId || product.product?.id || '',
        productName: product.product?.name || '',
        quantity: product.quantity || 0,
        unitPrice: product.product?.price || 0,
        totalPrice: (product.quantity || 0) * (product.product?.price || 0)
      }))
      
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30) // 30 days from now
      
      const invoiceData = {
        invoiceNumber: generateInvoiceNumber(),
        orderId: orderId,
        vendorId,
        vendorName,
        totalAmount,
        status: EInvoiceStatus.ISSUED,
        dueDate: dueDate,
        issuedDate: new Date(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        items,
        customer: orderData.customer || {
          name: '',
          phoneNumber: '',
          namaSantri: '',
          kelas: ''
        },
        commission: {
          percentage: 10, // Default 10% commission for BAFkitchen
          amount: totalAmount * 0.1
        }
      }
      
      // Save to Firestore
      const invoicePromise = addDoc(collection(db, 'invoices'), invoiceData)
      invoicePromises.push(invoicePromise)

      console.log(`📄 Created invoice for vendor: ${vendorName} (${vendorId})`)
      console.log(`    📋 Invoice Number: ${invoiceData.invoiceNumber}`)
      console.log(`    💰 Amount: ${currency.toIDRFormat(totalAmount)}`)
      console.log(`    📦 Items: ${items.length}`)
    }

    console.log(`🔄 Saving ${invoicePromises.length} invoices to database...`)
    await Promise.all(invoicePromises)
    console.log(`✅ Successfully generated ${invoicePromises.length} invoices for order ${orderId}`)
    
  } catch (error) {
    console.error('❌ Error generating invoices:', error)
    throw error
  }
}

// Update order status and log activity
interface UpdateOrderStatusRequest {
  orderId: string
  status: string
  notes?: string
  userId: string
  userEmail: string
  userName: string
}

const updateOrderStatus = async ({ orderId, status, notes, userId, userEmail, userName }: UpdateOrderStatusRequest) => {
  // First, get current order to track previous status and existing activities
  const orderDoc = await getDoc(doc(db, 'orders', orderId))
  if (!orderDoc.exists()) {
    throw new Error('Order not found')
  }
  
  const currentOrder = orderDoc.data()
  const previousStatus = currentOrder.status
  const existingActivities = currentOrder.activities || []
  
  // Create new activity
  const newActivity = {
    userId: userId,
    userEmail: userEmail,
    userName: userName,
    action: `Order status updated from "${previousStatus}" to "${status}"`,
    fromStatus: previousStatus,
    toStatus: status,
    notes: notes || '',
    timestamp: new Date(),
    createdAt: new Date()
  }
  
  console.log('📝 Creating activity for order:', orderId, 'from:', previousStatus, 'to:', status)
  
  // Update order with new status and append activity
  await updateDoc(doc(db, 'orders', orderId), {
    status: status,
    updatedAt: serverTimestamp(),
    activities: [...existingActivities, newActivity]
  })
  
  console.log('✅ Order updated with new activity')
  
  // Generate invoices if status changed to "Invoice Issued"
  if (status === EOrderStatus.INVOICE_ISSUED) {
    console.log('📄 Generating invoices for order:', orderId)
    await generateInvoicesForOrder(orderId, currentOrder)
  }
  
  return { success: true }
}

// Hooks
export const useGetOrder = (orderId: string, enabled: boolean = true) => {
  const [data, setData] = useState<IOrderType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrderData = useCallback(async () => {
    if (!enabled || !orderId) return

    setLoading(true)
    setError(null)

    try {
      const order = await fetchOrder(orderId)
      setData(order)
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        setError(new Error('Permission denied to access order'))
      } else {
        setError(err as Error)
      }
    } finally {
      setLoading(false)
    }
  }, [orderId, enabled])

  useEffect(() => {
    fetchOrderData()
  }, [fetchOrderData])

  return { data, loading, error, refetch: fetchOrderData }
}

export const useGetOrderActivities = (orderId: string, enabled: boolean = true) => {
  const [data, setData] = useState<IOrderActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchActivitiesData = useCallback(async () => {
    if (!enabled || !orderId) return

    setLoading(true)
    setError(null)

    try {
      const activities = await fetchOrderActivities(orderId)
      setData(activities)
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        setError(new Error('Permission denied to access order activities'))
      } else {
        setError(err as Error)
      }
    } finally {
      setLoading(false)
    }
  }, [orderId, enabled])

  useEffect(() => {
    fetchActivitiesData()
  }, [fetchActivitiesData])

  return { data, loading, error, refetch: fetchActivitiesData }
}

export const useUpdateOrderStatus = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateOrderStatusMutation = async (request: UpdateOrderStatusRequest) => {
    setLoading(true)
    setError(null)

    try {
      const result = await updateOrderStatus(request)
      console.log('🔄 Order status updated for order:', request.orderId)
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateOrderStatus: updateOrderStatusMutation, loading, error }
}