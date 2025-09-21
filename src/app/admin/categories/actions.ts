import { useState, useEffect, useCallback } from 'react'

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

export const useGetCategory = (categoryId: string) => {
  const [data, setData] = useState<ICategory.ICategory | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategory = useCallback(async () => {
    if (!categoryId) return

    setLoading(true)
    setError(null)

    try {
      const cdoc = await getDoc(doc(db, 'categories', categoryId))
      if (!cdoc.exists()) throw new Error('Category does not exist')
      const cdata = cdoc.data() as any
      let vendor: any = null
      if (cdata.vendorId) {
        const vdoc = await getDoc(doc(db, 'vendors', cdata.vendorId))
        if (vdoc.exists()) vendor = { id: vdoc.id, ...vdoc.data() }
      }
      setData({ id: cdoc.id, ...cdata, vendor } as ICategory.ICategory)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    fetchCategory()
  }, [fetchCategory])

  return { data, loading, error, refetch: fetchCategory }
}

export const useGetCategories = (params?: IFetchCategoriesRequest) => {
  const [data, setData] = useState<ICategory.ICategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
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
          setData([])
          return
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
      setData(categories)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return { data, loading, error, refetch: fetchCategories }
}

export const useCreateCategories = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createCategory = async (request: ICategory.ICreateCategoryRequest) => {
    setLoading(true)
    setError(null)

    try {
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
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createCategory, loading, error }
}

export const useUpdateCategories = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateCategory = async (request: ICategory.IUpdateCategoryRequest) => {
    setLoading(true)
    setError(null)

    try {
      const cref = doc(db, 'categories', request.id)
      const csnap = await getDoc(cref)
      if (!csnap.exists()) throw new Error('Category does not exist')
      await updateDoc(cref, {
        name: request.name,
        vendorId: request.vendorId,
        updatedAt: new Date().toISOString()
      })
      return { id: request.id, name: request.name, vendorId: request.vendorId } as ICategory.ICategory
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateCategory, loading, error }
}

export interface IFetchCategoriesRequest {
  vendorName?: string
}

// Aliases for backward compatibility
export const getCategory = useGetCategory
export const getCategories = useGetCategories
export const createCategories = useCreateCategories
export const updateCategories = useUpdateCategories