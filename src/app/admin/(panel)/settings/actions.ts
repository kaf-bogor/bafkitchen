import { useState, useEffect, useCallback } from 'react'

import {
  ISettings,
  ICreateSettingsRequest,
  IUpdateSettingsRequest
} from '@/interfaces/settings'
import { apiFetch } from '@/utils/api'

// Get settings (there should only be one document)
export const useGetSettings = () => {
  const [data, setData] = useState<ISettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ settings: ISettings | null }>(
        '/api/settings'
      )
      setData(res.settings)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [])

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
      const res = await apiFetch<{ settings: ISettings | null }>(
        '/api/settings'
      )
      const settings = res.settings?.id === settingsId ? res.settings : null
      setData(settings)
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

  const createSettings = async (
    request: ICreateSettingsRequest
  ): Promise<ISettings> => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ settings: ISettings }>('/api/settings', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      return res.settings
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

  const updateSettings = async (
    request: IUpdateSettingsRequest
  ): Promise<ISettings> => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ settings: ISettings }>(
        `/api/settings/${request.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            admin_phone_number: request.admin_phone_number,
            app_name: request.app_name,
            app_domain: request.app_domain
          })
        }
      )
      return res.settings
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateSettings, loading, error }
}
