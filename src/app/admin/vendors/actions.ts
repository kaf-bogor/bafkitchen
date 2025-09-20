import { useEffect } from 'react'

import { useQuery, useMutation, UseQueryResult, useQueryClient } from '@tanstack/react-query'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore'

import { IVendor, ICreateVendorRequest, IUpdateVendorRequest } from '@/interfaces/vendor'
import { db } from '@/utils/firebase'

// Helper function to transform vendor data
const transformVendorData = (doc: any): IVendor => {
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString()
  } as IVendor
}

// Fetch all vendors (compatible with existing usage)
// eslint-disable-next-line react-hooks/rules-of-hooks
export const getVendors = (): UseQueryResult<IVendor[], Error> => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useQuery<IVendor[], Error>({
    queryKey: ['vendors'],
    queryFn: async () => {
      try {
        // Try with isActive filter first
        let vendorsQuery = query(
          collection(db, 'vendors'),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc')
        )
        let vendorsSnap = await getDocs(vendorsQuery)

        // If no active vendors found, try without the isActive filter
        if (vendorsSnap.empty) {
          console.log('No active vendors found, trying without isActive filter')
          vendorsQuery = query(
            collection(db, 'vendors'),
            orderBy('createdAt', 'desc')
          )
          vendorsSnap = await getDocs(vendorsQuery)
        }

        return vendorsSnap.docs.map(transformVendorData)
      } catch (error) {
        console.error('Error fetching vendors:', error)
        // Return empty array if vendors collection doesn't exist yet
        return []
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - vendors don't change often
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000)
  })
}

// Fetch all vendors with real-time updates
export const useGetVendors = (): UseQueryResult<IVendor[], Error> => {
  const queryClient = useQueryClient()
  
  // Set up real-time listener
  useEffect(() => {
    const vendorsQuery = query(
      collection(db, 'vendors'),
      orderBy('createdAt', 'desc')
    )
    
    const unsubscribe = onSnapshot(
      vendorsQuery,
      (querySnapshot) => {
        const vendors: IVendor[] = querySnapshot.docs.map(transformVendorData)
        queryClient.setQueryData(['vendors'], vendors)
      },
      (error) => {
      }
    )
    
    return () => {
      unsubscribe()
    }
  }, [queryClient])
  
  return useQuery<IVendor[], Error>({
    queryKey: ['vendors'],
    queryFn: async () => {
      const vendorsQuery = query(
        collection(db, 'vendors'),
        orderBy('createdAt', 'desc')
      )
      const vendorsSnap = await getDocs(vendorsQuery)
      return vendorsSnap.docs.map(transformVendorData)
    },
    staleTime: Infinity, // Keep data fresh since we have real-time updates
    refetchOnWindowFocus: false // Disable refetch on focus since we have real-time updates
  })
}

// Fetch single vendor
export const useGetVendor = (vendorId: string): UseQueryResult<IVendor, Error> =>
  useQuery<IVendor, Error>({
    queryKey: ['vendor', vendorId],
    queryFn: async () => {
      const vendorDoc = await getDoc(doc(db, 'vendors', vendorId))
      
      if (!vendorDoc.exists()) {
        throw new Error('Vendor not found')
      }
      
      const data = vendorDoc.data()
      return {
        id: vendorDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString()
      } as IVendor
    },
    enabled: !!vendorId
  })

// Create vendor
export const useCreateVendor = () => {
  const queryClient = useQueryClient()
  
  return useMutation<IVendor, Error, ICreateVendorRequest>({
    mutationFn: async (request: ICreateVendorRequest) => {
      const vendorData = {
        name: request.name,
        email: request.email,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      const vendorRef = await addDoc(collection(db, 'vendors'), vendorData)
      
      return {
        id: vendorRef.id,
        ...request,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as IVendor
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    }
  })
}

// Update vendor
export const useUpdateVendor = () => {
  const queryClient = useQueryClient()
  
  return useMutation<IVendor, Error, IUpdateVendorRequest>({
    mutationFn: async (request: IUpdateVendorRequest) => {
      const vendorRef = doc(db, 'vendors', request.id)
      
      await updateDoc(vendorRef, {
        name: request.name,
        userId: request.userId,
        updatedAt: serverTimestamp()
      })
      
      // Fetch and return updated vendor
      const updatedDoc = await getDoc(vendorRef)
      const data = updatedDoc.data()
      
      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt || new Date().toISOString(),
        updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt || new Date().toISOString()
      } as IVendor
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['vendor', data.id] })
    }
  })
}

// Delete vendor (soft delete)
export const useDeleteVendor = () => {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, string>({
    mutationFn: async (vendorId: string) => {
      const vendorRef = doc(db, 'vendors', vendorId)
      
      await updateDoc(vendorRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    }
  })
}

