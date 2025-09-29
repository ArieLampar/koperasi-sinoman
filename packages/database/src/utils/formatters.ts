/**
 * Database formatting utilities
 */

/**
 * Format Indonesian Rupiah currency
 */
export function formatCurrency(amount: number, includeSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  return includeSymbol ? formatted : formatted.replace('Rp', '').trim()
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d]/g, '')
  return parseInt(cleaned) || 0
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')

  // Convert to international format if starts with 0
  let formatted = digits.startsWith('0') ? '62' + digits.slice(1) : digits

  // Add country code if not present
  if (!formatted.startsWith('62')) {
    formatted = '62' + formatted
  }

  // Format as +62 XXX-XXXX-XXXX
  if (formatted.length >= 11) {
    return `+${formatted.slice(0, 2)} ${formatted.slice(2, 5)}-${formatted.slice(5, 9)}-${formatted.slice(9)}`
  }

  return `+${formatted}`
}

/**
 * Format NIK for display (mask middle digits)
 */
export function formatNIK(nik: string, mask: boolean = true): string {
  if (!mask || nik.length !== 16) {
    return nik
  }

  // Show first 4 and last 4 digits, mask the middle
  return `${nik.slice(0, 4)}****${nik.slice(-4)}`
}

/**
 * Format member number
 */
export function formatMemberNumber(memberNumber: string): string {
  // Already formatted: SIN-YYYY-XXXXXX
  return memberNumber
}

/**
 * Generate member number
 */
export function generateMemberNumber(year?: number): string {
  const currentYear = year || new Date().getFullYear()
  const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `SIN-${currentYear}-${randomSuffix}`
}

/**
 * Generate account number
 */
export function generateAccountNumber(type: 'SA' | 'LA' = 'SA'): string {
  const year = new Date().getFullYear()
  const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `${type}-${year}-${randomSuffix}`
}

/**
 * Generate referral code
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate transaction reference number
 */
export function generateTransactionReference(prefix: string = 'TXN'): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Format date for Indonesian locale
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'full' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
  }

  switch (format) {
    case 'short':
      options.day = '2-digit'
      options.month = '2-digit'
      options.year = 'numeric'
      break
    case 'long':
      options.day = 'numeric'
      options.month = 'long'
      options.year = 'numeric'
      break
    case 'full':
      options.weekday = 'long'
      options.day = 'numeric'
      options.month = 'long'
      options.year = 'numeric'
      break
  }

  return new Intl.DateTimeFormat('id-ID', options).format(dateObj)
}

/**
 * Format datetime for Indonesian locale
 */
export function formatDateTime(datetime: string | Date): string {
  const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(dateObj)
}

/**
 * Format time for Indonesian locale
 */
export function formatTime(time: string | Date): string {
  const dateObj = typeof time === 'string' ? new Date(time) : time

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Format address for display
 */
export function formatAddress(address: {
  address?: string
  village?: string
  district?: string
  city?: string
  province?: string
  postal_code?: string
}): string {
  const parts = [
    address.address,
    address.village,
    address.district,
    address.city,
    address.province,
    address.postal_code,
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * Format bank account number
 */
export function formatBankAccount(accountNumber: string, bankCode?: string): string {
  // Remove any existing formatting
  const clean = accountNumber.replace(/[\s\-]/g, '')

  // Apply bank-specific formatting
  switch (bankCode?.toUpperCase()) {
    case 'BCA':
      // BCA: XXX-XX-XXXXX
      return clean.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
    case 'BNI':
      // BNI: XXXX-XXXX-XX
      return clean.replace(/(\d{4})(\d{4})(\d{2})/, '$1-$2-$3')
    case 'BRI':
      // BRI: XXXX-XX-XXXXXXX-X
      return clean.replace(/(\d{4})(\d{2})(\d{7})(\d{1})/, '$1-$2-$3-$4')
    case 'MANDIRI':
      // Mandiri: XXX-XX-XXXXXXXX
      return clean.replace(/(\d{3})(\d{2})(\d{8})/, '$1-$2-$3')
    default:
      // Default formatting: groups of 4
      return clean.replace(/(\d{4})(?=\d)/g, '$1-')
  }
}

/**
 * Mask sensitive data
 */
export function maskData(value: string, type: 'email' | 'phone' | 'account' | 'nik' = 'account'): string {
  switch (type) {
    case 'email':
      const [local, domain] = value.split('@')
      if (local.length <= 2) return value
      return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`

    case 'phone':
      if (value.length <= 4) return value
      return `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`

    case 'account':
      if (value.length <= 4) return value
      return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`

    case 'nik':
      return formatNIK(value, true)

    default:
      return value
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Convert to slug (URL-friendly string)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Format duration in milliseconds to human readable
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} hari`
  if (hours > 0) return `${hours} jam`
  if (minutes > 0) return `${minutes} menit`
  return `${seconds} detik`
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()

  const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)

  if (years > 0) return rtf.format(-years, 'year')
  if (months > 0) return rtf.format(-months, 'month')
  if (days > 0) return rtf.format(-days, 'day')
  if (hours > 0) return rtf.format(-hours, 'hour')
  if (minutes > 0) return rtf.format(-minutes, 'minute')
  return rtf.format(-seconds, 'second')
}