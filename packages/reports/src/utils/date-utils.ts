import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, format, subDays, subWeeks, subMonths, subYears } from 'date-fns'

export class DateUtils {
  /**
   * Get start and end dates for common periods
   */
  static getPeriodDates(period: string, referenceDate: Date = new Date()): { from: string; to: string } {
    let fromDate: Date
    let toDate: Date

    switch (period.toLowerCase()) {
      case 'today':
        fromDate = startOfDay(referenceDate)
        toDate = endOfDay(referenceDate)
        break

      case 'yesterday':
        const yesterday = subDays(referenceDate, 1)
        fromDate = startOfDay(yesterday)
        toDate = endOfDay(yesterday)
        break

      case 'this_week':
        fromDate = startOfWeek(referenceDate, { weekStartsOn: 1 }) // Monday
        toDate = endOfWeek(referenceDate, { weekStartsOn: 1 })
        break

      case 'last_week':
        const lastWeek = subWeeks(referenceDate, 1)
        fromDate = startOfWeek(lastWeek, { weekStartsOn: 1 })
        toDate = endOfWeek(lastWeek, { weekStartsOn: 1 })
        break

      case 'this_month':
        fromDate = startOfMonth(referenceDate)
        toDate = endOfMonth(referenceDate)
        break

      case 'last_month':
        const lastMonth = subMonths(referenceDate, 1)
        fromDate = startOfMonth(lastMonth)
        toDate = endOfMonth(lastMonth)
        break

      case 'this_year':
        fromDate = startOfYear(referenceDate)
        toDate = endOfYear(referenceDate)
        break

      case 'last_year':
        const lastYear = subYears(referenceDate, 1)
        fromDate = startOfYear(lastYear)
        toDate = endOfYear(lastYear)
        break

      case 'last_7_days':
        fromDate = subDays(referenceDate, 7)
        toDate = referenceDate
        break

      case 'last_30_days':
        fromDate = subDays(referenceDate, 30)
        toDate = referenceDate
        break

      case 'last_90_days':
        fromDate = subDays(referenceDate, 90)
        toDate = referenceDate
        break

      case 'last_365_days':
        fromDate = subDays(referenceDate, 365)
        toDate = referenceDate
        break

      default:
        // Default to last 30 days
        fromDate = subDays(referenceDate, 30)
        toDate = referenceDate
    }

    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    }
  }

  /**
   * Generate date ranges for time series data
   */
  static generateDateRanges(
    fromDate: string,
    toDate: string,
    groupBy: 'day' | 'week' | 'month' | 'year'
  ): Array<{ from: string; to: string; label: string }> {
    const ranges: Array<{ from: string; to: string; label: string }> = []
    const startDate = parseISO(fromDate)
    const endDate = parseISO(toDate)

    let currentDate = startDate

    while (currentDate <= endDate) {
      let periodStart: Date
      let periodEnd: Date
      let label: string

      switch (groupBy) {
        case 'day':
          periodStart = startOfDay(currentDate)
          periodEnd = endOfDay(currentDate)
          label = format(currentDate, 'yyyy-MM-dd')
          currentDate = subDays(currentDate, -1) // Move to next day
          break

        case 'week':
          periodStart = startOfWeek(currentDate, { weekStartsOn: 1 })
          periodEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
          label = `${format(periodStart, 'yyyy-MM-dd')} - ${format(periodEnd, 'yyyy-MM-dd')}`
          currentDate = subWeeks(currentDate, -1) // Move to next week
          break

        case 'month':
          periodStart = startOfMonth(currentDate)
          periodEnd = endOfMonth(currentDate)
          label = format(currentDate, 'yyyy-MM')
          currentDate = subMonths(currentDate, -1) // Move to next month
          break

        case 'year':
          periodStart = startOfYear(currentDate)
          periodEnd = endOfYear(currentDate)
          label = format(currentDate, 'yyyy')
          currentDate = subYears(currentDate, -1) // Move to next year
          break

        default:
          throw new Error(`Unsupported groupBy value: ${groupBy}`)
      }

      ranges.push({
        from: periodStart.toISOString(),
        to: periodEnd.toISOString(),
        label,
      })

      // Prevent infinite loop
      if (ranges.length > 1000) {
        break
      }
    }

    return ranges
  }

  /**
   * Format date for display
   */
  static formatDate(date: string | Date, formatString: string = 'dd/MM/yyyy'): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, formatString)
  }

  /**
   * Get relative time periods
   */
  static getRelativePeriods(): Array<{ value: string; label: string }> {
    return [
      { value: 'today', label: 'Today' },
      { value: 'yesterday', label: 'Yesterday' },
      { value: 'this_week', label: 'This Week' },
      { value: 'last_week', label: 'Last Week' },
      { value: 'this_month', label: 'This Month' },
      { value: 'last_month', label: 'Last Month' },
      { value: 'this_year', label: 'This Year' },
      { value: 'last_year', label: 'Last Year' },
      { value: 'last_7_days', label: 'Last 7 Days' },
      { value: 'last_30_days', label: 'Last 30 Days' },
      { value: 'last_90_days', label: 'Last 90 Days' },
      { value: 'last_365_days', label: 'Last 365 Days' },
    ]
  }

  /**
   * Validate date range
   */
  static validateDateRange(fromDate: string, toDate: string): { valid: boolean; error?: string } {
    try {
      const from = parseISO(fromDate)
      const to = parseISO(toDate)

      if (from > to) {
        return { valid: false, error: 'From date must be before or equal to to date' }
      }

      // Check if date range is too large (more than 2 years)
      const daysDiff = Math.abs((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 730) {
        return { valid: false, error: 'Date range cannot exceed 2 years' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, error: 'Invalid date format' }
    }
  }

  /**
   * Get timezone offset
   */
  static getTimezoneOffset(timezone?: string): number {
    if (!timezone) {
      return new Date().getTimezoneOffset()
    }

    try {
      const date = new Date()
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
      const targetTime = new Date(utc + this.getTimezoneOffsetMinutes(timezone) * 60000)
      return targetTime.getTimezoneOffset()
    } catch {
      return new Date().getTimezoneOffset()
    }
  }

  /**
   * Get timezone offset in minutes
   */
  private static getTimezoneOffsetMinutes(timezone: string): number {
    const timezoneOffsets: Record<string, number> = {
      'Asia/Jakarta': 420, // UTC+7
      'Asia/Makassar': 480, // UTC+8
      'Asia/Jayapura': 540, // UTC+9
      'UTC': 0,
    }

    return timezoneOffsets[timezone] || 0
  }
}