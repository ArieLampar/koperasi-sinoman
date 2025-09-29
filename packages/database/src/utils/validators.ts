/**
 * Database validation utilities
 */

// Regular expressions for validation
export const VALIDATION_PATTERNS = {
  // Indonesian specific patterns
  NIK: /^\d{16}$/,
  PHONE: /^(\+?62|0)[2-9]\d{7,11}$/,
  POSTAL_CODE: /^\d{5}$/,

  // General patterns
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

  // Financial patterns
  ACCOUNT_NUMBER: /^\d{10,20}$/,
  AMOUNT: /^\d+(\.\d{1,2})?$/,

  // Member patterns
  MEMBER_NUMBER: /^SIN-\d{4}-\d{6}$/,
  REFERRAL_CODE: /^[A-Z0-9]{8}$/,
} as const

/**
 * Validate NIK (Nomor Induk Kependudukan)
 */
export function validateNIK(nik: string): boolean {
  if (!VALIDATION_PATTERNS.NIK.test(nik)) {
    return false
  }

  // Additional NIK validation logic can be added here
  // Check birth date within NIK, district codes, etc.

  return true
}

/**
 * Validate Indonesian phone number
 */
export function validatePhone(phone: string): boolean {
  return VALIDATION_PATTERNS.PHONE.test(phone)
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  return VALIDATION_PATTERNS.EMAIL.test(email)
}

/**
 * Validate UUID
 */
export function validateUUID(uuid: string): boolean {
  return VALIDATION_PATTERNS.UUID.test(uuid)
}

/**
 * Validate member number format
 */
export function validateMemberNumber(memberNumber: string): boolean {
  return VALIDATION_PATTERNS.MEMBER_NUMBER.test(memberNumber)
}

/**
 * Validate referral code format
 */
export function validateReferralCode(code: string): boolean {
  return VALIDATION_PATTERNS.REFERRAL_CODE.test(code)
}

/**
 * Validate account number
 */
export function validateAccountNumber(accountNumber: string): boolean {
  return VALIDATION_PATTERNS.ACCOUNT_NUMBER.test(accountNumber)
}

/**
 * Validate amount format
 */
export function validateAmount(amount: string | number): boolean {
  if (typeof amount === 'number') {
    return amount >= 0 && amount <= 999999999999.99
  }
  return VALIDATION_PATTERNS.AMOUNT.test(amount)
}

/**
 * Validate age (must be at least 17 years old)
 */
export function validateAge(dateOfBirth: string): boolean {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 17
  }

  return age >= 17
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate Indonesian postal code
 */
export function validatePostalCode(postalCode: string): boolean {
  return VALIDATION_PATTERNS.POSTAL_CODE.test(postalCode)
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension ? allowedExtensions.includes(extension) : false
}

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(fileSize: number, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return fileSize <= maxSizeInBytes
}

/**
 * Validate business license number (Indonesian)
 */
export function validateBusinessLicense(license: string): boolean {
  // Simplified validation - in practice, this would check against official patterns
  return /^[A-Z0-9\-\/]{10,30}$/i.test(license)
}

/**
 * Validate NPWP (Nomor Pokok Wajib Pajak)
 */
export function validateNPWP(npwp: string): boolean {
  // Remove dots and dashes
  const cleanNPWP = npwp.replace(/[\.\-]/g, '')
  return /^\d{15}$/.test(cleanNPWP)
}

/**
 * Validate coordinates (latitude, longitude)
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Validate Indonesian bank account number
 */
export function validateBankAccount(accountNumber: string, bankCode?: string): boolean {
  // Remove spaces and dashes
  const cleanAccount = accountNumber.replace(/[\s\-]/g, '')

  // Basic length validation (varies by bank)
  if (cleanAccount.length < 8 || cleanAccount.length > 20) {
    return false
  }

  // Only digits allowed
  if (!/^\d+$/.test(cleanAccount)) {
    return false
  }

  // Bank-specific validation could be added here
  if (bankCode) {
    // Add specific validation rules for different banks
    switch (bankCode.toUpperCase()) {
      case 'BCA':
        return cleanAccount.length >= 10 && cleanAccount.length <= 10
      case 'BNI':
        return cleanAccount.length >= 10 && cleanAccount.length <= 10
      case 'BRI':
        return cleanAccount.length >= 15 && cleanAccount.length <= 15
      case 'MANDIRI':
        return cleanAccount.length >= 13 && cleanAccount.length <= 13
      default:
        return true // Unknown bank, use basic validation
    }
  }

  return true
}

/**
 * Validate Indonesian vehicle plate number
 */
export function validateVehiclePlate(plateNumber: string): boolean {
  // Indonesian vehicle plate format: X NNNN XX or XX NNNN XX
  return /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/i.test(plateNumber)
}

/**
 * Sanitize input string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000) // Limit length
}

/**
 * Validate and sanitize member data
 */
export function validateMemberData(data: {
  full_name?: string
  nik?: string
  email?: string
  phone?: string
  date_of_birth?: string
}): {
  isValid: boolean
  errors: Record<string, string[]>
  sanitized: typeof data
} {
  const errors: Record<string, string[]> = {}
  const sanitized = { ...data }

  // Validate and sanitize full name
  if (data.full_name) {
    sanitized.full_name = sanitizeInput(data.full_name)
    if (sanitized.full_name.length < 2) {
      errors.full_name = ['Full name must be at least 2 characters long']
    }
    if (sanitized.full_name.length > 100) {
      errors.full_name = ['Full name must be no more than 100 characters long']
    }
  }

  // Validate NIK
  if (data.nik && !validateNIK(data.nik)) {
    errors.nik = ['Invalid NIK format']
  }

  // Validate email
  if (data.email && !validateEmail(data.email)) {
    errors.email = ['Invalid email format']
  }

  // Validate phone
  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = ['Invalid phone number format']
  }

  // Validate age
  if (data.date_of_birth && !validateAge(data.date_of_birth)) {
    errors.date_of_birth = ['Must be at least 17 years old']
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  }
}

/**
 * Validate transaction data
 */
export function validateTransactionData(data: {
  amount?: number | string
  reference_number?: string
  payment_method?: string
}): {
  isValid: boolean
  errors: Record<string, string[]>
} {
  const errors: Record<string, string[]> = {}

  // Validate amount
  if (data.amount !== undefined) {
    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount
    if (isNaN(amount) || amount <= 0) {
      errors.amount = ['Amount must be a positive number']
    }
    if (amount > 999999999999.99) {
      errors.amount = ['Amount too large']
    }
  }

  // Validate reference number
  if (data.reference_number && data.reference_number.length > 50) {
    errors.reference_number = ['Reference number too long']
  }

  // Validate payment method
  const validPaymentMethods = ['bank_transfer', 'virtual_account', 'cash', 'qris']
  if (data.payment_method && !validPaymentMethods.includes(data.payment_method)) {
    errors.payment_method = ['Invalid payment method']
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}