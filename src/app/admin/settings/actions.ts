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
  limit,
  orderBy
} from 'firebase/firestore'

import { ISettings, ICreateSettingsRequest, IUpdateSettingsRequest } from '@/interfaces/settings'
import { db } from '@/utils/firebase'

// Get settings (there should only be one document)
export const useGetSettings = () => {
  const [data, setData] = useState<ISettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const settingsQuery = query(
        collection(db, 'settings'),
        orderBy('created_at', 'desc'),
        limit(1)
      )
      const qsnap = await getDocs(settingsQuery)

      if (!qsnap.empty) {
        const doc = qsnap.docs[0]
        const settingsData = doc.data() as any
        const settings: ISettings = {
          id: doc.id,
          admin_phone_number: settingsData.admin_phone_number || '',
          app_name: settingsData.app_name || 'BAF Kitchen',
          app_domain: settingsData.app_domain || '',
          created_at: settingsData.created_at?.toDate?.()?.toISOString() || '',
          updated_at: settingsData.updated_at?.toDate?.()?.toISOString() || ''
        }
        setData(settings)
      } else {
        setData(null)
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return { data, loading, error, refetch: fetchSettings }
}

// Get specific settings document
export const useGetSettingsById = (settingsId: string) => {
  const [data, setData] = useState<ISettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSettings = useCallback(async () => {
    if (!settingsId) return

    setLoading(true)
    setError(null)

    try {
      const settingsRef = doc(db, 'settings', settingsId)
      const snap = await getDoc(settingsRef)

      if (snap.exists()) {
        const settingsData = snap.data() as any
        const settings: ISettings = {
          id: snap.id,
          admin_phone_number: settingsData.admin_phone_number || '',
          app_name: settingsData.app_name || 'BAF Kitchen',
          app_domain: settingsData.app_domain || '',
          created_at: settingsData.created_at?.toDate?.()?.toISOString() || '',
          updated_at: settingsData.updated_at?.toDate?.()?.toISOString() || ''
        }
        setData(settings)
      } else {
        setData(null)
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [settingsId])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return { data, loading, error, refetch: fetchSettings }
}

// Create settings
export const useCreateSettings = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createSettings = async (request: ICreateSettingsRequest): Promise<ISettings> => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        admin_phone_number: request.admin_phone_number,
        app_name: request.app_name,
        app_domain: request.app_domain,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'settings'), payload)
      const snap = await getDoc(docRef)
      const settingsData = snap.data() as any

      const settings: ISettings = {
        id: docRef.id,
        admin_phone_number: settingsData.admin_phone_number,
        app_name: settingsData.app_name,
        app_domain: settingsData.app_domain,
        created_at: settingsData.created_at?.toDate?.()?.toISOString() || '',
        updated_at: settingsData.updated_at?.toDate?.()?.toISOString() || ''
      }

      return settings
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createSettings, loading, error }
}

// Update settings
export const useUpdateSettings = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateSettings = async (request: IUpdateSettingsRequest): Promise<ISettings> => {
    setLoading(true)
    setError(null)

    try {
      const settingsRef = doc(db, 'settings', request.id)
      await updateDoc(settingsRef, {
        admin_phone_number: request.admin_phone_number,
        app_name: request.app_name,
        app_domain: request.app_domain,
        updated_at: serverTimestamp()
      })

      const snap = await getDoc(settingsRef)
      const settingsData = snap.data() as any

      const settings: ISettings = {
        id: settingsRef.id,
        admin_phone_number: settingsData.admin_phone_number,
        app_name: settingsData.app_name,
        app_domain: settingsData.app_domain,
        created_at: settingsData.created_at?.toDate?.()?.toISOString() || '',
        updated_at: settingsData.updated_at?.toDate?.()?.toISOString() || ''
      }

      return settings
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateSettings, loading, error }
}