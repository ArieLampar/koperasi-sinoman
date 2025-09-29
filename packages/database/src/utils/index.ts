// Query utilities
export * from './query-builder'

// Validation utilities
export * from './validators'

// Formatting utilities
export * from './formatters'

// Additional utility functions
export { default as pagination } from './pagination'
export { default as search } from './search'
export { default as audit } from './audit'

// Constants
export const DATABASE_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // File upload
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  ALLOWED_DOCUMENT_EXTENSIONS: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],

  // Validation
  MIN_PASSWORD_LENGTH: 8,
  MAX_TEXT_LENGTH: 1000,
  MIN_AGE: 17,
  MAX_AGE: 100,

  // Business rules
  MIN_SAVINGS_AMOUNT: 10000, // Rp 10,000
  MAX_TRANSACTION_AMOUNT: 100000000000, // Rp 100 billion
  REFERRAL_BONUS: 50000, // Rp 50,000

  // Time zones
  TIMEZONE: 'Asia/Jakarta',

  // Status values
  STATUSES: {
    MEMBERSHIP: ['pending', 'active', 'suspended', 'inactive'] as const,
    KYC: ['pending', 'verified', 'rejected'] as const,
    TRANSACTION: ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const,
    PAYMENT: ['pending', 'paid', 'failed', 'refunded'] as const,
    ORDER: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const,
  },
} as const

// Error codes
export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',

  // Business logic
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',

  // File upload
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // General
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Data berhasil dibuat',
  UPDATED: 'Data berhasil diperbarui',
  DELETED: 'Data berhasil dihapus',
  VERIFIED: 'Verifikasi berhasil',
  UPLOADED: 'File berhasil diunggah',
  SENT: 'Data berhasil dikirim',
  PROCESSED: 'Transaksi berhasil diproses',
} as const

// Error messages in Indonesian
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: 'Anda tidak memiliki akses',
  [ERROR_CODES.FORBIDDEN]: 'Akses ditolak',
  [ERROR_CODES.SESSION_EXPIRED]: 'Sesi telah berakhir, silakan login kembali',
  [ERROR_CODES.VALIDATION_ERROR]: 'Data yang dimasukkan tidak valid',
  [ERROR_CODES.INVALID_INPUT]: 'Input tidak valid',
  [ERROR_CODES.DUPLICATE_ENTRY]: 'Data sudah ada',
  [ERROR_CODES.DATABASE_ERROR]: 'Terjadi kesalahan database',
  [ERROR_CODES.CONNECTION_ERROR]: 'Koneksi ke database gagal',
  [ERROR_CODES.CONSTRAINT_VIOLATION]: 'Pelanggaran aturan database',
  [ERROR_CODES.INSUFFICIENT_BALANCE]: 'Saldo tidak mencukupi',
  [ERROR_CODES.ACCOUNT_SUSPENDED]: 'Akun telah dibekukan',
  [ERROR_CODES.OPERATION_NOT_ALLOWED]: 'Operasi tidak diizinkan',
  [ERROR_CODES.FILE_TOO_LARGE]: 'Ukuran file terlalu besar',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Jenis file tidak didukung',
  [ERROR_CODES.UPLOAD_FAILED]: 'Upload file gagal',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Terlalu banyak permintaan, coba lagi nanti',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Terjadi kesalahan tidak dikenal',
  [ERROR_CODES.INTERNAL_ERROR]: 'Kesalahan sistem internal',
} as const

// Helper functions
export function getErrorMessage(code: keyof typeof ERROR_CODES): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR
}

export function isValidStatus<T extends keyof typeof DATABASE_CONSTANTS.STATUSES>(
  type: T,
  status: string
): status is typeof DATABASE_CONSTANTS.STATUSES[T][number] {
  return DATABASE_CONSTANTS.STATUSES[type].includes(status as any)
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

export function getJakartaTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: DATABASE_CONSTANTS.TIMEZONE }))
}