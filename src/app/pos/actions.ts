import { useState } from 'react'

import { IOrder as IOrderType, IPosOrderRequest } from '@/interfaces/order'
import { apiFetch } from '@/utils/api'

export const useCreatePosOrder = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createPosOrder = async (request: IPosOrderRequest) => {
    setLoading(true)
    setError(null)

    try {
      const items = request.items.map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        priceBase: item.priceBase,
        price: item.price,
        quantity: item.quantity,
        vendor: item.vendor?.id
          ? { id: item.vendor.id, name: item.vendor.name }
          : undefined
      }))

      const res = await apiFetch<IOrderType>('/api/pos/orders', {
        method: 'POST',
        body: JSON.stringify({
          items,
          totalPrice: request.totalPrice,
          customerName: request.customerName,
          notes: request.notes,
          payment: request.payment,
          cashierName: request.cashierName
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

  return { createPosOrder, loading, error }
}
