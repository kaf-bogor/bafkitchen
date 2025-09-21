import { useState, useEffect, useCallback } from 'react'

import { doc, getDoc } from 'firebase/firestore'

import { IOrder } from '@/interfaces'
import { db } from '@/utils/firebase'


export const useGetOrderDetail = (orderId?: string) => {
  const [data, setData] = useState<IOrder.IProductOrderResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return

    setLoading(true)
    setError(null)

    try {
      const oref = doc(db, 'orders', orderId)
      const snap = await getDoc(oref)
      if (!snap.exists()) throw new Error('Order not found')
      const o = snap.data() as any
      // Best-effort mapping to IProductOrderResponse
      const orderDetail = {
        id: snap.id,
        number: o.number ?? 0,
        total: o.total ?? 0,
        createdAt: o.createdAt?.toDate?.() ?? new Date(0),
        updatedAt: o.updatedAt?.toDate?.() ?? new Date(0),
        customerId: o.customerId ?? '',
        status: o.status ?? 'pending',
        productOrders: (o.productOrders ?? []).map((po: any) => ({
          id: po.id ?? '',
          quantity: po.quantity ?? 0,
          product: po.product as any
        })),
        customer: {
          id: o.customer?.id ?? '',
          name: o.customer?.name ?? '',
          phoneNumber: o.customer?.phoneNumber ?? '',
          email: o.customer?.email ?? '',
          address: o.customer?.address ?? ''
        }
      } as IOrder.IProductOrderResponse

      setData(orderDetail)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrderDetail()
  }, [fetchOrderDetail])

  return { data, loading, error, refetch: fetchOrderDetail }
}


