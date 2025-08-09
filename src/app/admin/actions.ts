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
  return qsnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as unknown as IOrder.IOrder[];
};


export const useOrders = (dateStart: string, dateEnd: string): UseQueryResult<IOrder.IOrder[], Error> =>
  useQuery<IOrder.IOrder[], Error>({
    queryKey: ['orders', dateStart, dateEnd],
    queryFn: async () => await fetchOrders(dateStart, dateEnd)
  })