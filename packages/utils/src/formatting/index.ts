/**
 * Formatting utilities with Indonesian localization
 */

// Currency formatting (Indonesian Rupiah)
export function formatCurrency(
  amount: number,
  options: {
    showSymbol?: boolean
    showDecimals?: boolean
    locale?: string
  } = {}
): string {
  const {
    showSymbol = true,
    showDecimals = false,
    locale = 'id-ID'
  } = options

  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'IDR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })

  return formatter.format(amount)
}

// Number formatting with Indonesian locale
export function formatNumber(
  number: number,
  options: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    locale?: string
  } = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    locale = 'id-ID'
  } = options

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  })

  return formatter.format(number)
}

// Percentage formatting
export function formatPercentage(
  value: number,
  options: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    locale?: string
  } = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    locale = 'id-ID'
  } = options

  const formatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  })

  return formatter.format(value / 100)
}

// NIK formatting
export function formatNIK(nik: string): string {
  if (!nik) return ''

  const cleanNik = nik.replace(/\D/g, '')
  if (cleanNik.length !== 16) return nik

  return cleanNik.replace(/(\d{2})(\d{2})(\d{2})(\d{6})(\d{4})/, '$1.$2.$3.$4.$5')
}

// NPWP formatting
export function formatNPWP(npwp: string): string {
  if (!npwp) return ''

  const cleanNpwp = npwp.replace(/\D/g, '')
  if (cleanNpwp.length !== 15) return npwp

  return cleanNpwp.replace(/(\d{2})(\d{3})(\d{3})(\d{1})(\d{3})(\d{3})/, '$1.$2.$3.$4-$5.$6')
}

// Phone number formatting
export function formatPhoneNumber(phone: string, format: 'international' | 'national' | 'clean' = 'national'): string {
  if (!phone) return ''

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')

  // Handle different input formats
  let normalizedPhone = cleanPhone

  // If starts with 62, it's already international format
  if (cleanPhone.startsWith('62')) {
    normalizedPhone = cleanPhone
  }
  // If starts with 0, replace with 62
  else if (cleanPhone.startsWith('0')) {
    normalizedPhone = '62' + cleanPhone.substring(1)
  }
  // If starts with 8, add 62
  else if (cleanPhone.startsWith('8')) {
    normalizedPhone = '62' + cleanPhone
  }

  switch (format) {
    case 'international':
      return `+${normalizedPhone}`
    case 'national':
      if (normalizedPhone.startsWith('62')) {
        const nationalNumber = '0' + normalizedPhone.substring(2)
        // Format as 0xxx-xxxx-xxxx
        return nationalNumber.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')
      }
      return phone
    case 'clean':
      return normalizedPhone
    default:
      return phone
  }
}

// Bank account number formatting
export function formatBankAccount(accountNumber: string): string {
  if (!accountNumber) return ''

  const cleanAccount = accountNumber.replace(/\D/g, '')

  // Format in groups of 4 digits
  return cleanAccount.replace(/(\d{4})(?=\d)/g, '$1-')
}

// Credit card number formatting
export function formatCreditCard(cardNumber: string): string {
  if (!cardNumber) return ''

  const cleanCard = cardNumber.replace(/\D/g, '')

  // Format in groups of 4 digits
  return cleanCard.replace(/(\d{4})(?=\d)/g, '$1 ')
}

// Address formatting for Indonesian addresses
export interface IndonesianAddress {
  street?: string
  village?: string
  district?: string
  city?: string
  province?: string
  postalCode?: string
}

export function formatAddress(address: IndonesianAddress): string {
  const parts: string[] = []

  if (address.street) parts.push(address.street)
  if (address.village) parts.push(`Kel. ${address.village}`)
  if (address.district) parts.push(`Kec. ${address.district}`)
  if (address.city) parts.push(address.city)
  if (address.province) parts.push(address.province)
  if (address.postalCode) parts.push(address.postalCode)

  return parts.join(', ')
}

// Name formatting (capitalize each word)
export function formatName(name: string): string {
  if (!name) return ''

  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}

// Duration formatting (in Indonesian)
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours} jam`)
  }
  if (minutes > 0) {
    parts.push(`${minutes} menit`)
  }
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds} detik`)
  }

  return parts.join(' ')
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text

  return text.substring(0, maxLength - suffix.length) + suffix
}

// Mask sensitive data
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email

  const [username, domain] = email.split('@')
  if (username.length <= 2) return email

  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
  return `${maskedUsername}@${domain}`
}

export function maskPhoneNumber(phone: string): string {
  if (!phone) return ''

  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length < 4) return phone

  const visibleStart = cleanPhone.substring(0, 2)
  const visibleEnd = cleanPhone.substring(cleanPhone.length - 2)
  const masked = '*'.repeat(cleanPhone.length - 4)

  return `${visibleStart}${masked}${visibleEnd}`
}

export function maskBankAccount(accountNumber: string): string {
  if (!accountNumber) return ''

  const cleanAccount = accountNumber.replace(/\D/g, '')
  if (cleanAccount.length < 4) return accountNumber

  const visibleEnd = cleanAccount.substring(cleanAccount.length - 4)
  const masked = '*'.repeat(cleanAccount.length - 4)

  return `${masked}${visibleEnd}`
}

// Indonesian number to words (for amounts)
export function numberToWords(num: number): string {
  const ones = [
    '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
    'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'
  ]

  const tens = [
    '', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh',
    'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'
  ]

  function convertHundreds(n: number): string {
    let result = ''

    if (n >= 100) {
      const hundreds = Math.floor(n / 100)
      result += (hundreds === 1 ? 'seratus' : ones[hundreds] + ' ratus')
      n %= 100
      if (n > 0) result += ' '
    }

    if (n >= 20) {
      const tensDigit = Math.floor(n / 10)
      result += tens[tensDigit]
      n %= 10
      if (n > 0) result += ' ' + ones[n]
    } else if (n > 0) {
      result += ones[n]
    }

    return result
  }

  if (num === 0) return 'nol'
  if (num < 0) return 'minus ' + numberToWords(-num)

  let result = ''

  if (num >= 1000000000) {
    const billions = Math.floor(num / 1000000000)
    result += (billions === 1 ? 'satu miliar' : convertHundreds(billions) + ' miliar')
    num %= 1000000000
    if (num > 0) result += ' '
  }

  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000)
    result += (millions === 1 ? 'satu juta' : convertHundreds(millions) + ' juta')
    num %= 1000000
    if (num > 0) result += ' '
  }

  if (num >= 1000) {
    const thousands = Math.floor(num / 1000)
    result += (thousands === 1 ? 'seribu' : convertHundreds(thousands) + ' ribu')
    num %= 1000
    if (num > 0) result += ' '
  }

  if (num > 0) {
    result += convertHundreds(num)
  }

  return result.trim()
}