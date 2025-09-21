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
    // Group products by vendor
    const productsByVendor = new Map<string, any[]>()
    
    if (orderData.productOrders && Array.isArray(orderData.productOrders)) {
      // Get vendor info from product's store data
      for (const productOrder of orderData.productOrders) {
        let vendorId = 'default-vendor'
        let vendorName = 'Unknown Vendor'
        
        if (productOrder.product) {
          // First try to get storeId from product
          if (productOrder.product.storeId) {
            vendorId = productOrder.product.storeId
          }
          
          // Try to find vendor name from order.vendors array (stores data)
          if (orderData.vendors && Array.isArray(orderData.vendors)) {
            const vendor = orderData.vendors.find((v: any) => v.id === vendorId)
            if (vendor && vendor.name) {
              vendorName = vendor.name
            }
          }
          
          // Fallback: check if product has store info directly
          if (vendorName === 'Unknown Vendor' && productOrder.product.store?.name) {
            vendorName = productOrder.product.store.name
          }
        }
        
        // Additional fallback: try to get vendor from stores collection directly
        if (vendorName === 'Unknown Vendor' && vendorId !== 'default-vendor') {
          try {
            const storeDoc = await getDoc(doc(db, 'stores', vendorId))
            if (storeDoc.exists()) {
              const storeData = storeDoc.data()
              if (storeData.name) {
                vendorName = storeData.name
              }
            }
          } catch (error) {
            console.warn(`Could not fetch store ${vendorId}:`, error)
          }
        }
        
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
      
      console.log('📄 Generated invoice for vendor:', vendorName, 'Amount:', totalAmount)
    }
    
    await Promise.all(invoicePromises)
    console.log('✅ All invoices generated successfully')
    
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