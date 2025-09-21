import { IProduct } from '@/interfaces'

export interface ISchedule {
  id: string
  date: string
  createdAt: string
  updatedAt: string
  products: IProduct.IProductResponse[]
}

export interface IScheduleResponse {
  schedule: ISchedule
}
export interface ICreateScheduleRequest {
  productId: string
  date: string
}
export interface IDeleteScheduleRequest {
  productId: string
  scheduleId: string
}

export interface IDeleteScheduleResponse {
  message: string
  deletedProductSchedule: {
    id: string
    productId: string
    scheduleId: string
  }
}

export interface ISchedulesResponse {
  schedules: ISchedule[]
}
