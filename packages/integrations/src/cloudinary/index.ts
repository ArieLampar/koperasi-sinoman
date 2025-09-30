import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary'
import { Readable } from 'stream'

// =============================================================================
// CLOUDINARY CONFIGURATION
// =============================================================================

interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
  secure?: boolean
}

export class CloudinaryService {
  private isConfigured = false

  constructor(config?: CloudinaryConfig) {
    if (config) {
      this.configure(config)
    } else {
      this.configureFromEnv()
    }
  }

  /**
   * Configure Cloudinary with provided config
   */
  configure(config: CloudinaryConfig) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: config.secure ?? true
    })
    this.isConfigured = true
  }

  /**
   * Configure Cloudinary from environment variables
   */
  configureFromEnv() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Missing Cloudinary environment variables. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.')
    }

    this.configure({
      cloudName,
      apiKey,
      apiSecret,
      secure: true
    })
  }

  /**
   * Check if Cloudinary is properly configured
   */
  private ensureConfigured() {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please call configure() first.')
    }
  }

  // =============================================================================
  // FILE UPLOAD METHODS
  // =============================================================================

  /**
   * Upload file from buffer
   */
  async uploadFromBuffer(
    buffer: Buffer,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    this.ensureConfigured()

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          ...this.getUploadOptions(options)
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(new CloudinaryError(error.message, error.http_code))
          } else if (result) {
            resolve(this.formatUploadResult(result))
          } else {
            reject(new CloudinaryError('Upload failed - no result returned'))
          }
        }
      )

      // Convert buffer to stream and pipe to Cloudinary
      const bufferStream = new Readable()
      bufferStream.push(buffer)
      bufferStream.push(null)
      bufferStream.pipe(uploadStream)
    })
  }

  /**
   * Upload file from URL
   */
  async uploadFromUrl(
    url: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    this.ensureConfigured()

    try {
      const result = await cloudinary.uploader.upload(url, {
        resource_type: 'auto',
        ...this.getUploadOptions(options)
      })

      return this.formatUploadResult(result)
    } catch (error: any) {
      throw new CloudinaryError(error.message, error.http_code)
    }
  }

  /**
   * Generate optimized image URL with transformations
   */
  getOptimizedImageUrl(
    publicId: string,
    transformations: ImageTransformations = {}
  ): string {
    this.ensureConfigured()

    return cloudinary.url(publicId, {
      secure: true,
      ...this.getTransformationOptions(transformations)
    })
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    this.ensureConfigured()

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    } catch (error: any) {
      throw new CloudinaryError(`Failed to delete file: ${error.message}`)
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(file: CloudinaryFile): ValidationResult {
    const errors: string[] = []

    // Validate file size (default 10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`)
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov']
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private getUploadOptions(options: CloudinaryUploadOptions) {
    return {
      folder: options.folder || 'koperasi-sinoman',
      public_id: options.publicId,
      use_filename: options.useFilename ?? true,
      unique_filename: options.uniqueFilename ?? true,
      overwrite: options.overwrite ?? false,
      tags: options.tags,
      context: options.context,
      transformation: options.transformation
    }
  }

  private getTransformationOptions(transformations: ImageTransformations) {
    return {
      width: transformations.width,
      height: transformations.height,
      crop: transformations.crop || 'fill',
      gravity: transformations.gravity || 'auto',
      quality: transformations.quality || 'auto:good',
      format: transformations.format || 'auto',
      fetch_format: 'auto',
      flags: transformations.progressive ? 'progressive' : undefined,
      effect: transformations.effect,
      radius: transformations.radius,
      border: transformations.border,
      overlay: transformations.overlay
    }
  }

  private formatUploadResult(result: UploadApiResponse): CloudinaryUploadResult {
    return {
      publicId: result.public_id,
      version: result.version,
      signature: result.signature,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
      createdAt: new Date(result.created_at),
      bytes: result.bytes,
      type: result.type,
      url: result.secure_url,
      originalFilename: result.original_filename,
      tags: result.tags || []
    }
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface CloudinaryUploadOptions {
  folder?: string
  publicId?: string
  useFilename?: boolean
  uniqueFilename?: boolean
  overwrite?: boolean
  tags?: string[]
  context?: Record<string, string>
  transformation?: any
}

export interface CloudinaryUploadResult {
  publicId: string
  version: number
  signature: string
  width?: number
  height?: number
  format: string
  resourceType: string
  createdAt: Date
  bytes: number
  type: string
  url: string
  originalFilename?: string
  tags: string[]
}

export interface ImageTransformations {
  width?: number
  height?: number
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'pad'
  gravity?: 'auto' | 'center' | 'face' | 'faces' | 'north' | 'south' | 'east' | 'west'
  quality?: 'auto' | 'auto:good' | 'auto:best' | 'auto:eco' | number
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'gif'
  progressive?: boolean
  effect?: string
  radius?: number | string
  border?: string
  overlay?: string
}

export interface CloudinaryFile {
  name: string
  type: string
  size: number
  buffer?: Buffer
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export class CloudinaryError extends Error {
  constructor(
    message: string,
    public httpCode?: number
  ) {
    super(message)
    this.name = 'CloudinaryError'
  }
}

/**
 * Create a new Cloudinary service instance
 */
export function createCloudinaryService(config?: CloudinaryConfig): CloudinaryService {
  return new CloudinaryService(config)
}

/**
 * Convert File or Blob to CloudinaryFile
 */
export async function fileToCloudinaryFile(file: File | Blob): Promise<CloudinaryFile> {
  const buffer = Buffer.from(await file.arrayBuffer())

  return {
    name: 'name' in file ? file.name : 'unnamed',
    type: file.type,
    size: file.size,
    buffer
  }
}

export default CloudinaryService