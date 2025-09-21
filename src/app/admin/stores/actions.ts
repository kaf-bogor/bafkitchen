import { useState, useEffect, useCallback } from 'react'

import { CreateToastFnReturn } from '@chakra-ui/react'
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

export const useGetStores = () => {
  const [data, setData] = useState<IStore.IStore[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchStores = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
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
      setData(stores)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  return { data, loading, error, refetch: fetchStores }
}

export function useGetStoresWithToast(toast: CreateToastFnReturn) {
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

export const useUpdateStores = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateStore = async (request: IStore.IUpdateStoreRequest) => {
    setLoading(true)
    setError(null)

    try {
      const sref = doc(db, 'stores', request.id)
      await updateDoc(sref, {
        name: request.name,
        updatedAt: serverTimestamp()
      })
      const snap = await getDoc(sref)
      return { id: sref.id, ...(snap.data() as any) } as IStore.IStore
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateStore, loading, error }
}

export const useGetStore = (storeId: string) => {
  const [data, setData] = useState<IStore.IStore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchStore = useCallback(async () => {
    if (!storeId) return

    setLoading(true)
    setError(null)

    try {
      const sref = doc(db, 'stores', storeId)
      const snap = await getDoc(sref)
      if (!snap.exists()) throw new Error('Store not found')
      const s = snap.data() as any
      const store = {
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
      setData(store)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchStore()
  }, [fetchStore])

  return { data, loading, error, refetch: fetchStore }
}

export const useCreateStore = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createStore = async (request: IStore.ICreateStoreRequest) => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        name: request.name,
        email: request.email,
        isDeleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      const res = await addDoc(collection(db, 'stores'), payload)
      const snap = await getDoc(res)
      return { id: res.id, ...(snap.data() as any) } as IStore.IStore
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createStore, loading, error }
}

// Aliases for backward compatibility
export const getStores = useGetStores
export const getStore = useGetStore
export const createStore = useCreateStore
export const updateStores = useUpdateStores
