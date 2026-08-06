import { useState } from 'react'

import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

import { EOrderChannel } from '@/constants/order'
import {
  IOrder as IOrderType,
  IPosOrderRequest
} from '@/interfaces/order'
import { db } from '@/utils/firebase'
import { generateOrderId } from '@/utils/orderIdGenerator'

export const useCreatePosOrder = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createPosOrder = async (request: IPosOrderRequest) => {
    setLoading(true)
    setError(null)

    try {
      const orderNumber = generateOrderId()

      // Transform cart items to productOrders format with vendor information
      const productOrders = await Promise.all(
        request.items.map(async (item, index) => {
          let productData: any = {}

          try {
            const { doc, getDoc } = await import('firebase/firestore')
            const productDoc = await getDoc(doc(db, 'products', item.id || ''))

            if (productDoc.exists()) {
              productData = productDoc.data()
            }
          } catch (err) {
            console.warn(`Failed to fetch product details for ${item.id}:`, err)
          }

          return {
            id: index + 1,
            quantity: item.quantity || 0,
            productId: item.id || '',
            product: {
              id: item.id || '',
              name: item.name || '',
              imageUrl: item.imageUrl || '',
              priceBase: item.priceBase || 0,
              price: item.price || 0,
              vendor: productData.vendor || item.vendor || null
            }
          }
        })
      )

      // Collect unique vendors from products
      const vendorMap = new Map()
      productOrders.forEach((order) => {
        if (order.product.vendor && !vendorMap.has(order.product.vendor.id)) {
          vendorMap.set(order.product.vendor.id, {
            id: order.product.vendor.id,
            name: order.product.vendor.name
          })
        }
      })
      const vendors = Array.from(vendorMap.values())

      const payload = {
        orderNumber,
        productOrders,
        total: request.totalPrice || 0,
        customer: {
          name: request.customerName || 'Walk-in Customer',
          phoneNumber: '-',
          namaSantri: '-',
          kelas: '-',
          notes: request.notes || ''
        },
        status: 'Payment Confirmed',
        channel: EOrderChannel.POS,
        payment: {
          method: request.payment.method,
          tendered: request.payment.tendered,
          change: request.payment.change
        },
        cashier: request.cashierName || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        store: {
          name: 'Baf Kitchen'
        },
        vendors
      }

      const res = await addDoc(collection(db, 'orders'), payload)

      return {
        id: res.id,
        orderNumber,
        total: request.totalPrice || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerId: '',
        customer: payload.customer,
        productOrders,
        store: { name: 'Baf Kitchen' },
        vendors,
        status: 'Payment Confirmed',
        channel: EOrderChannel.POS,
        payment: payload.payment
      } as IOrderType
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createPosOrder, loading, error }
}
