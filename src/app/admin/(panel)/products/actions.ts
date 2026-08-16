import { useState, useEffect, useCallback } from 'react'

import {
  IProductResponse,
  IEditProductRequest,
  ICreateProductRequest
} from '@/interfaces/product'
import { apiFetch } from '@/utils/api'
import { uploadToFirebase } from '@/utils/auth'

export const useGetProduct = (productId: string) => {
  const [data, setData] = useState<IProductResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!productId) return

    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ product: IProductResponse }>(`/api/products/${productId}`)
      setData(res.product)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return { data, loading, error, refetch: fetchProduct }
}

export const useGetProducts = (params?: IFetchProductRequest) => {
  const [data, setData] = useState<IProductResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let url = '/api/products'
      if (params?.categoryIds && params.categoryIds.length > 0) {
        const ids = params.categoryIds.slice(0, 10) // keep parity with Firestore limit
        url = `/api/products?categoryIds=${ids.map(encodeURIComponent).join(',')}`
      }
      const res = await apiFetch<{ products: IProductResponse[] }>(url)

      // client-side q filter (mirrors previous behavior)
      let results = res.products
      if (params?.q) {
        const q = params.q.toLowerCase()
        results = results.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q)
        )
      }

      setData(results)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.q, params?.categoryIds?.join(',')])

  useEffect(() => {
    fetchProducts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, loading, error, refetch: fetchProducts }
}

export const useDeleteProducts = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteProduct = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' })
      return { id }
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { deleteProduct, loading, error }
}

export const useCreateProducts = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createProduct = async (product: ICreateProductRequest) => {
    setLoading(true)
    setError(null)

    try {
      let imageUrl = ''
      let imageKey = ''
      if (product.image) {
        const upload = await uploadToFirebase(product.image)
        imageUrl = upload.downloadURL
        imageKey = upload.fullPath
      }

      const payload = {
        name: product.name,
        priceBase: product.priceBase,
        price: product.price,
        stock: product.stock ?? 0,
        vendor: product.vendor,
        categoryIds: product.categoryIds,
        description: product.description,
        imageUrl,
        imageKey,
        availability: product.availability ?? 'ready',
        preorderStart: product.preorderStart ?? null,
        preorderEnd: product.preorderEnd ?? null
      }
      const res = await apiFetch<{ product: IProductResponse }>('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      return res.product as any
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createProduct, loading, error }
}

export const useUpdateProducts = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateProduct = async (product: IEditProductRequest) => {
    setLoading(true)
    setError(null)

    try {
      let imageUrl = product.imageUrl ?? ''
      let imageKey = ''
      if (product.image) {
        const upload = await uploadToFirebase(product.image)
        imageUrl = upload.downloadURL
        imageKey = upload.fullPath
      }

      const payload = {
        name: product.name,
        priceBase: product.priceBase,
        price: product.price,
        stock: product.stock ?? 0,
        vendor: product.vendor,
        categoryIds: product.categoryIds,
        description: product.description,
        imageUrl,
        imageKey,
        availability: product.availability ?? 'ready',
        preorderStart: product.preorderStart ?? null,
        preorderEnd: product.preorderEnd ?? null
      }
      const res = await apiFetch<{ product: IProductResponse }>(
        `/api/products/${product.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload)
        }
      )
      return res.product as any
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateProduct, loading, error }
}

export interface IFetchProductRequest {
  categoryIds?: string[]
  q?: string
}