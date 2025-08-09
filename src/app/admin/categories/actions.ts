/* eslint-disable react-hooks/rules-of-hooks */
import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from 'firebase/firestore'

import { ICategory } from '@/interfaces'
import { db } from '@/utils/firebase'


export const getCategory = (
  categoryId: string
): UseQueryResult<ICategory.ICategory, Error> =>
  useQuery<ICategory.ICategory, Error>({
    queryKey: ['categories', categoryId],
    queryFn: async () => {
      const cdoc = await getDoc(doc(db, 'categories', categoryId))
      if (!cdoc.exists()) throw new Error('Category does not exist')
      const cdata = cdoc.data() as any
      let store: any = null
      if (cdata.storeId) {
        const sdoc = await getDoc(doc(db, 'stores', cdata.storeId))
        if (sdoc.exists()) store = { id: sdoc.id, ...sdoc.data() }
      }
      return { id: cdoc.id, ...cdata, store } as ICategory.ICategory
    }
  })

export const getCategories = (
  params?: IFetchCategoriesRequest
): UseQueryResult<ICategory.ICategory[], Error> =>
  useQuery<ICategory.ICategory[], Error>({
    queryKey: ['categories'],
    queryFn: async () => {
      const categoriesQ = query(collection(db, 'categories'))
      let storeFilterId: string | null = null
      if (params?.storeName) {
        const sQ = query(
          collection(db, 'stores'),
          where('name', '==', params.storeName),
          where('isDeleted', '==', false)
        )
        const sSnap = await getDocs(sQ)
        if (!sSnap.empty) {
          storeFilterId = sSnap.docs[0].id
        } else {
          return []
        }
      }

      const cSnap = await getDocs(categoriesQ)
      const categories: ICategory.ICategory[] = []
      for (const cd of cSnap.docs) {
        const c = { id: cd.id, ...(cd.data() as any) }
        if (storeFilterId && c.storeId !== storeFilterId) continue
        let store: any = null
        if (c.storeId) {
          const sdoc = await getDoc(doc(db, 'stores', c.storeId))
          if (sdoc.exists()) {
            const sdata = sdoc.data() as any
            if (!sdata.isDeleted) store = { id: sdoc.id, ...sdata }
          }
        }
        categories.push({ ...(c as any), store } as ICategory.ICategory)
      }
      return categories
    }
  })

export const createCategories = () =>
  useMutation<
    Awaited<ICategory.ICategory>,
    Error,
    ICategory.ICreateCategoryRequest
  >({
    mutationKey: ['categories', 'create'],
    mutationFn: async (request: ICategory.ICreateCategoryRequest) => {
      // Ensure store exists and not deleted
      const sdoc = await getDoc(doc(db, 'stores', request.storeId))
      if (!sdoc.exists() || (sdoc.data() as any)?.isDeleted) {
        throw new Error('Store does not exist')
      }
      const categoryData = {
        name: request.name,
        storeId: request.storeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      const ref = await addDoc(collection(db, 'categories'), categoryData)
      return { id: ref.id, ...categoryData } as ICategory.ICategory
    }
  })

export const updateCategories = () =>
  useMutation<
    Awaited<ICategory.ICategory>,
    Error,
    ICategory.IUpdateCategoryRequest
  >({
    mutationKey: ['categories', 'update'],
    mutationFn: async (request: ICategory.IUpdateCategoryRequest) => {
      const cref = doc(db, 'categories', request.id)
      const csnap = await getDoc(cref)
      if (!csnap.exists()) throw new Error('Category does not exist')
      await updateDoc(cref, {
        name: request.name,
        storeId: request.storeId,
        updatedAt: new Date().toISOString()
      })
      return { id: request.id, name: request.name, storeId: request.storeId } as ICategory.ICategory
    }
  })

export interface IFetchCategoriesRequest {
  storeName?: string
}
