import { IOrder } from '@/interfaces'

export interface ReportTotals {
  orderCount: number
  qty: number
  omset: number
  hpp: number
  labaKotor: number
}

export interface ReportRow {
  key: string
  name: string
  qty: number
  omset: number
  hpp: number
  labaKotor: number
}

const emptyTotals = (): ReportTotals => ({
  orderCount: 0,
  qty: 0,
  omset: 0,
  hpp: 0,
  labaKotor: 0
})

/**
 * Aggregate sales metrics from orders.
 *
 * - omset      = Σ (price × qty)          gross sales
 * - hpp        = Σ (priceBase × qty)      cost of goods
 * - labaKotor  = omset − hpp              gross margin
 *
 * Cancelled orders are excluded. Pass `vendorId` to scope to one vendor.
 */
export const buildReport = (
  orders: IOrder.IOrder[],
  options?: { vendorId?: string }
) => {
  const vendorId = options?.vendorId
  const totals = emptyTotals()
  const vendorMap = new Map<string, ReportRow>()
  const productMap = new Map<string, ReportRow>()

  const relevant = (orders || []).filter(
    (order) => order.status !== 'Cancelled'
  )

  for (const order of relevant) {
    let orderIncluded = false

    for (const po of order.productOrders || []) {
      const product = po.product
      const itemVendor = product?.vendor
      const vId = itemVendor?.id || order.vendors?.[0]?.id || 'tanpa-vendor'
      if (vendorId && vId !== vendorId) continue
      const vName =
        itemVendor?.name || order.vendors?.[0]?.name || 'Tanpa vendor'

      const qty = po.quantity || 0
      const price = product?.price || 0
      const priceBase = product?.priceBase || 0
      const omset = qty * price
      const hpp = qty * priceBase
      const labaKotor = omset - hpp

      totals.qty += qty
      totals.omset += omset
      totals.hpp += hpp
      totals.labaKotor += labaKotor
      orderIncluded = true

      const v =
        vendorMap.get(vId) ||
        ({
          key: vId,
          name: vName,
          qty: 0,
          omset: 0,
          hpp: 0,
          labaKotor: 0
        } as ReportRow)
      v.qty += qty
      v.omset += omset
      v.hpp += hpp
      v.labaKotor += labaKotor
      vendorMap.set(vId, v)

      const pId = product?.id || po.productId || 'unknown'
      const p =
        productMap.get(pId) ||
        ({
          key: pId,
          name: product?.name || '-',
          qty: 0,
          omset: 0,
          hpp: 0,
          labaKotor: 0
        } as ReportRow)
      p.qty += qty
      p.omset += omset
      p.hpp += hpp
      p.labaKotor += labaKotor
      productMap.set(pId, p)
    }

    if (orderIncluded) totals.orderCount += 1
  }

  return {
    totals,
    byVendor: Array.from(vendorMap.values()).sort((a, b) => b.omset - a.omset),
    byProduct: Array.from(productMap.values()).sort((a, b) => b.omset - a.omset)
  }
}
