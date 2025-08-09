/* eslint-disable react-hooks/rules-of-hooks */
import { useState } from 'react'

import { CreateToastFnReturn } from '@chakra-ui/react'
import {
  useQuery,
  useMutation,
  MutateOptions,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'

import { IStore } from '@/interfaces'
import { db } from '@/utils/firebase'

export const getStores = (): UseQueryResult<IStore.IStore[], Error> =>
  useQuery<IStore.IStore[], Error>({
    queryKey: ['stores'],
    queryFn: async () => {
      const qsnap = await getDocs(collection(db, 'stores'))
      const stores: IStore.IStore[] = qsnap.docs.map((d) => {
        const s = d.data() as any
        return {
          id: d.id,
          name: s.name,
          userId: s.userId,
          isDeleted: Boolean(s.isDeleted),
          createdAt: String(s.createdAt || ''),
          updatedAt: String(s.updatedAt || ''),
          user: {
            id: s.userId || '',
            name: s.userName || '',
            email: s.userEmail || '',
            role: 'admin',
            createdAt: '',
            updatedAt: '',
            phoneNumber: null,
            lastSignInAt: ''
          }
        }
      })
      return stores
    }
  })

export function useGetStore(toast: CreateToastFnReturn) {
  const [stores, setStores] = useState([] as any[])

  const fetchStores = async () => {
    try {
      const qsnap = await getDocs(collection(db, 'stores'))
      const stores = qsnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      setStores(stores)
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        status: 'error',
        duration: 2500,
        isClosable: true
      })
    }
  }

  return {
    stores,
    fetchStores
  }
}

export const updateStores = () =>
  useMutation<Awaited<IStore.IStore>, Error, IStore.IUpdateStoreRequest>({
    mutationKey: ['api', 'stores', 'edit'],
    mutationFn: async (request: IStore.IUpdateStoreRequest) => {
      const sref = doc(db, 'stores', request.id)
      await updateDoc(sref, {
        name: request.name,
        updatedAt: serverTimestamp()
      })
      const snap = await getDoc(sref)
      return { id: sref.id, ...(snap.data() as any) } as any
    }
  })

export const getStore = (
  storeId: string
): UseQueryResult<IStore.IStore, Error> => {
  return useQuery<IStore.IStore, Error>({
    queryKey: ['store', storeId],
    queryFn: async () => {
      const sref = doc(db, 'stores', storeId)
      const snap = await getDoc(sref)
      if (!snap.exists()) throw new Error('Store not found')
      const s = snap.data() as any
      return {
        id: sref.id,
        name: s.name,
        userId: s.userId,
        isDeleted: Boolean(s.isDeleted),
        createdAt: String(s.createdAt || ''),
        updatedAt: String(s.updatedAt || ''),
        user: {
          id: s.userId || '',
          name: s.userName || '',
          email: s.userEmail || '',
          role: 'admin',
          createdAt: '',
          updatedAt: '',
          phoneNumber: null,
          lastSignInAt: ''
        }
      } as IStore.IStore
    },
    enabled: !!storeId // Only run the query if storeId is provided
  })
}

export const createStore = (options: MutateOptions<
  IStore.IStore,
  Error,
  IStore.ICreateStoreRequest
>): UseMutationResult<
  IStore.IStore,
  Error,
  IStore.ICreateStoreRequest
> =>
  useMutation<IStore.IStore, Error, IStore.ICreateStoreRequest>({
    mutationKey: ['api', 'stores', 'create'],
    mutationFn: async (request: IStore.ICreateStoreRequest) => {
      const payload = {
        name: request.name,
        email: request.email,
        isDeleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      const res = await addDoc(collection(db, 'stores'), payload)
      const snap = await getDoc(res)
      return { id: res.id, ...(snap.data() as any) } as any
    }, ...options
  })
