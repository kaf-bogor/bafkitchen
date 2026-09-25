import { IProductDiscount } from '@/interfaces/discount'

import { toIDRFormat } from './currency'

export const jakartaToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(
    new Date()
  )

export const isDiscountActive = (
  discount: IProductDiscount,
  today: string = jakartaToday()
) => {
  if (!discount.isActive) return false
  if (discount.startDate && today < discount.startDate) return false
  if (discount.endDate && today > discount.endDate) return false
  return true
}

export const discountedUnitPrice = (
  price: number,
  discount: IProductDiscount
) => {
  if (discount.type === 'percentage') {
    const pct = Math.min(Math.max(discount.value, 0), 100)
    return Math.max(0, Math.round(price * (1 - pct / 100)))
  }
  return Math.max(0, Math.round(price - Math.max(discount.value, 0)))
}

export interface ILinePricing {
  discount: IProductDiscount | null
  unitPrice: number
  lineTotal: number
  amount: number
}

export const getLinePricing = (
  price: number,
  quantity: number,
  discounts?: IProductDiscount[] | null,
  today: string = jakartaToday()
): ILinePricing => {
  const qty = quantity || 0
  const applicable = (discounts || []).filter(
    (d) => isDiscountActive(d, today) && qty >= Math.max(d.minQuantity || 1, 1)
  )

  let best: ILinePricing | null = null
  for (const discount of applicable) {
    const unitPrice = discountedUnitPrice(price, discount)
    const amount = (price - unitPrice) * qty
    if (!best || amount > best.amount) {
      best = { discount, unitPrice, lineTotal: unitPrice * qty, amount }
    }
  }

  return (
    best || {
      discount: null,
      unitPrice: price,
      lineTotal: price * qty,
      amount: 0
    }
  )
}

export const getActiveDiscounts = (
  discounts?: IProductDiscount[] | null,
  today: string = jakartaToday()
) => (discounts || []).filter((d) => isDiscountActive(d, today))

export const getTeaserDiscount = (
  discounts?: IProductDiscount[] | null,
  today: string = jakartaToday()
) => {
  const active = getActiveDiscounts(discounts, today)
  if (!active.length) return null
  return active.reduce((best, d) =>
    (d.minQuantity || 1) < (best.minQuantity || 1) ? d : best
  )
}

export const discountLabel = (discount: IProductDiscount) =>
  discount.type === 'percentage'
    ? `-${discount.value}%`
    : `-${toIDRFormat(discount.value)}`
