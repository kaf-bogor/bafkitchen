import { useState, useEffect, useCallback, useRef } from 'react'

import {
  IInvoice,
  IUpdateInvoiceStatusRequest,
  ICreateVendorPeriodInvoiceRequest,
  EInvoiceStatus
} from '@/interfaces/invoice'
import { apiFetch } from '@/utils/api'

const POLL_INTERVAL = 5000

const transformInvoiceData = (invoice: IInvoice): IInvoice => ({
  ...invoice,
  createdAt: invoice.createdAt || new Date().toISOString(),
  updatedAt: invoice.updatedAt || new Date().toISOString(),
  issuedDate: invoice.issuedDate || new Date().toISOString(),
  dueDate: invoice.dueDate || new Date().toISOString()
})

export const useGetInvoices = () => {
  const [data, setData] = useState<IInvoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const hasLoaded = useRef(false)

  const fetchInvoices = useCallback(async () => {
    if (!hasLoaded.current) setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ invoices: IInvoice[] }>('/api/invoices')
      setData(res.invoices.map(transformInvoiceData))
    } catch (err) {
      setError(err as Error)
    } finally {
      hasLoaded.current = true
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvoices()
    const interval = setInterval(fetchInvoices, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchInvoices])

  return { data, loading, error, refetch: fetchInvoices }
}

export const useGetInvoicesByVendor = (vendorId: string) => {
  const [data, setData] = useState<IInvoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const hasLoaded = useRef(false)

  const fetchInvoicesByVendor = useCallback(async () => {
    if (!vendorId) return

    if (!hasLoaded.current) setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ invoices: IInvoice[] }>(
        `/api/invoices?vendorId=${encodeURIComponent(vendorId)}`
      )
      setData(res.invoices.map(transformInvoiceData))
    } catch (err) {
      setError(err as Error)
    } finally {
      hasLoaded.current = true
      setLoading(false)
    }
  }, [vendorId])

  useEffect(() => {
    fetchInvoicesByVendor()

    if (!vendorId) return
    const interval = setInterval(fetchInvoicesByVendor, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchInvoicesByVendor, vendorId])

  return { data, loading, error, refetch: fetchInvoicesByVendor }
}

// Fetch single invoice
export const useGetInvoice = (invoiceId: string) => {
  const [data, setData] = useState<IInvoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return

    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ invoice: IInvoice }>(
        `/api/invoices/${invoiceId}`
      )
      setData(transformInvoiceData(res.invoice))
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  return { data, loading, error, refetch: fetchInvoice }
}

// Generate the transaction invoice for an order (also sets it to Invoice Issued)
export const useGenerateInvoicesForOrder = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generateInvoicesForOrder = async (orderId: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ invoice: IInvoice }>('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({ orderId })
      })
      return transformInvoiceData(res.invoice)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { generateInvoicesForOrder, loading, error }
}

// Generate a consolidated vendor invoice for a date range
export const useCreateVendorPeriodInvoice = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createVendorPeriodInvoice = async (
    request: ICreateVendorPeriodInvoiceRequest
  ) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ invoice: IInvoice }>(
        '/api/invoices/vendor-period',
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      )
      return transformInvoiceData(res.invoice)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createVendorPeriodInvoice, loading, error }
}

// Update invoice status
export const useUpdateInvoiceStatus = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateInvoiceStatus = async (request: IUpdateInvoiceStatusRequest) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ invoice: IInvoice }>(
        `/api/invoices/${request.invoiceId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: request.status,
            ...(request.status === EInvoiceStatus.SETTLED
              ? { settledDate: request.settledDate }
              : {})
          })
        }
      )
      return transformInvoiceData(res.invoice)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateInvoiceStatus, loading, error }
}
