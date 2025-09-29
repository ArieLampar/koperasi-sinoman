// Types
export * from './types'

// Client utilities
export * from './client'

// Query and utility helpers
export * from './utils'

// Validation schemas
export * from './schemas'

// Re-export commonly used functions
export {
  createClient,
  createServerClient,
  createAdminClient,
  createClientForEnvironment,
} from './client'

export {
  queryBuilder,
  commonQueries,
  formatCurrency,
  formatPhone,
  formatDate,
  validateEmail,
  validatePhone,
  validateNIK,
  calculatePagination,
  createPaginatedResponse,
  DATABASE_CONSTANTS,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  getErrorMessage,
} from './utils'

export {
  createMemberSchema,
  updateMemberSchema,
  createTransactionSchema,
  createProductSchema,
  createOrderSchema,
} from './schemas'

// Version
export const VERSION = '0.1.0'

// Default configuration
export const DEFAULT_CONFIG = {
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  timeouts: {
    query: 30000, // 30 seconds
    transaction: 60000, // 1 minute
  },
  retries: {
    maxAttempts: 3,
    backoffMs: 1000,
  },
} as const