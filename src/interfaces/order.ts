import { IProduct, IProductCart } from '@/interfaces/product'
import { IStore } from '@/interfaces/store'

export interface IOrderRequest {
  orderer: IOrdererInputForm
  items: IProductCart[]
  totalPrice: number
}

export interface IProductOrder {
  id: number
  quantity: number
  productId: string
  product: {
    id: string
    name: string
    imageUrl: string
    priceBase: number
    price: number
    storeId?: string
    store?: {
      id: string
      name: string
    }
  }
}

export interface IOrder {
  id: string
  orderNumber?: string // Human-readable order number like BAF-20240912-12345
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
  storeId: string
  store: IStore
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
