import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'

// Types for admin operations
interface AdminConfig {
  retryAttempts: number
  retryDelay: number
  timeout: number
  enableAuditLogging: boolean
  logLevel: 'error' | 'warn' | 'info' | 'debug'
}

interface AuditLogEntry {
  event_type: string
  target_type: string
  target_id: string
  action_details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  user_id?: string
  session_id?: string
  ip_address?: string
  user_agent?: string
  timestamp: string
}

interface AdminError extends Error {
  code?: string
  details?: string
  hint?: string
  originalError?: PostgrestError | Error
  operation?: string
  retryable?: boolean
}

interface RetryConfig {
  attempts: number
  delay: number
  backoff: boolean
  retryableErrors: string[]
}

// Default configuration for admin client
const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  timeout: 30000, // 30 seconds
  enableAuditLogging: true,
  logLevel: 'info',
}

// Retryable error codes
const RETRYABLE_ERROR_CODES = [
  'PGRST301', // Connection timeout
  'PGRST302', // Connection failed
  'PGRST503', // Service unavailable
  '08000', // Connection exception
  '08003', // Connection does not exist
  '08006', // Connection failure
  '53300', // Too many connections
  '57P01', // Admin shutdown
]

class AdminSupabaseClient {
  private client: SupabaseClient
  private config: AdminConfig
  private adminSession: any = null

  constructor(config: Partial<AdminConfig> = {}) {
    this.config = { ...DEFAULT_ADMIN_CONFIG, ...config }
    this.client = createClientComponentClient()
    this.setupErrorHandling()
  }

  /**
   * Setup global error handling and monitoring
   */
  private setupErrorHandling(): void {
    // Monitor auth state changes
    this.client.auth.onAuthStateChange(async (event, session) => {
      this.adminSession = session

      if (event === 'SIGNED_IN' && session?.user) {
        await this.logAdminEvent({
          event_type: 'admin.auth.signin',
          target_type: 'admin_session',
          target_id: session.user.id,
          action_details: {
            event,
            user_email: session.user.email,
            timestamp: new Date().toISOString(),
          },
          severity: 'medium',
        })
      }

      if (event === 'SIGNED_OUT') {
        await this.logAdminEvent({
          event_type: 'admin.auth.signout',
          target_type: 'admin_session',
          target_id: session?.user?.id || 'unknown',
          action_details: {
            event,
            timestamp: new Date().toISOString(),
          },
          severity: 'medium',
        })
      }

      if (event === 'TOKEN_REFRESHED') {
        await this.logAdminEvent({
          event_type: 'admin.auth.token_refresh',
          target_type: 'admin_session',
          target_id: session?.user?.id || 'unknown',
          action_details: {
            event,
            timestamp: new Date().toISOString(),
          },
          severity: 'low',
        })
      }
    })
  }

  /**
   * Enhanced query method with retry logic and error handling
   */
  async query<T = any>(
    operation: string,
    queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    options: {
      retryConfig?: Partial<RetryConfig>
      auditLog?: Partial<AuditLogEntry>
      timeout?: number
    } = {}
  ): Promise<{ data: T | null; error: AdminError | null }> {
    const retryConfig: RetryConfig = {
      attempts: this.config.retryAttempts,
      delay: this.config.retryDelay,
      backoff: true,
      retryableErrors: RETRYABLE_ERROR_CODES,
      ...options.retryConfig,
    }

    const timeout = options.timeout || this.config.timeout
    let lastError: AdminError | null = null

    // Log operation start
    if (this.config.enableAuditLogging && options.auditLog) {
      await this.logAdminEvent({
        event_type: 'admin.operation.start',
        target_type: 'database',
        target_id: operation,
        action_details: {
          operation,
          timestamp: new Date().toISOString(),
        },
        severity: 'low',
        ...options.auditLog,
      })
    }

    for (let attempt = 1; attempt <= retryConfig.attempts; attempt++) {
      try {
        // Add timeout to the query
        const result = await Promise.race([
          queryFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
          ),
        ])

        if (result.error) {
          const adminError = this.createAdminError(result.error, operation)

          // Check if error is retryable
          if (
            attempt < retryConfig.attempts &&
            this.isRetryableError(adminError, retryConfig.retryableErrors)
          ) {
            const delay = retryConfig.backoff
              ? retryConfig.delay * Math.pow(2, attempt - 1)
              : retryConfig.delay

            this.log('warn', `Retrying operation ${operation} (attempt ${attempt + 1}/${retryConfig.attempts}) after ${delay}ms`, adminError)

            await this.sleep(delay)
            lastError = adminError
            continue
          }

          // Log failed operation
          if (this.config.enableAuditLogging) {
            await this.logAdminEvent({
              event_type: 'admin.operation.error',
              target_type: 'database',
              target_id: operation,
              action_details: {
                operation,
                error: adminError.message,
                code: adminError.code,
                attempt,
                timestamp: new Date().toISOString(),
              },
              severity: 'high',
              ...options.auditLog,
            })
          }

          return { data: null, error: adminError }
        }

        // Log successful operation
        if (this.config.enableAuditLogging && options.auditLog) {
          await this.logAdminEvent({
            event_type: 'admin.operation.success',
            target_type: 'database',
            target_id: operation,
            action_details: {
              operation,
              attempt,
              timestamp: new Date().toISOString(),
            },
            severity: 'low',
            ...options.auditLog,
          })
        }

        return { data: result.data, error: null }

      } catch (error) {
        const adminError = this.createAdminError(error as Error, operation)
        lastError = adminError

        if (attempt === retryConfig.attempts) {
          // Log final failure
          if (this.config.enableAuditLogging) {
            await this.logAdminEvent({
              event_type: 'admin.operation.failure',
              target_type: 'database',
              target_id: operation,
              action_details: {
                operation,
                error: adminError.message,
                finalAttempt: attempt,
                timestamp: new Date().toISOString(),
              },
              severity: 'critical',
              ...options.auditLog,
            })
          }

          return { data: null, error: adminError }
        }

        const delay = retryConfig.backoff
          ? retryConfig.delay * Math.pow(2, attempt - 1)
          : retryConfig.delay

        this.log('warn', `Retrying operation ${operation} (attempt ${attempt + 1}/${retryConfig.attempts}) after ${delay}ms`, adminError)

        await this.sleep(delay)
      }
    }

    return { data: null, error: lastError }
  }

  /**
   * Enhanced admin-specific database operations
   */

  // Member management with elevated permissions
  async getMembers(filters: Record<string, any> = {}) {
    return this.query(
      'admin.members.list',
      async () => {
        let query = this.client
          .from('members')
          .select(`
            *,
            savings_accounts(id, balance, status, savings_types(name)),
            loans(id, amount, status),
            audit_logs(id, event_type, created_at)
          `)

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value)
          }
        })

        return query.order('created_at', { ascending: false })
      },
      {
        auditLog: {
          event_type: 'admin.members.list',
          target_type: 'members',
          target_id: 'all',
          action_details: { filters },
        },
      }
    )
  }

  // Savings account operations with admin privileges
  async getSavingsAccounts(options: { includeInactive?: boolean } = {}) {
    return this.query(
      'admin.savings.list',
      async () => {
        let query = this.client
          .from('savings_accounts')
          .select(`
            *,
            members!inner(id, full_name, member_number, membership_status),
            savings_types!inner(id, name, code, is_mandatory, is_withdrawable),
            transactions(id, amount, transaction_types(name, category), created_at)
          `)

        if (!options.includeInactive) {
          query = query.eq('status', 'active')
        }

        return query.order('created_at', { ascending: false })
      },
      {
        auditLog: {
          event_type: 'admin.savings.list',
          target_type: 'savings_accounts',
          target_id: 'all',
          action_details: { options },
        },
      }
    )
  }

  // Transaction processing with elevated permissions
  async processTransaction(transactionId: string, action: 'approve' | 'reject', notes?: string) {
    return this.query(
      'admin.transaction.process',
      async () => {
        const updates = {
          payment_status: action === 'approve' ? 'completed' : 'cancelled',
          processed_at: new Date().toISOString(),
          processed_by: this.adminSession?.user?.id,
          notes: notes || null,
        }

        return this.client
          .from('transactions')
          .update(updates)
          .eq('id', transactionId)
          .select()
      },
      {
        auditLog: {
          event_type: `admin.transaction.${action}`,
          target_type: 'transaction',
          target_id: transactionId,
          action_details: { action, notes },
          severity: 'medium',
        },
      }
    )
  }

  // Bulk operations with proper error handling
  async bulkUpdateMembers(memberIds: string[], updates: Record<string, any>) {
    return this.query(
      'admin.members.bulk_update',
      async () => {
        return this.client
          .from('members')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: this.adminSession?.user?.id
          })
          .in('id', memberIds)
          .select()
      },
      {
        auditLog: {
          event_type: 'admin.members.bulk_update',
          target_type: 'members',
          target_id: memberIds.join(','),
          action_details: {
            updates,
            count: memberIds.length,
            member_ids: memberIds
          },
          severity: 'high',
        },
      }
    )
  }

  // Advanced reporting with admin access
  async generateReport(reportType: string, parameters: Record<string, any>) {
    return this.query(
      'admin.reports.generate',
      async () => {
        // This would typically call a stored procedure or complex query
        return this.client.rpc('generate_admin_report', {
          report_type: reportType,
          parameters,
          generated_by: this.adminSession?.user?.id,
        })
      },
      {
        auditLog: {
          event_type: 'admin.reports.generate',
          target_type: 'report',
          target_id: reportType,
          action_details: { reportType, parameters },
          severity: 'medium',
        },
        timeout: 60000, // Longer timeout for reports
      }
    )
  }

  // System maintenance operations
  async performMaintenance(operation: string, parameters: Record<string, any> = {}) {
    return this.query(
      'admin.system.maintenance',
      async () => {
        return this.client.rpc('admin_maintenance_operation', {
          operation,
          parameters,
          executed_by: this.adminSession?.user?.id,
        })
      },
      {
        auditLog: {
          event_type: 'admin.system.maintenance',
          target_type: 'system',
          target_id: operation,
          action_details: { operation, parameters },
          severity: 'critical',
        },
        retryConfig: {
          attempts: 1, // No retries for maintenance operations
        },
      }
    )
  }

  /**
   * Audit logging functionality
   */
  private async logAdminEvent(entry: Partial<AuditLogEntry>): Promise<void> {
    if (!this.config.enableAuditLogging) return

    try {
      const auditEntry: AuditLogEntry = {
        event_type: entry.event_type || 'admin.unknown',
        target_type: entry.target_type || 'unknown',
        target_id: entry.target_id || 'unknown',
        action_details: entry.action_details || {},
        severity: entry.severity || 'low',
        user_id: entry.user_id || this.adminSession?.user?.id,
        session_id: entry.session_id || this.adminSession?.access_token?.slice(-10),
        ip_address: entry.ip_address || await this.getClientIP(),
        user_agent: entry.user_agent || navigator?.userAgent || 'Unknown',
        timestamp: entry.timestamp || new Date().toISOString(),
      }

      // Insert audit log
      const { error } = await this.client
        .from('audit_logs')
        .insert(auditEntry)

      if (error) {
        this.log('error', 'Failed to insert audit log', error)
      }
    } catch (error) {
      this.log('error', 'Audit logging failed', error as Error)
    }
  }

  /**
   * Utility methods
   */
  private createAdminError(error: PostgrestError | Error, operation: string): AdminError {
    const adminError = new Error(error.message) as AdminError

    if ('code' in error) {
      adminError.code = error.code
      adminError.details = error.details
      adminError.hint = error.hint
    }

    adminError.originalError = error
    adminError.operation = operation
    adminError.retryable = this.isRetryableError(adminError, RETRYABLE_ERROR_CODES)

    return adminError
  }

  private isRetryableError(error: AdminError, retryableCodes: string[]): boolean {
    if (!error.code) return false
    return retryableCodes.includes(error.code) ||
           error.message.includes('timeout') ||
           error.message.includes('network')
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async getClientIP(): Promise<string> {
    try {
      // In a real implementation, you might get this from a header or API
      return 'unknown'
    } catch {
      return 'unknown'
    }
  }

  private log(level: string, message: string, error?: Error | AdminError): void {
    const logLevels = { error: 0, warn: 1, info: 2, debug: 3 }
    const currentLevel = logLevels[this.config.logLevel as keyof typeof logLevels] || 2
    const messageLevel = logLevels[level as keyof typeof logLevels] || 2

    if (messageLevel <= currentLevel) {
      const timestamp = new Date().toISOString()
      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        error: error ? {
          message: error.message,
          code: (error as AdminError).code,
          operation: (error as AdminError).operation,
        } : undefined,
      }

      console.log(`[ADMIN-CLIENT] ${JSON.stringify(logEntry)}`)
    }
  }

  /**
   * Permission and validation methods
   */
  async validateAdminPermission(permission: string): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('admin_permissions')
        .select('permission')
        .eq('user_id', this.adminSession?.user?.id)
        .eq('permission', permission)
        .eq('is_active', true)
        .single()

      return !error && !!data
    } catch {
      return false
    }
  }

  async requireAdminPermission(permission: string): Promise<void> {
    const hasPermission = await this.validateAdminPermission(permission)
    if (!hasPermission) {
      throw new Error(`Admin permission required: ${permission}`)
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    await this.logAdminEvent({
      event_type: 'admin.client.shutdown',
      target_type: 'admin_client',
      target_id: 'singleton',
      action_details: {
        timestamp: new Date().toISOString(),
      },
      severity: 'low',
    })
  }

  /**
   * Get the underlying Supabase client for direct access when needed
   */
  get raw(): SupabaseClient {
    return this.client
  }

  /**
   * Get current admin session
   */
  get session() {
    return this.adminSession
  }
}

// Singleton instance for admin client
let adminClientInstance: AdminSupabaseClient | null = null

/**
 * Get or create admin Supabase client instance
 */
export function createAdminSupabaseClient(config?: Partial<AdminConfig>): AdminSupabaseClient {
  if (!adminClientInstance) {
    adminClientInstance = new AdminSupabaseClient(config)
  }
  return adminClientInstance
}

/**
 * Get admin client instance (must be created first)
 */
export function getAdminSupabaseClient(): AdminSupabaseClient {
  if (!adminClientInstance) {
    throw new Error('Admin Supabase client not initialized. Call createAdminSupabaseClient() first.')
  }
  return adminClientInstance
}

// Export types for use in other files
export type { AdminConfig, AuditLogEntry, AdminError, RetryConfig }
export { AdminSupabaseClient }

// Default export
export default AdminSupabaseClient