import { useCallback, useEffect, useState } from 'react'

import {
  ICreatePurchaseRequest,
  IPurchase,
  IStockBatch
} from '@/interfaces/purchase'
import { apiFetch } from '@/utils/api'

export const useGetPurchases = () => {
  const [data, setData] = useState<IPurchase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchPurchases = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ purchases: IPurchase[] }>('/api/purchases')
      setData(res.purchases)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  return { data, loading, error, refetch: fetchPurchases }
}

export const useGetPurchase = (purchaseId: string) => {
  const [data, setData] = useState<IPurchase | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchPurchase = useCallback(async () => {
    if (!purchaseId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ purchase: IPurchase }>(
        `/api/purchases/${purchaseId}`
      )
      setData(res.purchase)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [purchaseId])

  useEffect(() => {
    fetchPurchase()
  }, [fetchPurchase])

  return { data, loading, error, refetch: fetchPurchase }
}

export const useCreatePurchase = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createPurchase = async (payload: ICreatePurchaseRequest) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ purchase: IPurchase }>('/api/purchases', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      return res.purchase
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createPurchase, loading, error }
}

export const useUpdatePurchase = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updatePurchase = async (
    id: string,
    payload: ICreatePurchaseRequest
  ) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ purchase: IPurchase }>(
        `/api/purchases/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload)
        }
      )
      return res.purchase
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updatePurchase, loading, error }
}

export const useDeletePurchase = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deletePurchase = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await apiFetch(`/api/purchases/${id}`, { method: 'DELETE' })
      return { id }
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { deletePurchase, loading, error }
}

export const useGetStockBatches = (productId?: string) => {
  const [data, setData] = useState<IStockBatch[]>([])
  const [summary, setSummary] = useState({
    totalRemaining: 0,
    totalValue: 0,
    potentialProfit: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchBatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = productId ? `?productId=${encodeURIComponent(productId)}` : ''
      const res = await apiFetch<{
        batches: IStockBatch[]
        summary: typeof summary
      }>(`/api/inventory/batches${qs}`)
      setData(res.batches)
      setSummary(res.summary)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  return { data, summary, loading, error, refetch: fetchBatches }
}
