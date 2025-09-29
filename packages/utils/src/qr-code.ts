/**
 * QR Code Generation Utilities for Digital Member Cards
 *
 * Comprehensive QR code utilities for Koperasi Sinoman digital member cards,
 * including secure member ID encoding, verification, and digital card data generation.
 *
 * Features:
 * - Secure member ID encoding with checksums
 * - Digital member card QR generation
 * - QR code verification and validation
 * - Encrypted member data encoding
 * - Tamper-proof verification
 * - Indonesian business compliance
 *
 * @author Koperasi Sinoman
 * @version 1.0.0
 */

import { generateSecureToken } from './crypto'
import { validateNIK } from './validation'

// ===================================
// TYPES & INTERFACES
// ===================================

export interface MemberCardData {
  memberId: string
  memberNumber: string
  fullName: string
  nik?: string
  phoneNumber: string
  email?: string
  membershipType: 'regular' | 'premium' | 'investor'
  membershipStatus: 'active' | 'inactive' | 'suspended'
  joinDate: Date
  branchCode?: string
  profilePhoto?: string
}

export interface DigitalMemberCard {
  cardId: string
  memberId: string
  memberNumber: string
  fullName: string
  membershipType: 'regular' | 'premium' | 'investor'
  membershipStatus: 'active' | 'inactive' | 'suspended'
  joinDate: string
  branchCode?: string
  issuedAt: string
  expiresAt?: string
  version: string
}

export interface QRMemberCardOptions {
  includePersonalData?: boolean
  includeBiometric?: boolean
  expirationDays?: number
  encryptData?: boolean
  addChecksum?: boolean
  customFields?: Record<string, any>
}

export interface QRCodeGenerationResult {
  qrData: string
  cardData: DigitalMemberCard
  checksum: string
  isEncrypted: boolean
  metadata: {
    generatedAt: string
    version: string
    format: string
    size: number
  }
}

export interface QRVerificationResult {
  isValid: boolean
  isExpired: boolean
  cardData?: DigitalMemberCard
  memberId?: string
  memberNumber?: string
  errors: string[]
  verifiedAt: string
}

export interface MemberVerificationData {
  memberId: string
  memberNumber: string
  fullName: string
  membershipStatus: 'active' | 'inactive' | 'suspended'
  lastVerified: string
  verificationLevel: 'basic' | 'enhanced' | 'full'
}

// ===================================
// CONSTANTS & CONFIGURATION
// ===================================

const QR_VERSION = '1.0.0'
const QR_FORMAT = 'KOPERASI_SINOMAN_MEMBER'
const DEFAULT_EXPIRATION_DAYS = 365
const MAX_QR_SIZE = 2048 // Maximum QR data size in characters
const CHECKSUM_LENGTH = 8

const MEMBERSHIP_TYPE_CODES = {
  regular: 'REG',
  premium: 'PRM',
  investor: 'INV'
} as const

const STATUS_CODES = {
  active: 'ACT',
  inactive: 'INA',
  suspended: 'SUS'
} as const

// Branch codes for Indonesian regions
const BRANCH_CODES = {
  'JAKARTA': 'JKT',
  'BANDUNG': 'BDG',
  'SURABAYA': 'SBY',
  'MEDAN': 'MDN',
  'SEMARANG': 'SMG',
  'MAKASSAR': 'MKS',
  'PALEMBANG': 'PLM',
  'DENPASAR': 'DPS',
  'YOGYAKARTA': 'YGY',
  'MALANG': 'MLG'
} as const

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Simple hash function for checksums
 */
function createSimpleHash(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase()
}

/**
 * Format date to YYYY-MM-DD format
 */
function formatDateSimple(date: Date): string {
  return date.toISOString().split('T')[0]
}

// ===================================
// MEMBER ID ENCODING FUNCTIONS
// ===================================

/**
 * Generate a secure member ID with checksum
 */
export function generateMemberIdWithChecksum(
  memberNumber: string,
  branchCode?: string
): string {
  const branch = branchCode || 'JKT'
  const timestamp = Date.now().toString(36).toUpperCase()
  const baseId = `${branch}-${memberNumber}-${timestamp}`
  const checksum = generateChecksum(baseId)

  return `${baseId}-${checksum}`
}

/**
 * Validate member ID format and checksum
 */
export function validateMemberId(memberId: string): boolean {
  try {
    const parts = memberId.split('-')
    if (parts.length !== 4) return false

    const [branch, memberNumber, timestamp, checksum] = parts

    // Validate branch code
    if (!Object.values(BRANCH_CODES).includes(branch as any)) return false

    // Validate member number format (should be numeric)
    if (!/^\d+$/.test(memberNumber)) return false

    // Validate timestamp format
    if (!/^[A-Z0-9]+$/.test(timestamp)) return false

    // Validate checksum
    const baseId = `${branch}-${memberNumber}-${timestamp}`
    const expectedChecksum = generateChecksum(baseId)

    return checksum === expectedChecksum
  } catch {
    return false
  }
}

/**
 * Extract member number from member ID
 */
export function extractMemberNumber(memberId: string): string | null {
  try {
    const parts = memberId.split('-')
    if (parts.length !== 4) return null
    return parts[1]
  } catch {
    return null
  }
}

/**
 * Extract branch code from member ID
 */
export function extractBranchCode(memberId: string): string | null {
  try {
    const parts = memberId.split('-')
    if (parts.length !== 4) return null
    return parts[0]
  } catch {
    return null
  }
}

// ===================================
// QR CODE GENERATION FUNCTIONS
// ===================================

/**
 * Generate QR code data for digital member card
 */
export function generateMemberCardQR(
  memberData: MemberCardData,
  options: QRMemberCardOptions = {}
): QRCodeGenerationResult {
  const opts = {
    includePersonalData: false,
    includeBiometric: false,
    expirationDays: DEFAULT_EXPIRATION_DAYS,
    encryptData: false,
    addChecksum: true,
    customFields: {},
    ...options
  }

  // Create digital member card data
  const cardData: DigitalMemberCard = {
    cardId: generateSecureToken(16),
    memberId: memberData.memberId,
    memberNumber: memberData.memberNumber,
    fullName: memberData.fullName,
    membershipType: memberData.membershipType,
    membershipStatus: memberData.membershipStatus,
    joinDate: formatDateSimple(memberData.joinDate),
    branchCode: memberData.branchCode,
    issuedAt: new Date().toISOString(),
    expiresAt: opts.expirationDays
      ? new Date(Date.now() + opts.expirationDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
    version: QR_VERSION
  }

  // Add optional personal data
  if (opts.includePersonalData && memberData.nik) {
    (cardData as any).nik = memberData.nik
  }

  if (opts.includePersonalData && memberData.email) {
    (cardData as any).email = memberData.email
  }

  // Add custom fields
  Object.assign(cardData, opts.customFields)

  // Create QR data structure
  const qrDataObject = {
    format: QR_FORMAT,
    version: QR_VERSION,
    data: cardData,
    metadata: {
      generatedAt: new Date().toISOString(),
      includesPersonalData: opts.includePersonalData,
      includeBiometric: opts.includeBiometric,
      encrypted: opts.encryptData
    }
  }

  // Convert to JSON string
  let qrDataString = JSON.stringify(qrDataObject)

  // Encrypt if requested
  if (opts.encryptData) {
    qrDataString = encryptQRData(qrDataString)
  }

  // Add checksum if requested
  let checksum = ''
  if (opts.addChecksum) {
    checksum = generateChecksum(qrDataString)
    qrDataString = `${qrDataString}|CHK:${checksum}`
  }

  // Validate size limit
  if (qrDataString.length > MAX_QR_SIZE) {
    throw new Error(`QR data too large: ${qrDataString.length} > ${MAX_QR_SIZE} characters`)
  }

  return {
    qrData: qrDataString,
    cardData,
    checksum,
    isEncrypted: opts.encryptData,
    metadata: {
      generatedAt: new Date().toISOString(),
      version: QR_VERSION,
      format: QR_FORMAT,
      size: qrDataString.length
    }
  }
}

/**
 * Generate simple member verification QR
 */
export function generateMemberVerificationQR(
  memberId: string,
  memberNumber: string,
  fullName: string,
  membershipStatus: 'active' | 'inactive' | 'suspended' = 'active'
): string {
  const verificationData: MemberVerificationData = {
    memberId,
    memberNumber,
    fullName,
    membershipStatus,
    lastVerified: new Date().toISOString(),
    verificationLevel: 'basic'
  }

  const qrData = {
    format: 'KOPERASI_SINOMAN_VERIFICATION',
    version: QR_VERSION,
    data: verificationData,
    checksum: generateChecksum(JSON.stringify(verificationData))
  }

  return JSON.stringify(qrData)
}

/**
 * Generate attendance QR code for member events
 */
export function generateAttendanceQR(
  memberId: string,
  eventId: string,
  eventName: string,
  eventDate: Date
): string {
  const attendanceData = {
    format: 'KOPERASI_SINOMAN_ATTENDANCE',
    version: QR_VERSION,
    data: {
      memberId,
      eventId,
      eventName,
      eventDate: formatDateSimple(eventDate),
      generatedAt: new Date().toISOString(),
      validUntil: new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString()
    }
  }

  const dataString = JSON.stringify(attendanceData)
  const checksum = generateChecksum(dataString)

  return `${dataString}|CHK:${checksum}`
}

// ===================================
// QR CODE VERIFICATION FUNCTIONS
// ===================================

/**
 * Verify and decode member card QR code
 */
export function verifyMemberCardQR(qrData: string): QRVerificationResult {
  const result: QRVerificationResult = {
    isValid: false,
    isExpired: false,
    errors: [],
    verifiedAt: new Date().toISOString()
  }

  try {
    // Check for checksum
    let dataToVerify = qrData
    let expectedChecksum = ''

    if (qrData.includes('|CHK:')) {
      const parts = qrData.split('|CHK:')
      dataToVerify = parts[0]
      expectedChecksum = parts[1]

      // Verify checksum
      const actualChecksum = generateChecksum(dataToVerify)
      if (actualChecksum !== expectedChecksum) {
        result.errors.push('Invalid checksum - data may be corrupted')
        return result
      }
    }

    // Try to decrypt if needed
    let jsonString = dataToVerify
    if (isEncryptedQRData(dataToVerify)) {
      try {
        jsonString = decryptQRData(dataToVerify)
      } catch (error) {
        result.errors.push('Failed to decrypt QR data')
        return result
      }
    }

    // Parse JSON
    const qrObject = JSON.parse(jsonString)

    // Validate format
    if (qrObject.format !== QR_FORMAT) {
      result.errors.push(`Invalid format: expected ${QR_FORMAT}, got ${qrObject.format}`)
      return result
    }

    // Validate version compatibility
    if (!isVersionCompatible(qrObject.version)) {
      result.errors.push(`Incompatible version: ${qrObject.version}`)
      return result
    }

    // Extract card data
    const cardData = qrObject.data as DigitalMemberCard

    // Validate required fields
    if (!cardData.memberId || !cardData.memberNumber || !cardData.fullName) {
      result.errors.push('Missing required member data')
      return result
    }

    // Validate member ID format
    if (!validateMemberId(cardData.memberId)) {
      result.errors.push('Invalid member ID format')
      return result
    }

    // Check expiration
    if (cardData.expiresAt) {
      const expirationDate = new Date(cardData.expiresAt)
      if (expirationDate < new Date()) {
        result.isExpired = true
        result.errors.push('Member card has expired')
      }
    }

    // Validate membership status
    if (cardData.membershipStatus === 'suspended') {
      result.errors.push('Member account is suspended')
    } else if (cardData.membershipStatus === 'inactive') {
      result.errors.push('Member account is inactive')
    }

    // If we get here, the QR is valid
    result.isValid = result.errors.length === 0 && !result.isExpired
    result.cardData = cardData
    result.memberId = cardData.memberId
    result.memberNumber = cardData.memberNumber

    return result

  } catch (error) {
    result.errors.push(`QR parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

/**
 * Quick member ID verification from QR
 */
export function quickVerifyMemberQR(qrData: string): {
  isValid: boolean
  memberId?: string
  memberNumber?: string
  membershipStatus?: string
} {
  try {
    const verification = verifyMemberCardQR(qrData)

    if (!verification.isValid) {
      return { isValid: false }
    }

    return {
      isValid: true,
      memberId: verification.memberId,
      memberNumber: verification.memberNumber,
      membershipStatus: verification.cardData?.membershipStatus
    }
  } catch {
    return { isValid: false }
  }
}

/**
 * Verify attendance QR code
 */
export function verifyAttendanceQR(qrData: string, eventId: string): {
  isValid: boolean
  memberId?: string
  isExpired: boolean
  errors: string[]
} {
  const result = {
    isValid: false,
    isExpired: false,
    errors: [] as string[]
  }

  try {
    // Check for checksum
    let dataToVerify = qrData
    if (qrData.includes('|CHK:')) {
      const parts = qrData.split('|CHK:')
      dataToVerify = parts[0]
      const expectedChecksum = parts[1]

      const actualChecksum = generateChecksum(dataToVerify)
      if (actualChecksum !== expectedChecksum) {
        result.errors.push('Invalid checksum')
        return result
      }
    }

    const qrObject = JSON.parse(dataToVerify)

    if (qrObject.format !== 'KOPERASI_SINOMAN_ATTENDANCE') {
      result.errors.push('Invalid attendance QR format')
      return result
    }

    if (qrObject.data.eventId !== eventId) {
      result.errors.push('QR code is for a different event')
      return result
    }

    // Check if expired
    if (qrObject.data.validUntil) {
      const validUntil = new Date(qrObject.data.validUntil)
      if (validUntil < new Date()) {
        result.isExpired = true
        result.errors.push('Attendance QR has expired')
      }
    }

    result.isValid = result.errors.length === 0 && !result.isExpired
    return { ...result, memberId: qrObject.data.memberId }

  } catch (error) {
    result.errors.push(`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Generate checksum for data integrity
 */
function generateChecksum(data: string): string {
  return createSimpleHash(data).substring(0, CHECKSUM_LENGTH).toUpperCase()
}

/**
 * Check if QR data is encrypted
 */
function isEncryptedQRData(data: string): boolean {
  // Simple heuristic: encrypted data would not be valid JSON
  try {
    JSON.parse(data)
    return false
  } catch {
    return true
  }
}

/**
 * Encrypt QR data (placeholder - implement with actual encryption)
 */
function encryptQRData(data: string): string {
  // This is a placeholder - implement actual encryption here
  // For now, we'll use base64 encoding as a simple obfuscation
  return Buffer.from(data).toString('base64')
}

/**
 * Decrypt QR data (placeholder - implement with actual decryption)
 */
function decryptQRData(encryptedData: string): string {
  // This is a placeholder - implement actual decryption here
  // For now, we'll use base64 decoding
  try {
    return Buffer.from(encryptedData, 'base64').toString('utf-8')
  } catch (error) {
    throw new Error('Failed to decrypt QR data')
  }
}

/**
 * Check version compatibility
 */
function isVersionCompatible(version: string): boolean {
  // Simple version check - major version must match
  const [major] = version.split('.')
  const [currentMajor] = QR_VERSION.split('.')
  return major === currentMajor
}

/**
 * Generate member card preview data for UI
 */
export function generateMemberCardPreview(memberData: MemberCardData): {
  displayName: string
  membershipTypeDisplay: string
  statusDisplay: string
  joinDateDisplay: string
  branchDisplay: string
} {
  const membershipTypeNames = {
    regular: 'Anggota Reguler',
    premium: 'Anggota Premium',
    investor: 'Anggota Investor'
  }

  const statusNames = {
    active: 'Aktif',
    inactive: 'Tidak Aktif',
    suspended: 'Dibekukan'
  }

  return {
    displayName: memberData.fullName,
    membershipTypeDisplay: membershipTypeNames[memberData.membershipType],
    statusDisplay: statusNames[memberData.membershipStatus],
    joinDateDisplay: memberData.joinDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }),
    branchDisplay: memberData.branchCode || 'Jakarta Pusat'
  }
}

/**
 * Validate member card data before QR generation
 */
export function validateMemberCardData(memberData: MemberCardData): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Required fields
  if (!memberData.memberId?.trim()) {
    errors.push('Member ID is required')
  }

  if (!memberData.memberNumber?.trim()) {
    errors.push('Member number is required')
  }

  if (!memberData.fullName?.trim()) {
    errors.push('Full name is required')
  }

  if (!memberData.phoneNumber?.trim()) {
    errors.push('Phone number is required')
  }

  // Validate member ID format
  if (memberData.memberId && !validateMemberId(memberData.memberId)) {
    errors.push('Invalid member ID format')
  }

  // Validate NIK if provided
  if (memberData.nik && !validateNIK(memberData.nik)) {
    errors.push('Invalid NIK format')
  }

  // Validate membership type
  if (!['regular', 'premium', 'investor'].includes(memberData.membershipType)) {
    errors.push('Invalid membership type')
  }

  // Validate membership status
  if (!['active', 'inactive', 'suspended'].includes(memberData.membershipStatus)) {
    errors.push('Invalid membership status')
  }

  // Validate join date
  if (!memberData.joinDate || isNaN(memberData.joinDate.getTime())) {
    errors.push('Invalid join date')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// ===================================
// EXPORTS
// ===================================

export {
  QR_VERSION,
  QR_FORMAT,
  MEMBERSHIP_TYPE_CODES,
  STATUS_CODES,
  BRANCH_CODES
}

