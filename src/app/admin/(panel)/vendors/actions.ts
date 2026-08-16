import { useState, useEffect, useCallback, useRef } from 'react'

import { IVendor, ICreateVendorRequest, IUpdateVendorRequest } from '@/interfaces/vendor'
import { apiFetch } from '@/utils/api'

const transformVendorData = (vendor: IVendor): IVendor => ({
  ...vendor,
  createdAt: vendor.createdAt || new Date().toISOString(),
  updatedAt: vendor.updatedAt || new Date().toISOString()
})

const POLL_INTERVAL = 5000

// Fetch all active vendors (used by product forms)
export const getVendors = async (): Promise<IVendor[]> => {
  try {
    const res = await apiFetch<{ vendors: IVendor[] }>('/api/vendors')
    return res.vendors.map(transformVendorData)
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return []
  }
}

// Fetch all vendors (active + inactive) with periodic refresh
export const useGetVendors = () => {
  const [data, setData] = useState<IVendor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const hasLoaded = useRef(false)

  const fetchVendors = useCallback(async () => {
    if (!hasLoaded.current) setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ vendors: IVendor[] }>('/api/vendors?includeInactive=1')
      setData(res.vendors.map(transformVendorData))
    } catch (err) {
      setError(err as Error)
    } finally {
      hasLoaded.current = true
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendors()
    const interval = setInterval(fetchVendors, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchVendors])

  return { data, loading, error, refetch: fetchVendors }
}

// Fetch single vendor
export const useGetVendor = (vendorId: string) => {
  const [data, setData] = useState<IVendor | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchVendor = useCallback(async () => {
    if (!vendorId) return

    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ vendor: IVendor }>(`/api/vendors/${vendorId}`)
      setData(transformVendorData(res.vendor))
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  useEffect(() => {
    fetchVendor()
  }, [fetchVendor])

  return { data, loading, error, refetch: fetchVendor }
}

// Create vendor
export const useCreateVendor = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createVendor = async (request: ICreateVendorRequest) => {
    setLoading(true)
    setError(null)

    try {
      const ts = new Date().toISOString()
      const res = await apiFetch<{ vendor: IVendor }>('/api/vendors', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      return {
        ...res.vendor,
        createdAt: res.vendor.createdAt || ts,
        updatedAt: res.vendor.updatedAt || ts
      } as IVendor
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createVendor, loading, error }
}

// Update vendor
export const useUpdateVendor = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateVendor = async (request: IUpdateVendorRequest) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ vendor: IVendor }>(`/api/vendors/${request.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: request.name, userId: request.userId })
      })
      return transformVendorData(res.vendor)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateVendor, loading, error }
}

// Delete vendor (soft delete)
export const useDeleteVendor = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteVendor = async (vendorId: string) => {
    setLoading(true)
    setError(null)

    try {
      await apiFetch(`/api/vendors/${vendorId}`, { method: 'DELETE' })
      return { id: vendorId }
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { deleteVendor, loading, error }
}