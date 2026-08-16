import { useState, useEffect } from 'react'

import { ISchedule } from '@/interfaces'
import { apiFetch } from '@/utils/api'

const FETCH_TIMEOUT = 15000

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error('Koneksi lambat, silakan coba lagi')),
        ms
      )
    )
  ])

export const useGetSchedules = (
  start?: Date,
  end?: Date,
  enabled: boolean = true
) => {
  const [data, setData] = useState<ISchedule.ISchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSchedules = async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      let url = '/api/schedules'
      if (start && end) {
        url = `/api/schedules?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`
      }
      const res = await withTimeout(
        apiFetch<{ schedules: ISchedule.ISchedule[] }>(url),
        FETCH_TIMEOUT
      )
      setData(res.schedules)
    } catch (err: any) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return { data, loading, error, refetch: fetchSchedules }
}

export const usePostSchedules = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createSchedule = async (params: ISchedule.ICreateScheduleRequest) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ schedule: ISchedule.ISchedule }>('/api/schedules', {
        method: 'POST',
        body: JSON.stringify(params)
      })
      return res.schedule
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createSchedule, loading, error }
}

export const useDeleteSchedule = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteSchedule = async (params: ISchedule.IDeleteScheduleRequest) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{
        message: string
        deletedProductSchedule: {
          id: string
          productId: string
          scheduleId: string
        }
      }>(
        `/api/schedules/${params.scheduleId}?productId=${encodeURIComponent(params.productId)}`,
        { method: 'DELETE' }
      )
      return res
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { deleteSchedule, loading, error }
}

// Aliases for backward compatibility
export const getSchedules = useGetSchedules
export const postSchedules = usePostSchedules
export const deleteSchedule = useDeleteSchedule