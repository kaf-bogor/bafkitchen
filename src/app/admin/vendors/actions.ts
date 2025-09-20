import { useQuery, useMutation, UseQueryResult, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
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
        console.error('Vendors real-time listener error:', error)
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

// Migration function to move data from stores to vendors
export const useMigrateStoresToVendors = () => {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      console.log('🔄 Starting migration from stores to vendors...')
      
      try {
        // Check authentication first
        const { getAuth } = await import('firebase/auth')
        const auth = getAuth()
        const user = auth.currentUser
        
        if (!user) {
          throw new Error('You must be signed in to run migration')
        }
        
        console.log('👤 Current user:', user.email)
        
        // Fetch all stores
        console.log('📥 Fetching stores...')
        const storesSnap = await getDocs(collection(db, 'stores'))
        console.log(`📊 Found ${storesSnap.docs.length} stores`)
        
        if (storesSnap.empty) {
          console.log('⚠️  No stores found to migrate')
          return
        }
        
        let migratedCount = 0
        let skippedCount = 0
        let errorCount = 0
        
        for (const storeDoc of storesSnap.docs) {
          try {
            const storeData = storeDoc.data()
            console.log(`🏪 Processing store: "${storeData.name}" (ID: ${storeDoc.id})`)
            
            // Check if vendor already exists with same name
            const existingVendorQuery = query(
              collection(db, 'vendors'),
              where('name', '==', storeData.name)
            )
            const existingVendorSnap = await getDocs(existingVendorQuery)
            
            if (existingVendorSnap.empty) {
              // Create new vendor from store data
              const vendorData = {
                name: storeData.name || 'Unnamed Vendor',
                email: storeData.user?.email || storeData.email || '',
                userId: storeData.userId || '',
                isActive: !storeData.isDeleted,
                createdAt: storeData.createdAt || serverTimestamp(),
                updatedAt: serverTimestamp(),
                // Keep original store ID as reference for mapping
                originalStoreId: storeDoc.id
              }
              
              console.log('📝 Creating vendor:', vendorData)
              await addDoc(collection(db, 'vendors'), vendorData)
              console.log(`✅ Migrated store "${storeData.name}" to vendors collection`)
              migratedCount++
            } else {
              console.log(`⏭️  Vendor "${storeData.name}" already exists, skipping...`)
              skippedCount++
            }
          } catch (storeError) {
            console.error(`❌ Error processing store ${storeDoc.id}:`, storeError)
            errorCount++
          }
        }
        
        console.log('🎉 Migration completed!')
        console.log(`📊 Summary: ${migratedCount} migrated, ${skippedCount} skipped, ${errorCount} errors`)
        
        if (errorCount > 0) {
          throw new Error(`Migration completed with ${errorCount} errors. Check console for details.`)
        }
        
      } catch (error) {
        console.error('❌ Migration failed:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    }
  })
}