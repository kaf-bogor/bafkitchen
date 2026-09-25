export interface IPurchaseItem {
  id: string
  purchaseId: string
  productId: string
  productName: string
  qty: number
  costPrice: number
  sellPrice: number
  subtotal: number
  margin: number
}

export interface IPurchase {
  id: string
  purchaseNumber: string
  supplier: string
  purchaseDate: string
  note: string
  totalCost: number
  totalQty: number
  totalMargin: number
  items: IPurchaseItem[]
  createdAt: string
  updatedAt: string
}

export interface ICreatePurchaseItemInput {
  productId: string
  qty: number
  costPrice: number
  sellPrice: number
}

export interface ICreatePurchaseRequest {
  supplier: string
  purchaseDate: string
  note?: string
  items: ICreatePurchaseItemInput[]
}

export interface IStockBatch {
  id: string
  productId: string
  productName: string
  purchaseId: string
  purchaseNumber: string
  supplier: string
  qtyIn: number
  qtyRemaining: number
  costPrice: number
  sellPrice: number
  potentialProfit: number
  receivedAt: string
}

export interface IProductPurchase {
  id: string
  purchaseId: string
  purchaseNumber: string
  supplier: string
  purchaseDate: string
  qty: number
  costPrice: number
  sellPrice: number
  subtotal: number
  createdAt: string
}
