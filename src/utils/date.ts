import { addDays, format } from 'date-fns'
import { id } from 'date-fns/locale'

export const getDaysOfWeek = (startDate: Date) => {
  return Array.from({ length: 7 }, (_, i) => addDays(startDate, i))
}

export const formatDate = (date: Date) => {
  return format(date, 'EEEE, d MMMM', { locale: id }).replace(/minggu/i, 'Ahad')
}

export const formatShortDate = (date: string | Date) => {
  return format(new Date(date), 'd MMM yyyy', { locale: id })
}

export const formatDateRange = (start: string, end: string) => {
  return `${formatShortDate(start)} - ${formatShortDate(end)}`
}
