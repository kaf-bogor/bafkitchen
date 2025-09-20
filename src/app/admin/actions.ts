import { useQuery, UseQueryResult } from '@tanstack/react-query';
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
): UseQueryResult<IOrder.IOrder[], Error> =>
  useQuery<IOrder.IOrder[], Error>({
    queryKey: ['orders', dateStart, dateEnd],
    queryFn: async () => await fetchOrders(dateStart, dateEnd),
    enabled: enabled, // Only run query when explicitly enabled
    retry: (failureCount, error: any) => {
      // Don't retry if it's a permission error
      if (error?.code === 'permission-denied') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false // Don't refetch on window focus
  })