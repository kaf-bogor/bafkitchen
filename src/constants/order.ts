/* eslint-disable no-unused-vars */
export enum EOrderStatus {
  PAYMENT_PENDING = 'Payment Pending',
  PAYMENT_CONFIRMED = 'Payment Confirmed',
  ORDER_PROCESSING = 'Order Processing',
  ORDER_PICKED_UP = 'Order Picked Up',
  INVOICE_ISSUED = 'Invoice Issued',
  INVOICE_SETTLED = 'Invoice Settled'
}

export const orderStatusFlow = [
  EOrderStatus.PAYMENT_PENDING,
  EOrderStatus.PAYMENT_CONFIRMED,
  EOrderStatus.ORDER_PROCESSING,
  EOrderStatus.ORDER_PICKED_UP,
  EOrderStatus.INVOICE_ISSUED,
  EOrderStatus.INVOICE_SETTLED
]

export const mapOrderStatusToColor: { [key: string]: string } = {
  [EOrderStatus.PAYMENT_PENDING]: 'orange',
  [EOrderStatus.PAYMENT_CONFIRMED]: 'green',
  [EOrderStatus.ORDER_PROCESSING]: 'blue',
  [EOrderStatus.ORDER_PICKED_UP]: 'purple',
  [EOrderStatus.INVOICE_ISSUED]: 'gray',
  [EOrderStatus.INVOICE_SETTLED]: 'green'
}

export const mapOrderStatusToMessage: { [key: string]: string } = {
  [EOrderStatus.PAYMENT_PENDING]: 'Menunggu pembayaran',
  [EOrderStatus.PAYMENT_CONFIRMED]: 'Pembayaran dikonfirmasi',
  [EOrderStatus.ORDER_PROCESSING]: 'Memproses pesanan',
  [EOrderStatus.ORDER_PICKED_UP]: 'Pesanan diambil',
  [EOrderStatus.INVOICE_ISSUED]: 'Invoice diterbitkan',
  [EOrderStatus.INVOICE_SETTLED]: 'Invoice lunas'
}

// Helper function to get the next status in the flow
export const getNextStatus = (currentStatus: string): string | null => {
  const currentIndex = orderStatusFlow.indexOf(currentStatus as EOrderStatus)
  if (currentIndex === -1 || currentIndex === orderStatusFlow.length - 1) {
    return null // Status not found or already at the last status
  }
  return orderStatusFlow[currentIndex + 1]
}

// Helper function to get the next status message
export const getNextStatusMessage = (currentStatus: string): string | null => {
  const nextStatus = getNextStatus(currentStatus)
  return nextStatus ? mapOrderStatusToMessage[nextStatus] : null
}

// Action descriptions for each status transition (in Bahasa Indonesia)
export const mapStatusToActionDescription: { [key: string]: string } = {
  [EOrderStatus.PAYMENT_PENDING]: 'Konfirmasi Pembayaran',
  [EOrderStatus.PAYMENT_CONFIRMED]: 'Proses Pesanan',
  [EOrderStatus.ORDER_PROCESSING]: 'Tandai Diambil',
  [EOrderStatus.ORDER_PICKED_UP]: 'Terbitkan Invoice',
  [EOrderStatus.INVOICE_ISSUED]: 'Tandai Lunas'
}

// Helper function to get action description for current status
export const getActionDescription = (currentStatus: string): string | null => {
  return mapStatusToActionDescription[currentStatus] || null
}

export enum ETimeFrame {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum EOrderChannel {
  POS = 'pos',
  ONLINE = 'online'
}
