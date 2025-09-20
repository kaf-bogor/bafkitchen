/* eslint-disable react-hooks/rules-of-hooks */
import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'

import { IStore } from '@/interfaces'
import { IOrder as IOrderType, IOrderRequest } from '@/interfaces/order'
import { db } from '@/utils/firebase'
import { generateOrderId } from '@/utils/orderIdGenerator'

export const useCreateOrders = (
  options?: Omit<UseMutationOptions<IOrderType, Error, IOrderRequest>, 'mutationFn'>
) =>
  useMutation<IOrderType, Error, IOrderRequest>({
    mutationKey: ['orders', 'create'],
    mutationFn: async (orderRequest: IOrderRequest) => {
      console.log('🚀 Creating order with request:', orderRequest)
      
      // Check authentication status
      const { getAuth } = await import('firebase/auth')
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      console.log('👤 Current user:', currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      } : 'Not authenticated')
      
      if (!currentUser) {
        console.warn('⚠️ User is not authenticated, but continuing with order creation...')
      }
      
      const orderNumber = generateOrderId()
      console.log('📝 Generated order number:', orderNumber)
      
      // Fetch all vendors from stores collection
      let vendors: IStore.IStore[] = []
      try {
        console.log('🏪 Fetching vendors from stores collection...')
        const storesSnapshot = await getDocs(collection(db, 'stores'))
        console.log('📊 Raw Firestore response - docs found:', storesSnapshot.docs.length)
        
        if (storesSnapshot.empty) {
          console.warn('⚠️ No documents found in stores collection!')
          // Let's try to fetch from vendors collection instead
          console.log('🔄 Trying vendors collection as fallback...')
          const vendorsSnapshot = await getDocs(collection(db, 'vendors'))
          console.log('📊 Vendors collection - docs found:', vendorsSnapshot.docs.length)
          
          if (!vendorsSnapshot.empty) {
            vendors = vendorsSnapshot.docs.map((doc) => {
              const data = doc.data()
              console.log('📋 Vendor doc data:', { id: doc.id, name: data.name })
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
            console.log('📋 Store doc data:', { id: doc.id, name: data.name })
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
        
        console.log('✅ Active vendors after filtering:', vendors.length)
        console.log('📋 Vendor names:', vendors.map(v => ({ id: v.id, name: v.name })))
      } catch (error) {
        console.error('❌ Error fetching vendors:', error)
        console.error('❌ Error details:', {
          code: (error as any)?.code,
          message: (error as any)?.message
        })
        // Continue with empty vendors array if fetch fails
      }
      
      // Transform cart items to productOrders format with vendor information
      const productOrders = await Promise.all(
        orderRequest.items.map(async (item, index) => {
          // Fetch full product details to get storeId and store information
          let storeId = ''
          let storeName = 'Unknown Vendor'
          
          try {
            const { doc, getDoc } = await import('firebase/firestore')
            const productDoc = await getDoc(doc(db, 'products', item.id || ''))
            
            if (productDoc.exists()) {
              const productData = productDoc.data()
              storeId = productData.storeId || ''
              console.log(`📦 Product ${item.name} has storeId: ${storeId}`)
              
              // Try to get store name from the vendors array we already fetched
              if (storeId && vendors.length > 0) {
                const vendor = vendors.find(v => v.id === storeId)
                if (vendor) {
                  storeName = vendor.name
                  console.log(`✅ Found vendor from cached list: ${storeName}`)
                }
              }
              
              // If vendors array is empty or vendor not found, try to fetch directly from stores
              if (storeName === 'Unknown Vendor' && storeId) {
                try {
                  console.log(`🔍 Fetching vendor directly from stores collection for storeId: ${storeId}`)
                  const storeDoc = await getDoc(doc(db, 'stores', storeId))
                  if (storeDoc.exists()) {
                    const storeData = storeDoc.data()
                    storeName = storeData.name || 'Unknown Vendor'
                    console.log(`✅ Found vendor from direct fetch: ${storeName}`)
                  } else {
                    // Try vendors collection
                    console.log(`🔍 Trying vendors collection for storeId: ${storeId}`)
                    const vendorDoc = await getDoc(doc(db, 'vendors', storeId))
                    if (vendorDoc.exists()) {
                      const vendorData = vendorDoc.data()
                      storeName = vendorData.name || 'Unknown Vendor'
                      console.log(`✅ Found vendor from vendors collection: ${storeName}`)
                    }
                  }
                } catch (fetchError) {
                  console.warn(`Failed to fetch store/vendor details for ${storeId}:`, fetchError)
                }
              }
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
              storeId: storeId,
              store: storeId ? {
                id: storeId,
                name: storeName
              } : undefined
            }
          }
        })
      )
      
      console.log('🛒 Product orders:', productOrders.length, 'items')
      
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
          name: orderRequest.storeName || 'Baf Kitchen'
        },
        vendors: vendors || [] // Ensure vendors is never undefined
      }
      
      // Final validation before saving
      console.log('🔍 Final payload validation:')
      console.log('📊 Vendors array:', payload.vendors.map(v => ({ id: v.id, name: v.name })))
      console.log('🛒 Product orders with vendor info:', payload.productOrders.map(po => ({
        productName: po.product.name,
        storeId: po.product.storeId,
        storeName: po.product.store?.name
      })))
      
      console.log('💾 Saving order payload to Firestore:', payload)
      
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
        console.error('❌ Found undefined fields:', undefinedFields)
        console.error('❌ Full payload:', JSON.stringify(payload, null, 2))
        throw new Error(`Undefined fields found: ${undefinedFields.join(', ')}`)
      }
      
      try {
        const res = await addDoc(collection(db, 'orders'), payload)
        console.log('✅ Order saved successfully with ID:', res.id)
        
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
          store: { name: orderRequest.storeName || 'Baf Kitchen' },
          vendors: vendors || [],
          status: 'Payment Pending'
        } as IOrderType
      } catch (error) {
        console.error('❌ Failed to save order to Firestore:', error)
        throw error
      }
    },
    ...options
  })
