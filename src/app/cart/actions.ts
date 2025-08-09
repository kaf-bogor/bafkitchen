/* eslint-disable react-hooks/rules-of-hooks */
import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

import { IOrder, IOrderRequest } from '@/interfaces/order'
import { db } from '@/utils/firebase'

export const useCreateOrders = (
  options?: Omit<UseMutationOptions<IOrder, Error, IOrderRequest>, 'mutationFn'>
) =>
  useMutation<IOrder, Error, IOrderRequest>({
    mutationKey: ['orders', 'create'],
    mutationFn: async (product: IOrderRequest) => {
      const payload = {
        items: product.items,
        total: product.totalPrice,
        customer: product.orderer,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        storeName: product.storeName || null
      }
      const res = await addDoc(collection(db, 'orders'), payload)
      return {
        id: res.id,
        total: product.totalPrice,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerId: '',
        customer: product.orderer,
        productOrders: [],
        store: { name: product.storeName || '' },
        status: 'pending'
      } as unknown as IOrder
    },
    ...options
  })
