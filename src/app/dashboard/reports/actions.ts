import { useCallback, useEffect, useState } from 'react'

import { IOrder } from '@/interfaces'
import { apiFetch } from '@/utils/api'

export const useVendorOrders = (vendorId: string) => {
  const [data, setData] = useState<IOrder.IOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!vendorId) {
      setData([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ orders: IOrder.IOrder[] }>(
        `/api/orders?vendorId=${encodeURIComponent(vendorId)}`
      )
      setData(res.orders)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return { data, loading, error, refetch: fetchOrders }
}
