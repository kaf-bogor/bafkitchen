import { useState, useEffect, useCallback } from 'react'

import { ICategory } from '@/interfaces'
import { apiFetch } from '@/utils/api'

export const useGetCategory = (categoryId: string) => {
  const [data, setData] = useState<ICategory.ICategory | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategory = useCallback(async () => {
    if (!categoryId) return

    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ category: ICategory.ICategory }>(
        `/api/categories/${categoryId}`
      )
      setData(res.category)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    fetchCategory()
  }, [fetchCategory])

  return { data, loading, error, refetch: fetchCategory }
}

export const useGetCategories = (params?: IFetchCategoriesRequest) => {
  const [data, setData] = useState<ICategory.ICategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const query = params?.vendorName
        ? `/api/categories?vendorName=${encodeURIComponent(params.vendorName)}`
        : '/api/categories'
      const res = await apiFetch<{ categories: ICategory.ICategory[] }>(query)
      setData(res.categories)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return { data, loading, error, refetch: fetchCategories }
}

export const useCreateCategories = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createCategory = async (request: ICategory.ICreateCategoryRequest) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ category: ICategory.ICategory }>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      return res.category
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createCategory, loading, error }
}

export const useUpdateCategories = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateCategory = async (request: ICategory.IUpdateCategoryRequest) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ category: ICategory.ICategory }>(
        `/api/categories/${request.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ name: request.name, vendorId: request.vendorId })
        }
      )
      return res.category
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateCategory, loading, error }
}

export interface IFetchCategoriesRequest {
  vendorName?: string
}

// Aliases for backward compatibility
export const getCategory = useGetCategory
export const getCategories = useGetCategories
export const createCategories = useCreateCategories
export const updateCategories = useUpdateCategories