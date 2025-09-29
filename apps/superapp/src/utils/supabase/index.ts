// Browser client exports
export {
  createClient as createBrowserClient,
  getSupabaseClient,
  supabaseClient,
  queries,
  auth,
  SupabaseQueryBuilder,
} from './client'

// Server client exports
export {
  createClient as createServerClient,
  createServiceClient,
  serverQueries,
  serviceOperations,
} from './server'

// Middleware exports
export {
  updateSession,
  getUser as getMiddlewareUser,
} from './middleware'

// Type exports
export type {
  Database,
  SupabaseClient,
  ServerSupabaseClient,
  ServiceSupabaseClient,
  Tables,
  Enums,
  Functions,
  Member,
  SavingsAccount,
  Loan,
  Transaction,
  PaymentSchedule,
  Notification,
  MemberInsert,
  MemberUpdate,
  SavingsAccountInsert,
  SavingsAccountUpdate,
  LoanInsert,
  LoanUpdate,
  TransactionInsert,
  TransactionUpdate,
  MemberStatus,
  AccountType,
  LoanType,
  LoanStatus,
  TransactionType,
  TransactionStatus,
  PaymentStatus,
  NotificationType,
  NotificationCategory,
} from './client'

// Re-export database types
export type { Database } from '@/types/database'