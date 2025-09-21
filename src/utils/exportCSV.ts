import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Papa from 'papaparse'

import { IOrder } from '@/interfaces'
import { currency } from '@/utils'

interface ExportOrderData {
  orderNumber: string
  orderDate: string
  customerName: string
  customerPhone: string
  namaSantri: string
  kelas: string
  status: string
  totalAmount: string
  vendorNames: string
  productCount: number
  notes: string
  createdAt: string
  updatedAt: string
}

export const exportOrdersToCSV = (orders: IOrder.IOrder[], filename?: string) => {
  // Transform orders data for CSV export
  const exportData: ExportOrderData[] = orders.map((order) => ({
    orderNumber: order.orderNumber || order.id,
    orderDate: format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
    customerName: order.customer?.name || 'N/A',
    customerPhone: order.customer?.phoneNumber || 'N/A',
    namaSantri: order.customer?.namaSantri || 'N/A',
    kelas: order.customer?.kelas || 'N/A',
    status: order.status || 'N/A',
    totalAmount: currency.toIDRFormat(order.total || 0),
    vendorNames: order.vendors?.map(v => v.name).join(', ') || 'N/A',
    productCount: order.productOrders?.length || 0,
    notes: order.customer?.notes || '',
    createdAt: format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
    updatedAt: format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm', { locale: id })
  }))

  // Configure CSV headers
  const headers = [
    'Order Number',
    'Order Date', 
    'Customer Name',
    'Customer Phone',
    'Nama Santri',
    'Kelas',
    'Status',
    'Total Amount',
    'Vendors',
    'Product Count',
    'Notes',
    'Created At',
    'Updated At'
  ]

  // Convert to CSV
  const csv = Papa.unparse({
    fields: headers,
    data: exportData.map(order => [
      order.orderNumber,
      order.orderDate,
      order.customerName,
      order.customerPhone,
      order.namaSantri,
      order.kelas,
      order.status,
      order.totalAmount,
      order.vendorNames,
      order.productCount,
      order.notes,
      order.createdAt,
      order.updatedAt
    ])
  })

  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `Orders_Export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const exportDetailedOrdersToCSV = (orders: IOrder.IOrder[], filename?: string) => {
  // Create detailed export with one row per product
  const detailedData: any[] = []

  orders.forEach((order) => {
    if (order.productOrders && order.productOrders.length > 0) {
      order.productOrders.forEach((productOrder) => {
        detailedData.push({
          orderNumber: order.orderNumber || order.id,
          orderDate: format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
          customerName: order.customer?.name || 'N/A',
          customerPhone: order.customer?.phoneNumber || 'N/A',
          namaSantri: order.customer?.namaSantri || 'N/A',
          kelas: order.customer?.kelas || 'N/A',
          orderStatus: order.status || 'N/A',
          productName: productOrder.product?.name || 'N/A',
          productQuantity: productOrder.quantity || 0,
          productPrice: currency.toIDRFormat(productOrder.product?.price || 0),
          productTotal: currency.toIDRFormat((productOrder.quantity || 0) * (productOrder.product?.price || 0)),
          orderTotal: currency.toIDRFormat(order.total || 0),
          vendorNames: order.vendors?.map(v => v.name).join(', ') || 'N/A',
          notes: order.customer?.notes || '',
          createdAt: format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
          updatedAt: format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm', { locale: id })
        })
      })
    } else {
      // Order with no products
      detailedData.push({
        orderNumber: order.orderNumber || order.id,
        orderDate: format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
        customerName: order.customer?.name || 'N/A',
        customerPhone: order.customer?.phoneNumber || 'N/A',
        namaSantri: order.customer?.namaSantri || 'N/A',
        kelas: order.customer?.kelas || 'N/A',
        orderStatus: order.status || 'N/A',
        productName: 'No Products',
        productQuantity: 0,
        productPrice: currency.toIDRFormat(0),
        productTotal: currency.toIDRFormat(0),
        orderTotal: currency.toIDRFormat(order.total || 0),
        vendorNames: order.vendors?.map(v => v.name).join(', ') || 'N/A',
        notes: order.customer?.notes || '',
        createdAt: format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
        updatedAt: format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm', { locale: id })
      })
    }
  })

  // Configure CSV headers for detailed export
  const headers = [
    'Order Number',
    'Order Date',
    'Customer Name',
    'Customer Phone',
    'Nama Santri',
    'Kelas',
    'Order Status',
    'Product Name',
    'Product Quantity',
    'Product Price',
    'Product Total',
    'Order Total',
    'Vendors',
    'Notes',
    'Created At',
    'Updated At'
  ]

  // Convert to CSV
  const csv = Papa.unparse({
    fields: headers,
    data: detailedData.map(row => [
      row.orderNumber,
      row.orderDate,
      row.customerName,
      row.customerPhone,
      row.namaSantri,
      row.kelas,
      row.orderStatus,
      row.productName,
      row.productQuantity,
      row.productPrice,
      row.productTotal,
      row.orderTotal,
      row.vendorNames,
      row.notes,
      row.createdAt,
      row.updatedAt
    ])
  })

  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `Orders_Detailed_Export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}