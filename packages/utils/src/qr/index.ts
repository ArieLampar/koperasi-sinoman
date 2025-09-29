/**
 * QR Code generation utilities for Indonesian business use cases
 */

// QR Code data types for Indonesian business
export interface IndonesianQRPayment {
  merchantName: string
  merchantCity: string
  merchantId: string
  amount?: number
  currency?: string
  transactionId?: string
  description?: string
}

export interface QRContactInfo {
  name: string
  phone?: string
  email?: string
  organization?: string
  address?: string
  website?: string
}

export interface QRWifiConfig {
  ssid: string
  password: string
  security: 'WPA' | 'WEP' | 'nopass'
  hidden?: boolean
}

export interface QREventInfo {
  title: string
  description?: string
  location?: string
  startDate: Date
  endDate?: Date
  allDay?: boolean
}

// QR Code generation options
export interface QRCodeOptions {
  size?: number
  margin?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  version?: number
  maskPattern?: number
  darkColor?: string
  lightColor?: string
}

// Generate Indonesian QR Payment (QRIS-like format)
export function generateQRPaymentData(payment: IndonesianQRPayment): string {
  const {
    merchantName,
    merchantCity,
    merchantId,
    amount,
    currency = 'IDR',
    transactionId,
    description
  } = payment

  // Simplified QRIS-like format (actual QRIS has complex specifications)
  const qrData = {
    merchant_name: merchantName,
    merchant_city: merchantCity,
    merchant_id: merchantId,
    amount: amount ? amount.toString() : undefined,
    currency,
    transaction_id: transactionId,
    description
  }

  // Remove undefined values
  const cleanData = Object.fromEntries(
    Object.entries(qrData).filter(([, value]) => value !== undefined)
  )

  return JSON.stringify(cleanData)
}

// Generate contact vCard QR data
export function generateQRContactData(contact: QRContactInfo): string {
  const { name, phone, email, organization, address, website } = contact

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `N:${name};;;`,
    phone ? `TEL:${phone}` : null,
    email ? `EMAIL:${email}` : null,
    organization ? `ORG:${organization}` : null,
    address ? `ADR:;;${address};;;;` : null,
    website ? `URL:${website}` : null,
    'END:VCARD'
  ]
    .filter(Boolean)
    .join('\n')

  return vcard
}

// Generate WiFi configuration QR data
export function generateQRWifiData(wifi: QRWifiConfig): string {
  const { ssid, password, security, hidden = false } = wifi

  return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`
}

// Generate calendar event QR data
export function generateQREventData(event: QREventInfo): string {
  const { title, description, location, startDate, endDate, allDay = false } = event

  const formatDate = (date: Date) => {
    if (allDay) {
      return date.toISOString().split('T')[0].replace(/-/g, '')
    }
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const vevent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Koperasi Sinoman//QR Utils//ID',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description}` : null,
    location ? `LOCATION:${location}` : null,
    `DTSTART:${formatDate(startDate)}`,
    endDate ? `DTEND:${formatDate(endDate)}` : null,
    'END:VEVENT',
    'END:VCALENDAR'
  ]
    .filter(Boolean)
    .join('\n')

  return vevent
}

// Generate SMS QR data
export function generateQRSMSData(phoneNumber: string, message?: string): string {
  const cleanPhone = phoneNumber.replace(/\D/g, '')

  if (message) {
    return `sms:${cleanPhone}?body=${encodeURIComponent(message)}`
  }

  return `sms:${cleanPhone}`
}

// Generate email QR data
export function generateQREmailData(
  email: string,
  subject?: string,
  body?: string
): string {
  const params = new URLSearchParams()

  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)

  const queryString = params.toString()
  return `mailto:${email}${queryString ? '?' + queryString : ''}`
}

// Generate phone call QR data
export function generateQRPhoneData(phoneNumber: string): string {
  const cleanPhone = phoneNumber.replace(/\D/g, '')
  return `tel:${cleanPhone}`
}

// Generate URL QR data
export function generateQRUrlData(url: string): string {
  // Ensure URL has protocol
  if (!url.match(/^https?:\/\//)) {
    return `https://${url}`
  }
  return url
}

// Generate Indonesian bank transfer QR data
export function generateQRBankTransferData(
  bankCode: string,
  accountNumber: string,
  amount?: number,
  description?: string
): string {
  const transferData = {
    bank_code: bankCode,
    account_number: accountNumber,
    amount: amount?.toString(),
    description,
    country: 'ID'
  }

  // Remove undefined values
  const cleanData = Object.fromEntries(
    Object.entries(transferData).filter(([, value]) => value !== undefined)
  )

  return JSON.stringify(cleanData)
}

// Generate social media profile QR data
export function generateQRSocialData(
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'whatsapp',
  username: string
): string {
  const baseUrls = {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    twitter: 'https://twitter.com/',
    linkedin: 'https://linkedin.com/in/',
    whatsapp: 'https://wa.me/'
  }

  const baseUrl = baseUrls[platform]

  if (platform === 'whatsapp') {
    // WhatsApp expects phone number without + or special characters
    const cleanNumber = username.replace(/\D/g, '')
    return `${baseUrl}${cleanNumber}`
  }

  return `${baseUrl}${username}`
}

// Generate location/GPS coordinates QR data
export function generateQRLocationData(
  latitude: number,
  longitude: number,
  label?: string
): string {
  if (label) {
    return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(label)})`
  }
  return `geo:${latitude},${longitude}`
}

// Generate Indonesian address QR data
export function generateQRIndonesianAddressData(address: {
  street: string
  village?: string
  district?: string
  city: string
  province: string
  postalCode?: string
}): string {
  const { street, village, district, city, province, postalCode } = address

  const addressParts = [
    street,
    village ? `Kel. ${village}` : null,
    district ? `Kec. ${district}` : null,
    city,
    province,
    postalCode
  ].filter(Boolean)

  const fullAddress = addressParts.join(', ')
  return `geo:0,0?q=${encodeURIComponent(fullAddress)}`
}

// Validate QR code data length
export function validateQRDataLength(
  data: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M'
): { isValid: boolean; maxLength: number; currentLength: number } {
  // QR Code capacity limits (approximate for alphanumeric data)
  const capacityLimits = {
    L: 4296, // Low error correction
    M: 3391, // Medium error correction
    Q: 2420, // Quartile error correction
    H: 1852  // High error correction
  }

  const maxLength = capacityLimits[errorCorrectionLevel]
  const currentLength = data.length

  return {
    isValid: currentLength <= maxLength,
    maxLength,
    currentLength
  }
}

// Optimize QR data for size
export function optimizeQRData(data: string): string {
  return data
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
}

// Generate QR code data with validation
export function generateValidatedQRData(
  data: string,
  options: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; optimize?: boolean } = {}
): { data: string; isValid: boolean; validation: ReturnType<typeof validateQRDataLength> } {
  const { errorCorrectionLevel = 'M', optimize = true } = options

  let processedData = optimize ? optimizeQRData(data) : data
  const validation = validateQRDataLength(processedData, errorCorrectionLevel)

  return {
    data: processedData,
    isValid: validation.isValid,
    validation
  }
}

// Common Indonesian QR code templates
export const QR_TEMPLATES = {
  // Indonesian payment template
  PAYMENT: (merchantName: string, amount?: number) =>
    generateQRPaymentData({
      merchantName,
      merchantCity: 'Jakarta',
      merchantId: 'MERCHANT_ID',
      amount
    }),

  // Indonesian contact template
  CONTACT: (name: string, phone: string, email?: string) =>
    generateQRContactData({
      name,
      phone,
      email
    }),

  // WhatsApp contact template
  WHATSAPP: (phoneNumber: string, message?: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const waUrl = `https://wa.me/${cleanPhone}`
    return message ? `${waUrl}?text=${encodeURIComponent(message)}` : waUrl
  },

  // Indonesian address template
  ADDRESS: (street: string, city: string, province: string) =>
    generateQRIndonesianAddressData({
      street,
      city,
      province
    })
} as const

// QR code error messages in Indonesian
export const QR_ERROR_MESSAGES = {
  DATA_TOO_LONG: 'Data QR code terlalu panjang untuk tingkat koreksi error yang dipilih',
  INVALID_PHONE: 'Format nomor telepon tidak valid',
  INVALID_EMAIL: 'Format email tidak valid',
  INVALID_URL: 'Format URL tidak valid',
  MISSING_REQUIRED_FIELD: 'Field wajib tidak diisi',
  INVALID_AMOUNT: 'Jumlah pembayaran tidak valid'
} as const