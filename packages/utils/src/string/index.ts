/**
 * String utilities and text manipulation functions
 */

import slug from 'slug'

// Capitalize first letter
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Capitalize first letter of each word
export function capitalizeWords(str: string): string {
  if (!str) return ''
  return str.toLowerCase().split(' ').map(capitalize).join(' ')
}

// Convert to camelCase
export function toCamelCase(str: string): string {
  if (!str) return ''
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase()
    })
    .replace(/\s+/g, '')
}

// Convert to PascalCase
export function toPascalCase(str: string): string {
  if (!str) return ''
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, letter => letter.toUpperCase())
    .replace(/\s+/g, '')
}

// Convert to snake_case
export function toSnakeCase(str: string): string {
  if (!str) return ''
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_')
}

// Convert to kebab-case
export function toKebabCase(str: string): string {
  if (!str) return ''
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('-')
}

// Create URL-friendly slug
export function createSlug(str: string, options: { lower?: boolean } = {}): string {
  const { lower = true } = options
  return slug(str, { lower })
}

// Truncate string with ellipsis
export function truncate(str: string, length: number, suffix: string = '...'): string {
  if (!str || str.length <= length) return str
  return str.substring(0, length - suffix.length) + suffix
}

// Truncate by words
export function truncateWords(str: string, wordCount: number, suffix: string = '...'): string {
  if (!str) return ''
  const words = str.split(/\s+/)
  if (words.length <= wordCount) return str
  return words.slice(0, wordCount).join(' ') + suffix
}

// Pad string to specific length
export function padLeft(str: string, length: number, char: string = ' '): string {
  if (!str) str = ''
  return str.padStart(length, char)
}

export function padRight(str: string, length: number, char: string = ' '): string {
  if (!str) str = ''
  return str.padEnd(length, char)
}

// Remove extra whitespace
export function normalizeWhitespace(str: string): string {
  if (!str) return ''
  return str.replace(/\s+/g, ' ').trim()
}

// Count words
export function countWords(str: string): number {
  if (!str) return 0
  return str.trim().split(/\s+/).filter(word => word.length > 0).length
}

// Count characters (excluding spaces)
export function countCharacters(str: string, includeSpaces: boolean = true): number {
  if (!str) return 0
  return includeSpaces ? str.length : str.replace(/\s/g, '').length
}

// Extract numbers from string
export function extractNumbers(str: string): number[] {
  if (!str) return []
  const matches = str.match(/\d+\.?\d*/g)
  return matches ? matches.map(Number) : []
}

// Extract email addresses
export function extractEmails(str: string): string[] {
  if (!str) return []
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  return str.match(emailRegex) || []
}

// Extract URLs
export function extractUrls(str: string): string[] {
  if (!str) return []
  const urlRegex = /https?:\/\/[^\s]+/g
  return str.match(urlRegex) || []
}

// Remove HTML tags
export function stripHtml(str: string): string {
  if (!str) return ''
  return str.replace(/<[^>]*>/g, '')
}

// Escape HTML entities
export function escapeHtml(str: string): string {
  if (!str) return ''
  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  }
  return str.replace(/[&<>"'\/]/g, char => entityMap[char])
}

// Unescape HTML entities
export function unescapeHtml(str: string): string {
  if (!str) return ''
  const entityMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/',
  }
  return str.replace(/&[^;]+;/g, entity => entityMap[entity] || entity)
}

// Generate random string
export function generateRandomString(
  length: number,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

// Generate random alphanumeric string
export function generateId(length: number = 8): string {
  return generateRandomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')
}

// Check if string contains only digits
export function isNumeric(str: string): boolean {
  if (!str) return false
  return /^\d+$/.test(str)
}

// Check if string contains only letters
export function isAlpha(str: string): boolean {
  if (!str) return false
  return /^[a-zA-Z]+$/.test(str)
}

// Check if string contains only letters and numbers
export function isAlphanumeric(str: string): boolean {
  if (!str) return false
  return /^[a-zA-Z0-9]+$/.test(str)
}

// Check if string is empty or only whitespace
export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0
}

// Reverse string
export function reverse(str: string): string {
  if (!str) return ''
  return str.split('').reverse().join('')
}

// Check if string is palindrome
export function isPalindrome(str: string): boolean {
  if (!str) return false
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '')
  return cleaned === reverse(cleaned)
}

// Get string similarity (Levenshtein distance)
export function levenshteinDistance(str1: string, str2: string): number {
  if (!str1 || !str2) return Math.max(str1?.length || 0, str2?.length || 0)

  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

// Calculate string similarity percentage
export function similarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 100
  if (!str1 || !str2) return 0

  const maxLength = Math.max(str1.length, str2.length)
  const distance = levenshteinDistance(str1, str2)
  return ((maxLength - distance) / maxLength) * 100
}

// Replace multiple occurrences
export function replaceAll(str: string, search: string | RegExp, replace: string): string {
  if (!str) return ''
  return str.replace(new RegExp(search, 'g'), replace)
}

// Insert string at position
export function insertAt(str: string, index: number, insert: string): string {
  if (!str) return insert
  if (index < 0) index = 0
  if (index > str.length) index = str.length
  return str.slice(0, index) + insert + str.slice(index)
}

// Remove characters at position
export function removeAt(str: string, index: number, count: number = 1): string {
  if (!str || index < 0 || index >= str.length) return str
  return str.slice(0, index) + str.slice(index + count)
}

// Split string into chunks
export function chunk(str: string, size: number): string[] {
  if (!str || size <= 0) return []
  const chunks: string[] = []
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size))
  }
  return chunks
}

// Word wrap
export function wordWrap(str: string, width: number): string {
  if (!str || width <= 0) return str

  const words = str.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + word).length <= width) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      if (currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        // Word is longer than width, split it
        const chunks = chunk(word, width)
        lines.push(...chunks.slice(0, -1))
        currentLine = chunks[chunks.length - 1] || ''
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.join('\n')
}

// Indonesian-specific string utilities
export function removeIndonesianStopWords(str: string): string {
  if (!str) return ''

  const stopWords = [
    'yang', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'dalam', 'adalah', 'ini', 'itu',
    'dan', 'atau', 'juga', 'akan', 'dapat', 'bisa', 'tidak', 'ada', 'saya', 'kami', 'kita',
    'dia', 'mereka', 'sudah', 'belum', 'sedang', 'masih', 'selalu', 'pernah', 'jika', 'kalau',
    'karena', 'sebab', 'maka', 'lalu', 'kemudian', 'setelah', 'sebelum', 'saat', 'ketika'
  ]

  return str
    .split(/\s+/)
    .filter(word => !stopWords.includes(word.toLowerCase()))
    .join(' ')
}

// Format Indonesian names properly
export function formatIndonesianName(name: string): string {
  if (!name) return ''

  // Common Indonesian name particles that should be lowercase
  const particles = ['bin', 'binti', 'van', 'de', 'der', 'von', 'al', 'el']

  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (particles.includes(word)) {
        return word
      }
      return capitalize(word)
    })
    .join(' ')
}

// Clean Indonesian text (remove diacritics)
export function cleanIndonesianText(str: string): string {
  if (!str) return ''

  const diacriticsMap: Record<string, string> = {
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ā': 'a', 'ă': 'a',
    'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e', 'ē': 'e', 'ĕ': 'e',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i', 'ī': 'i', 'ĭ': 'i',
    'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'ō': 'o', 'ŏ': 'o',
    'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u', 'ū': 'u', 'ŭ': 'u',
    'ý': 'y', 'ỳ': 'y', 'ÿ': 'y', 'ŷ': 'y',
    'ñ': 'n', 'ç': 'c'
  }

  return str.replace(/[áàäâāăéèëêēĕíìïîīĭóòöôōŏúùüûūŭýỳÿŷñç]/g, match => diacriticsMap[match] || match)
}