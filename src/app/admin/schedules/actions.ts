/* 
  File ini berisi React custom hooks untuk mengambil data toko menggunakan Axios dan React Query untuk pengambilan dan penyimpanan data.
  - Fungsi getSchedules menggunakan useQuery dari @tanstack/react-query untuk mendapatkan daftar toko dan mengembalikan hasil query.
  - Endpoint pengambilan data sudah diubah menjadi 'api/schedules' sesuai instruksi.
*/

/* eslint-disable react-hooks/rules-of-hooks */
// Menonaktifkan aturan eslint untuk menghilangkan peringatan terkait penggunaan react-hooks

import {
  useQuery,
  useMutation,
  UseQueryResult,
  MutateOptions,
  useQueryClient
} from '@tanstack/react-query'
import { Timestamp, addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, query, where, orderBy, getDoc } from 'firebase/firestore'

import { ISchedule, IProduct } from '@/interfaces'
import { db } from '@/utils/firebase'


// Fungsi untuk mengambil data schedules menggunakan React Query
export const getSchedules = (start?: Date, end?: Date, enabled: boolean = true): UseQueryResult<ISchedule.ISchedule[], Error> =>
  useQuery<ISchedule.ISchedule[], Error>({
    queryKey: ['schedules', start, end], // Ensure the query key is unique for different dates
    enabled: enabled, // Only run when enabled
    queryFn: async () => {
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

      return transformedSchedules
    },
    retry: (failureCount, error: any) => {
      if (error?.code === 'permission-denied') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

// Fungsi untuk membuat jadwal baru menggunakan useMutation
export const postSchedules = (
  options: MutateOptions<
    ISchedule.ISchedule,
    Error,
    ISchedule.ICreateScheduleRequest
  >
) => {
  const queryClient = useQueryClient()
  
  return useMutation<
    ISchedule.ISchedule,
    Error,
    ISchedule.ICreateScheduleRequest
  >({
    mutationKey: ['schedules', 'create'],
    mutationFn: async (params: ISchedule.ICreateScheduleRequest) => {
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
    },
    onSuccess: () => {
      // Invalidate and refetch schedules
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
    ...options
  })
}

// Fungsi untuk menghapus jadwal berdasarkan productId dan scheduleId menggunakan useMutation
export const deleteSchedule = (
  options: MutateOptions<
    ISchedule.IDeleteScheduleResponse,
    Error,
    ISchedule.IDeleteScheduleRequest
  >
) => {
  const queryClient = useQueryClient()
  
  return useMutation<
    ISchedule.IDeleteScheduleResponse,
    Error,
    ISchedule.IDeleteScheduleRequest
  >({
    mutationKey: ['schedules', 'delete'],
    mutationFn: async (params: ISchedule.IDeleteScheduleRequest) => {
      // Assume scheduleId is the document id to delete
      await deleteDoc(doc(db, 'schedules', params.scheduleId))
      return { message: 'deleted', deletedProductSchedule: { id: params.scheduleId, productId: params.productId, scheduleId: params.scheduleId } }
    },
    onSuccess: () => {
      // Invalidate and refetch schedules
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
    ...options
  })
}
