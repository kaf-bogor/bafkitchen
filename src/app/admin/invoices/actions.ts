import { useQuery, useMutation, UseQueryResult, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'

import { IInvoice, IUpdateInvoiceStatusRequest, EInvoiceStatus } from '@/interfaces/invoice'
import { IOrder as IOrderType } from '@/interfaces/order'
import { db } from '@/utils/firebase'

// Generate invoice number
const generateInvoiceNumber = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `INV-${dateStr}-${randomStr}`
}

// Helper function to transform invoice data
const transformInvoiceData = (doc: any): IInvoice => {
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
    issuedDate: data.issuedDate?.toDate?.()?.toISOString() || data.issuedDate || new Date().toISOString(),
    dueDate: data.dueDate?.toDate?.()?.toISOString() || data.dueDate || new Date().toISOString(),
    settledDate: data.settledDate?.toDate?.()?.toISOString() || data.settledDate
  } as IInvoice
}

// Custom hook for real-time invoice updates
export const useGetInvoices = (): UseQueryResult<IInvoice[], Error> => {
  const queryClient = useQueryClient()
  
  // Set up real-time listener
  useEffect(() => {
    const invoicesQuery = query(
      collection(db, 'invoices'),
      orderBy('createdAt', 'desc')
    )
    
    const unsubscribe = onSnapshot(
      invoicesQuery,
      (querySnapshot) => {
        const invoices: IInvoice[] = querySnapshot.docs.map(transformInvoiceData)
        queryClient.setQueryData(['invoices'], invoices)
      },
      (error) => {
        console.error('Invoice real-time listener error:', error)
      }
    )
    
    return () => {
      unsubscribe()
    }
  }, [queryClient])
  
  return useQuery<IInvoice[], Error>({
    queryKey: ['invoices'],
    queryFn: async () => {
      // Initial fetch
      const invoicesQuery = query(
        collection(db, 'invoices'),
        orderBy('createdAt', 'desc')
      )
      const invoicesSnap = await getDocs(invoicesQuery)
      return invoicesSnap.docs.map(transformInvoiceData)
    },
    staleTime: Infinity, // Keep data fresh since we have real-time updates
    refetchOnWindowFocus: false // Disable refetch on focus since we have real-time updates
  })
}

// Fetch invoices by vendor with real-time updates
export const useGetInvoicesByVendor = (vendorId: string): UseQueryResult<IInvoice[], Error> => {
  const queryClient = useQueryClient()
  
  // Set up real-time listener for vendor invoices
  useEffect(() => {
    if (!vendorId) return
    
    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    )
    
    const unsubscribe = onSnapshot(
      invoicesQuery,
      (querySnapshot) => {
        const invoices: IInvoice[] = querySnapshot.docs.map(transformInvoiceData)
        queryClient.setQueryData(['invoices', 'vendor', vendorId], invoices)
      },
      (error) => {
        console.error('Vendor invoices real-time listener error:', error)
      }
    )
    
    return () => {
      unsubscribe()
    }
  }, [queryClient, vendorId])
  
  return useQuery<IInvoice[], Error>({
    queryKey: ['invoices', 'vendor', vendorId],
    queryFn: async () => {
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc')
      )
      const invoicesSnap = await getDocs(invoicesQuery)
      return invoicesSnap.docs.map(transformInvoiceData)
    },
    enabled: !!vendorId,
    staleTime: Infinity, // Keep data fresh since we have real-time updates
    refetchOnWindowFocus: false // Disable refetch on focus since we have real-time updates
  })
}

// Fetch single invoice
export const useGetInvoice = (invoiceId: string): UseQueryResult<IInvoice, Error> =>
  useQuery<IInvoice, Error>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId))
      
      if (!invoiceDoc.exists()) {
        throw new Error('Invoice not found')
      }
      
      const data = invoiceDoc.data()
      return {
        id: invoiceDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        issuedDate: data.issuedDate?.toDate?.()?.toISOString() || data.issuedDate || new Date().toISOString(),
        dueDate: data.dueDate?.toDate?.()?.toISOString() || data.dueDate || new Date().toISOString(),
        settledDate: data.settledDate?.toDate?.()?.toISOString() || data.settledDate
      } as IInvoice
    },
    enabled: !!invoiceId
  })

// Generate invoices for an order
export const useGenerateInvoicesForOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation<IInvoice[], Error, string>({
    mutationFn: async (orderId: string) => {
      // Fetch the order
      const orderDoc = await getDoc(doc(db, 'orders', orderId))
      if (!orderDoc.exists()) {
        throw new Error('Order not found')
      }
      
      const order = {
        id: orderDoc.id,
        ...orderDoc.data()
      } as IOrderType
      
      // Group products by vendor
      const productsByVendor = new Map<string, any[]>()
      
      if (order.productOrders && Array.isArray(order.productOrders)) {
        for (const productOrder of order.productOrders) {
          // Get vendor info from product's store data
          let vendorId = 'default-vendor'
          let vendorName = 'Unknown Vendor'
          
          console.log('🔍 Processing product order:', {
            productId: productOrder.product?.id,
            productName: productOrder.product?.name,
            storeId: productOrder.product?.storeId,
            store: productOrder.product?.store
          })
          
          if (productOrder.product) {
            // First try to get storeId from product (this should now work with our fix)
            if (productOrder.product.storeId) {
              vendorId = productOrder.product.storeId
              console.log(`✅ Found storeId: ${vendorId}`)
              
              // Try to get vendor name from product's store object
              if (productOrder.product.store?.name) {
                vendorName = productOrder.product.store.name
                console.log(`✅ Found vendor name from product.store: ${vendorName}`)
              }
              // Fallback: try to find vendor name from order.vendors array
              else if (order.vendors && Array.isArray(order.vendors)) {
                const vendor = order.vendors.find((v: any) => v.id === vendorId)
                if (vendor && vendor.name) {
                  vendorName = vendor.name
                  console.log(`✅ Found vendor name from order.vendors: ${vendorName}`)
                }
              }
            }
          }
          
          // Additional fallback: try to get vendor from stores collection directly
          if (vendorName === 'Unknown Vendor' && vendorId !== 'default-vendor') {
            try {
              const storeDoc = await getDoc(doc(db, 'stores', vendorId))
              if (storeDoc.exists()) {
                const storeData = storeDoc.data()
                if (storeData.name) {
                  vendorName = storeData.name
                  console.log(`✅ Found vendor name from stores collection: ${vendorName}`)
                }
              }
            } catch (error) {
              console.warn(`Could not fetch store ${vendorId}:`, error)
            }
          }
          
          console.log(`📊 Final vendor assignment: ${vendorId} -> ${vendorName}`)
          
          if (!productsByVendor.has(vendorId)) {
            productsByVendor.set(vendorId, [])
          }
          
          productsByVendor.get(vendorId)?.push({
            ...productOrder,
            vendorId,
            vendorName
          })
        }
      }
      
      console.log('🏪 Products grouped by vendor:', Array.from(productsByVendor.keys()).map(vendorId => ({
        vendorId,
        productCount: productsByVendor.get(vendorId)?.length || 0,
        vendorName: productsByVendor.get(vendorId)?.[0]?.vendorName
      })))
      
      // Generate invoices for each vendor
      const invoices: IInvoice[] = []
      
      for (const [vendorId, products] of Array.from(productsByVendor)) {
        const vendorName = products[0]?.vendorName || 'Unknown Vendor'
        const items = products.map(product => ({
          productId: product.productId || product.product?.id || '',
          productName: product.product?.name || '',
          quantity: product.quantity || 0,
          unitPrice: product.product?.price || 0,
          totalPrice: (product.quantity || 0) * (product.product?.price || 0)
        }))
        
        const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 30) // 30 days from now
        
        const invoiceData: Omit<IInvoice, 'id'> = {
          invoiceNumber: generateInvoiceNumber(),
          orderId: order.id,
          vendorId,
          vendorName,
          totalAmount,
          status: EInvoiceStatus.ISSUED,
          dueDate: dueDate.toISOString(),
          issuedDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items,
          customer: order.customer || {
            name: '',
            phoneNumber: '',
            namaSantri: '',
            kelas: ''
          },
          commission: {
            percentage: 10, // Default 10% commission for BAFkitchen
            amount: totalAmount * 0.1
          }
        }
        
        // Save to Firestore
        const invoiceRef = await addDoc(collection(db, 'invoices'), {
          ...invoiceData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          issuedDate: serverTimestamp(),
          dueDate: new Date(invoiceData.dueDate)
        })
        
        invoices.push({
          id: invoiceRef.id,
          ...invoiceData
        })
      }
      
      return invoices
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    }
  })
}

// Update invoice status
export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation<IInvoice, Error, IUpdateInvoiceStatusRequest>({
    mutationFn: async (request: IUpdateInvoiceStatusRequest) => {
      const invoiceRef = doc(db, 'invoices', request.invoiceId)
      const updateData: any = {
        status: request.status,
        updatedAt: serverTimestamp()
      }
      
      if (request.status === EInvoiceStatus.SETTLED && request.settledDate) {
        updateData.settledDate = new Date(request.settledDate)
      }
      
      await updateDoc(invoiceRef, updateData)
      
      // Fetch and return updated invoice
      const updatedDoc = await getDoc(invoiceRef)
      const data = updatedDoc.data()
      
      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt || new Date().toISOString(),
        updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt || new Date().toISOString(),
        issuedDate: data?.issuedDate?.toDate?.()?.toISOString() || data?.issuedDate || new Date().toISOString(),
        dueDate: data?.dueDate?.toDate?.()?.toISOString() || data?.dueDate || new Date().toISOString(),
        settledDate: data?.settledDate?.toDate?.()?.toISOString() || data?.settledDate
      } as IInvoice
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] })
      queryClient.invalidateQueries({ queryKey: ['invoices', 'vendor', data.vendorId] })
    }
  })
}