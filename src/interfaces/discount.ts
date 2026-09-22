export type TProductDiscountType = 'percentage' | 'fixed'

export interface IProductDiscount {
  id: string
  productId: string
  name: string
  type: TProductDiscountType
  value: number
  minQuantity: number
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface IProductDiscountInput {
  id?: string
  name?: string
  type: TProductDiscountType
  value: number
  minQuantity?: number
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean
}

export interface IDiscountProductInfo {
  id: string
  name: string
}

export interface IDiscountWithProduct extends IProductDiscount {
  product?: IDiscountProductInfo | null
}
