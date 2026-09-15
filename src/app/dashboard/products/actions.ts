import { useCallback, useEffect, useState } from 'react'

import { IProductResponse } from '@/interfaces/product'
import { apiFetch } from '@/utils/api'

export const useVendorProducts = (vendorId: string) => {
  const [data, setData] = useState<IProductResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = useCallback(async () => {
    if (!vendorId) {
      setData([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ products: IProductResponse[] }>(
        `/api/products?vendorId=${encodeURIComponent(vendorId)}`
      )
      setData(res.products)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { data, loading, error, refetch: fetchProducts }
}
