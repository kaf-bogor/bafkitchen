/* eslint-disable react-hooks/rules-of-hooks */
import {
  useQuery,

  UseQueryResult
} from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'

import { IOrder } from '@/interfaces'
import { db } from '@/utils/firebase'


export const useGetOrderDetail = (orderId?: string): UseQueryResult<IOrder.IProductOrderResponse, Error> =>
  useQuery<IOrder.IProductOrderResponse, Error>({
    queryKey: ['orders', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order id is required')
      const oref = doc(db, 'orders', orderId)
      const snap = await getDoc(oref)
      if (!snap.exists()) throw new Error('Order not found')
      const o = snap.data() as any
      // Best-effort mapping to IProductOrderResponse
      return {
        id: snap.id,
        number: o.number ?? 0,
        total: o.total ?? 0,
        createdAt: o.createdAt?.toDate?.() ?? new Date(0),
        updatedAt: o.updatedAt?.toDate?.() ?? new Date(0),
        customerId: o.customerId ?? '',
        status: o.status ?? 'pending',
        storeId: o.storeId ?? '',
        store: { name: o.store?.name ?? '' } as any,
        productOrders: (o.productOrders ?? []).map((po: any) => ({
          id: po.id ?? '',
          quantity: po.quantity ?? 0,
          product: po.product as any
        })),
        customer: {
          id: o.customer?.id ?? '',
          name: o.customer?.name ?? '',
          phoneNumber: o.customer?.phoneNumber ?? '',
          email: o.customer?.email ?? '',
          address: o.customer?.address ?? ''
        }
      } as IOrder.IProductOrderResponse
    },
    enabled: !!orderId
  })


