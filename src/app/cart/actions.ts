import { useState } from 'react'

import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'

import { IStore } from '@/interfaces'
import { IOrder as IOrderType, IOrderRequest } from '@/interfaces/order'
import { db } from '@/utils/firebase'
import { generateOrderId } from '@/utils/orderIdGenerator'

export const useCreateOrders = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createOrder = async (orderRequest: IOrderRequest) => {
    setLoading(true)
    setError(null)

    try {
      // Check authentication status
      const { getAuth } = await import('firebase/auth')
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        console.warn('⚠️ User is not authenticated, but continuing with order creation...')
      }
      
      const orderNumber = generateOrderId()
      
      // Fetch all vendors from stores collection
      let vendors: IStore.IStore[] = []
      try {
        const storesSnapshot = await getDocs(collection(db, 'stores'))
        
        if (storesSnapshot.empty) {
          // Try to fetch from vendors collection instead
          const vendorsSnapshot = await getDocs(collection(db, 'vendors'))
          
          if (!vendorsSnapshot.empty) {
            vendors = vendorsSnapshot.docs.map((doc) => {
              const data = doc.data()
              return {
                id: doc.id,
                name: data.name || '',
                userId: data.userId || '',
                isDeleted: Boolean(data.isDeleted),
                createdAt: String(data.createdAt || ''),
                updatedAt: String(data.updatedAt || ''),
                user: {
                  id: data.userId || '',
                  name: data.userName || '',
                  email: data.userEmail || '',
                  role: 'admin',
                  createdAt: '',
                  updatedAt: '',
                  phoneNumber: null,
                  lastSignInAt: ''
                }
              } as IStore.IStore
            }).filter(store => !store.isDeleted)
          }
        } else {
          vendors = storesSnapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              name: data.name || '',
              userId: data.userId || '',
              isDeleted: Boolean(data.isDeleted),
              createdAt: String(data.createdAt || ''),
              updatedAt: String(data.updatedAt || ''),
              user: {
                id: data.userId || '',
                name: data.userName || '',
                email: data.userEmail || '',
                role: 'admin',
                createdAt: '',
                updatedAt: '',
                phoneNumber: null,
                lastSignInAt: ''
              }
            } as IStore.IStore
          }).filter(store => !store.isDeleted)
        }
      } catch (error) {
        console.error('❌ Error fetching vendors:', error)
        // Continue with empty vendors array if fetch fails
      }
      
      // Transform cart items to productOrders format with vendor information
      const productOrders = await Promise.all(
        orderRequest.items.map(async (item, index) => {
          // Fetch full product details to get vendor information
          let productData: any = {}
          
          try {
            const { doc, getDoc } = await import('firebase/firestore')
            const productDoc = await getDoc(doc(db, 'products', item.id || ''))
            
            if (productDoc.exists()) {
              productData = productDoc.data()
            }
          } catch (error) {
            console.warn(`Failed to fetch product details for ${item.id}:`, error)
          }
          
          return {
            id: index + 1, // Sequential ID for product order
            quantity: item.quantity || 0,
            productId: item.id || '',
            product: {
              id: item.id || '',
              name: item.name || '',
              imageUrl: item.imageUrl || '',
              priceBase: item.priceBase || 0,
              price: item.price || 0,
              vendor: productData.vendor || null
            }
          }
        })
      )
      
      const payload = {
        orderNumber,
        productOrders,
        total: orderRequest.totalPrice || 0,
        customer: {
          name: orderRequest.orderer.name || '',
          phoneNumber: orderRequest.orderer.phoneNumber || '',
          namaSantri: orderRequest.orderer.namaSantri || '',
          kelas: orderRequest.orderer.kelas || '',
          notes: orderRequest.orderer.notes || ''
        },
        status: 'Payment Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        store: {
          name: 'Baf Kitchen'
        },
        vendors: vendors || [] // Ensure vendors is never undefined
      }
      
      // Deep check for undefined values
      const checkForUndefined = (obj: any, path: string = ''): string[] => {
        const undefinedFields: string[] = []
        
        if (obj === undefined) {
          undefinedFields.push(path)
          return undefinedFields
        }
        
        if (obj === null || typeof obj !== 'object') {
          return undefinedFields
        }
        
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            undefinedFields.push(...checkForUndefined(item, `${path}[${index}]`))
          })
        } else {
          Object.keys(obj).forEach(key => {
            const value = obj[key]
            const currentPath = path ? `${path}.${key}` : key
            
            if (value === undefined) {
              undefinedFields.push(currentPath)
            } else {
              undefinedFields.push(...checkForUndefined(value, currentPath))
            }
          })
        }
        
        return undefinedFields
      }
      
      const undefinedFields = checkForUndefined(payload)
      if (undefinedFields.length > 0) {
        throw new Error(`Undefined fields found: ${undefinedFields.join(', ')}`)
      }
      
      const res = await addDoc(collection(db, 'orders'), payload)

      return {
        id: res.id,
        orderNumber,
        total: orderRequest.totalPrice || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerId: '',
        customer: {
          name: orderRequest.orderer.name || '',
          phoneNumber: orderRequest.orderer.phoneNumber || '',
          namaSantri: orderRequest.orderer.namaSantri || '',
          kelas: orderRequest.orderer.kelas || '',
          notes: orderRequest.orderer.notes || ''
        },
        productOrders,
        store: { name: 'Baf Kitchen' },
        vendors: vendors || [],
        status: 'Payment Pending'
      } as IOrderType
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createOrder, loading, error }
}
