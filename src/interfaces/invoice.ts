export interface IInvoice {
  id: string
  invoiceNumber: string // Format: INV-YYYYMMDD-XXXX
  orderId: string
  vendorId: string
  vendorName: string
  totalAmount: number
  status: EInvoiceStatus
  dueDate: string
  issuedDate: string
  settledDate?: string
  createdAt: string
  updatedAt: string

  // Invoice items (products from this specific vendor)
  items: IInvoiceItem[]
  
  // Customer and order details
  customer: {
    name: string
    phoneNumber: string
    namaSantri: string
    kelas: string
  }
  
  // BAFkitchen commission/fee details
  commission?: {
    percentage: number
    amount: number
  }
}

export interface IInvoiceItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export enum EInvoiceStatus {
  // eslint-disable-next-line no-unused-vars
  PENDING = 'Pending',
  // eslint-disable-next-line no-unused-vars
  ISSUED = 'Issued', 
  // eslint-disable-next-line no-unused-vars
  OVERDUE = 'Overdue',
  // eslint-disable-next-line no-unused-vars
  SETTLED = 'Settled'
}

export const invoiceStatusColors = {
  [EInvoiceStatus.PENDING]: 'orange',
  [EInvoiceStatus.ISSUED]: 'blue',
  [EInvoiceStatus.OVERDUE]: 'red',
  [EInvoiceStatus.SETTLED]: 'green'
}

export const invoiceStatusMessages = {
  [EInvoiceStatus.PENDING]: 'Menunggu',
  [EInvoiceStatus.ISSUED]: 'Diterbitkan',
  [EInvoiceStatus.OVERDUE]: 'Jatuh Tempo',
  [EInvoiceStatus.SETTLED]: 'Lunas'
}

// Request interfaces
export interface ICreateInvoiceRequest {
  orderId: string
  vendorId: string
  items: IInvoiceItem[]
  dueDate?: string // Optional, defaults to 30 days from issue date
}

export interface IUpdateInvoiceStatusRequest {
  invoiceId: string
  status: EInvoiceStatus
  settledDate?: string
}