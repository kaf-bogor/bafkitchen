import { useState, useEffect } from 'react'

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDoc,
  updateDoc
} from 'firebase/firestore'

import { ISchedule, IProduct } from '@/interfaces'
import { db } from '@/utils/firebase'

// Fungsi untuk mengambil data schedules
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
      let schedulesQuery

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
      const schedules = schedulesSnap.docs.map((d) => {
        const data = d.data() as any
        return {
          id: d.id,
          date: data.date?.toDate?.()?.toISOString() || data.date,
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
          updatedAt:
            data.updatedAt?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
          products: data.products || []
        }
      }) as ISchedule.ISchedule[]

      setData(schedules)
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        setError(new Error('Permission denied to access schedules'))
      } else {
        setError(err as Error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      // First, fetch the product data
      const productDoc = await getDoc(doc(db, 'products', params.productId))
      const productData = productDoc.exists()
        ? ({
            id: productDoc.id,
            ...productDoc.data()
          } as IProduct.IProductResponse)
        : null

      if (!productData) {
        throw new Error('Product not found')
      }

      const targetDate = new Date(params.date)
      const dateStart = new Date(targetDate)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(targetDate)
      dateEnd.setHours(23, 59, 59, 999)

      // Check if a schedule already exists for this date
      const existingScheduleQuery = query(
        collection(db, 'schedules'),
        where('date', '>=', Timestamp.fromDate(dateStart)),
        where('date', '<=', Timestamp.fromDate(dateEnd))
      )

      const existingSchedules = await getDocs(existingScheduleQuery)

      if (!existingSchedules.empty) {
        // Schedule exists for this date, update it with the new product
        const existingSchedule = existingSchedules.docs[0]
        const scheduleData = existingSchedule.data()

        // Get existing products for this schedule
        const existingProducts = scheduleData.products || []

        // Check if product is already in this schedule
        if (existingProducts.find((p: any) => p.id === params.productId)) {
          throw new Error('Product is already scheduled for this date')
        }

        // Add new product to existing products array
        const updatedProducts = [...existingProducts, productData]

        // Update the existing schedule
        await updateDoc(doc(db, 'schedules', existingSchedule.id), {
          products: updatedProducts,
          updatedAt: serverTimestamp()
        })

        return {
          id: existingSchedule.id,
          date: new Date(params.date).toISOString(),
          createdAt:
            scheduleData.createdAt?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          products: updatedProducts
        } as ISchedule.ISchedule
      } else {
        // Create new schedule for this date
        const payload = {
          date: Timestamp.fromDate(targetDate),
          products: [productData],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }

        const res = await addDoc(collection(db, 'schedules'), payload)

        return {
          id: res.id,
          date: new Date(params.date).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          products: [productData]
        } as ISchedule.ISchedule
      }
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
      // Get the schedule document
      const scheduleDoc = await getDoc(doc(db, 'schedules', params.scheduleId))

      if (!scheduleDoc.exists()) {
        throw new Error('Schedule not found')
      }

      const scheduleData = scheduleDoc.data()
      const currentProducts = scheduleData.products || []

      // Remove the specific product from the products array
      const updatedProducts = currentProducts.filter(
        (product: any) => product.id !== params.productId
      )

      if (updatedProducts.length === 0) {
        // If no products left, delete the entire schedule
        await deleteDoc(doc(db, 'schedules', params.scheduleId))
      } else {
        // Update the schedule with remaining products
        await updateDoc(doc(db, 'schedules', params.scheduleId), {
          products: updatedProducts,
          updatedAt: serverTimestamp()
        })
      }

      return {
        message: 'deleted',
        deletedProductSchedule: {
          id: params.scheduleId,
          productId: params.productId,
          scheduleId: params.scheduleId
        }
      }
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
