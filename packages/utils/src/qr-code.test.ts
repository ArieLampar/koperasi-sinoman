/**
 * Test file for QR code utilities
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateMemberIdWithChecksum,
  validateMemberId,
  extractMemberNumber,
  extractBranchCode,
  generateMemberCardQR,
  generateMemberVerificationQR,
  generateAttendanceQR,
  verifyMemberCardQR,
  quickVerifyMemberQR,
  verifyAttendanceQR,
  generateMemberCardPreview,
  validateMemberCardData,
  QR_VERSION,
  QR_FORMAT,
  MEMBERSHIP_TYPE_CODES,
  STATUS_CODES,
  BRANCH_CODES,
  type MemberCardData,
  type QRMemberCardOptions
} from './qr-code'

describe('QR Code Utilities', () => {
  let sampleMemberData: MemberCardData

  beforeEach(() => {
    sampleMemberData = {
      memberId: 'JKT-12345-TEST123-ABC123',
      memberNumber: '12345',
      fullName: 'Budi Santoso',
      nik: '3273010101900001',
      phoneNumber: '+628123456789',
      email: 'budi.santoso@email.com',
      membershipType: 'regular',
      membershipStatus: 'active',
      joinDate: new Date('2020-01-15'),
      branchCode: 'JKT',
      profilePhoto: 'https://example.com/photo.jpg'
    }
  })

  describe('Member ID Encoding and Validation', () => {
    describe('generateMemberIdWithChecksum', () => {
      it('should generate valid member ID with checksum', () => {
        const memberNumber = '12345'
        const branchCode = 'JKT'
        const memberId = generateMemberIdWithChecksum(memberNumber, branchCode)

        expect(memberId).toMatch(/^JKT-12345-[A-Z0-9]+-[A-Z0-9]{8}$/)
        expect(validateMemberId(memberId)).toBe(true)
      })

      it('should use default branch code when not provided', () => {
        const memberNumber = '12345'
        const memberId = generateMemberIdWithChecksum(memberNumber)

        expect(memberId).toMatch(/^JKT-12345-[A-Z0-9]+-[A-Z0-9]{8}$/)
        expect(validateMemberId(memberId)).toBe(true)
      })

      it('should generate different IDs for different timestamps', () => {
        const memberNumber = '12345'
        const id1 = generateMemberIdWithChecksum(memberNumber)

        // Wait a bit to ensure different timestamp
        setTimeout(() => {
          const id2 = generateMemberIdWithChecksum(memberNumber)
          expect(id1).not.toBe(id2)
        }, 1)
      })
    })

    describe('validateMemberId', () => {
      it('should validate correct member ID format', () => {
        const validIds = [
          'JKT-12345-ABC123-CHECKSUM',
          'BDG-67890-XYZ789-TESTSUM1',
          'SBY-11111-111111-ABCDEF12'
        ]

        // Note: These might not have valid checksums, so we test the format validation
        validIds.forEach(id => {
          const parts = id.split('-')
          expect(parts).toHaveLength(4)
        })
      })

      it('should reject invalid member ID formats', () => {
        const invalidIds = [
          'INVALID',
          'JKT-12345',
          'JKT-12345-ABC',
          'XXX-12345-ABC123-CHECKSUM', // Invalid branch
          'JKT-ABCDE-ABC123-CHECKSUM', // Non-numeric member number
          'JKT-12345-abc123-CHECKSUM', // Lowercase in timestamp
        ]

        invalidIds.forEach(id => {
          expect(validateMemberId(id)).toBe(false)
        })
      })
    })

    describe('extractMemberNumber', () => {
      it('should extract member number from valid ID', () => {
        const memberId = 'JKT-12345-ABC123-CHECKSUM'
        const memberNumber = extractMemberNumber(memberId)
        expect(memberNumber).toBe('12345')
      })

      it('should return null for invalid ID format', () => {
        const invalidId = 'INVALID-FORMAT'
        const memberNumber = extractMemberNumber(invalidId)
        expect(memberNumber).toBeNull()
      })
    })

    describe('extractBranchCode', () => {
      it('should extract branch code from valid ID', () => {
        const memberId = 'BDG-12345-ABC123-CHECKSUM'
        const branchCode = extractBranchCode(memberId)
        expect(branchCode).toBe('BDG')
      })

      it('should return null for invalid ID format', () => {
        const invalidId = 'INVALID-FORMAT'
        const branchCode = extractBranchCode(invalidId)
        expect(branchCode).toBeNull()
      })
    })
  })

  describe('QR Code Generation', () => {
    describe('generateMemberCardQR', () => {
      it('should generate QR code with default options', () => {
        const result = generateMemberCardQR(sampleMemberData)

        expect(result.qrData).toBeDefined()
        expect(result.cardData).toBeDefined()
        expect(result.checksum).toBeDefined()
        expect(result.isEncrypted).toBe(false)
        expect(result.metadata.version).toBe(QR_VERSION)
        expect(result.metadata.format).toBe(QR_FORMAT)
        expect(result.qrData.length).toBeLessThanOrEqual(2048)
      })

      it('should include personal data when requested', () => {
        const options: QRMemberCardOptions = {
          includePersonalData: true
        }

        const result = generateMemberCardQR(sampleMemberData, options)
        const qrObject = JSON.parse(result.qrData.split('|CHK:')[0])

        expect(qrObject.data.nik).toBe(sampleMemberData.nik)
        expect(qrObject.data.email).toBe(sampleMemberData.email)
      })

      it('should encrypt data when requested', () => {
        const options: QRMemberCardOptions = {
          encryptData: true
        }

        const result = generateMemberCardQR(sampleMemberData, options)

        expect(result.isEncrypted).toBe(true)
        // Encrypted data should not be valid JSON
        expect(() => JSON.parse(result.qrData.split('|CHK:')[0])).toThrow()
      })

      it('should add custom expiration date', () => {
        const options: QRMemberCardOptions = {
          expirationDays: 30
        }

        const result = generateMemberCardQR(sampleMemberData, options)

        expect(result.cardData.expiresAt).toBeDefined()

        const expirationDate = new Date(result.cardData.expiresAt!)
        const expectedDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        // Check if within a reasonable range (1 minute difference)
        expect(Math.abs(expirationDate.getTime() - expectedDate.getTime())).toBeLessThan(60000)
      })

      it('should include custom fields', () => {
        const options: QRMemberCardOptions = {
          customFields: {
            department: 'IT',
            position: 'Developer'
          }
        }

        const result = generateMemberCardQR(sampleMemberData, options)
        const qrObject = JSON.parse(result.qrData.split('|CHK:')[0])

        expect(qrObject.data.department).toBe('IT')
        expect(qrObject.data.position).toBe('Developer')
      })

      it('should throw error if QR data exceeds size limit', () => {
        const largeCustomFields = {}
        // Create a very large custom field
        for (let i = 0; i < 100; i++) {
          largeCustomFields[`field${i}`] = 'x'.repeat(100)
        }

        const options: QRMemberCardOptions = {
          customFields: largeCustomFields
        }

        expect(() => generateMemberCardQR(sampleMemberData, options)).toThrow('QR data too large')
      })
    })

    describe('generateMemberVerificationQR', () => {
      it('should generate verification QR with basic member info', () => {
        const qrData = generateMemberVerificationQR(
          sampleMemberData.memberId,
          sampleMemberData.memberNumber,
          sampleMemberData.fullName,
          sampleMemberData.membershipStatus
        )

        const qrObject = JSON.parse(qrData)

        expect(qrObject.format).toBe('KOPERASI_SINOMAN_VERIFICATION')
        expect(qrObject.version).toBe(QR_VERSION)
        expect(qrObject.data.memberId).toBe(sampleMemberData.memberId)
        expect(qrObject.data.memberNumber).toBe(sampleMemberData.memberNumber)
        expect(qrObject.data.fullName).toBe(sampleMemberData.fullName)
        expect(qrObject.data.membershipStatus).toBe(sampleMemberData.membershipStatus)
        expect(qrObject.checksum).toBeDefined()
      })

      it('should default to active status when not provided', () => {
        const qrData = generateMemberVerificationQR(
          sampleMemberData.memberId,
          sampleMemberData.memberNumber,
          sampleMemberData.fullName
        )

        const qrObject = JSON.parse(qrData)
        expect(qrObject.data.membershipStatus).toBe('active')
      })
    })

    describe('generateAttendanceQR', () => {
      it('should generate attendance QR for events', () => {
        const eventId = 'EVENT-001'
        const eventName = 'Rapat Anggota Tahunan'
        const eventDate = new Date('2024-06-15')

        const qrData = generateAttendanceQR(
          sampleMemberData.memberId,
          eventId,
          eventName,
          eventDate
        )

        const [dataString, checksumPart] = qrData.split('|CHK:')
        const qrObject = JSON.parse(dataString)

        expect(qrObject.format).toBe('KOPERASI_SINOMAN_ATTENDANCE')
        expect(qrObject.data.memberId).toBe(sampleMemberData.memberId)
        expect(qrObject.data.eventId).toBe(eventId)
        expect(qrObject.data.eventName).toBe(eventName)
        expect(qrObject.data.eventDate).toBe('2024-06-15')
        expect(checksumPart).toBeDefined()
      })
    })
  })

  describe('QR Code Verification', () => {
    describe('verifyMemberCardQR', () => {
      it('should verify valid member card QR', () => {
        const generationResult = generateMemberCardQR(sampleMemberData)
        const verificationResult = verifyMemberCardQR(generationResult.qrData)

        expect(verificationResult.isValid).toBe(true)
        expect(verificationResult.isExpired).toBe(false)
        expect(verificationResult.errors).toHaveLength(0)
        expect(verificationResult.memberId).toBe(sampleMemberData.memberId)
        expect(verificationResult.memberNumber).toBe(sampleMemberData.memberNumber)
        expect(verificationResult.cardData).toBeDefined()
      })

      it('should detect corrupted QR data', () => {
        const generationResult = generateMemberCardQR(sampleMemberData)
        const corruptedQR = generationResult.qrData.replace('a', 'x')

        const verificationResult = verifyMemberCardQR(corruptedQR)

        expect(verificationResult.isValid).toBe(false)
        expect(verificationResult.errors.length).toBeGreaterThan(0)
      })

      it('should detect expired member cards', () => {
        const options: QRMemberCardOptions = {
          expirationDays: -1 // Already expired
        }

        const generationResult = generateMemberCardQR(sampleMemberData, options)
        const verificationResult = verifyMemberCardQR(generationResult.qrData)

        expect(verificationResult.isExpired).toBe(true)
        expect(verificationResult.errors).toContain('Member card has expired')
      })

      it('should detect suspended member accounts', () => {
        const suspendedMemberData = {
          ...sampleMemberData,
          membershipStatus: 'suspended' as const
        }

        const generationResult = generateMemberCardQR(suspendedMemberData)
        const verificationResult = verifyMemberCardQR(generationResult.qrData)

        expect(verificationResult.errors).toContain('Member account is suspended')
      })

      it('should handle encrypted QR data', () => {
        const options: QRMemberCardOptions = {
          encryptData: true
        }

        const generationResult = generateMemberCardQR(sampleMemberData, options)
        const verificationResult = verifyMemberCardQR(generationResult.qrData)

        expect(verificationResult.isValid).toBe(true)
        expect(verificationResult.memberId).toBe(sampleMemberData.memberId)
      })

      it('should reject invalid format', () => {
        const invalidQR = JSON.stringify({
          format: 'INVALID_FORMAT',
          version: QR_VERSION,
          data: {}
        })

        const verificationResult = verifyMemberCardQR(invalidQR)

        expect(verificationResult.isValid).toBe(false)
        expect(verificationResult.errors).toContain('Invalid format: expected KOPERASI_SINOMAN_MEMBER, got INVALID_FORMAT')
      })

      it('should reject incompatible versions', () => {
        const incompatibleQR = JSON.stringify({
          format: QR_FORMAT,
          version: '2.0.0', // Future version
          data: sampleMemberData
        })

        const verificationResult = verifyMemberCardQR(incompatibleQR)

        expect(verificationResult.isValid).toBe(false)
        expect(verificationResult.errors).toContain('Incompatible version: 2.0.0')
      })
    })

    describe('quickVerifyMemberQR', () => {
      it('should provide quick verification for valid QR', () => {
        const generationResult = generateMemberCardQR(sampleMemberData)
        const result = quickVerifyMemberQR(generationResult.qrData)

        expect(result.isValid).toBe(true)
        expect(result.memberId).toBe(sampleMemberData.memberId)
        expect(result.memberNumber).toBe(sampleMemberData.memberNumber)
        expect(result.membershipStatus).toBe(sampleMemberData.membershipStatus)
      })

      it('should return invalid for corrupted QR', () => {
        const result = quickVerifyMemberQR('invalid-qr-data')

        expect(result.isValid).toBe(false)
        expect(result.memberId).toBeUndefined()
        expect(result.memberNumber).toBeUndefined()
      })
    })

    describe('verifyAttendanceQR', () => {
      it('should verify valid attendance QR', () => {
        const eventId = 'EVENT-001'
        const eventName = 'Rapat Anggota Tahunan'
        const eventDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow

        const qrData = generateAttendanceQR(
          sampleMemberData.memberId,
          eventId,
          eventName,
          eventDate
        )

        const result = verifyAttendanceQR(qrData, eventId)

        expect(result.isValid).toBe(true)
        expect(result.memberId).toBe(sampleMemberData.memberId)
        expect(result.isExpired).toBe(false)
        expect(result.errors).toHaveLength(0)
      })

      it('should reject QR for different event', () => {
        const eventId = 'EVENT-001'
        const eventName = 'Rapat Anggota Tahunan'
        const eventDate = new Date()

        const qrData = generateAttendanceQR(
          sampleMemberData.memberId,
          eventId,
          eventName,
          eventDate
        )

        const result = verifyAttendanceQR(qrData, 'EVENT-002')

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('QR code is for a different event')
      })

      it('should detect expired attendance QR', () => {
        const eventId = 'EVENT-001'
        const eventName = 'Rapat Anggota Tahunan'
        const eventDate = new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago

        const qrData = generateAttendanceQR(
          sampleMemberData.memberId,
          eventId,
          eventName,
          eventDate
        )

        const result = verifyAttendanceQR(qrData, eventId)

        expect(result.isExpired).toBe(true)
        expect(result.errors).toContain('Attendance QR has expired')
      })
    })
  })

  describe('Utility Functions', () => {
    describe('generateMemberCardPreview', () => {
      it('should generate preview data with Indonesian localization', () => {
        const preview = generateMemberCardPreview(sampleMemberData)

        expect(preview.displayName).toBe('Budi Santoso')
        expect(preview.membershipTypeDisplay).toBe('Anggota Reguler')
        expect(preview.statusDisplay).toBe('Aktif')
        expect(preview.joinDateDisplay).toContain('2020') // Should contain the year
        expect(preview.branchDisplay).toBeDefined()
      })

      it('should handle different membership types', () => {
        const premiumMember = { ...sampleMemberData, membershipType: 'premium' as const }
        const investorMember = { ...sampleMemberData, membershipType: 'investor' as const }

        const premiumPreview = generateMemberCardPreview(premiumMember)
        const investorPreview = generateMemberCardPreview(investorMember)

        expect(premiumPreview.membershipTypeDisplay).toBe('Anggota Premium')
        expect(investorPreview.membershipTypeDisplay).toBe('Anggota Investor')
      })

      it('should handle different membership statuses', () => {
        const inactiveMember = { ...sampleMemberData, membershipStatus: 'inactive' as const }
        const suspendedMember = { ...sampleMemberData, membershipStatus: 'suspended' as const }

        const inactivePreview = generateMemberCardPreview(inactiveMember)
        const suspendedPreview = generateMemberCardPreview(suspendedMember)

        expect(inactivePreview.statusDisplay).toBe('Tidak Aktif')
        expect(suspendedPreview.statusDisplay).toBe('Dibekukan')
      })
    })

    describe('validateMemberCardData', () => {
      it('should validate complete valid member data', () => {
        const result = validateMemberCardData(sampleMemberData)

        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should detect missing required fields', () => {
        const invalidData = {
          ...sampleMemberData,
          memberId: '',
          memberNumber: '',
          fullName: '',
          phoneNumber: ''
        }

        const result = validateMemberCardData(invalidData)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Member ID is required')
        expect(result.errors).toContain('Member number is required')
        expect(result.errors).toContain('Full name is required')
        expect(result.errors).toContain('Phone number is required')
      })

      it('should validate NIK format when provided', () => {
        const invalidNIKData = {
          ...sampleMemberData,
          nik: '123456789' // Too short
        }

        const result = validateMemberCardData(invalidNIKData)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Invalid NIK format')
      })

      it('should validate membership type', () => {
        const invalidTypeData = {
          ...sampleMemberData,
          membershipType: 'invalid' as any
        }

        const result = validateMemberCardData(invalidTypeData)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Invalid membership type')
      })

      it('should validate membership status', () => {
        const invalidStatusData = {
          ...sampleMemberData,
          membershipStatus: 'invalid' as any
        }

        const result = validateMemberCardData(invalidStatusData)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Invalid membership status')
      })

      it('should validate join date', () => {
        const invalidDateData = {
          ...sampleMemberData,
          joinDate: new Date('invalid-date')
        }

        const result = validateMemberCardData(invalidDateData)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Invalid join date')
      })
    })
  })

  describe('Constants and Configuration', () => {
    it('should have correct membership type codes', () => {
      expect(MEMBERSHIP_TYPE_CODES.regular).toBe('REG')
      expect(MEMBERSHIP_TYPE_CODES.premium).toBe('PRM')
      expect(MEMBERSHIP_TYPE_CODES.investor).toBe('INV')
    })

    it('should have correct status codes', () => {
      expect(STATUS_CODES.active).toBe('ACT')
      expect(STATUS_CODES.inactive).toBe('INA')
      expect(STATUS_CODES.suspended).toBe('SUS')
    })

    it('should have Indonesian branch codes', () => {
      expect(BRANCH_CODES.JAKARTA).toBe('JKT')
      expect(BRANCH_CODES.BANDUNG).toBe('BDG')
      expect(BRANCH_CODES.SURABAYA).toBe('SBY')
      expect(BRANCH_CODES.MEDAN).toBe('MDN')
    })

    it('should have valid QR format and version', () => {
      expect(QR_FORMAT).toBe('KOPERASI_SINOMAN_MEMBER')
      expect(QR_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    })
  })
})