import { useState, useEffect, useCallback } from 'react'

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

// Fetch all vendors directly from Firestore (no react-query)
export const getVendors = async (): Promise<IVendor[]> => {
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
}

// Fetch all vendors with real-time updates
export const useGetVendors = () => {
  const [data, setData] = useState<IVendor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    setError(null)

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
        vendorsQuery = query(
          collection(db, 'vendors'),
          orderBy('createdAt', 'desc')
        )
        vendorsSnap = await getDocs(vendorsQuery)
      }

      const vendors = vendorsSnap.docs.map(transformVendorData)
      setData(vendors)
    } catch (err) {
      setError(err as Error)
      // Return empty array if vendors collection doesn't exist yet
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendors()

    // Set up real-time listener
    const vendorsQuery = query(
      collection(db, 'vendors'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      vendorsQuery,
      (querySnapshot) => {
        const vendors: IVendor[] = querySnapshot.docs.map(transformVendorData)
        setData(vendors)
      },
      (err) => {
        setError(err as Error)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [fetchVendors])

  return { data, loading, error, refetch: fetchVendors }
}

// Fetch single vendor
export const useGetVendor = (vendorId: string) => {
  const [data, setData] = useState<IVendor | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchVendor = useCallback(async () => {
    if (!vendorId) return

    setLoading(true)
    setError(null)

    try {
      const vendorDoc = await getDoc(doc(db, 'vendors', vendorId))

      if (!vendorDoc.exists()) {
        throw new Error('Vendor not found')
      }

      const vendorData = vendorDoc.data()
      const vendor = {
        id: vendorDoc.id,
        ...vendorData,
        createdAt: vendorData.createdAt?.toDate?.()?.toISOString() || vendorData.createdAt || new Date().toISOString(),
        updatedAt: vendorData.updatedAt?.toDate?.()?.toISOString() || vendorData.updatedAt || new Date().toISOString()
      } as IVendor

      setData(vendor)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  useEffect(() => {
    fetchVendor()
  }, [fetchVendor])

  return { data, loading, error, refetch: fetchVendor }
}

// Create vendor
export const useCreateVendor = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createVendor = async (request: ICreateVendorRequest) => {
    setLoading(true)
    setError(null)

    try {
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
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createVendor, loading, error }
}

// Update vendor
export const useUpdateVendor = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateVendor = async (request: IUpdateVendorRequest) => {
    setLoading(true)
    setError(null)

    try {
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
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateVendor, loading, error }
}

// Delete vendor (soft delete)
export const useDeleteVendor = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteVendor = async (vendorId: string) => {
    setLoading(true)
    setError(null)

    try {
      const vendorRef = doc(db, 'vendors', vendorId)

      await updateDoc(vendorRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      })

      return { id: vendorId }
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { deleteVendor, loading, error }
}

