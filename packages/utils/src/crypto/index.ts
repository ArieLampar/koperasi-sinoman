/**
 * Cryptographic utilities and security functions
 */

import { createHash, createHmac, randomBytes, pbkdf2Sync } from 'crypto'
import { nanoid } from 'nanoid'

// Generate secure random string
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

// Generate URL-safe random ID
export function generateId(length: number = 21): string {
  return nanoid(length)
}

// Generate custom alphabet ID
export function generateCustomId(alphabet: string, length: number = 21): string {
  return nanoid(length, alphabet)
}

// Generate numeric ID
export function generateNumericId(length: number = 8): string {
  return generateCustomId('0123456789', length)
}

// Generate alphanumeric ID (uppercase)
export function generateAlphanumericId(length: number = 8): string {
  return generateCustomId('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', length)
}

// Hash functions
export function md5(data: string): string {
  return createHash('md5').update(data).digest('hex')
}

export function sha1(data: string): string {
  return createHash('sha1').update(data).digest('hex')
}

export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

export function sha512(data: string): string {
  return createHash('sha512').update(data).digest('hex')
}

// HMAC functions
export function hmacSha256(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex')
}

export function hmacSha512(data: string, secret: string): string {
  return createHmac('sha512', secret).update(data).digest('hex')
}

// Password hashing with PBKDF2
export interface HashOptions {
  iterations?: number
  keyLength?: number
  salt?: string
}

export function hashPassword(
  password: string,
  options: HashOptions = {}
): { hash: string; salt: string } {
  const { iterations = 100000, keyLength = 64 } = options
  const salt = options.salt || randomBytes(32).toString('hex')

  const hash = pbkdf2Sync(password, salt, iterations, keyLength, 'sha512').toString('hex')

  return { hash, salt }
}

// Verify password
export function verifyPassword(
  password: string,
  hash: string,
  salt: string,
  options: HashOptions = {}
): boolean {
  const { iterations = 100000, keyLength = 64 } = options

  const verifyHash = pbkdf2Sync(password, salt, iterations, keyLength, 'sha512').toString('hex')

  return hash === verifyHash
}

// Constant-time string comparison (prevents timing attacks)
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

// Generate salt
export function generateSalt(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

// Generate random bytes as hex
export function generateRandomHex(length: number = 16): string {
  return randomBytes(length).toString('hex')
}

// Generate random bytes as base64
export function generateRandomBase64(length: number = 16): string {
  return randomBytes(length).toString('base64')
}

// Generate UUID v4 (random)
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Base64 encoding/decoding utilities
export function base64Encode(data: string): string {
  return Buffer.from(data, 'utf8').toString('base64')
}

export function base64Decode(data: string): string {
  return Buffer.from(data, 'base64').toString('utf8')
}

// URL-safe Base64 encoding/decoding
export function base64UrlEncode(data: string): string {
  return base64Encode(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function base64UrlDecode(data: string): string {
  // Add padding if needed
  const padding = 4 - (data.length % 4)
  const padded = padding === 4 ? data : data + '='.repeat(padding)

  return base64Decode(
    padded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
  )
}

// Hex encoding/decoding utilities
export function hexEncode(data: string): string {
  return Buffer.from(data, 'utf8').toString('hex')
}

export function hexDecode(data: string): string {
  return Buffer.from(data, 'hex').toString('utf8')
}

// Simple encryption/decryption (for non-sensitive data)
export function simpleEncrypt(text: string, key: string): string {
  const cipher = createHash('sha256').update(key).digest()
  let result = ''

  for (let i = 0; i < text.length; i++) {
    const keyChar = cipher[i % cipher.length]
    const encryptedChar = String.fromCharCode(text.charCodeAt(i) ^ keyChar)
    result += encryptedChar
  }

  return base64Encode(result)
}

export function simpleDecrypt(encryptedText: string, key: string): string {
  const cipher = createHash('sha256').update(key).digest()
  const text = base64Decode(encryptedText)
  let result = ''

  for (let i = 0; i < text.length; i++) {
    const keyChar = cipher[i % cipher.length]
    const decryptedChar = String.fromCharCode(text.charCodeAt(i) ^ keyChar)
    result += decryptedChar
  }

  return result
}

// Generate cryptographically secure random number
export function secureRandom(min: number = 0, max: number = 1): number {
  const range = max - min
  const bytesNeeded = Math.ceil(Math.log2(range) / 8)
  const maxValidValue = Math.floor(256 ** bytesNeeded / range) * range

  let randomValue: number
  do {
    const randomBytes = randomBytes(bytesNeeded)
    randomValue = randomBytes.readUIntBE(0, bytesNeeded)
  } while (randomValue >= maxValidValue)

  return min + (randomValue % range)
}

// Generate secure random integer
export function secureRandomInt(min: number, max: number): number {
  return Math.floor(secureRandom(min, max + 1))
}

// Generate OTP (One-Time Password)
export function generateOTP(length: number = 6): string {
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += secureRandomInt(0, 9).toString()
  }
  return otp
}

// Generate API key
export function generateApiKey(prefix: string = '', length: number = 32): string {
  const key = generateSecureToken(length)
  return prefix ? `${prefix}_${key}` : key
}

// Generate session token
export function generateSessionToken(): string {
  return generateSecureToken(48)
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return generateSecureToken(32)
}

// Mask sensitive data (for logging)
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (!data || data.length <= visibleChars * 2) {
    return '*'.repeat(data?.length || 0)
  }

  const start = data.substring(0, visibleChars)
  const end = data.substring(data.length - visibleChars)
  const masked = '*'.repeat(data.length - (visibleChars * 2))

  return `${start}${masked}${end}`
}

// Validate hash format
export function isValidHash(hash: string, algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512'): boolean {
  const lengths = {
    md5: 32,
    sha1: 40,
    sha256: 64,
    sha512: 128
  }

  const expectedLength = lengths[algorithm]
  return hash.length === expectedLength && /^[a-f0-9]+$/i.test(hash)
}

// Generate checksum for data integrity
export function generateChecksum(data: string): string {
  return sha256(data).substring(0, 8)
}

// Verify checksum
export function verifyChecksum(data: string, checksum: string): boolean {
  const calculatedChecksum = generateChecksum(data)
  return constantTimeEqual(calculatedChecksum, checksum)
}

// Generate fingerprint for objects
export function generateFingerprint(obj: any): string {
  const serialized = JSON.stringify(obj, Object.keys(obj).sort())
  return sha256(serialized).substring(0, 16)
}

// Time-based token generation (expires after certain time)
export interface TimedToken {
  token: string
  expires: number
}

export function generateTimedToken(expiresInMs: number = 3600000): TimedToken {
  const token = generateSecureToken()
  const expires = Date.now() + expiresInMs

  return { token, expires }
}

export function isTimedTokenValid(token: TimedToken): boolean {
  return Date.now() < token.expires
}

// Key derivation function
export function deriveKey(
  password: string,
  salt: string,
  iterations: number = 100000,
  keyLength: number = 32
): string {
  return pbkdf2Sync(password, salt, iterations, keyLength, 'sha256').toString('hex')
}

// Secure comparison for tokens/hashes
export function secureCompare(a: string, b: string): boolean {
  return constantTimeEqual(a, b)
}