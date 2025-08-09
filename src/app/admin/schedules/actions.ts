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
  MutateOptions
} from '@tanstack/react-query'
import { Timestamp, addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, query, where, orderBy } from 'firebase/firestore'

import { ISchedule } from '@/interfaces'
import { db } from '@/utils/firebase'


// Fungsi untuk mengambil data schedules menggunakan React Query
export const getSchedules = (start?: Date, end?: Date): UseQueryResult<ISchedule.ISchedule[], Error> =>
  useQuery<ISchedule.ISchedule[], Error>({
    queryKey: ['schedules', start, end], // Ensure the query key is unique for different dates
    queryFn: async () => {
      if (!start || !end) {
        const qsnap = await getDocs(collection(db, 'schedules'))
        return qsnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ISchedule.ISchedule[]
      }
      const qref = query(
        collection(db, 'schedules'),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end)),
        orderBy('date', 'asc')
      )
      const qsnap = await getDocs(qref)
      return qsnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ISchedule.ISchedule[]
    }
  });

// Fungsi untuk membuat jadwal baru menggunakan useMutation
export const postSchedules = (
  options: MutateOptions<
    ISchedule.ISchedule,
    Error,
    ISchedule.ICreateScheduleRequest
  >
) => {
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
      return { id: res.id, ...payload } as unknown as ISchedule.ISchedule
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
    ...options
  })
}
