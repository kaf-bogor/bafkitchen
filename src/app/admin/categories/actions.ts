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
      let vendor: any = null
      if (cdata.vendorId) {
        const vdoc = await getDoc(doc(db, 'vendors', cdata.vendorId))
        if (vdoc.exists()) vendor = { id: vdoc.id, ...vdoc.data() }
      }
      return { id: cdoc.id, ...cdata, vendor } as ICategory.ICategory
    }
  })

export const getCategories = (
  params?: IFetchCategoriesRequest
): UseQueryResult<ICategory.ICategory[], Error> =>
  useQuery<ICategory.ICategory[], Error>({
    queryKey: ['categories'],
    queryFn: async () => {
      const categoriesQ = query(collection(db, 'categories'))
      let vendorFilterId: string | null = null
      if (params?.vendorName) {
        const vQ = query(
          collection(db, 'vendors'),
          where('name', '==', params.vendorName),
          where('isActive', '==', true)
        )
        const vSnap = await getDocs(vQ)
        if (!vSnap.empty) {
          vendorFilterId = vSnap.docs[0].id
        } else {
          return []
        }
      }

      const cSnap = await getDocs(categoriesQ)
      const categories: ICategory.ICategory[] = []
      for (const cd of cSnap.docs) {
        const c = { id: cd.id, ...(cd.data() as any) }
        if (vendorFilterId && c.vendorId !== vendorFilterId) continue
        let vendor: any = null
        if (c.vendorId) {
          const vdoc = await getDoc(doc(db, 'vendors', c.vendorId))
          if (vdoc.exists()) {
            const vdata = vdoc.data() as any
            if (vdata.isActive) vendor = { id: vdoc.id, ...vdata }
          }
        }
        categories.push({ ...(c as any), vendor } as ICategory.ICategory)
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
      // Ensure vendor exists and is active
      const vdoc = await getDoc(doc(db, 'vendors', request.vendorId))
      if (!vdoc.exists() || !(vdoc.data() as any)?.isActive) {
        throw new Error('Vendor does not exist or is inactive')
      }
      const categoryData = {
        name: request.name,
        vendorId: request.vendorId,
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
        vendorId: request.vendorId,
        updatedAt: new Date().toISOString()
      })
      return { id: request.id, name: request.name, vendorId: request.vendorId } as ICategory.ICategory
    }
  })

export interface IFetchCategoriesRequest {
  vendorName?: string
}
