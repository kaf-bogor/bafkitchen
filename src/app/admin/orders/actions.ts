/* eslint-disable react-hooks/rules-of-hooks */
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'

import { IOrder } from '@/interfaces'
import { db } from '@/utils/firebase'

export const getOrders = (): UseQueryResult<IOrder.IOrder[], Error> =>
  useQuery<IOrder.IOrder[], Error>({
    queryKey: ['order'],
    queryFn: async () => {
      const qsnap = await getDocs(collection(db, 'orders'))
      return qsnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any
    }
  })

