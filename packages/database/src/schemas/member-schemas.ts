import { z } from 'zod'
import {
  uuidSchema,
  emailSchema,
  phoneSchema,
  nikSchema,
  addressSchema,
  birthDateSchema,
  genderSchema,
  membershipStatusSchema,
  membershipTypeSchema,
  kycStatusSchema,
  verificationStatusSchema,
  documentTypeSchema,
  paginationSchema,
  urlSchema,
  createUpdateSchema,
  createFilterSchema,
} from './common-schemas'

// Member schemas
export const createMemberSchema = z.object({
  full_name: z.string().min(2, 'Full name too short').max(100, 'Full name too long'),
  nik: nikSchema,
  email: emailSchema,
  phone: phoneSchema,
  date_of_birth: birthDateSchema,
  gender: genderSchema,
  address: z.string().min(10, 'Address too short').max(500, 'Address too long'),
  village: z.string().max(100, 'Village name too long').optional(),
  district: z.string().max(100, 'District name too long').optional(),
  city: z.string().max(100, 'City name too long').default('Ponorogo'),
  province: z.string().max(100, 'Province name too long').default('Jawa Timur'),
  postal_code: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits').optional(),
  membership_type: membershipTypeSchema.default('regular'),
  occupation: z.string().max(100, 'Occupation too long').optional(),
  referred_by: uuidSchema.optional(),
})

export const updateMemberSchema = createUpdateSchema({
  full_name: z.string().min(2, 'Full name too short').max(100, 'Full name too long'),
  phone: phoneSchema,
  address: z.string().min(10, 'Address too short').max(500, 'Address too long'),
  village: z.string().max(100, 'Village name too long'),
  district: z.string().max(100, 'District name too long'),
  city: z.string().max(100, 'City name too long'),
  province: z.string().max(100, 'Province name too long'),
  postal_code: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits'),
  profile_picture_url: urlSchema,
  bio: z.string().max(1000, 'Bio too long'),
  occupation: z.string().max(100, 'Occupation too long'),
})

export const memberFiltersSchema = createFilterSchema({
  membership_status: membershipStatusSchema,
  membership_type: membershipTypeSchema,
  kyc_status: kycStatusSchema,
  city: z.string(),
  province: z.string(),
  join_date_from: z.string().datetime(),
  join_date_to: z.string().datetime(),
  search: z.string().min(1, 'Search query required'),
})

export const memberQuerySchema = z.object({
  ...memberFiltersSchema.shape,
  ...paginationSchema.shape,
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})

// Member verification schemas
export const verifyMemberKycSchema = z.object({
  member_id: uuidSchema,
  kyc_status: kycStatusSchema,
  verified_by: uuidSchema,
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const updateMemberStatusSchema = z.object({
  member_id: uuidSchema,
  status: membershipStatusSchema,
  reason: z.string().max(500, 'Reason too long').optional(),
})

// Member document schemas
export const createMemberDocumentSchema = z.object({
  member_id: uuidSchema,
  document_type: documentTypeSchema,
  document_url: z.string().url('Invalid document URL'),
})

export const verifyDocumentSchema = z.object({
  document_id: uuidSchema,
  verification_status: verificationStatusSchema,
  verified_by: uuidSchema,
  notes: z.string().max(1000, 'Notes too long').optional(),
})

// Referral schemas
export const createReferralSchema = z.object({
  referrer_id: uuidSchema,
  referred_id: uuidSchema,
  referral_bonus: z.number().min(0, 'Bonus must be positive').default(0),
})

export const referralStatsSchema = z.object({
  member_id: uuidSchema,
  period_from: z.string().datetime().optional(),
  period_to: z.string().datetime().optional(),
})

// Member profile schemas
export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Full name too short').max(100, 'Full name too long').optional(),
  phone: phoneSchema.optional(),
  profile_picture_url: urlSchema,
  bio: z.string().max(1000, 'Bio too long').optional(),
  occupation: z.string().max(100, 'Occupation too long').optional(),
})

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .refine(
      (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password),
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirm_password: z.string(),
}).refine(
  (data) => data.new_password === data.confirm_password,
  {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  }
)

// Member search schemas
export const memberSearchSchema = z.object({
  query: z.string().min(1, 'Search query required').max(100, 'Search query too long'),
  filters: memberFiltersSchema.optional(),
  ...paginationSchema.shape,
})

// Member statistics schemas
export const memberStatsFiltersSchema = z.object({
  period_from: z.string().datetime().optional(),
  period_to: z.string().datetime().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  membership_type: membershipTypeSchema.optional(),
})

// Member export schemas
export const memberExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
  filters: memberFiltersSchema.optional(),
  fields: z.array(z.string()).optional(),
})

// Member import schemas
export const memberImportSchema = z.object({
  file_url: z.string().url('Invalid file URL'),
  format: z.enum(['csv', 'xlsx']).default('csv'),
  validate_only: z.boolean().default(false),
  skip_duplicates: z.boolean().default(true),
})

export const memberImportRowSchema = z.object({
  full_name: z.string().min(2, 'Full name too short').max(100, 'Full name too long'),
  nik: nikSchema,
  email: emailSchema,
  phone: phoneSchema,
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  gender: genderSchema,
  address: z.string().min(10, 'Address too short').max(500, 'Address too long'),
  village: z.string().max(100, 'Village name too long').optional(),
  district: z.string().max(100, 'District name too long').optional(),
  city: z.string().max(100, 'City name too long').default('Ponorogo'),
  province: z.string().max(100, 'Province name too long').default('Jawa Timur'),
  postal_code: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits').optional(),
  occupation: z.string().max(100, 'Occupation too long').optional(),
  referrer_member_number: z.string().optional(),
})

// Member notification schemas
export const memberNotificationSchema = z.object({
  member_ids: z.array(uuidSchema).min(1, 'At least one member required'),
  title: z.string().min(1, 'Title required').max(100, 'Title too long'),
  message: z.string().min(1, 'Message required').max(1000, 'Message too long'),
  type: z.enum(['info', 'warning', 'success', 'error']).default('info'),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app'])).min(1, 'At least one channel required'),
  schedule_at: z.string().datetime().optional(),
})

// Validation helper functions
export function validateMemberData(data: unknown) {
  return createMemberSchema.safeParse(data)
}

export function validateMemberUpdate(data: unknown) {
  return updateMemberSchema.safeParse(data)
}

export function validateMemberFilters(data: unknown) {
  return memberFiltersSchema.safeParse(data)
}