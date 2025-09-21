import { useState, useEffect, useCallback } from 'react'

import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore'

import { IOrder } from '@/interfaces'
import { db } from '@/utils/firebase'

// Helper function to transform order data
const transformOrderData = (doc: any): IOrder.IOrder => {
  const data = doc.data()
  return {
    id: doc.id,
    orderNumber: data.orderNumber || `BAF-${doc.id.slice(-8)}`,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString()
  } as IOrder.IOrder
}

export const useGetOrders = (enabled: boolean = true) => {
  const [data, setData] = useState<IOrder.IOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      )
      const qsnap = await getDocs(ordersQuery)
      const orders = qsnap.docs.map(transformOrderData)
      setData(orders)
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        setError(new Error('Permission denied to access orders'))
      } else {
        setError(err as Error)
      }
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    fetchOrders()

    if (!enabled) return

    // Set up real-time listener
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      ordersQuery,
      (querySnapshot) => {
        const orders: IOrder.IOrder[] = querySnapshot.docs.map(transformOrderData)
        setData(orders)
      },
      (err) => {
        console.error('Orders real-time listener error:', err)
        setError(err as Error)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [fetchOrders, enabled])

  return { data, loading, error, refetch: fetchOrders }
}

// Alias for backward compatibility
export const getOrders = useGetOrders

