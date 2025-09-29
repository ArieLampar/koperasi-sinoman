/**
 * Vitest setup file
 * Global test configuration and utilities
 */

import { beforeEach, afterEach, vi } from 'vitest'

// Mock console methods in tests to reduce noise
beforeEach(() => {
  // Mock console.warn and console.error to prevent test output pollution
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  // Restore all mocks after each test
  vi.restoreAllMocks()
  // Clear all timers
  vi.clearAllTimers()
})

// Global test utilities
declare global {
  const TestUtils: {
    createMockDate: (dateString: string) => Date
    generateTestId: (length?: number) => string
    createMockPhoneNumber: (valid?: boolean) => string
    createMockEmail: (valid?: boolean) => string
    createMockNIK: (valid?: boolean) => string
  }
}

// Test utilities available globally in tests
globalThis.TestUtils = {
  createMockDate: (dateString: string) => new Date(dateString),

  generateTestId: (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  createMockPhoneNumber: (valid = true) => {
    if (valid) {
      return '081234567890'
    }
    return '123'
  },

  createMockEmail: (valid = true) => {
    if (valid) {
      return 'test@example.com'
    }
    return 'invalid-email'
  },

  createMockNIK: (valid = true) => {
    if (valid) {
      // Generate a valid-format NIK (16 digits)
      return '3502011234567890'
    }
    return '123'
  },
}

// Mock crypto for Node.js environments that don't have it
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto')
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => crypto.randomUUID(),
      getRandomValues: (arr: Uint8Array) => crypto.getRandomValues(arr),
    },
  })
}

// Increase test timeout for integration tests
vi.setConfig({
  testTimeout: 10000,
})