import { useState, useEffect, useCallback } from 'react';

import { Timestamp, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

import { IOrder } from '@/interfaces';
import { db } from '@/utils/firebase';

const fetchOrders = async (dateStart: string, dateEnd: string) => {
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  const qref = query(
    collection(db, 'orders'),
    where('createdAt', '>=', Timestamp.fromDate(start)),
    where('createdAt', '<=', Timestamp.fromDate(end)),
    orderBy('createdAt', 'desc')
  );
  const qsnap = await getDocs(qref);
  return qsnap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString()
    };
  }) as unknown as IOrder.IOrder[];
};


export const useOrders = (
  dateStart: string,
  dateEnd: string,
  enabled: boolean = true
) => {
  const [data, setData] = useState<IOrder.IOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrdersData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const orders = await fetchOrders(dateStart, dateEnd)
      setData(orders)
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        setError(new Error('Permission denied to access orders'))
      } else {
        setError(err as Error)
      }
    } finally {
      setLoading(false)
    }
  }, [dateStart, dateEnd, enabled])

  useEffect(() => {
    fetchOrdersData()
  }, [fetchOrdersData])

  return { data, loading, error, refetch: fetchOrdersData }
}