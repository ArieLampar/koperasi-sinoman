import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Create a Supabase client for use in the browser
 * This client handles authentication state and can be used in client components
 */
export function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Automatically refresh the session when it expires
      autoRefreshToken: true,
      // Persist auth session to localStorage
      persistSession: true,
      // Detect session changes in other browser tabs
      detectSessionInUrl: true,
      // Storage key for auth tokens
      storageKey: 'koperasi-sinoman-auth',
      // Storage options
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null
          return window.localStorage.getItem(key)
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return
          window.localStorage.setItem(key, value)
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return
          window.localStorage.removeItem(key)
        },
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'koperasi-sinoman-superapp@1.0.0',
      },
    },
    // Database configuration
    db: {
      schema: 'public',
    },
    // Real-time configuration
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

// Create a singleton instance for the browser client
let supabase: ReturnType<typeof createClient> | null = null

/**
 * Get the Supabase client instance (singleton pattern)
 * This ensures we only create one client instance in the browser
 */
export function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient()
  }
  return supabase
}

// Export the singleton instance as default
export const supabaseClient = getSupabaseClient()

// Export types for use in other files
export type SupabaseClient = ReturnType<typeof createClient>
export type { Database } from '@/types/database'

// Utility types for better TypeScript support
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]

// Commonly used table types
export type Member = Tables<'members'>
export type SavingsAccount = Tables<'savings_accounts'>
export type Loan = Tables<'loans'>
export type Transaction = Tables<'transactions'>
export type PaymentSchedule = Tables<'payment_schedules'>
export type Notification = Tables<'notifications'>

// Insert and Update types for form handling
export type MemberInsert = Database['public']['Tables']['members']['Insert']
export type MemberUpdate = Database['public']['Tables']['members']['Update']
export type SavingsAccountInsert = Database['public']['Tables']['savings_accounts']['Insert']
export type SavingsAccountUpdate = Database['public']['Tables']['savings_accounts']['Update']
export type LoanInsert = Database['public']['Tables']['loans']['Insert']
export type LoanUpdate = Database['public']['Tables']['loans']['Update']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

// Enum types for form validation
export type MemberStatus = Enums<'member_status'>
export type AccountType = Enums<'account_type'>
export type LoanType = Enums<'loan_type'>
export type LoanStatus = Enums<'loan_status'>
export type TransactionType = Enums<'transaction_type'>
export type TransactionStatus = Enums<'transaction_status'>
export type PaymentStatus = Enums<'payment_status'>
export type NotificationType = Enums<'notification_type'>
export type NotificationCategory = Enums<'notification_category'>

/**
 * Type-safe wrapper for Supabase queries
 * Provides better error handling and TypeScript support
 */
export class SupabaseQueryBuilder {
  constructor(private client: SupabaseClient) {}

  /**
   * Get member by user ID
   */
  async getMemberByUserId(userId: string) {
    const { data, error } = await this.client
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get savings accounts for a member
   */
  async getSavingsAccounts(memberId: string) {
    const { data, error } = await this.client
      .from('savings_accounts')
      .select('*')
      .eq('member_id', memberId)
      .eq('is_active', true)
      .order('account_type')

    if (error) throw error
    return data || []
  }

  /**
   * Get loans for a member
   */
  async getLoans(memberId: string) {
    const { data, error } = await this.client
      .from('loans')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get recent transactions for a member
   */
  async getRecentTransactions(memberId: string, limit = 10) {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  /**
   * Get notifications for a member
   */
  async getNotifications(memberId: string, unreadOnly = false) {
    let query = this.client
      .from('notifications')
      .select('*')
      .eq('member_id', memberId)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

// Create query builder instance
export const queries = new SupabaseQueryBuilder(supabaseClient)

/**
 * Authentication helper functions
 */
export const auth = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) throw error
    return data
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabaseClient.auth.signOut()
    if (error) throw error
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
  },

  /**
   * Update password
   */
  async updatePassword(password: string) {
    const { error } = await supabaseClient.auth.updateUser({
      password,
    })

    if (error) throw error
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabaseClient.auth.getSession()
    if (error) throw error
    return data.session
  },

  /**
   * Get current user
   */
  async getUser() {
    const { data, error } = await supabaseClient.auth.getUser()
    if (error) throw error
    return data.user
  },
}