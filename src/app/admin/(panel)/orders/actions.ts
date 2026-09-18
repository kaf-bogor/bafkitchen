import { useState, useEffect, useCallback, useRef } from 'react'

import { IOrder } from '@/interfaces'
import { apiFetch } from '@/utils/api'

const POLL_INTERVAL = 5000

interface OrderApiShape {
  id: string
  orderNumber?: string
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

const transformOrderData = (order: OrderApiShape): IOrder.IOrder =>
  ({
    ...order,
    id: order.id,
    orderNumber: order.orderNumber || `BZ-${order.id.slice(-8)}`,
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString()
  }) as IOrder.IOrder

export const useGetOrders = (enabled: boolean = true) => {
  const [data, setData] = useState<IOrder.IOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const hasLoaded = useRef(false)

  const fetchOrders = useCallback(async () => {
    if (!enabled) return

    if (!hasLoaded.current) setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ orders: OrderApiShape[] }>('/api/orders')
      const orders = res.orders.map(transformOrderData)
      setData(orders)
    } catch (err: any) {
      setError(err as Error)
    } finally {
      hasLoaded.current = true
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    fetchOrders()

    if (!enabled) return
    const interval = setInterval(fetchOrders, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchOrders, enabled])

  return { data, loading, error, refetch: fetchOrders }
}

// Alias for backward compatibility
export const getOrders = useGetOrders

export const useGenerateOrderInvoice = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generateInvoice = async (orderId: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{
        invoice: { id: string; invoiceNumber: string }
      }>('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({ orderId })
      })
      return res.invoice
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { generateInvoice, loading, error }
}