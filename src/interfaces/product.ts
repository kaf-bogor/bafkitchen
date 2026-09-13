import { ICategory } from '@/interfaces/category'
import { IVendor } from '@/interfaces/vendor'

export interface ICreateProductRequest {
  name: string
  sku?: string
  unit?: string
  isActive?: boolean
  priceBase: number
  price: number
  stock: number | null
  vendor: {
    id: string
    name: string
  }
  categoryIds: string[]
  description: string
  image?: File 
  availability?: string
  preorderStart?: string | null
  preorderEnd?: string | null
  channels?: string[]
  availabilityType?: string
  weeklyDays?: number[]
  specificDates?: string[]
  preorderLeadDays?: number | null
  preorderCutoffTime?: string | null
  preorderMinQty?: number | null
  preorderMaxQty?: number | null
  preorderCapacity?: number | null
  fulfillmentType?: string
}

export interface IProductsResponse {
  products: IProductResponse[]
}

export interface IProductResponse {
  id: string
  name: string
  sku: string
  unit: string
  isActive: boolean
  priceBase: number
  price: number
  stock: number
  description: string
  imageUrl: string
  image?: File
  availability: string
  preorderStart: string | null
  preorderEnd: string | null
  channels: string[]
  availabilityType: string
  weeklyDays: number[]
  specificDates: string[]
  preorderLeadDays: number | null
  preorderCutoffTime: string | null
  preorderMinQty: number | null
  preorderMaxQty: number | null
  preorderCapacity: number | null
  fulfillmentType: string
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  vendor: IVendor
  categories: ICategory[]
}

export interface ICategoryInput {
  label: string
  value: string
}

export interface ICreateProductInput {
  name: string
  sku?: string
  unit?: string
  isActive?: boolean
  priceBase: number
  price: number
  stock: number
  vendor: {
    id: string
    name: string
  }
  categories: ICategoryInput[]
  description: string
  image?: File | null
  imageUrl?: string
  availability?: string
  preorderStart?: string | null
  preorderEnd?: string | null
  channels?: string[]
  availabilityType?: string
  weeklyDays?: number[]
  specificDates?: string[]
  preorderLeadDays?: number | null
  preorderCutoffTime?: string | null
  preorderMinQty?: number | null
  preorderMaxQty?: number | null
  preorderCapacity?: number | null
  fulfillmentType?: string
}

export type IProduct = {
  id: string
  name: string
  priceBase: number
  price: number
  stock: number
  vendor: IVendor
  categories: ICategory[]
  description: string
  imageUrl: string
  availability?: string
  preorderStart?: string | null
  preorderEnd?: string | null
}

export const IProduct = {
  fromData: (product: IProductResponse) => ({
    id: product.id,
    name: product.name,
    priceBase: product.priceBase,
    price: product.price,
    stock: product.stock,
    vendor: product.vendor,
    categories: [],
    description: product.description,
    imageUrl: product.imageUrl,
    availability: product.availability || 'ready',
    preorderStart: product.preorderStart ?? null,
    preorderEnd: product.preorderEnd ?? null
  })
}

export interface IEditProductRequest {
  id: string
  name: string
  sku?: string
  unit?: string
  isActive?: boolean
  priceBase: number
  price: number
  stock: number | null
  vendor: {
    id: string
    name: string
  }
  categoryIds: string[]
  description: string
  image?: File
  imageUrl?: string
  availability?: string
  preorderStart?: string | null
  preorderEnd?: string | null
  channels?: string[]
  availabilityType?: string
  weeklyDays?: number[]
  specificDates?: string[]
  preorderLeadDays?: number | null
  preorderCutoffTime?: string | null
  preorderMinQty?: number | null
  preorderMaxQty?: number | null
  preorderCapacity?: number | null
  fulfillmentType?: string
}

export interface IProductCart extends IProduct {
  quantity: number
  notes?: string
}
