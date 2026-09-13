import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { jsPDF } from 'jspdf'

import { currency } from '@/utils'

export interface IReceiptItem {
  name: string
  price: number
  quantity: number
}

export interface IReceiptData {
  orderNumber: string
  date: string
  cashier?: string
  customerName?: string
  items: IReceiptItem[]
  total: number
  payment: {
    method: string
    tendered: number
    change: number
  }
}

// Builds receipt data from an order document
// eslint-disable-next-line no-unused-vars
export const buildReceiptData = (order: {
  orderNumber?: string
  createdAt: string
  cashier?: string
  customer?: { name?: string }
  productOrders: {
    quantity: number
    product: { name: string; price: number }
  }[]
  total: number
  payment?: { method: string; tendered: number; change: number }
}): IReceiptData => ({
  orderNumber: order.orderNumber || '-',
  date: order.createdAt,
  cashier: order.cashier,
  customerName: order.customer?.name,
  items: order.productOrders.map((po) => ({
    name: po.product?.name || '-',
    price: po.product?.price || 0,
    quantity: po.quantity || 0
  })),
  total: order.total,
  payment: order.payment || { method: 'Tunai', tendered: order.total, change: 0 }
})

// Generates an 80mm thermal-style receipt PDF
export const exportReceiptToPDF = (receipt: IReceiptData) => {
  const pageWidth = 80
  const margin = 5
  const lineHeight = 5
  let y = 10

  const estimatedHeight = 60 + receipt.items.length * lineHeight * 2
  const pdf = new jsPDF({
    unit: 'mm',
    format: [pageWidth, Math.max(estimatedHeight, 120)]
  })

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.text('BAZAF', pageWidth / 2, y, { align: 'center' })
  y += lineHeight

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('Struk Pembelian', pageWidth / 2, y, { align: 'center' })
  y += lineHeight + 2

  pdf.text(`No: ${receipt.orderNumber}`, margin, y)
  y += lineHeight
  pdf.text(
    `Tgl: ${format(new Date(receipt.date), 'dd MMM yyyy HH:mm', { locale: id })}`,
    margin,
    y
  )
  y += lineHeight
  if (receipt.cashier) {
    pdf.text(`Kasir: ${receipt.cashier}`, margin, y)
    y += lineHeight
  }
  if (receipt.customerName) {
    pdf.text(`Pelanggan: ${receipt.customerName}`, margin, y)
    y += lineHeight
  }

  pdf.line(margin, y, pageWidth - margin, y)
  y += lineHeight

  receipt.items.forEach((item) => {
    pdf.text(item.name, margin, y)
    y += lineHeight
    pdf.text(
      `${item.quantity} x ${currency.toIDRFormat(item.price)}`,
      margin,
      y
    )
    pdf.text(
      currency.toIDRFormat(item.price * item.quantity),
      pageWidth - margin,
      y,
      { align: 'right' }
    )
    y += lineHeight
  })

  pdf.line(margin, y, pageWidth - margin, y)
  y += lineHeight

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('TOTAL', margin, y)
  pdf.text(currency.toIDRFormat(receipt.total), pageWidth - margin, y, {
    align: 'right'
  })
  y += lineHeight + 1

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(`Bayar (${receipt.payment.method})`, margin, y)
  pdf.text(currency.toIDRFormat(receipt.payment.tendered), pageWidth - margin, y, {
    align: 'right'
  })
  y += lineHeight
  pdf.text('Kembalian', margin, y)
  pdf.text(currency.toIDRFormat(receipt.payment.change), pageWidth - margin, y, {
    align: 'right'
  })
  y += lineHeight + 4

  pdf.text('Terima kasih!', pageWidth / 2, y, { align: 'center' })

  pdf.save(`struk-${receipt.orderNumber}.pdf`)
}
