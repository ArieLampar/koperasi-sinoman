import { z } from 'zod'
import { VALIDATION_PATTERNS } from '../utils/validators'

// Common field schemas
export const uuidSchema = z.string().uuid('Invalid UUID format')

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')

export const phoneSchema = z
  .string()
  .regex(VALIDATION_PATTERNS.PHONE, 'Invalid phone number format')

export const nikSchema = z
  .string()
  .regex(VALIDATION_PATTERNS.NIK, 'NIK must be exactly 16 digits')

export const postalCodeSchema = z
  .string()
  .regex(/^\d{5}$/, 'Postal code must be 5 digits')
  .optional()

export const amountSchema = z
  .number()
  .min(0, 'Amount must be positive')
  .max(999999999999.99, 'Amount too large')

export const percentageSchema = z
  .number()
  .min(0, 'Percentage must be positive')
  .max(100, 'Percentage cannot exceed 100')

// Date schemas
export const dateSchema = z.string().datetime('Invalid date format')

export const birthDateSchema = z
  .string()
  .datetime('Invalid birth date format')
  .refine((date) => {
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age

    return actualAge >= 17 && actualAge <= 100
  }, 'Age must be between 17 and 100 years')

// Enum schemas
export const genderSchema = z.enum(['male', 'female'])

export const membershipStatusSchema = z.enum(['pending', 'active', 'suspended', 'inactive'])

export const membershipTypeSchema = z.enum(['regular', 'investor', 'premium'])

export const kycStatusSchema = z.enum(['pending', 'verified', 'rejected'])

export const verificationStatusSchema = z.enum(['pending', 'approved', 'rejected'])

export const documentTypeSchema = z.enum(['ktp', 'selfie', 'kk', 'npwp', 'bank_statement'])

export const transactionStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled'])

export const paymentMethodSchema = z.enum(['bank_transfer', 'virtual_account', 'cash', 'qris'])

export const accountStatusSchema = z.enum(['active', 'frozen', 'closed'])

export const businessTypeSchema = z.enum(['koperasi', 'umkm', 'individual'])

export const productStatusSchema = z.enum(['draft', 'active', 'inactive', 'discontinued'])

// Address schema
export const addressSchema = z.object({
  address: z.string().min(10, 'Address too short').max(500, 'Address too long'),
  village: z.string().max(100, 'Village name too long').optional(),
  district: z.string().max(100, 'District name too long').optional(),
  city: z.string().max(100, 'City name too long').default('Ponorogo'),
  province: z.string().max(100, 'Province name too long').default('Jawa Timur'),
  postal_code: postalCodeSchema,
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
})

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query required').max(100, 'Search query too long'),
  fields: z.array(z.string()).min(1, 'At least one search field required'),
  fuzzy: z.boolean().default(true),
  caseSensitive: z.boolean().default(false),
  exactMatch: z.boolean().default(false),
})

// Sort schema
export const sortSchema = z.object({
  column: z.string().min(1, 'Sort column required'),
  order: z.enum(['asc', 'desc']).default('asc'),
})

// File upload schema
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename required'),
  contentType: z.string().min(1, 'Content type required'),
  size: z.number().min(1, 'File size must be positive').max(10 * 1024 * 1024, 'File too large (max 10MB)'),
})

// Coordinates schema
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  longitude: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
})

// Password schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .refine(
    (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password),
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )

// URL schema
export const urlSchema = z.string().url('Invalid URL format').optional()

// Slug schema
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
  .max(100, 'Slug too long')

// Color hex schema
export const colorHexSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format')
  .optional()

// Metadata schema (for flexible JSON fields)
export const metadataSchema = z.record(z.any()).optional()

// Time range schema
export const timeRangeSchema = z.object({
  from: dateSchema,
  to: dateSchema,
}).refine(
  (data) => new Date(data.from) <= new Date(data.to),
  'From date must be before or equal to to date'
)

// API response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
})

export const paginatedResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    success: z.boolean(),
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPrevPage: z.boolean(),
    }),
    error: z.string().optional(),
  })

// Validation helpers
export const createValidationSchema = <T extends z.ZodRawShape>(shape: T) => {
  return z.object(shape)
}

export const createUpdateSchema = <T extends z.ZodRawShape>(shape: T) => {
  return z.object(shape).partial()
}

export const createFilterSchema = <T extends z.ZodRawShape>(shape: T) => {
  return z.object(shape).partial()
}