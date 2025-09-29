/**
 * Validation utilities with Indonesian-specific validators
 */

import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

// NIK (Nomor Induk Kependudukan) validation
export function validateNIK(nik: string): boolean {
  if (!nik || typeof nik !== 'string') return false

  // Remove any non-digit characters
  const cleanNik = nik.replace(/\D/g, '')

  // Must be exactly 16 digits
  if (cleanNik.length !== 16) return false

  // Basic format validation
  const provinceCode = cleanNik.substring(0, 2)
  const cityCode = cleanNik.substring(2, 4)
  const districtCode = cleanNik.substring(4, 6)
  const birthDate = cleanNik.substring(6, 12)
  const serialNumber = cleanNik.substring(12, 16)

  // Province code validation (01-94)
  const provinceNum = parseInt(provinceCode, 10)
  if (provinceNum < 1 || provinceNum > 94) return false

  // City code validation (01-99)
  const cityNum = parseInt(cityCode, 10)
  if (cityNum < 1 || cityNum > 99) return false

  // District code validation (01-99)
  const districtNum = parseInt(districtCode, 10)
  if (districtNum < 1 || districtNum > 99) return false

  // Birth date validation (DDMMYY format)
  const day = parseInt(birthDate.substring(0, 2), 10)
  const month = parseInt(birthDate.substring(2, 4), 10)
  const year = parseInt(birthDate.substring(4, 6), 10)

  // Adjust day for gender (female adds 40 to day)
  const actualDay = day > 40 ? day - 40 : day

  if (actualDay < 1 || actualDay > 31) return false
  if (month < 1 || month > 12) return false

  // Serial number cannot be 0000
  if (serialNumber === '0000') return false

  return true
}

// Indonesian phone number validation
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false

  try {
    // Parse with Indonesia country code
    const phoneNumber = parsePhoneNumber(phone, 'ID')
    return phoneNumber ? isValidPhoneNumber(phone, 'ID') : false
  } catch {
    return false
  }
}

// Format Indonesian phone number
export function formatPhoneNumber(phone: string): string | null {
  if (!validatePhoneNumber(phone)) return null

  try {
    const phoneNumber = parsePhoneNumber(phone, 'ID')
    return phoneNumber?.formatInternational() || null
  } catch {
    return null
  }
}

// Email validation (RFC 5322 compliant)
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email)
}

// Password strength validation
export interface PasswordStrengthResult {
  isValid: boolean
  score: number // 0-5
  feedback: string[]
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = []
  let score = 0

  if (!password) {
    return { isValid: false, score: 0, feedback: ['Password is required'] }
  }

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Password must be at least 8 characters long')
  }

  // Uppercase letter
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password must contain at least one uppercase letter')
  }

  // Lowercase letter
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password must contain at least one lowercase letter')
  }

  // Number
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Password must contain at least one number')
  }

  // Special character
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password must contain at least one special character')
  }

  const isValid = score >= 4
  return { isValid, score, feedback }
}

// Indonesian postal code validation
export function validatePostalCode(postalCode: string): boolean {
  if (!postalCode || typeof postalCode !== 'string') return false

  // Indonesian postal codes are 5 digits
  const cleanCode = postalCode.replace(/\D/g, '')
  return cleanCode.length === 5 && parseInt(cleanCode, 10) > 0
}

// NPWP (Nomor Pokok Wajib Pajak) validation
export function validateNPWP(npwp: string): boolean {
  if (!npwp || typeof npwp !== 'string') return false

  // Remove any non-digit characters
  const cleanNpwp = npwp.replace(/\D/g, '')

  // Must be exactly 15 digits
  if (cleanNpwp.length !== 15) return false

  // Basic format validation
  const taxpayerNumber = cleanNpwp.substring(0, 9)
  const checkDigit = cleanNpwp.substring(9, 10)
  const taxOfficeCode = cleanNpwp.substring(10, 13)
  const statusCode = cleanNpwp.substring(13, 15)

  // Taxpayer number cannot be all zeros
  if (taxpayerNumber === '000000000') return false

  // Tax office code validation (001-999)
  const taxOfficeNum = parseInt(taxOfficeCode, 10)
  if (taxOfficeNum < 1 || taxOfficeNum > 999) return false

  // Status code validation (00-99)
  const statusNum = parseInt(statusCode, 10)
  if (statusNum < 0 || statusNum > 99) return false

  // Check digit validation using modulo 11
  const digits = taxpayerNumber.split('').map(Number)
  const weights = [2, 4, 8, 5, 0, 9, 7, 3, 6]
  let sum = 0

  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i]
  }

  const calculatedCheckDigit = (11 - (sum % 11)) % 10
  return parseInt(checkDigit, 10) === calculatedCheckDigit
}

// Bank account number validation (basic format)
export function validateBankAccount(accountNumber: string): boolean {
  if (!accountNumber || typeof accountNumber !== 'string') return false

  // Remove any non-digit characters
  const cleanAccount = accountNumber.replace(/\D/g, '')

  // Indonesian bank account numbers are typically 10-16 digits
  return cleanAccount.length >= 10 && cleanAccount.length <= 16
}

// URL validation
export function validateURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Credit card number validation (Luhn algorithm)
export function validateCreditCard(cardNumber: string): boolean {
  if (!cardNumber || typeof cardNumber !== 'string') return false

  // Remove any non-digit characters
  const cleanNumber = cardNumber.replace(/\D/g, '')

  // Credit card numbers are typically 13-19 digits
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false

  // Luhn algorithm
  let sum = 0
  let alternate = false

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10)

    if (alternate) {
      digit *= 2
      if (digit > 9) {
        digit = (digit % 10) + 1
      }
    }

    sum += digit
    alternate = !alternate
  }

  return sum % 10 === 0
}

// Indonesian ID validation (supports NIK, NPWP, etc.)
export interface IDValidationResult {
  isValid: boolean
  type: 'nik' | 'npwp' | 'unknown'
  formatted?: string
}

export function validateIndonesianID(id: string): IDValidationResult {
  if (!id || typeof id !== 'string') {
    return { isValid: false, type: 'unknown' }
  }

  const cleanId = id.replace(/\D/g, '')

  // Check NIK (16 digits)
  if (cleanId.length === 16 && validateNIK(cleanId)) {
    return {
      isValid: true,
      type: 'nik',
      formatted: cleanId.replace(/(\d{2})(\d{2})(\d{2})(\d{6})(\d{4})/, '$1.$2.$3.$4.$5')
    }
  }

  // Check NPWP (15 digits)
  if (cleanId.length === 15 && validateNPWP(cleanId)) {
    return {
      isValid: true,
      type: 'npwp',
      formatted: cleanId.replace(/(\d{2})(\d{3})(\d{3})(\d{1})(\d{3})(\d{3})/, '$1.$2.$3.$4-$5.$6')
    }
  }

  return { isValid: false, type: 'unknown' }
}