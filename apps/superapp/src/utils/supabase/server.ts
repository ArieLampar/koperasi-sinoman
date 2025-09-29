import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import type { Database } from '@/types/database'

/**
 * Create a Supabase client for use in Server Components and Server Actions
 * This client handles cookies properly for server-side rendering with proper cache behavior
 */
export function createClient() {
  const cookieStore = cookies()

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Set secure cookies for production
            const secureOptions: CookieOptions = {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              httpOnly: true,
              path: '/',
              maxAge: options.maxAge || 60 * 60 * 24 * 7, // 7 days default
            }
            cookieStore.set({ name, value, ...secureOptions })
          } catch (error) {
            // The `set` method was called from a Server Component
            // This can be ignored if you have middleware refreshing user sessions
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Failed to set cookie ${name} in Server Component:`, error)
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            const secureOptions: CookieOptions = {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              httpOnly: true,
              path: '/',
              maxAge: 0,
            }
            cookieStore.set({ name, value: '', ...secureOptions })
          } catch (error) {
            // The `delete` method was called from a Server Component
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Failed to remove cookie ${name} in Server Component:`, error)
            }
          }
        },
      },
      auth: {
        // Server-side auth configuration
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        storageKey: 'koperasi-sinoman-auth',
        // Flow type for server-side
        flowType: 'pkce',
      },
      global: {
        headers: {
          'X-Client-Info': 'koperasi-sinoman-superapp-server@1.0.0',
          'X-Request-ID': headers().get('x-request-id') || crypto.randomUUID(),
        },
      },
      db: {
        schema: 'public',
      },
      // Realtime disabled for server client
      realtime: {
        params: {
          eventsPerSecond: -1,
        },
      },
    }
  )
}

/**
 * Create a cached Supabase client for use in Server Components
 * This prevents creating multiple instances within the same request
 */
export const createCachedClient = cache(() => createClient())

/**
 * Create a Supabase client with service role key for admin operations
 * This should only be used in server-side code that requires elevated permissions
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseServiceKey) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      cookies: {
        get() {
          return undefined
        },
        set() {
          // No-op for service client
        },
        remove() {
          // No-op for service client
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'koperasi-sinoman-superapp-service@1.0.0',
        },
      },
    }
  )
}

// Export types for server components
export type ServerSupabaseClient = ReturnType<typeof createClient>
export type ServiceSupabaseClient = ReturnType<typeof createServiceClient>

/**
 * Cached helper to get the current authenticated user
 * Uses React cache to prevent multiple calls within the same request
 */
const getAuthenticatedUser = cache(async () => {
  try {
    const supabase = createCachedClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting authenticated user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Exception getting authenticated user:', error)
    return null
  }
})

/**
 * Cached helper to get member data for the authenticated user
 * Uses React cache and Next.js unstable_cache for optimal performance
 */
const getMemberData = cache(async () => {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return null

    const supabase = createCachedClient()
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No member record found - this might be expected for new users
        console.info('No member record found for user:', user.id)
      } else {
        console.error('Error getting member data:', error)
      }
      return null
    }

    return data
  } catch (error) {
    console.error('Exception getting member data:', error)
    return null
  }
})

/**
 * Server-side query helpers with proper caching and error handling
 */
export const serverQueries = {
  /**
   * Get authenticated user from server
   * Uses React cache to prevent multiple auth calls
   */
  getUser: getAuthenticatedUser,

  /**
   * Get member data for authenticated user
   * Uses React cache for efficient data access
   */
  getMemberData: getMemberData,

  /**
   * Get savings accounts for a member with caching
   */
  getSavingsData: cache(async () => {
    try {
      const memberData = await getMemberData()
      if (!memberData) return []

      const supabase = createCachedClient()
      const { data, error } = await supabase
        .from('savings_accounts')
        .select(`
          *,
          transactions:transactions!account_id(
            id,
            created_at,
            amount,
            transaction_type
          )
        `)
        .eq('member_id', memberData.id)
        .eq('is_active', true)
        .order('account_type')

      if (error) {
        console.error('Error getting savings data:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Exception getting savings data:', error)
      return []
    }
  }),

  /**
   * Get loans for a member with caching
   */
  getLoansData: cache(async () => {
    try {
      const memberData = await getMemberData()
      if (!memberData) return []

      const supabase = createCachedClient()
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          payment_schedules:payment_schedules(
            id,
            due_date,
            total_amount,
            paid_amount,
            status
          )
        `)
        .eq('member_id', memberData.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting loans data:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Exception getting loans data:', error)
      return []
    }
  }),

  /**
   * Get recent transactions for a member with caching
   */
  getRecentTransactions: cache(async (limit = 10) => {
    try {
      const memberData = await getMemberData()
      if (!memberData) return []

      const supabase = createCachedClient()
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          savings_accounts:account_id(account_number, account_type),
          loans:loan_id(loan_number, loan_type)
        `)
        .eq('member_id', memberData.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error getting transactions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Exception getting transactions:', error)
      return []
    }
  }),

  /**
   * Get notifications for a member with caching
   */
  getNotifications: cache(async (unreadOnly = false) => {
    try {
      const memberData = await getMemberData()
      if (!memberData) return []

      const supabase = createCachedClient()
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('member_id', memberData.id)

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      // Only get non-expired notifications
      query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error getting notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Exception getting notifications:', error)
      return []
    }
  }),

  /**
   * Get member summary with total balances
   */
  getMemberSummary: cache(async () => {
    try {
      const memberData = await getMemberData()
      if (!memberData) return null

      const [savingsData, loansData] = await Promise.all([
        serverQueries.getSavingsData(),
        serverQueries.getLoansData(),
      ])

      const totalSavings = savingsData.reduce((sum, account) => sum + account.balance, 0)
      const totalLoans = loansData.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
      const activeLoansCount = loansData.filter(loan => loan.status === 'active').length

      return {
        member: memberData,
        totalSavings,
        totalLoans,
        activeLoansCount,
        netWorth: totalSavings - totalLoans,
      }
    } catch (error) {
      console.error('Exception getting member summary:', error)
      return null
    }
  }),
}

/**
 * Cached data fetchers with Next.js cache for static-like behavior
 * These use unstable_cache for longer-term caching where appropriate
 */
export const cachedQueries = {
  /**
   * Get savings data with Next.js cache (5 minutes)
   */
  getSavingsDataCached: unstable_cache(
    async (memberId: string) => {
      const supabase = createCachedClient()
      const { data, error } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('member_id', memberId)
        .eq('is_active', true)
        .order('account_type')

      if (error) throw error
      return data || []
    },
    ['savings-data'],
    {
      revalidate: 300, // 5 minutes
      tags: ['savings'],
    }
  ),

  /**
   * Get member profile with Next.js cache (15 minutes)
   */
  getMemberProfileCached: unstable_cache(
    async (userId: string) => {
      const supabase = createCachedClient()
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data
    },
    ['member-profile'],
    {
      revalidate: 900, // 15 minutes
      tags: ['member'],
    }
  ),
}

/**
 * Error handling utilities
 */
export class SupabaseServerError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
    public hint?: string
  ) {
    super(message)
    this.name = 'SupabaseServerError'
  }
}

/**
 * Helper function to handle Supabase errors consistently
 */
export function handleSupabaseError(error: any, context: string): never {
  console.error(`Supabase error in ${context}:`, error)

  throw new SupabaseServerError(
    error.message || 'An unexpected database error occurred',
    error.code,
    error.details,
    error.hint
  )
}

/**
 * Server Actions helpers for form submissions and mutations
 */
export const serverActions = {
  /**
   * Create a transaction with proper error handling
   */
  async createTransaction(transactionData: Database['public']['Tables']['transactions']['Insert']) {
    try {
      const supabase = createCachedClient()
      const memberData = await getMemberData()

      if (!memberData) {
        throw new SupabaseServerError('User not authenticated or no member record found')
      }

      // Ensure the transaction belongs to the authenticated member
      const dataWithMember = {
        ...transactionData,
        member_id: memberData.id,
        reference_number: transactionData.reference_number || `TXN-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(dataWithMember)
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, 'createTransaction')
      }

      return data
    } catch (error) {
      if (error instanceof SupabaseServerError) throw error
      throw new SupabaseServerError('Failed to create transaction', undefined, error)
    }
  },

  /**
   * Update member profile
   */
  async updateMemberProfile(updates: Database['public']['Tables']['members']['Update']) {
    try {
      const supabase = createCachedClient()
      const memberData = await getMemberData()

      if (!memberData) {
        throw new SupabaseServerError('User not authenticated or no member record found')
      }

      const { data, error } = await supabase
        .from('members')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberData.id)
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, 'updateMemberProfile')
      }

      return data
    } catch (error) {
      if (error instanceof SupabaseServerError) throw error
      throw new SupabaseServerError('Failed to update member profile', undefined, error)
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string) {
    try {
      const supabase = createCachedClient()
      const memberData = await getMemberData()

      if (!memberData) {
        throw new SupabaseServerError('User not authenticated')
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('member_id', memberData.id) // Ensure user can only update their own notifications
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, 'markNotificationRead')
      }

      return data
    } catch (error) {
      if (error instanceof SupabaseServerError) throw error
      throw new SupabaseServerError('Failed to mark notification as read', undefined, error)
    }
  },
}

/**
 * Service role operations (admin only)
 * These operations require elevated permissions and should only be used in admin contexts
 */
export const serviceOperations = {
  /**
   * Create a new member (admin operation)
   */
  async createMember(memberData: Database['public']['Tables']['members']['Insert']) {
    try {
      const supabase = createServiceClient()

      // Generate member ID if not provided
      if (!memberData.member_id) {
        const timestamp = Date.now().toString()
        memberData.member_id = `M${timestamp.slice(-6)}` // Last 6 digits of timestamp
      }

      const { data, error } = await supabase
        .from('members')
        .insert({
          ...memberData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, 'createMember')
      }

      return data
    } catch (error) {
      if (error instanceof SupabaseServerError) throw error
      throw new SupabaseServerError('Failed to create member', undefined, error)
    }
  },

  /**
   * Update member status (admin operation)
   */
  async updateMemberStatus(
    memberId: string,
    status: Database['public']['Enums']['member_status'],
    adminUserId?: string
  ) {
    try {
      const supabase = createServiceClient()

      const { data, error } = await supabase
        .from('members')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, 'updateMemberStatus')
      }

      // Log the status change for audit purposes
      if (adminUserId) {
        await supabase
          .from('notifications')
          .insert({
            member_id: memberId,
            title: 'Status Akun Diperbarui',
            message: `Status akun Anda telah diubah menjadi: ${status}`,
            type: status === 'active' ? 'success' : 'warning',
            category: 'system',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
      }

      return data
    } catch (error) {
      if (error instanceof SupabaseServerError) throw error
      throw new SupabaseServerError('Failed to update member status', undefined, error)
    }
  },

  /**
   * Process transaction (admin operation)
   */
  async processTransaction(transactionId: string, processedBy: string, notes?: string) {
    try {
      const supabase = createServiceClient()

      const { data, error } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          processed_by: processedBy,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', transactionId)
        .select(`
          *,
          members:member_id(full_name, email)
        `)
        .single()

      if (error) {
        handleSupabaseError(error, 'processTransaction')
      }

      // Create notification for the member
      await supabase
        .from('notifications')
        .insert({
          member_id: data.member_id,
          title: 'Transaksi Diproses',
          message: `Transaksi ${data.description} telah diproses dan selesai.`,
          type: 'success',
          category: 'payment',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      return data
    } catch (error) {
      if (error instanceof SupabaseServerError) throw error
      throw new SupabaseServerError('Failed to process transaction', undefined, error)
    }
  },

  /**
   * Approve loan application (admin operation)
   */
  async approveLoan(loanId: string, approvedBy: string) {
    try {
      const supabase = createServiceClient()

      const { data, error } = await supabase
        .from('loans')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', loanId)
        .select(`
          *,
          members:member_id(full_name, email)
        `)
        .single()

      if (error) {
        handleSupabaseError(error, 'approveLoan')
      }

      // Create notification for the member
      await supabase
        .from('notifications')
        .insert({
          member_id: data.member_id,
          title: 'Pinjaman Disetujui',
          message: `Pengajuan pinjaman Anda sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.principal_amount)} telah disetujui.`,
          type: 'success',
          category: 'loan',
          action_url: `/loans/${loanId}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      return data
    } catch (error) {
      if (error instanceof SupabaseServerError) throw error
      throw new SupabaseServerError('Failed to approve loan', undefined, error)
    }
  },
}