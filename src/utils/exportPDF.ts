import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { jsPDF } from 'jspdf'

import { IInvoice } from '@/interfaces/invoice'
import { currency } from '@/utils'

// BAZAF design tokens (kept in sync with src/theme/index.ts)
const BRAND = { r: 22, g: 163, b: 74 } // brand.600
const INK = { r: 23, g: 25, b: 35 } // gray.900
const BODY = { r: 45, g: 55, b: 72 } // gray.700
const MUTED = { r: 113, g: 128, b: 150 } // gray.500
const LINE = { r: 226, g: 232, b: 240 } // gray.200
const SOFT = { r: 247, g: 250, b: 252 } // gray.50

const PAGE_WIDTH = 210
const MARGIN = 20
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const setColor = (
  pdf: jsPDF,
  mode: 'text' | 'fill' | 'draw',
  color: { r: number; g: number; b: number }
) => {
  if (mode === 'text') pdf.setTextColor(color.r, color.g, color.b)
  if (mode === 'fill') pdf.setFillColor(color.r, color.g, color.b)
  if (mode === 'draw') pdf.setDrawColor(color.r, color.g, color.b)
}

const getStatusInfo = (status: string) => {
  switch (status.toLowerCase()) {
    case 'settled':
      return { label: 'LUNAS', color: { r: 34, g: 197, b: 94 } }
    case 'overdue':
      return { label: 'TERLAMBAT', color: { r: 239, g: 68, b: 68 } }
    case 'issued':
      return { label: 'DITERBITKAN', color: { r: 59, g: 130, b: 246 } }
    default:
      return { label: 'MENUNGGU', color: { r: 234, g: 179, b: 8 } }
  }
}

export const exportInvoiceToPDF = (invoice: IInvoice) => {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  pdf.setFont('helvetica', 'normal')

  // ---- Header: brand mark + wordmark ----
  setColor(pdf, 'fill', BRAND)
  pdf.roundedRect(MARGIN, 16, 12, 12, 3, 3, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.setTextColor(255, 255, 255)
  pdf.text('B', MARGIN + 4.4, 24.6)

  setColor(pdf, 'text', INK)
  pdf.setFontSize(16)
  pdf.text('Bazaf', MARGIN + 16, 23.5)
  setColor(pdf, 'text', MUTED)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text('Invoice', MARGIN + 16, 28.5)

  // ---- Header: invoice meta (right aligned) ----
  setColor(pdf, 'text', INK)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.text('INVOICE', PAGE_WIDTH - MARGIN, 24, { align: 'right' })

  setColor(pdf, 'text', MUTED)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text(`No. ${invoice.invoiceNumber}`, PAGE_WIDTH - MARGIN, 30, {
    align: 'right'
  })
  pdf.text(
    `Tanggal: ${format(new Date(invoice.issuedDate), 'dd MMM yyyy', { locale: id })}`,
    PAGE_WIDTH - MARGIN,
    35,
    { align: 'right' }
  )
  pdf.text(
    `Jatuh tempo: ${format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: id })}`,
    PAGE_WIDTH - MARGIN,
    40,
    { align: 'right' }
  )

  // ---- Status pill ----
  const status = getStatusInfo(invoice.status)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  const pillWidth = pdf.getTextWidth(status.label) + 8
  const pillX = PAGE_WIDTH - MARGIN - pillWidth
  setColor(pdf, 'fill', status.color)
  pdf.roundedRect(pillX, 44, pillWidth, 7.5, 3.75, 3.75, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.text(status.label, pillX + pillWidth / 2, 49, { align: 'center' })

  // ---- Divider ----
  setColor(pdf, 'draw', LINE)
  pdf.setLineWidth(0.3)
  pdf.line(MARGIN, 58, PAGE_WIDTH - MARGIN, 58)

  // ---- Bill to / Customer ----
  const isPeriod = invoice.type === 'vendor_period'
  const col2X = MARGIN + CONTENT_WIDTH / 2 + 5

  setColor(pdf, 'text', MUTED)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('VENDOR', MARGIN, 67)
  pdf.text(isPeriod ? 'PERIODE' : 'PELANGGAN', col2X, 67)

  setColor(pdf, 'text', INK)
  pdf.setFontSize(11)
  pdf.text(invoice.vendorName || '-', MARGIN, 73)
  const rightTitle =
    isPeriod && invoice.periodStart && invoice.periodEnd
      ? `${format(new Date(invoice.periodStart), 'dd MMM yyyy', { locale: id })} – ${format(new Date(invoice.periodEnd), 'dd MMM yyyy', { locale: id })}`
      : invoice.customer?.name || '-'
  pdf.text(rightTitle, col2X, 73)

  setColor(pdf, 'text', BODY)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text(`ID vendor: ${invoice.vendorId || '-'}`, MARGIN, 78.5)

  let customerY = 78.5
  if (isPeriod) {
    pdf.text(
      `Jumlah order: ${invoice.orderIds?.length || 0}`,
      col2X,
      customerY
    )
    customerY += 5
  } else {
    if (invoice.customer?.phoneNumber) {
      pdf.text(`Telepon: ${invoice.customer.phoneNumber}`, col2X, customerY)
      customerY += 5
    }
    if (invoice.customer?.namaSantri) {
      pdf.text(`Nama santri: ${invoice.customer.namaSantri}`, col2X, customerY)
      customerY += 5
    }
    if (invoice.customer?.kelas) {
      pdf.text(`Kelas: ${invoice.customer.kelas}`, col2X, customerY)
      customerY += 5
    }
  }

  // ---- Items table ----
  let y = Math.max(customerY, 86) + 6
  setColor(pdf, 'fill', SOFT)
  pdf.rect(MARGIN, y - 5, CONTENT_WIDTH, 9, 'F')

  setColor(pdf, 'text', MUTED)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('PRODUK', MARGIN + 3, y)
  pdf.text('QTY', MARGIN + 100, y, { align: 'right' })
  pdf.text('HARGA', MARGIN + 140, y, { align: 'right' })
  pdf.text('TOTAL', PAGE_WIDTH - MARGIN - 3, y, { align: 'right' })

  y += 8
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)

  invoice.items.forEach((item) => {
    if (y > 250) {
      pdf.addPage()
      y = 30
    }

    const name =
      item.productName.length > 45
        ? `${item.productName.substring(0, 45)}...`
        : item.productName

    setColor(pdf, 'text', INK)
    pdf.text(name, MARGIN + 3, y)

    const hasVendorLine = Boolean(item.vendorName)
    if (hasVendorLine) {
      setColor(pdf, 'text', MUTED)
      pdf.setFontSize(7.5)
      pdf.text(item.vendorName as string, MARGIN + 3, y + 3.5)
      pdf.setFontSize(9)
    }

    setColor(pdf, 'text', BODY)
    pdf.text(String(item.quantity), MARGIN + 100, y, { align: 'right' })
    if (item.orderNumber || item.unitPrice === 0) {
      pdf.text('-', MARGIN + 140, y, { align: 'right' })
    } else {
      pdf.text(currency.toIDRFormat(item.unitPrice), MARGIN + 140, y, {
        align: 'right'
      })
    }
    pdf.text(currency.toIDRFormat(item.totalPrice), PAGE_WIDTH - MARGIN - 3, y, {
      align: 'right'
    })

    setColor(pdf, 'draw', LINE)
    pdf.line(MARGIN, y + 3, PAGE_WIDTH - MARGIN, y + 3)
    y += hasVendorLine ? 11 : 8
  })

  // ---- Summary ----
  y += 4
  const boxWidth = 82
  const boxX = PAGE_WIDTH - MARGIN - boxWidth

  setColor(pdf, 'draw', LINE)
  pdf.line(boxX, y - 2, PAGE_WIDTH - MARGIN, y - 2)

  setColor(pdf, 'text', INK)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('Total', boxX, y + 3)
  pdf.text(currency.toIDRFormat(invoice.totalAmount), PAGE_WIDTH - MARGIN, y + 3, {
    align: 'right'
  })
  y += 14

  // ---- Payment note ----
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  if (invoice.settledDate) {
    setColor(pdf, 'text', { r: 34, g: 197, b: 94 })
    pdf.text(
      `Lunas pada ${format(new Date(invoice.settledDate), 'dd MMMM yyyy', { locale: id })}`,
      MARGIN,
      y
    )
  } else if (new Date(invoice.dueDate) < new Date()) {
    setColor(pdf, 'text', { r: 239, g: 68, b: 68 })
    pdf.text('TERLAMBAT - pembayaran segera diperlukan', MARGIN, y)
  } else {
    setColor(pdf, 'text', MUTED)
    pdf.text(
      `Bayar sebelum ${format(new Date(invoice.dueDate), 'dd MMMM yyyy', { locale: id })}`,
      MARGIN,
      y
    )
  }

  // ---- Footer ----
  setColor(pdf, 'draw', LINE)
  pdf.line(MARGIN, 275, PAGE_WIDTH - MARGIN, 275)
  setColor(pdf, 'text', MUTED)
  pdf.setFontSize(8)
  pdf.text('Dibuat oleh Bazaf', MARGIN, 281)
  pdf.text(
    `Dicetak ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`,
    PAGE_WIDTH - MARGIN,
    281,
    { align: 'right' }
  )

  const vendorSuffix = invoice.vendorName
    ? `_${invoice.vendorName.replace(/[^a-zA-Z0-9]/g, '_')}`
    : ''
  const fileName = `Invoice_${invoice.invoiceNumber}${vendorSuffix}.pdf`
  pdf.save(fileName)
}

export const exportInvoicesListToPDF = (
  invoices: IInvoice[],
  filename?: string
) => {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = PAGE_WIDTH

  const renderHeader = () => {
    setColor(pdf, 'fill', BRAND)
    pdf.roundedRect(MARGIN, 16, 10, 10, 2.5, 2.5, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(255, 255, 255)
    pdf.text('B', MARGIN + 3.6, 23)

    setColor(pdf, 'text', INK)
    pdf.setFontSize(15)
    pdf.text('Bazaf', MARGIN + 14, 22)
    setColor(pdf, 'text', MUTED)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text('Daftar Invoice', MARGIN + 14, 27)

    setColor(pdf, 'text', INK)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.text('INVOICE', pageWidth - MARGIN, 22, { align: 'right' })
    setColor(pdf, 'text', MUTED)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(
      `Dicetak ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: id })}`,
      pageWidth - MARGIN,
      27,
      { align: 'right' }
    )

    setColor(pdf, 'draw', LINE)
    pdf.line(MARGIN, 34, pageWidth - MARGIN, 34)
  }

  const renderTableHeader = (y: number) => {
    setColor(pdf, 'fill', SOFT)
    pdf.rect(MARGIN, y - 5, CONTENT_WIDTH, 9, 'F')
    setColor(pdf, 'text', MUTED)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text('NO. INVOICE', MARGIN + 3, y)
    pdf.text('TANGGAL', MARGIN + 45, y)
    pdf.text('VENDOR', MARGIN + 72, y)
    pdf.text('TOTAL', pageWidth - MARGIN - 40, y, { align: 'right' })
    pdf.text('STATUS', pageWidth - MARGIN - 3, y, { align: 'right' })
  }

  renderHeader()
  let y = 44
  renderTableHeader(y)
  y += 8

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)

  invoices.forEach((invoice) => {
    if (y > 270) {
      pdf.addPage()
      renderHeader()
      y = 44
      renderTableHeader(y)
      y += 8
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
    }

    const status = getStatusInfo(invoice.status)
    const vendor =
      invoice.vendorName.length > 18
        ? `${invoice.vendorName.substring(0, 18)}...`
        : invoice.vendorName

    setColor(pdf, 'text', INK)
    pdf.text(invoice.invoiceNumber, MARGIN + 3, y)
    setColor(pdf, 'text', BODY)
    pdf.text(
      format(new Date(invoice.issuedDate), 'dd MMM yyyy', { locale: id }),
      MARGIN + 45,
      y
    )
    pdf.text(vendor, MARGIN + 72, y)
    pdf.text(currency.toIDRFormat(invoice.totalAmount), pageWidth - MARGIN - 40, y, {
      align: 'right'
    })
    setColor(pdf, 'text', status.color)
    pdf.text(status.label, pageWidth - MARGIN - 3, y, { align: 'right' })

    setColor(pdf, 'draw', LINE)
    pdf.line(MARGIN, y + 3, pageWidth - MARGIN, y + 3)
    y += 8
  })

  setColor(pdf, 'draw', LINE)
  pdf.line(MARGIN, 275, pageWidth - MARGIN, 275)
  setColor(pdf, 'text', MUTED)
  pdf.setFontSize(8)
  pdf.text(`Total ${invoices.length} invoice`, MARGIN, 281)
  pdf.text('Dibuat oleh Bazaf', pageWidth - MARGIN, 281, { align: 'right' })

  pdf.save(
    filename ||
      `Invoices_List_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`
  )
}

export const exportReportToPDF = (
  {
    title,
    subtitle,
    summary,
    columns,
    rows
  }: {
    title: string
    subtitle?: string
    summary?: { label: string; value: string }[]
    columns: string[]
    rows: (string | number)[][]
  },
  filename?: string
) => {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })

  setColor(pdf, 'fill', BRAND)
  pdf.roundedRect(MARGIN, 16, 10, 10, 2.5, 2.5, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(255, 255, 255)
  pdf.text('B', MARGIN + 3.6, 23)

  setColor(pdf, 'text', INK)
  pdf.setFontSize(15)
  pdf.text('Bazaf', MARGIN + 14, 22)
  setColor(pdf, 'text', MUTED)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text('Laporan penjualan', MARGIN + 14, 27)

  setColor(pdf, 'text', INK)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text(title, PAGE_WIDTH - MARGIN, 22, { align: 'right' })
  if (subtitle) {
    setColor(pdf, 'text', MUTED)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(subtitle, PAGE_WIDTH - MARGIN, 27, { align: 'right' })
  }

  setColor(pdf, 'draw', LINE)
  pdf.line(MARGIN, 34, PAGE_WIDTH - MARGIN, 34)

  let y = 44

  if (summary?.length) {
    for (const item of summary) {
      setColor(pdf, 'text', BODY)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.text(item.label, MARGIN, y)
      setColor(pdf, 'text', INK)
      pdf.setFont('helvetica', 'bold')
      pdf.text(item.value, PAGE_WIDTH - MARGIN, y, { align: 'right' })
      y += 6
    }
    setColor(pdf, 'draw', LINE)
    pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
    y += 8
  }

  const colCount = columns.length
  const colWidth = CONTENT_WIDTH / colCount

  const renderTableHeader = () => {
    setColor(pdf, 'fill', SOFT)
    pdf.rect(MARGIN, y - 5, CONTENT_WIDTH, 9, 'F')
    setColor(pdf, 'text', MUTED)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    columns.forEach((col, i) => {
      if (i === 0) {
        pdf.text(String(col).toUpperCase(), MARGIN + 3, y)
      } else {
        pdf.text(String(col).toUpperCase(), MARGIN + colWidth * (i + 1) - 3, y, {
          align: 'right'
        })
      }
    })
    y += 8
  }

  renderTableHeader()
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)

  for (const row of rows) {
    if (y > 272) {
      pdf.addPage()
      y = 30
      renderTableHeader()
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
    }
    row.forEach((cell, i) => {
      const value = String(cell)
      setColor(pdf, 'text', i === 0 ? INK : BODY)
      if (i === 0) {
        const max = Math.floor(colWidth / 1.7)
        pdf.text(
          value.length > max ? `${value.slice(0, max)}...` : value,
          MARGIN + 3,
          y
        )
      } else {
        pdf.text(value, MARGIN + colWidth * (i + 1) - 3, y, { align: 'right' })
      }
    })
    setColor(pdf, 'draw', LINE)
    pdf.line(MARGIN, y + 3, PAGE_WIDTH - MARGIN, y + 3)
    y += 8
  }

  setColor(pdf, 'draw', LINE)
  pdf.line(MARGIN, 275, PAGE_WIDTH - MARGIN, 275)
  setColor(pdf, 'text', MUTED)
  pdf.setFontSize(8)
  pdf.text('Dibuat oleh Bazaf', MARGIN, 281)
  pdf.text(
    `Dicetak ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: id })}`,
    PAGE_WIDTH - MARGIN,
    281,
    { align: 'right' }
  )

  pdf.save(filename || `Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`)
}

interface StockChecklistRow {
  productId: string
  productName: string
  sku: string
  unit: string
  systemStock: number
  countedStock?: number | null
  difference?: number | null
  note?: string
}

export const exportStockChecklistToPDF = (
  items: StockChecklistRow[],
  options?: { title?: string; subtitle?: string; fileName?: string }
) => {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  const pageWidth = 297
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  const renderHeader = () => {
    setColor(pdf, 'fill', BRAND)
    pdf.roundedRect(margin, 12, 10, 10, 2.5, 2.5, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(255, 255, 255)
    pdf.text('B', margin + 3.6, 19)

    setColor(pdf, 'text', INK)
    pdf.setFontSize(15)
    pdf.text('Bazaf', margin + 14, 18)
    setColor(pdf, 'text', MUTED)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text('Checklist stok fisik', margin + 14, 23)

    setColor(pdf, 'text', INK)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.text(options?.title || 'Checklist Stok', pageWidth - margin, 18, {
      align: 'right'
    })
    setColor(pdf, 'text', MUTED)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(options?.subtitle || '', pageWidth - margin, 23, {
      align: 'right'
    })

    setColor(pdf, 'draw', LINE)
    pdf.line(margin, 29, pageWidth - margin, 29)
  }

  const cols = {
    no: margin + 2,
    sku: margin + 10,
    name: margin + 45,
    unit: margin + 135,
    system: margin + 175,
    counted: margin + 205,
    difference: margin + 232,
    note: margin + 240
  }

  const renderTableHeader = (y: number) => {
    setColor(pdf, 'fill', SOFT)
    pdf.rect(margin, y - 5, contentWidth, 8, 'F')
    setColor(pdf, 'text', MUTED)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text('NO', cols.no, y)
    pdf.text('SKU', cols.sku, y)
    pdf.text('NAMA PRODUK', cols.name, y)
    pdf.text('SATUAN', cols.unit, y)
    pdf.text('STOK SISTEM', cols.system, y, { align: 'right' })
    pdf.text('STOK FISIK', cols.counted, y, { align: 'right' })
    pdf.text('SELISIH', cols.difference, y, { align: 'right' })
    pdf.text('CATATAN', cols.note, y)
  }

  renderHeader()
  let y = 38
  renderTableHeader(y)
  y += 7

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)

  items.forEach((item, index) => {
    if (y > 195) {
      pdf.addPage()
      renderHeader()
      y = 38
      renderTableHeader(y)
      y += 7
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
    }

    const name =
      item.productName.length > 48
        ? `${item.productName.substring(0, 48)}...`
        : item.productName
    const note = (item.note || '').length > 22
      ? `${(item.note || '').substring(0, 22)}...`
      : item.note || ''

    setColor(pdf, 'text', BODY)
    pdf.text(String(index + 1), cols.no, y)
    pdf.text(item.sku || '-', cols.sku, y)
    setColor(pdf, 'text', INK)
    pdf.text(name, cols.name, y)
    setColor(pdf, 'text', BODY)
    pdf.text(item.unit || '-', cols.unit, y)
    pdf.text(String(item.systemStock), cols.system, y, { align: 'right' })
    pdf.text(
      item.countedStock === null || item.countedStock === undefined
        ? ''
        : String(item.countedStock),
      cols.counted,
      y,
      { align: 'right' }
    )
    pdf.text(
      item.difference === null || item.difference === undefined
        ? ''
        : String(item.difference),
      cols.difference,
      y,
      { align: 'right' }
    )
    pdf.text(note, cols.note, y)

    setColor(pdf, 'draw', LINE)
    pdf.line(margin, y + 3, pageWidth - margin, y + 3)
    y += 7
  })

  setColor(pdf, 'draw', LINE)
  pdf.line(margin, 202, pageWidth - margin, 202)
  setColor(pdf, 'text', MUTED)
  pdf.setFontSize(8)
  pdf.text(`Total ${items.length} produk`, margin, 207)
  pdf.text(
    `Dicetak ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: id })}`,
    pageWidth - margin,
    207,
    { align: 'right' }
  )

  pdf.save(
    options?.fileName ||
      `Checklist_Stok_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`
  )
}
