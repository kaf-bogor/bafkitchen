import { useCallback, useEffect, useState } from 'react'

import { IDiscountWithProduct } from '@/interfaces/discount'
import { apiFetch } from '@/utils/api'

export const useGetDiscounts = () => {
  const [data, setData] = useState<IDiscountWithProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchDiscounts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ discounts: IDiscountWithProduct[] }>(
        '/api/discounts'
      )
      setData(res.discounts)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDiscounts()
  }, [fetchDiscounts])

  return { data, loading, error, refetch: fetchDiscounts }
}

export const useUpdateDiscount = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateDiscount = async (id: string, fields: { isActive?: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ discount: IDiscountWithProduct }>(
        `/api/discounts/${id}`,
        { method: 'PATCH', body: JSON.stringify(fields) }
      )
      return res.discount
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateDiscount, loading, error }
}

export const useDeleteDiscount = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteDiscount = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await apiFetch(`/api/discounts/${id}`, { method: 'DELETE' })
      return { id }
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { deleteDiscount, loading, error }
}
