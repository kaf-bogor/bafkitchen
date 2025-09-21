
import { useState, useEffect, useCallback } from 'react'

import { Timestamp, addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, query, where, orderBy, getDoc } from 'firebase/firestore'

import { ISchedule, IProduct } from '@/interfaces'
import { db } from '@/utils/firebase'


// Fungsi untuk mengambil data schedules
export const useGetSchedules = (start?: Date, end?: Date, enabled: boolean = true) => {
  const [data, setData] = useState<ISchedule.ISchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSchedules = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      let schedulesQuery;
      
      if (!start || !end) {
        schedulesQuery = collection(db, 'schedules')
      } else {
        schedulesQuery = query(
          collection(db, 'schedules'),
          where('date', '>=', Timestamp.fromDate(start)),
          where('date', '<=', Timestamp.fromDate(end)),
          orderBy('date', 'asc')
        )
      }

      const schedulesSnap = await getDocs(schedulesQuery)
      const rawSchedules = schedulesSnap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id, 
          ...data,
          date: data.date?.toDate?.()?.toISOString() || data.date
        };
      })

      // Group schedules by date and fetch product details
      const schedulesByDate = new Map<string, any[]>()
      
      for (const schedule of rawSchedules) {
        const dateKey = new Date(schedule.date).toDateString()
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('Schedule grouping debug:', {
            scheduleId: schedule.id,
            originalDate: schedule.date,
            parsedDate: new Date(schedule.date),
            dateKey: dateKey,
            productId: schedule.productId
          });
        }
        
        if (!schedulesByDate.has(dateKey)) {
          schedulesByDate.set(dateKey, [])
        }
        schedulesByDate.get(dateKey)!.push(schedule)
      }

      const transformedSchedules: ISchedule.ISchedule[] = []

      for (const [, schedules] of Array.from(schedulesByDate.entries())) {
        const productSchedules = []
        
        for (const schedule of schedules) {
          try {
            const productDoc = await getDoc(doc(db, 'products', schedule.productId))
            if (productDoc.exists()) {
              const productData = { id: productDoc.id, ...productDoc.data() } as IProduct.IProductResponse
              productSchedules.push({
                productId: schedule.productId,
                scheduleId: schedule.id,
                product: productData
              })
            }
          } catch (error) {
            console.error(`Error fetching product ${schedule.productId}:`, error)
          }
        }

        if (productSchedules.length > 0) {
          transformedSchedules.push({
            id: schedules[0].id, // Use first schedule's ID as group ID
            date: schedules[0].date,
            createdAt: schedules[0].createdAt,
            updatedAt: schedules[0].updatedAt,
            productSchedules
          })
        }
      }

      setData(transformedSchedules)
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        setError(new Error('Permission denied to access schedules'))
      } else {
        setError(err as Error)
      }
    } finally {
      setLoading(false)
    }
  }, [start, end, enabled])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  return { data, loading, error, refetch: fetchSchedules }
}

// Fungsi untuk membuat jadwal baru
export const usePostSchedules = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createSchedule = async (params: ISchedule.ICreateScheduleRequest) => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        productId: params.productId,
        date: Timestamp.fromDate(new Date(params.date)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      const res = await addDoc(collection(db, 'schedules'), payload)
      
      // Fetch the product data to return properly structured response
      const productDoc = await getDoc(doc(db, 'products', params.productId))
      const productData = productDoc.exists() 
        ? { id: productDoc.id, ...productDoc.data() } as IProduct.IProductResponse
        : null

      if (!productData) {
        throw new Error('Product not found')
      }

      const newSchedule: ISchedule.ISchedule = {
        id: res.id,
        date: new Date(params.date).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        productSchedules: [{
          productId: params.productId,
          scheduleId: res.id,
          product: productData
        }]
      }

      return newSchedule
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createSchedule, loading, error }
}

// Fungsi untuk menghapus jadwal berdasarkan productId dan scheduleId
export const useDeleteSchedule = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteSchedule = async (params: ISchedule.IDeleteScheduleRequest) => {
    setLoading(true)
    setError(null)

    try {
      // Assume scheduleId is the document id to delete
      await deleteDoc(doc(db, 'schedules', params.scheduleId))
      return { message: 'deleted', deletedProductSchedule: { id: params.scheduleId, productId: params.productId, scheduleId: params.scheduleId } }
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
