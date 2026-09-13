import { IProduct, IProductCart } from '@/interfaces/product'
import { IStore } from '@/interfaces/store'

export interface IOrderRequest {
  orderer: IOrdererInputForm
  items: IProductCart[]
  totalPrice: number
}

export interface IPaymentInfo {
  method: string
  tendered: number
  change: number
}

export interface IPosOrderRequest {
  items: IProductCart[]
  totalPrice: number
  customerName?: string
  notes?: string
  payment: IPaymentInfo
  cashierName?: string
}

export interface IProductOrder {
  id: number
  quantity: number
  productId: string
  notes?: string
  product: {
    id: string
    name: string
    imageUrl: string
    priceBase: number
    price: number
    vendor?: {
      id: string
      name: string
    }
  }
}

export interface IOrder {
  id: string
  orderNumber?: string // Human-readable order number like BZ-0010926
  total: number
  createdAt: string
  updatedAt: string
  customerId: string
  customer: IOrdererInputForm
  productOrders: IProductOrder[]
  store: {
    name: string
  }
  vendors?: IStore[] // List of all vendors/stores available at checkout time
  status: string
  channel?: string // 'pos' for cashier sales, 'preorder' for pre-order
  fulfillmentDate?: string // ISO date for scheduled/pre-order fulfillment
  payment?: IPaymentInfo
  cashier?: string
  paymentProofUrl?: string
  paymentProofKey?: string
  activities?: IOrderActivity[]
}

export interface IUpdateOrderStatusRequest {
  id: string
  status: string
}

export interface IUpdateOrderStatusApiRequest {
  status: string
}

export interface IOrdererInputForm {
  name: string
  phoneNumber: string
  namaSantri: string
  kelas: string
  notes: string
}

export interface IOrderActivity {
  id: string
  orderId: string
  userId: string
  userEmail: string
  userName: string
  action: string
  fromStatus?: string
  toStatus?: string
  notes?: string
  proofUrl?: string
  proofKey?: string
  timestamp: string
  createdAt: string
}

export interface IProductOrderResponse {
  id: string
  number: number
  total: number
  createdAt: Date
  updatedAt: Date
  customerId: string
  status: string
  productOrders: {
    id: string
    quantity: number
    product: IProduct
  }[]
  customer: {
    id: string
    name: string
    phoneNumber: string
    email: string
    address: string
  }
  activities?: IOrderActivity[]
}
