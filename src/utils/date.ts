import { addDays, format, isSameDay } from 'date-fns'
import { id } from 'date-fns/locale'

import { ISchedule } from '@/interfaces'

export const getDaysOfWeek = (startDate: Date) => {
  return Array.from({ length: 7 }, (_, i) => addDays(startDate, i))
}

export const formatDate = (date: Date) => {
  return format(date, 'EEEE, d MMMM', { locale: id }).replace(/minggu/i, 'Ahad')
}

export const getScheduleForDay = (
  day: Date,
  schedules: ISchedule.ISchedule[]
) => {
  const filtered = schedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.date);
    const result = isSameDay(scheduleDate, day);
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Schedule filtering debug:', {
        dayString: day.toDateString(),
        scheduleId: schedule.id,
        scheduleDateString: scheduleDate.toDateString(),
        scheduleDate: schedule.date,
        isSame: result
      });
    }
    
    return result;
  });
  
  return filtered;
}
