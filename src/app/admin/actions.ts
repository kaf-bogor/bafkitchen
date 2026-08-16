import { useState, useEffect, useCallback } from 'react'

import { IOrder } from '@/interfaces'
import { apiFetch } from '@/utils/api'

const fetchOrders = async (dateStart: string, dateEnd: string) => {
  const query = `/api/orders?dateStart=${encodeURIComponent(dateStart)}&dateEnd=${encodeURIComponent(dateEnd)}`
  const res = await apiFetch<{ orders: IOrder.IOrder[] }>(query)
  return res.orders
}

export const useOrders = (
  dateStart: string,
  dateEnd: string,
  enabled: boolean = true
) => {
  const [data, setData] = useState<IOrder.IOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrdersData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const orders = await fetchOrders(dateStart, dateEnd)
      setData(orders)
    } catch (err: any) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [dateStart, dateEnd, enabled])

  useEffect(() => {
    fetchOrdersData()
  }, [fetchOrdersData])

  return { data, loading, error, refetch: fetchOrdersData }
}