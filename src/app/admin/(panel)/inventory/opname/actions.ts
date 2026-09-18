import { useCallback, useEffect, useState } from 'react'

import {
  ICreateStockOpnameRequest,
  IStockChecklistItem,
  IStockOpname,
  IStockOpnameFilters
} from '@/interfaces/stockOpname'
import { apiFetch } from '@/utils/api'

export const useGetOpnames = () => {
  const [data, setData] = useState<IStockOpname[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchOpnames = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ opnames: IStockOpname[] }>(
        '/api/inventory/opname'
      )
      setData(res.opnames)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOpnames()
  }, [fetchOpnames])

  return { data, loading, error, refetch: fetchOpnames }
}

export const useGetOpname = (opnameId: string) => {
  const [data, setData] = useState<IStockOpname | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchOpname = useCallback(async () => {
    if (!opnameId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ opname: IStockOpname }>(
        `/api/inventory/opname/${opnameId}`
      )
      setData(res.opname)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [opnameId])

  useEffect(() => {
    fetchOpname()
  }, [fetchOpname])

  return { data, loading, error, refetch: fetchOpname }
}

export const useCreateOpname = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createOpname = async (payload: ICreateStockOpnameRequest) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ opname: IStockOpname }>(
        '/api/inventory/opname',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      )
      return res.opname
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createOpname, loading, error }
}

export const useUpdateOpnameItems = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateOpnameItems = async (
    opnameId: string,
    items: { id: string; countedStock: number | null; note?: string }[]
  ) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ opname: IStockOpname }>(
        `/api/inventory/opname/${opnameId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ items })
        }
      )
      return res.opname
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateOpnameItems, loading, error }
}

export const useFinalizeOpname = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const finalizeOpname = async (opnameId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ opname: IStockOpname; adjusted: number }>(
        `/api/inventory/opname/${opnameId}/finalize`,
        { method: 'POST' }
      )
      return res
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { finalizeOpname, loading, error }
}

export const useDeleteOpname = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteOpname = async (opnameId: string) => {
    setLoading(true)
    setError(null)
    try {
      await apiFetch(`/api/inventory/opname/${opnameId}`, { method: 'DELETE' })
      return { id: opnameId }
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { deleteOpname, loading, error }
}

export const getChecklistSheet = async (
  filters: IStockOpnameFilters
): Promise<IStockChecklistItem[]> => {
  const search = new URLSearchParams()
  if (filters.vendorId) search.set('vendorId', filters.vendorId)
  if (filters.channel) search.set('channel', filters.channel)
  if (filters.inStock) search.set('inStock', '1')
  if (filters.categoryIds?.length) {
    search.set('categoryIds', filters.categoryIds.join(','))
  }
  const qs = search.toString()
  const res = await apiFetch<{ items: IStockChecklistItem[] }>(
    `/api/inventory/opname/sheet${qs ? `?${qs}` : ''}`
  )
  return res.items
}
