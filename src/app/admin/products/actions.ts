import { useState, useEffect, useCallback } from 'react'

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore'

import {
  IProductResponse,
  IEditProductRequest,
  ICreateProductRequest
} from '@/interfaces/product'
import { db, uploadToFirebase } from '@/utils/firebase'

export const useGetProduct = (productId: string) => {
  const [data, setData] = useState<IProductResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!productId) return

    setLoading(true)
    setError(null)

    try {
      const pref = doc(db, 'products', productId)
      const psnap = await getDoc(pref)
      if (!psnap.exists()) throw new Error('Product not found')
      const pdata = psnap.data() as any

      // Use the vendor stored in the product, or create a default if missing
      const vendor = pdata.vendor || {
        id: 'baf-kitchen',
        name: 'Baf Kitchen',
        userId: '',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
        user: {
          id: '',
          name: '',
          email: '',
          role: 'user' as const,
          createdAt: '',
          updatedAt: '',
          phoneNumber: null,
          lastSignInAt: ''
        }
      }

      // fetch categories
      const categoryIds: string[] = pdata.categoryIds || []
      const categories = await Promise.all(
        categoryIds.map(async (cid) => {
          const cref = doc(db, 'categories', cid)
          const csnap = await getDoc(cref)
          return { id: cref.id, ...(csnap.data() as any) }
        })
      )

      const result: IProductResponse = {
        id: psnap.id,
        name: pdata.name,
        priceBase: pdata.priceBase,
        price: pdata.price,
        stock: pdata.stock ?? 0,
        description: pdata.description ?? '',
        imageUrl: pdata.imageUrl ?? '',
        createdAt: String(pdata.createdAt || ''),
        updatedAt: String(pdata.updatedAt || ''),
        vendor,
        categories
      }
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return { data, loading, error, refetch: fetchProduct }
}

export const useGetProducts = (params?: IFetchProductRequest) => {
  const [data, setData] = useState<IProductResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const col = collection(db, 'products')
      let qref = query(col)
      if (params?.categoryIds && params.categoryIds.length > 0) {
        const ids = params.categoryIds.slice(0, 10) // Firestore limit for array-contains-any
        qref = query(col, where('categoryIds', 'array-contains-any', ids))
      }
      const qsnap = await getDocs(qref)
      const results: IProductResponse[] = await Promise.all(
        qsnap.docs.map(async (d) => {
          const pdata = d.data() as any

          // Use the vendor stored in the product, or create a default if missing
          const vendor = pdata.vendor || {
            id: 'baf-kitchen',
            name: 'Baf Kitchen',
            userId: '',
            isDeleted: false,
            createdAt: '',
            updatedAt: '',
            user: {
              id: '',
              name: '',
              email: '',
              role: 'user' as const,
              createdAt: '',
              updatedAt: '',
              phoneNumber: null,
              lastSignInAt: ''
            }
          }

          // categories
          const categoryIds: string[] = pdata.categoryIds || []
          const categories = await Promise.all(
            categoryIds.map(async (cid) => {
              const cref = doc(db, 'categories', cid)
              const csnap = await getDoc(cref)
              return { id: cref.id, ...(csnap.data() as any) }
            })
          )

          return {
            id: d.id,
            name: pdata.name,
            priceBase: pdata.priceBase,
            price: pdata.price,
            stock: pdata.stock ?? 0,
            description: pdata.description ?? '',
            imageUrl: pdata.imageUrl ?? '',
            createdAt: String(pdata.createdAt || ''),
            updatedAt: String(pdata.updatedAt || ''),
            vendor,
            categories
          } as IProductResponse
        })
      )

      // client-side q filter
      let filteredResults = results
      if (params?.q) {
        const q = params.q.toLowerCase()
        filteredResults = results.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q)
        )
      }

      setData(filteredResults)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { data, loading, error, refetch: fetchProducts }
}

export const useDeleteProducts = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteProduct = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const pref = doc(db, 'products', id)
      await deleteDoc(pref)
      return { id }
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { deleteProduct, loading, error }
}

export const useCreateProducts = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createProduct = async (product: ICreateProductRequest) => {
    setLoading(true)
    setError(null)

    try {
      let imageUrl = ''
      if (product.image) {
        const upload = await uploadToFirebase(product.image)
        imageUrl = upload.downloadURL
      }

      const payload = {
        name: product.name,
        priceBase: product.priceBase,
        price: product.price,
        stock: product.stock ?? 0,
        vendor: product.vendor,
        categoryIds: product.categoryIds,
        description: product.description,
        imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      const res = await addDoc(collection(db, 'products'), payload)
      const snap = await getDoc(res)
      return { id: res.id, ...(snap.data() as any) } as any
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createProduct, loading, error }
}

export const useUpdateProducts = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateProduct = async (product: IEditProductRequest) => {
    setLoading(true)
    setError(null)

    try {
      const pref = doc(db, 'products', product.id)
      const psnap = await getDoc(pref)
      if (!psnap.exists()) throw new Error('Product not found')

      let imageUrl = (psnap.data() as any)?.imageUrl || ''
      if (product.image) {
        const upload = await uploadToFirebase(product.image)
        imageUrl = upload.downloadURL
      }

      await updateDoc(pref, {
        name: product.name,
        priceBase: product.priceBase,
        price: product.price,
        stock: product.stock ?? 0,
        vendor: product.vendor,
        categoryIds: product.categoryIds,
        description: product.description,
        imageUrl,
        updatedAt: serverTimestamp()
      })
      const updated = await getDoc(pref)
      return { id: pref.id, ...(updated.data() as any) } as any
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateProduct, loading, error }
}

export interface IFetchProductRequest {
  categoryIds?: string[]
  q?: string
}