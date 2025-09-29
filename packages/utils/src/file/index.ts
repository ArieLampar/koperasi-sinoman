/**
 * File utilities and helpers
 */

// File size formatting
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

// Parse file size string to bytes
export function parseFileSize(sizeStr: string): number {
  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
    PB: 1024 ** 5,
  }

  const match = sizeStr.trim().match(/^(\d+(?:\.\d+)?)\s*([A-Z]{1,2})$/i)
  if (!match) return 0

  const [, size, unit] = match
  const unitMultiplier = units[unit.toUpperCase()]

  return unitMultiplier ? parseFloat(size) * unitMultiplier : 0
}

// Get file extension
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex + 1).toLowerCase()
}

// Get file name without extension
export function getFileNameWithoutExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  return lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex)
}

// Validate file type by extension
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = getFileExtension(filename)
  return allowedTypes.map(type => type.toLowerCase()).includes(extension)
}

// Common file type groups
export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'],
  VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'],
  AUDIO: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'],
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
  CODE: ['js', 'ts', 'html', 'css', 'php', 'py', 'java', 'cpp', 'c', 'rb', 'go'],
} as const

// Check if file is image
export function isImageFile(filename: string): boolean {
  return isValidFileType(filename, FILE_TYPES.IMAGE)
}

// Check if file is document
export function isDocumentFile(filename: string): boolean {
  return isValidFileType(filename, FILE_TYPES.DOCUMENT)
}

// Check if file is video
export function isVideoFile(filename: string): boolean {
  return isValidFileType(filename, FILE_TYPES.VIDEO)
}

// Check if file is audio
export function isAudioFile(filename: string): boolean {
  return isValidFileType(filename, FILE_TYPES.AUDIO)
}

// Check if file is archive
export function isArchiveFile(filename: string): boolean {
  return isValidFileType(filename, FILE_TYPES.ARCHIVE)
}

// Check if file is code
export function isCodeFile(filename: string): boolean {
  return isValidFileType(filename, FILE_TYPES.CODE)
}

// Get MIME type from file extension
export function getMimeType(filename: string): string {
  const extension = getFileExtension(filename)

  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',

    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    rtf: 'application/rtf',

    // Video
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    '3gp': 'video/3gpp',

    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    wma: 'audio/x-ms-wma',

    // Archives
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    bz2: 'application/x-bzip2',
    xz: 'application/x-xz',

    // Code
    js: 'application/javascript',
    ts: 'application/typescript',
    html: 'text/html',
    css: 'text/css',
    php: 'application/x-php',
    py: 'text/x-python',
    java: 'text/x-java-source',
    cpp: 'text/x-c++src',
    c: 'text/x-csrc',
    rb: 'application/x-ruby',
    go: 'text/x-go',

    // Others
    json: 'application/json',
    xml: 'application/xml',
    csv: 'text/csv',
  }

  return mimeTypes[extension] || 'application/octet-stream'
}

// Generate safe filename
export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase()
}

// Generate unique filename
export function generateUniqueFilename(originalName: string, existingFiles: string[] = []): string {
  const extension = getFileExtension(originalName)
  const nameWithoutExt = getFileNameWithoutExtension(originalName)
  const sanitizedName = sanitizeFilename(nameWithoutExt)

  let counter = 0
  let filename = extension ? `${sanitizedName}.${extension}` : sanitizedName

  while (existingFiles.includes(filename)) {
    counter++
    filename = extension
      ? `${sanitizedName}_${counter}.${extension}`
      : `${sanitizedName}_${counter}`
  }

  return filename
}

// Validate file size
export function isValidFileSize(fileSize: number, maxSize: number): boolean {
  return fileSize <= maxSize
}

// File path utilities
export function getDirectoryPath(filePath: string): string {
  const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  return lastSlashIndex === -1 ? '' : filePath.substring(0, lastSlashIndex)
}

export function getFileName(filePath: string): string {
  const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  return lastSlashIndex === -1 ? filePath : filePath.substring(lastSlashIndex + 1)
}

export function joinPaths(...paths: string[]): string {
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

// Create file info object
export interface FileInfo {
  name: string
  nameWithoutExtension: string
  extension: string
  size: number
  formattedSize: string
  mimeType: string
  isImage: boolean
  isDocument: boolean
  isVideo: boolean
  isAudio: boolean
  isArchive: boolean
  isCode: boolean
}

export function getFileInfo(filename: string, size: number): FileInfo {
  const extension = getFileExtension(filename)
  const nameWithoutExtension = getFileNameWithoutExtension(filename)
  const mimeType = getMimeType(filename)

  return {
    name: filename,
    nameWithoutExtension,
    extension,
    size,
    formattedSize: formatFileSize(size),
    mimeType,
    isImage: isImageFile(filename),
    isDocument: isDocumentFile(filename),
    isVideo: isVideoFile(filename),
    isAudio: isAudioFile(filename),
    isArchive: isArchiveFile(filename),
    isCode: isCodeFile(filename),
  }
}

// File validation for uploads
export interface FileValidationOptions {
  maxSize?: number
  allowedTypes?: string[]
  allowedMimeTypes?: string[]
  minSize?: number
}

export interface FileValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateFile(
  filename: string,
  size: number,
  options: FileValidationOptions = {}
): FileValidationResult {
  const errors: string[] = []
  const extension = getFileExtension(filename)
  const mimeType = getMimeType(filename)

  // Check file size
  if (options.minSize && size < options.minSize) {
    errors.push(`File size must be at least ${formatFileSize(options.minSize)}`)
  }

  if (options.maxSize && size > options.maxSize) {
    errors.push(`File size must not exceed ${formatFileSize(options.maxSize)}`)
  }

  // Check file type by extension
  if (options.allowedTypes && !isValidFileType(filename, options.allowedTypes)) {
    errors.push(`File type .${extension} is not allowed`)
  }

  // Check MIME type
  if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(mimeType)) {
    errors.push(`MIME type ${mimeType} is not allowed`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Convert bytes to human readable format with binary units
export function formatFileSizeBinary(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

// Convert bytes to human readable format with decimal units
export function formatFileSizeDecimal(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B'

  const k = 1000
  const sizes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

// Generate file hash (for duplicate detection)
export function generateFileHash(content: string | Buffer): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(content).digest('hex')
}

// Check if filename has valid characters
export function hasValidFilenameCharacters(filename: string): boolean {
  // Check for invalid characters in filename
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
  return !invalidChars.test(filename)
}

// Get file type category
export function getFileCategory(filename: string): string {
  if (isImageFile(filename)) return 'image'
  if (isDocumentFile(filename)) return 'document'
  if (isVideoFile(filename)) return 'video'
  if (isAudioFile(filename)) return 'audio'
  if (isArchiveFile(filename)) return 'archive'
  if (isCodeFile(filename)) return 'code'
  return 'other'
}