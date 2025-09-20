/* eslint-disable react-hooks/rules-of-hooks */
import { useQuery, UseQueryResult, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore'

import { IOrder } from '@/interfaces'
import { db } from '@/utils/firebase'

// Helper function to transform order data
const transformOrderData = (doc: any): IOrder.IOrder => {
  const data = doc.data()
  return {
    id: doc.id,
    orderNumber: data.orderNumber || `BAF-${doc.id.slice(-8)}`,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString()
  } as IOrder.IOrder
}

export const getOrders = (enabled: boolean = true): UseQueryResult<IOrder.IOrder[], Error> => {
  const queryClient = useQueryClient()
  
  // Set up real-time listener
  useEffect(() => {
    if (!enabled) return
    
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    )
    
    const unsubscribe = onSnapshot(
      ordersQuery,
      (querySnapshot) => {
        const orders: IOrder.IOrder[] = querySnapshot.docs.map(transformOrderData)
        queryClient.setQueryData(['order'], orders)
      },
      (error) => {
        console.error('Orders real-time listener error:', error)
      }
    )
    
    return () => {
      unsubscribe()
    }
  }, [queryClient, enabled])
  
  return useQuery<IOrder.IOrder[], Error>({
    queryKey: ['order'],
    queryFn: async () => {
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      )
      const qsnap = await getDocs(ordersQuery)
      return qsnap.docs.map(transformOrderData)
    },
    enabled: enabled,
    retry: (failureCount, error: any) => {
      if (error?.code === 'permission-denied') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: Infinity, // Keep data fresh since we have real-time updates
    refetchOnWindowFocus: false // Disable refetch on focus since we have real-time updates
  })
}

