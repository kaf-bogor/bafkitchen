import { IVendor } from '@/interfaces/vendor'

export interface ICreateCategoryRequest {
  name: string
  vendorId: string
}

export interface IUpdateCategoryRequest {
  id: string
  name: string
  vendorId: string
}

export interface ICategory {
  id: string
  name: string
  vendorId: string
  createdAt: string
  updatedAt: string
  vendor?: IVendor
}


export interface ICategoriesResponse {
  categories: ICategory[]
}
