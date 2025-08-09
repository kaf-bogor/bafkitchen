import {
  useQuery,
  useMutation,
  UseMutationOptions,
  UseQueryResult
} from '@tanstack/react-query'
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

import { IProduct } from '@/interfaces'
import {
  IProductResponse,
  IEditProductRequest,
  ICreateProductRequest
} from '@/interfaces/product'
import { db, uploadToFirebase } from '@/utils/firebase'

export const useGetProduct = (
  productId: String
): UseQueryResult<IProductResponse, Error> =>
  useQuery<IProductResponse, Error>({
    queryKey: ['product', productId],
    queryFn: async () => {
      const pref = doc(db, 'products', String(productId))
      const psnap = await getDoc(pref)
      if (!psnap.exists()) throw new Error('Product not found')
      const pdata = psnap.data() as any

      // fetch related store
      const sref = doc(db, 'stores', pdata.storeId)
      const ssnap = await getDoc(sref)
      const store = { id: sref.id, ...(ssnap.data() as any) }

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
        storeId: pdata.storeId,
        createdAt: String(pdata.createdAt || ''),
        updatedAt: String(pdata.updatedAt || ''),
        store,
        categories
      }
      return result
    }
  })

export const useGetProducts = (
  params?: IFetchProductRequest
): UseQueryResult<IProductResponse[], Error> =>
  useQuery<IProductResponse[], Error>({
    queryKey: ['products', params],
    queryFn: async () => {
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

          // related store
          const sref = doc(db, 'stores', pdata.storeId)
          const ssnap = await getDoc(sref)
          const store = { id: sref.id, ...(ssnap.data() as any) }

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
            storeId: pdata.storeId,
            createdAt: String(pdata.createdAt || ''),
            updatedAt: String(pdata.updatedAt || ''),
            store,
            categories
          } as IProductResponse
        })
      )

      // client-side q filter
      if (params?.q) {
        const q = params.q.toLowerCase()
        return results.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q)
        )
      }

      return results
    }
  })

export const useDeleteProducts = (id: string) =>
  useMutation({
    mutationKey: ['products', 'delete'],
    mutationFn: async () => {
      const pref = doc(db, 'products', id)
      await deleteDoc(pref)
      return { id }
    }
  })

export const useCreateProducts = (
  options?: Omit<
    UseMutationOptions<
      IProduct.IProduct,
      Error,
      IProduct.ICreateProductRequest
    >,
    'mutationFn'
  >
) =>
  useMutation({
    mutationKey: ['products', 'create'],
    mutationFn: async (product: ICreateProductRequest) => {
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
        storeId: product.storeId,
        categoryIds: product.categoryIds,
        description: product.description,
        imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      const res = await addDoc(collection(db, 'products'), payload)
      const snap = await getDoc(res)
      return { id: res.id, ...(snap.data() as any) } as any
    },
    ...options
  })

export const useUpdateProducts = (
  options?: Omit<
    UseMutationOptions<IProduct.IProduct, Error, IProduct.IEditProductRequest>,
    'mutationFn'
  >
) =>
  useMutation<Awaited<IProduct.IProduct>, Error, IProduct.IEditProductRequest>({
    mutationKey: ['products', 'update'],
    mutationFn: async (product: IEditProductRequest) => {
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
        storeId: product.storeId,
        categoryIds: product.categoryIds,
        description: product.description,
        imageUrl,
        updatedAt: serverTimestamp()
      })
      const updated = await getDoc(pref)
      return { id: pref.id, ...(updated.data() as any) } as any
    },
    ...options
  })

// createFormData removed; using Firestore + Storage directly

export interface IFetchProductRequest {
  categoryIds?: string[]
  q?: string
}
