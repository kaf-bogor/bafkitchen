import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import { IOrder } from '@/interfaces'
import { currency } from '@/utils'

// Note: Google Sheets API integration requires server-side setup
// This provides client-side functionality to prepare data and create shareable CSV

interface GoogleSheetsExportData {
  title: string
  headers: string[]
  data: string[][]
  metadata: {
    exportDate: string
    totalOrders: number
    dateRange?: string
  }
}

export const prepareOrdersForGoogleSheets = (
  orders: IOrder.IOrder[],
  options: {
    includeProductDetails?: boolean
    title?: string
    dateRange?: string
  } = {}
): GoogleSheetsExportData => {
  const { includeProductDetails = false, title = 'Orders Export', dateRange } = options

  if (includeProductDetails) {
    return prepareDetailedOrdersData(orders, title, dateRange)
  } else {
    return prepareSummaryOrdersData(orders, title, dateRange)
  }
}

const prepareSummaryOrdersData = (
  orders: IOrder.IOrder[],
  title: string,
  dateRange?: string
): GoogleSheetsExportData => {
  const headers = [
    'Order Number',
    'Order Date',
    'Customer Name',
    'Customer Phone',
    'Nama Santri',
    'Kelas',
    'Status',
    'Total Amount (IDR)',
    'Total Amount (Number)',
    'Vendors',
    'Product Count',
    'Notes',
    'Created At',
    'Updated At'
  ]

  const data = orders.map((order) => [
    order.orderNumber || order.id,
    format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
    order.customer?.name || 'N/A',
    order.customer?.phoneNumber || 'N/A',
    order.customer?.namaSantri || 'N/A',
    order.customer?.kelas || 'N/A',
    order.status || 'N/A',
    currency.toIDRFormat(order.total || 0),
    (order.total || 0).toString(),
    order.vendors?.map(v => v.name).join(', ') || 'N/A',
    (order.productOrders?.length || 0).toString(),
    order.customer?.notes || '',
    format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
    format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm', { locale: id })
  ])

  return {
    title,
    headers,
    data,
    metadata: {
      exportDate: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: id }),
      totalOrders: orders.length,
      dateRange
    }
  }
}

const prepareDetailedOrdersData = (
  orders: IOrder.IOrder[],
  title: string,
  dateRange?: string
): GoogleSheetsExportData => {
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
    'Product Price (IDR)',
    'Product Price (Number)',
    'Product Total (IDR)',
    'Product Total (Number)',
    'Order Total (IDR)',
    'Order Total (Number)',
    'Vendors',
    'Notes',
    'Created At',
    'Updated At'
  ]

  const data: string[][] = []

  orders.forEach((order) => {
    if (order.productOrders && order.productOrders.length > 0) {
      order.productOrders.forEach((productOrder) => {
        const productPrice = productOrder.product?.price || 0
        const productTotal = (productOrder.quantity || 0) * productPrice

        data.push([
          order.orderNumber || order.id,
          format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
          order.customer?.name || 'N/A',
          order.customer?.phoneNumber || 'N/A',
          order.customer?.namaSantri || 'N/A',
          order.customer?.kelas || 'N/A',
          order.status || 'N/A',
          productOrder.product?.name || 'N/A',
          (productOrder.quantity || 0).toString(),
          currency.toIDRFormat(productPrice),
          productPrice.toString(),
          currency.toIDRFormat(productTotal),
          productTotal.toString(),
          currency.toIDRFormat(order.total || 0),
          (order.total || 0).toString(),
          order.vendors?.map(v => v.name).join(', ') || 'N/A',
          order.customer?.notes || '',
          format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
          format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm', { locale: id })
        ])
      })
    } else {
      // Order with no products
      data.push([
        order.orderNumber || order.id,
        format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
        order.customer?.name || 'N/A',
        order.customer?.phoneNumber || 'N/A',
        order.customer?.namaSantri || 'N/A',
        order.customer?.kelas || 'N/A',
        order.status || 'N/A',
        'No Products',
        '0',
        currency.toIDRFormat(0),
        '0',
        currency.toIDRFormat(0),
        '0',
        currency.toIDRFormat(order.total || 0),
        (order.total || 0).toString(),
        order.vendors?.map(v => v.name).join(', ') || 'N/A',
        order.customer?.notes || '',
        format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
        format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm', { locale: id })
      ])
    }
  })

  return {
    title,
    headers,
    data,
    metadata: {
      exportDate: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: id }),
      totalOrders: orders.length,
      dateRange
    }
  }
}

// Create CSV for Google Sheets import
export const createGoogleSheetsCSV = (sheetsData: GoogleSheetsExportData): string => {
  const csvRows: string[] = []
  
  // Add title
  csvRows.push(`"${sheetsData.title}"`)
  csvRows.push('') // Empty row
  
  // Add metadata
  csvRows.push('"Export Information"')
  csvRows.push(`"Export Date","${sheetsData.metadata.exportDate}"`)
  csvRows.push(`"Total Orders","${sheetsData.metadata.totalOrders}"`)
  if (sheetsData.metadata.dateRange) {
    csvRows.push(`"Date Range","${sheetsData.metadata.dateRange}"`)
  }
  csvRows.push('') // Empty row
  
  // Add headers
  csvRows.push(sheetsData.headers.map(header => `"${header}"`).join(','))
  
  // Add data
  sheetsData.data.forEach(row => {
    csvRows.push(row.map(cell => `"${cell}"`).join(','))
  })
  
  return csvRows.join('\n')
}

// Download CSV for Google Sheets import
export const downloadGoogleSheetsCSV = (
  orders: IOrder.IOrder[],
  options: {
    includeProductDetails?: boolean
    title?: string
    dateRange?: string
    filename?: string
  } = {}
) => {
  const { filename } = options
  const sheetsData = prepareOrdersForGoogleSheets(orders, options)
  const csvContent = createGoogleSheetsCSV(sheetsData)
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `GoogleSheets_Orders_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Open Google Sheets with instructions
export const openGoogleSheetsImportInstructions = () => {
  const instructions = `
To import your data into Google Sheets:

1. Go to https://sheets.google.com
2. Create a new spreadsheet or open an existing one
3. Click on "File" > "Import"
4. Choose "Upload" and select the CSV file you just downloaded
5. Select "Replace current sheet" or "Insert new sheet(s)"
6. Choose "Comma" as separator
7. Click "Import data"

Your orders data will be imported with proper formatting and metadata!
  `
  
  alert(instructions)
  
  // Open Google Sheets in new tab
  window.open('https://sheets.google.com', '_blank')
}