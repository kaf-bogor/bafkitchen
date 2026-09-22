import { useState, useEffect, useCallback } from 'react'

import {
  IProductResponse,
  IEditProductRequest,
  ICreateProductRequest
} from '@/interfaces/product'
import { apiFetch } from '@/utils/api'
import { uploadMedia } from '@/utils/auth'

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
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const search = new URLSearchParams()
      if (params?.q) search.set('q', params.q)
      if (params?.categoryIds?.length) {
        search.set('categoryIds', params.categoryIds.slice(0, 10).join(','))
      }
      if (params?.vendorId) search.set('vendorId', params.vendorId)
      if (params?.channel) search.set('channel', params.channel)
      if (params?.inStock) search.set('inStock', '1')
      if (params?.sort) search.set('sort', params.sort)
      if (params?.limit) search.set('limit', String(params.limit))
      if (params?.offset) search.set('offset', String(params.offset))
      const qs = search.toString()

      const res = await apiFetch<{
        products: IProductResponse[]
        total?: number
      }>(`/api/products${qs ? `?${qs}` : ''}`)

      setData(res.products)
      setTotal(res.total ?? res.products.length)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params?.q,
    params?.categoryIds?.join(','),
    params?.vendorId,
    params?.channel,
    params?.inStock,
    params?.sort,
    params?.limit,
    params?.offset
  ])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { data, total, loading, error, refetch: fetchProducts }
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
        const upload = await uploadMedia(product.image)
        imageUrl = upload.downloadURL
        imageKey = upload.fullPath
      }

      const payload = {
        name: product.name,
        sku: product.sku ?? '',
        unit: product.unit ?? 'pcs',
        isActive: product.isActive ?? true,
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
        preorderEnd: product.preorderEnd ?? null,
        channels: product.channels ?? ['pos'],
        availabilityType: product.availabilityType ?? 'always',
        weeklyDays: product.weeklyDays ?? [],
        specificDates: product.specificDates ?? [],
        preorderLeadDays: product.preorderLeadDays ?? null,
        preorderCutoffTime: product.preorderCutoffTime ?? null,
        preorderMinQty: product.preorderMinQty ?? null,
        preorderMaxQty: product.preorderMaxQty ?? null,
        preorderCapacity: product.preorderCapacity ?? null,
        fulfillmentType: product.fulfillmentType ?? 'takeaway',
        discounts: product.discounts ?? []
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
        const upload = await uploadMedia(product.image)
        imageUrl = upload.downloadURL
        imageKey = upload.fullPath
      }

      const payload = {
        name: product.name,
        sku: product.sku ?? '',
        unit: product.unit ?? 'pcs',
        isActive: product.isActive ?? true,
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
        preorderEnd: product.preorderEnd ?? null,
        channels: product.channels ?? ['pos'],
        availabilityType: product.availabilityType ?? 'always',
        weeklyDays: product.weeklyDays ?? [],
        specificDates: product.specificDates ?? [],
        preorderLeadDays: product.preorderLeadDays ?? null,
        preorderCutoffTime: product.preorderCutoffTime ?? null,
        preorderMinQty: product.preorderMinQty ?? null,
        preorderMaxQty: product.preorderMaxQty ?? null,
        preorderCapacity: product.preorderCapacity ?? null,
        fulfillmentType: product.fulfillmentType ?? 'takeaway',
        discounts: product.discounts ?? []
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

export const useUpdateProductApproval = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateProductApproval = async (
    id: string,
    status: 'pending' | 'approved' | 'rejected'
  ) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ id: string; approvalStatus: string }>(
        `/api/products/${id}/approval`,
        {
          method: 'PUT',
          body: JSON.stringify({ status })
        }
      )
      return res
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateProductApproval, loading, error }
}

export interface IProductFieldsUpdate {
  price?: number
  priceBase?: number
  stock?: number | null
  isActive?: boolean
  channels?: string[]
  approvalStatus?: 'pending' | 'approved' | 'rejected'
}

export const useUpdateProductFields = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateProductFields = async (
    id: string,
    fields: IProductFieldsUpdate
  ) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ id: string }>(`/api/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(fields)
      })
      return res
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateProductFields, loading, error }
}

export const useBatchUpdateProducts = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const batchUpdateProducts = async (
    ids: string[],
    fields: IProductFieldsUpdate
  ) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ updated: number }>('/api/products/batch', {
        method: 'POST',
        body: JSON.stringify({ ids, fields })
      })
      return res
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { batchUpdateProducts, loading, error }
}

export const useBulkUpdateProducts = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const bulkUpdateProducts = async (
    items: { id: string; fields: IProductFieldsUpdate }[]
  ) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ updated: number }>('/api/products/bulk', {
        method: 'POST',
        body: JSON.stringify({ items })
      })
      return res
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { bulkUpdateProducts, loading, error }
}

export interface IFetchProductRequest {
  categoryIds?: string[]
  q?: string
  vendorId?: string
  channel?: string
  inStock?: boolean
  sort?: string
  limit?: number
  offset?: number
}