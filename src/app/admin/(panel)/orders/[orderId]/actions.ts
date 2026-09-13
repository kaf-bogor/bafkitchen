import { useState, useEffect, useCallback } from 'react'

import { IOrder as IOrderType, IOrderActivity } from '@/interfaces/order'
import { apiFetch } from '@/utils/api'

interface OrderApiShape {
  id: string
  orderNumber?: string
  createdAt: string
  updatedAt: string
  activities?: (Partial<IOrderActivity> & {
    timestamp?: string | Date
    createdAt?: string | Date
  })[]
  [key: string]: unknown
}

const toIso = (value: string | Date | undefined, fallback: string) => {
  if (!value) return fallback
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return fallback
}

// Fetch single order
const fetchOrder = async (orderId: string): Promise<IOrderType> => {
  const res = await apiFetch<{ order: OrderApiShape }>(`/api/orders/${orderId}`)
  const data = res.order
  return {
    ...data,
    id: data.id,
    orderNumber: data.orderNumber || `BZ-${data.id.slice(-8)}`,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  } as IOrderType
}

// Fetch order activities from order document
const fetchOrderActivities = async (orderId: string): Promise<IOrderActivity[]> => {
  const res = await apiFetch<{ order: OrderApiShape }>(`/api/orders/${orderId}`)
  const activities = res.order.activities || []

  const processedActivities = activities.map((activity, index) => ({
    id: `${orderId}-activity-${index}`,
    ...activity,
    timestamp: toIso(activity.timestamp, new Date().toISOString()),
    createdAt: toIso(activity.createdAt, new Date().toISOString())
  })) as IOrderActivity[]

  processedActivities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return processedActivities
}

// Status update — the server records the acting user from the session
const updateOrderStatus = async ({
  orderId,
  status,
  notes,
  proofUrl,
  proofKey
}: {
  orderId: string
  status: string
  notes?: string
  proofUrl?: string
  proofKey?: string
}) => {
  await apiFetch(`/api/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes, proofUrl, proofKey })
  })
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
      setError(err as Error)
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
      setError(err as Error)
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

  const updateOrderStatusMutation = async (request: {
    orderId: string
    status: string
    notes?: string
    userId?: string
    userEmail?: string
    userName?: string
    proofUrl?: string
    proofKey?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const result = await updateOrderStatus(request)
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

export const useUpdatePaymentProof = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updatePaymentProof = async (request: {
    orderId: string
    proofUrl: string
    proofKey?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{
        success: boolean
        paymentProofUrl: string
        paymentProofKey: string
      }>(`/api/orders/${request.orderId}/payment-proof`, {
        method: 'PUT',
        body: JSON.stringify({
          proofUrl: request.proofUrl,
          proofKey: request.proofKey
        })
      })
      return res
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updatePaymentProof, loading, error }
}