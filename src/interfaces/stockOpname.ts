export type TStockOpnameStatus = 'draft' | 'finalized'

export interface IStockOpnameFilters {
  vendorId?: string
  categoryIds?: string[]
  channel?: string
  inStock?: boolean
}

export interface IStockOpnameItem {
  id: string
  opnameId: string
  productId: string
  productName: string
  sku: string
  unit: string
  systemStock: number
  countedStock: number | null
  difference: number | null
  note: string
  createdAt: string
  updatedAt: string
}

export interface IStockOpname {
  id: string
  opnameNumber: string
  opnameDate: string
  note: string
  status: TStockOpnameStatus
  filters: IStockOpnameFilters
  totalProducts: number
  totalDifference: number
  finalizedAt?: string
  createdAt: string
  updatedAt: string
  items?: IStockOpnameItem[]
}

export interface ICreateStockOpnameRequest {
  opnameDate: string
  note?: string
  filters?: IStockOpnameFilters
}

export interface IUpdateStockOpnameItemsRequest {
  items: {
    id: string
    countedStock: number | null
    note?: string
  }[]
}

export interface IStockChecklistItem {
  productId: string
  productName: string
  sku: string
  unit: string
  systemStock: number
  countedStock?: number | null
  difference?: number | null
  note?: string
}
