/**
 * @koperasi-sinoman/utils
 *
 * Comprehensive utility functions and helpers for Koperasi Sinoman applications
 * with Indonesian localization support, financial calculations, and business logic.
 *
 * @author Koperasi Sinoman
 * @version 1.0.0
 * @license MIT
 */

// ===================================
// VALIDATION UTILITIES
// ===================================
// Indonesian-specific validation functions including NIK, NPWP, phone numbers
export * from './validation'

// ===================================
// FORMATTING UTILITIES
// ===================================
// Currency, number, date formatting with Indonesian locale support
export * from './formatting'

// ===================================
// CURRENCY UTILITIES
// ===================================
// Indonesian Rupiah formatting, savings interest, and SHU calculations
export * from './currency'

// ===================================
// DATE & TIME UTILITIES
// ===================================
// Date manipulation, Indonesian calendar, business days, timezone support
export * from './date'

// ===================================
// MATHEMATICAL & FINANCIAL UTILITIES
// ===================================
// Number operations, statistical functions, Indonesian financial calculations
export * from './number'

// ===================================
// STRING PROCESSING UTILITIES
// ===================================
// Text manipulation, Indonesian text processing, case conversion, slugs
export * from './string'

// ===================================
// ARRAY MANIPULATION UTILITIES
// ===================================
// Array operations, sorting, grouping, statistical functions
export * from './array'

// ===================================
// OBJECT UTILITIES
// ===================================
// Object manipulation, deep operations, property access, transformations
export * from './object'

// ===================================
// CRYPTOGRAPHIC UTILITIES
// ===================================
// Secure ID generation, password hashing, encryption, token generation
export * from './crypto'

// ===================================
// FILE HANDLING UTILITIES
// ===================================
// File type detection, size formatting, validation, path manipulation
export * from './file'

// ===================================
// URL UTILITIES
// ===================================
// URL parsing, validation, query parameters, domain extraction
export * from './url'

// ===================================
// QR CODE UTILITIES
// ===================================
// QR code data generation for Indonesian business use cases
export * from './qr'

// ===================================
// DIGITAL MEMBER CARD QR UTILITIES
// ===================================
// Digital member card QR generation, encoding, and verification
export * from './qr-code'

// ===================================
// ERROR HANDLING UTILITIES
// ===================================
// Custom error classes, error aggregation, retry logic, safe operations
export * from './error'

// ===================================
// CONSTANTS & CONFIGURATION
// ===================================
// Indonesian provinces, banks, currencies, validation rules, business constants
export * from './constants'

// ===================================
// CONVENIENCE EXPORTS
// ===================================
// Most commonly used functions for quick imports

// Currency formatting (most used)
export { formatCurrency, formatNumber } from './formatting'
export { formatIDR, parseIDR, toIDRWords, calculateSavingsInterest, calculateSHUDistribution } from './currency'

// Date helpers (most used)
export { formatDate, getRelativeTime, calculateAge } from './date'

// Validation (most used)
export { validateNIK, validatePhoneNumber, validateEmail } from './validation'

// ID generation (most used)
export { generateId, generateSecureToken } from './crypto'

// QR code generation (most used)
export {
  generateQRPaymentData,
  generateQRContactData,
  QR_TEMPLATES
} from './qr'

// Digital member card QR (most used)
export {
  generateMemberCardQR,
  generateMemberVerificationQR,
  verifyMemberCardQR,
  quickVerifyMemberQR,
  generateMemberIdWithChecksum,
  validateMemberId
} from './qr-code'

// Error handling (most used)
export {
  ValidationError,
  NotFoundError,
  createValidationError,
  safeAsync
} from './error'

// ===================================
// TYPE EXPORTS
// ===================================
// Export commonly used types for TypeScript users

export type {
  // Validation types
  PasswordStrengthResult,
  IDValidationResult,
} from './validation'

export type {
  // Date types
  DateRange,
} from './date'

export type {
  // Formatting types
  IndonesianAddress,
} from './formatting'

export type {
  // Currency types
  CurrencyFormatOptions,
  SavingsInterestConfig,
  SavingsInterestResult,
  SHUDistributionConfig,
  SHUDistributionResult,
} from './currency'

export type {
  // QR types
  IndonesianQRPayment,
  QRContactInfo,
  QRCodeOptions,
} from './qr'

export type {
  // Digital member card QR types
  MemberCardData,
  DigitalMemberCard,
  QRMemberCardOptions,
  QRCodeGenerationResult,
  QRVerificationResult,
  MemberVerificationData,
} from './qr-code'

export type {
  // Error types
  BaseError,
} from './error'

export type {
  // File types
  FileInfo,
  FileValidationOptions,
  FileValidationResult,
} from './file'

export type {
  // URL types
  ParsedUrl,
} from './url'

// ===================================
// VERSION & METADATA
// ===================================
export const VERSION = '1.0.0'
export const PACKAGE_NAME = '@koperasi-sinoman/utils'
export const AUTHOR = 'Koperasi Sinoman'
export const DESCRIPTION = 'Comprehensive utility functions for Indonesian business applications'

// Feature flags for conditional functionality
export const FEATURES = {
  INDONESIAN_LOCALIZATION: true,
  FINANCIAL_CALCULATIONS: true,
  QR_CODE_GENERATION: true,
  CRYPTO_UTILITIES: true,
  VALIDATION_INDONESIAN: true,
  DATE_INDONESIAN_CALENDAR: true,
} as const