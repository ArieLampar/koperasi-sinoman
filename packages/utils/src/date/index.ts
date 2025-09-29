/**
 * Date utilities with Indonesian localization using date-fns
 */

import {
  format,
  parseISO,
  isValid,
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  addMonths,
  addYears,
  startOfDay,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfMonth,
  endOfYear,
  isBefore,
  isAfter,
  isSameDay,
  isSameMonth,
  isSameYear,
  isWeekend,
  getDay,
} from 'date-fns'
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz'
import { id } from 'date-fns/locale'

// Indonesian timezone
export const INDONESIA_TIMEZONE = 'Asia/Jakarta'

// Common date formats
export const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  DISPLAY: 'dd MMMM yyyy',
  DISPLAY_SHORT: 'dd MMM yyyy',
  DISPLAY_WITH_DAY: 'EEEE, dd MMMM yyyy',
  TIME: 'HH:mm',
  TIME_WITH_SECONDS: 'HH:mm:ss',
  DATETIME: 'dd MMMM yyyy HH:mm',
  DATETIME_SHORT: 'dd/MM/yyyy HH:mm',
} as const

// Format date with Indonesian locale
export function formatDate(
  date: Date | string,
  formatStr: string = DATE_FORMATS.DISPLAY,
  options: { timezone?: string } = {}
): string {
  const { timezone = INDONESIA_TIMEZONE } = options

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''

    if (timezone) {
      return formatInTimeZone(dateObj, timezone, formatStr, { locale: id })
    }

    return format(dateObj, formatStr, { locale: id })
  } catch {
    return ''
  }
}

// Parse date string to Date object
export function parseDate(dateString: string, timezone?: string): Date | null {
  try {
    const parsed = parseISO(dateString)
    if (!isValid(parsed)) return null

    if (timezone) {
      return zonedTimeToUtc(parsed, timezone)
    }

    return parsed
  } catch {
    return null
  }
}

// Get relative time in Indonesian
export function getRelativeTime(date: Date | string, baseDate: Date = new Date()): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''

    const diffMinutes = differenceInMinutes(baseDate, dateObj)
    const diffHours = differenceInHours(baseDate, dateObj)
    const diffDays = differenceInDays(baseDate, dateObj)

    if (diffMinutes < 1) {
      return 'baru saja'
    } else if (diffMinutes < 60) {
      return `${diffMinutes} menit yang lalu`
    } else if (diffHours < 24) {
      return `${diffHours} jam yang lalu`
    } else if (diffDays === 1) {
      return 'kemarin'
    } else if (diffDays < 7) {
      return `${diffDays} hari yang lalu`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} minggu yang lalu`
    } else if (diffDays < 365) {
      const months = differenceInMonths(baseDate, dateObj)
      return `${months} bulan yang lalu`
    } else {
      const years = differenceInYears(baseDate, dateObj)
      return `${years} tahun yang lalu`
    }
  } catch {
    return ''
  }
}

// Calculate age from birth date
export function calculateAge(birthDate: Date | string): number {
  try {
    const dateObj = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate
    if (!isValid(dateObj)) return 0

    return differenceInYears(new Date(), dateObj)
  } catch {
    return 0
  }
}

// Check if date is valid
export function isValidDate(date: Date | string): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj)
  } catch {
    return false
  }
}

// Get Indonesian day name
export function getDayName(date: Date | string, short: boolean = false): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''

    const formatStr = short ? 'EEE' : 'EEEE'
    return format(dateObj, formatStr, { locale: id })
  } catch {
    return ''
  }
}

// Get Indonesian month name
export function getMonthName(date: Date | string, short: boolean = false): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''

    const formatStr = short ? 'MMM' : 'MMMM'
    return format(dateObj, formatStr, { locale: id })
  } catch {
    return ''
  }
}

// Business days utilities
export function isBusinessDay(date: Date | string): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return false

    return !isWeekend(dateObj)
  } catch {
    return false
  }
}

export function addBusinessDays(date: Date | string, days: number): Date | null {
  try {
    let dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return null

    let addedDays = 0
    const increment = days > 0 ? 1 : -1

    while (addedDays !== Math.abs(days)) {
      dateObj = addDays(dateObj, increment)
      if (isBusinessDay(dateObj)) {
        addedDays++
      }
    }

    return dateObj
  } catch {
    return null
  }
}

// Date range utilities
export interface DateRange {
  start: Date
  end: Date
}

export function isDateInRange(date: Date | string, range: DateRange): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return false

    return !isBefore(dateObj, range.start) && !isAfter(dateObj, range.end)
  } catch {
    return false
  }
}

export function getDateRangeOverlap(range1: DateRange, range2: DateRange): DateRange | null {
  const start = isAfter(range1.start, range2.start) ? range1.start : range2.start
  const end = isBefore(range1.end, range2.end) ? range1.end : range2.end

  if (isBefore(end, start)) return null

  return { start, end }
}

// Period utilities
export function getThisMonth(): DateRange {
  const now = new Date()
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  }
}

export function getThisYear(): DateRange {
  const now = new Date()
  return {
    start: startOfYear(now),
    end: endOfYear(now),
  }
}

export function getLastMonth(): DateRange {
  const lastMonth = addMonths(new Date(), -1)
  return {
    start: startOfMonth(lastMonth),
    end: endOfMonth(lastMonth),
  }
}

export function getLastYear(): DateRange {
  const lastYear = addYears(new Date(), -1)
  return {
    start: startOfYear(lastYear),
    end: endOfYear(lastYear),
  }
}

// Date comparison utilities
export function isSamePeriod(
  date1: Date | string,
  date2: Date | string,
  period: 'day' | 'month' | 'year'
): boolean {
  try {
    const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1
    const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2

    if (!isValid(dateObj1) || !isValid(dateObj2)) return false

    switch (period) {
      case 'day':
        return isSameDay(dateObj1, dateObj2)
      case 'month':
        return isSameMonth(dateObj1, dateObj2)
      case 'year':
        return isSameYear(dateObj1, dateObj2)
      default:
        return false
    }
  } catch {
    return false
  }
}

// Indonesian holiday checker (basic implementation)
export function isIndonesianHoliday(date: Date | string): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return false

    const month = dateObj.getMonth() + 1
    const day = dateObj.getDate()

    // Fixed holidays
    const fixedHolidays = [
      { month: 1, day: 1 },   // New Year
      { month: 8, day: 17 },  // Independence Day
      { month: 12, day: 25 }, // Christmas
    ]

    return fixedHolidays.some(holiday => holiday.month === month && holiday.day === day)
  } catch {
    return false
  }
}

// Time zone utilities
export function convertToIndonesianTime(date: Date | string): Date {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return new Date()

    return zonedTimeToUtc(dateObj, INDONESIA_TIMEZONE)
  } catch {
    return new Date()
  }
}

// Date generation utilities
export function generateDateRange(start: Date | string, end: Date | string): Date[] {
  try {
    const startDate = typeof start === 'string' ? parseISO(start) : start
    const endDate = typeof end === 'string' ? parseISO(end) : end

    if (!isValid(startDate) || !isValid(endDate)) return []

    const dates: Date[] = []
    let currentDate = startOfDay(startDate)
    const lastDate = startOfDay(endDate)

    while (!isAfter(currentDate, lastDate)) {
      dates.push(new Date(currentDate))
      currentDate = addDays(currentDate, 1)
    }

    return dates
  } catch {
    return []
  }
}

// Fiscal year utilities (assuming April-March fiscal year)
export function getFiscalYear(date: Date | string = new Date()): number {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return new Date().getFullYear()

    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() + 1

    return month >= 4 ? year : year - 1
  } catch {
    return new Date().getFullYear()
  }
}

export function getFiscalYearRange(fiscalYear: number): DateRange {
  return {
    start: new Date(fiscalYear, 3, 1), // April 1st
    end: new Date(fiscalYear + 1, 2, 31, 23, 59, 59, 999), // March 31st
  }
}