/**
 * Test file demonstrating validation utilities
 */

import { describe, it, expect } from 'vitest'
import {
  validateNIK,
  validatePhoneNumber,
  validateEmail,
  validatePasswordStrength,
  validateNPWP,
  validateIndonesianID
} from './index'

describe('Indonesian Validation Utils', () => {
  describe('validateNIK', () => {
    it('should validate correct NIK format', () => {
      expect(validateNIK('3502011234567890')).toBe(true)
      expect(validateNIK('1234567890123456')).toBe(true)
    })

    it('should reject invalid NIK format', () => {
      expect(validateNIK('123')).toBe(false)
      expect(validateNIK('12345678901234567')).toBe(false)
      expect(validateNIK('')).toBe(false)
      expect(validateNIK('abcd1234567890ef')).toBe(false)
    })

    it('should validate NIK with proper province and district codes', () => {
      // Jakarta (31)
      expect(validateNIK('3101011234567890')).toBe(true)
      // Invalid province code (95)
      expect(validateNIK('9501011234567890')).toBe(false)
    })
  })

  describe('validatePhoneNumber', () => {
    it('should validate Indonesian phone numbers', () => {
      expect(validatePhoneNumber('081234567890')).toBe(true)
      expect(validatePhoneNumber('+6281234567890')).toBe(true)
      expect(validatePhoneNumber('6281234567890')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false)
      expect(validatePhoneNumber('')).toBe(false)
      expect(validatePhoneNumber('12345')).toBe(false)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.id')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
    })
  })

  describe('validatePasswordStrength', () => {
    it('should validate strong passwords', () => {
      const result = validatePasswordStrength('StrongPass123!')
      expect(result.isValid).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(4)
    })

    it('should reject weak passwords', () => {
      const result = validatePasswordStrength('weak')
      expect(result.isValid).toBe(false)
      expect(result.feedback.length).toBeGreaterThan(0)
    })
  })

  describe('validateNPWP', () => {
    it('should validate NPWP format', () => {
      expect(validateNPWP('123456789012345')).toBe(true)
    })

    it('should reject invalid NPWP', () => {
      expect(validateNPWP('123')).toBe(false)
      expect(validateNPWP('000000000012345')).toBe(false)
    })
  })

  describe('validateIndonesianID', () => {
    it('should detect NIK format', () => {
      const result = validateIndonesianID('1234567890123456')
      expect(result.isValid).toBe(true)
      expect(result.type).toBe('nik')
      expect(result.formatted).toBe('12.34.56.789012.3456')
    })

    it('should detect NPWP format', () => {
      const result = validateIndonesianID('123456789012345')
      expect(result.isValid).toBe(true)
      expect(result.type).toBe('npwp')
    })

    it('should handle unknown formats', () => {
      const result = validateIndonesianID('123')
      expect(result.isValid).toBe(false)
      expect(result.type).toBe('unknown')
    })
  })
})