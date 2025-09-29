/**
 * URL utilities and manipulation functions
 */

// Validate URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Parse URL into components
export interface ParsedUrl {
  protocol: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  origin: string
  host: string
}

export function parseUrl(url: string): ParsedUrl | null {
  try {
    const parsed = new URL(url)
    return {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
      origin: parsed.origin,
      host: parsed.host,
    }
  } catch {
    return null
  }
}

// Get domain from URL
export function getDomain(url: string): string | null {
  const parsed = parseUrl(url)
  return parsed ? parsed.hostname : null
}

// Get root domain (remove subdomains)
export function getRootDomain(url: string): string | null {
  const domain = getDomain(url)
  if (!domain) return null

  const parts = domain.split('.')
  if (parts.length <= 2) return domain

  // Handle common TLDs
  const commonTLDs = ['co.uk', 'co.id', 'com.au', 'co.nz', 'co.za']
  const lastTwoParts = parts.slice(-2).join('.')

  if (commonTLDs.includes(lastTwoParts)) {
    return parts.slice(-3).join('.')
  }

  return parts.slice(-2).join('.')
}

// Add query parameters to URL
export function addQueryParams(url: string, params: Record<string, any>): string {
  try {
    const urlObj = new URL(url)

    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // Handle array values
          value.forEach(item => urlObj.searchParams.append(key, String(item)))
        } else {
          urlObj.searchParams.set(key, String(value))
        }
      }
    }

    return urlObj.toString()
  } catch {
    return url
  }
}

// Remove query parameters from URL
export function removeQueryParams(url: string, paramsToRemove: string[]): string {
  try {
    const urlObj = new URL(url)

    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param)
    })

    return urlObj.toString()
  } catch {
    return url
  }
}

// Get query parameters as object
export function getQueryParams(url: string): Record<string, string | string[]> {
  try {
    const urlObj = new URL(url)
    const params: Record<string, string | string[]> = {}

    for (const [key, value] of urlObj.searchParams) {
      if (key in params) {
        // Convert to array if multiple values
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value)
        } else {
          params[key] = [params[key] as string, value]
        }
      } else {
        params[key] = value
      }
    }

    return params
  } catch {
    return {}
  }
}

// Build URL from components
export function buildUrl(
  base: string,
  path: string = '',
  params: Record<string, any> = {},
  hash: string = ''
): string {
  try {
    const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    let url = `${baseUrl}${cleanPath}`

    // Add query parameters
    if (Object.keys(params).length > 0) {
      url = addQueryParams(url, params)
    }

    // Add hash
    if (hash) {
      const cleanHash = hash.startsWith('#') ? hash : `#${hash}`
      url += cleanHash
    }

    return url
  } catch {
    return base
  }
}

// Join URL paths
export function joinUrlPaths(...paths: string[]): string {
  return paths
    .filter(path => path && path.trim() !== '')
    .map((path, index) => {
      // Remove leading/trailing slashes except for first path
      if (index === 0) {
        return path.replace(/\/+$/, '')
      }
      return path.replace(/^\/+|\/+$/g, '')
    })
    .join('/')
}

// Encode URL component safely
export function encodeUrlComponent(str: string): string {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

// Decode URL component safely
export function decodeUrlComponent(str: string): string {
  try {
    return decodeURIComponent(str)
  } catch {
    return str
  }
}

// Normalize URL (remove trailing slash, convert to lowercase, etc.)
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url.toLowerCase())

    // Remove trailing slash from pathname (except root)
    if (urlObj.pathname !== '/') {
      urlObj.pathname = urlObj.pathname.replace(/\/+$/, '')
    }

    // Sort query parameters
    const sortedParams = new URLSearchParams()
    const paramKeys = Array.from(urlObj.searchParams.keys()).sort()

    paramKeys.forEach(key => {
      const values = urlObj.searchParams.getAll(key)
      values.forEach(value => sortedParams.append(key, value))
    })

    urlObj.search = sortedParams.toString()

    return urlObj.toString()
  } catch {
    return url
  }
}

// Check if URL is external (different domain)
export function isExternalUrl(url: string, baseUrl: string): boolean {
  try {
    const targetDomain = getDomain(url)
    const baseDomain = getDomain(baseUrl)

    if (!targetDomain || !baseDomain) return false

    return targetDomain !== baseDomain
  } catch {
    return false
  }
}

// Check if URL uses HTTPS
export function isSecureUrl(url: string): boolean {
  const parsed = parseUrl(url)
  return parsed ? parsed.protocol === 'https:' : false
}

// Convert to HTTPS if possible
export function toHttps(url: string): string {
  if (!url.startsWith('http:')) return url
  return url.replace('http:', 'https:')
}

// Check if URL is valid image URL
export function isImageUrl(url: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico']
  const parsed = parseUrl(url)

  if (!parsed) return false

  const extension = parsed.pathname.split('.').pop()?.toLowerCase()
  return extension ? imageExtensions.includes(extension) : false
}

// Extract filename from URL
export function getFilenameFromUrl(url: string): string | null {
  const parsed = parseUrl(url)
  if (!parsed) return null

  const pathParts = parsed.pathname.split('/')
  const filename = pathParts[pathParts.length - 1]

  return filename && filename.includes('.') ? filename : null
}

// Create data URL
export function createDataUrl(data: string, mimeType: string = 'text/plain'): string {
  const base64Data = btoa(unescape(encodeURIComponent(data)))
  return `data:${mimeType};base64,${base64Data}`
}

// Parse data URL
export interface ParsedDataUrl {
  mimeType: string
  charset: string
  base64: boolean
  data: string
}

export function parseDataUrl(dataUrl: string): ParsedDataUrl | null {
  const match = dataUrl.match(/^data:([^;]+)(;charset=([^;]+))?(;base64)?,(.*)$/)
  if (!match) return null

  const [, mimeType, , charset = 'US-ASCII', base64Flag, data] = match

  return {
    mimeType,
    charset,
    base64: !!base64Flag,
    data: base64Flag ? atob(data) : decodeURIComponent(data),
  }
}

// Shorten URL for display
export function shortenUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url

  const parsed = parseUrl(url)
  if (!parsed) return url.substring(0, maxLength) + '...'

  const domain = parsed.hostname
  const path = parsed.pathname + parsed.search + parsed.hash

  if (domain.length >= maxLength) {
    return domain.substring(0, maxLength - 3) + '...'
  }

  const availableLength = maxLength - domain.length - 3 // 3 for '...'
  if (path.length <= availableLength) {
    return domain + path
  }

  return domain + path.substring(0, availableLength) + '...'
}

// Generate slug from text for URL
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Validate email URL (mailto)
export function isValidMailtoUrl(url: string): boolean {
  return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+/.test(url)
}

// Validate phone URL (tel)
export function isValidTelUrl(url: string): boolean {
  return /^tel:\+?[\d\s-()]+$/.test(url)
}

// Get URL without query parameters and hash
export function getCleanUrl(url: string): string {
  const parsed = parseUrl(url)
  if (!parsed) return url

  return `${parsed.protocol}//${parsed.host}${parsed.pathname}`
}

// Check if URL is localhost
export function isLocalhost(url: string): boolean {
  const parsed = parseUrl(url)
  if (!parsed) return false

  const hostname = parsed.hostname.toLowerCase()
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

// Add or update query parameter
export function setQueryParam(url: string, key: string, value: string): string {
  try {
    const urlObj = new URL(url)
    urlObj.searchParams.set(key, value)
    return urlObj.toString()
  } catch {
    return url
  }
}

// Get specific query parameter
export function getQueryParam(url: string, key: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.searchParams.get(key)
  } catch {
    return null
  }
}