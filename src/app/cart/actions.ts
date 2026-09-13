import { useState } from 'react'

import { IOrder as IOrderType, IOrderRequest } from '@/interfaces/order'
import { apiFetch } from '@/utils/api'

export const useCreateOrders = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createOrder = async (orderRequest: IOrderRequest) => {
    setLoading(true)
    setError(null)

    try {
      const items = orderRequest.items.map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        priceBase: item.priceBase,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || '',
        vendor: item.vendor?.id
          ? { id: item.vendor.id, name: item.vendor.name }
          : undefined
      }))

      const res = await apiFetch<IOrderType>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items,
          orderer: orderRequest.orderer,
          totalPrice: orderRequest.totalPrice
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

  return { createOrder, loading, error }
}