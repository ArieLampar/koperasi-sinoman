import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'

// Types for admin roles and permissions
export type AdminRole = 'super_admin' | 'admin' | 'finance' | 'customer_service' | 'manager'

export interface AdminUser {
  id: string
  member_id: string
  role: AdminRole
  permissions: string[]
  is_active: boolean
  last_login: string | null
  created_at: string
  member: {
    id: string
    full_name: string
    email: string
    member_number: string
    membership_status: string
  }
}

export interface AdminSession {
  user: User
  adminUser: AdminUser
  sessionId: string
  loginTime: string
  lastActivity: string
  ipAddress?: string
  userAgent?: string
}

export interface SecurityContext {
  requiresPermission: string[]
  requiresRole?: AdminRole[]
  requiresMFA?: boolean
  sensitiveOperation?: boolean
  auditLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface AdminOperationLog {
  operation: string
  target_type: string
  target_id: string
  admin_user_id: string
  permissions_checked: string[]
  role: AdminRole
  success: boolean
  error_message?: string
  execution_time_ms: number
  context: Record<string, any>
  timestamp: string
}

// Permission definitions
export const ADMIN_PERMISSIONS = {
  // Member management
  'members.read': 'View member data',
  'members.create': 'Create new members',
  'members.update': 'Update member information',
  'members.delete': 'Delete members',
  'members.kyc': 'Manage KYC verification',
  'members.bulk_operations': 'Perform bulk member operations',

  // Savings management
  'savings.read': 'View savings accounts',
  'savings.create': 'Create savings accounts',
  'savings.update': 'Update savings accounts',
  'savings.freeze': 'Freeze/unfreeze accounts',
  'savings.close': 'Close savings accounts',
  'savings.adjust': 'Manual balance adjustments',
  'savings.bulk_process': 'Bulk savings processing',

  // Transaction management
  'transactions.read': 'View transactions',
  'transactions.process': 'Process pending transactions',
  'transactions.reverse': 'Reverse transactions',
  'transactions.manual': 'Manual transaction entry',

  // Loan management
  'loans.read': 'View loan data',
  'loans.create': 'Create loans',
  'loans.approve': 'Approve loan applications',
  'loans.disburse': 'Disburse loans',
  'loans.collect': 'Manage loan collections',

  // Financial operations
  'finance.reports': 'Generate financial reports',
  'finance.reconciliation': 'Perform reconciliation',
  'finance.accounting': 'Access accounting functions',

  // System administration
  'system.settings': 'Manage system settings',
  'system.users': 'Manage admin users',
  'system.maintenance': 'Perform system maintenance',
  'system.backup': 'Manage backups',

  // Reporting and analytics
  'reports.read': 'View reports',
  'reports.export': 'Export reports',
  'reports.sensitive': 'Access sensitive reports',

  // Audit and compliance
  'audit.read': 'View audit logs',
  'audit.export': 'Export audit data',
} as const

// Role-based permission matrix
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: Object.keys(ADMIN_PERMISSIONS),
  admin: [
    'members.read', 'members.create', 'members.update', 'members.kyc',
    'savings.read', 'savings.create', 'savings.update', 'savings.adjust',
    'transactions.read', 'transactions.process',
    'loans.read', 'loans.create', 'loans.approve',
    'finance.reports', 'reports.read', 'reports.export',
    'audit.read'
  ],
  finance: [
    'members.read', 'savings.read', 'transactions.read', 'transactions.process',
    'loans.read', 'loans.disburse', 'loans.collect',
    'finance.reports', 'finance.reconciliation', 'finance.accounting',
    'reports.read', 'reports.export', 'reports.sensitive'
  ],
  customer_service: [
    'members.read', 'members.update', 'members.kyc',
    'savings.read', 'transactions.read',
    'loans.read', 'reports.read'
  ],
  manager: [
    'members.read', 'savings.read', 'transactions.read',
    'loans.read', 'loans.approve',
    'finance.reports', 'reports.read', 'reports.export',
    'audit.read'
  ]
}

class AdminSupabaseServer {
  private client: SupabaseClient
  private adminSession: AdminSession | null = null

  constructor() {
    const cookieStore = cookies()

    this.client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin operations
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Server component - ignore cookie setting errors
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Server component - ignore cookie removal errors
            }
          },
        },
        auth: {
          // Enhanced security options for admin
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: true,
          flowType: 'pkce'
        }
      }
    )
  }

  /**
   * Initialize admin session with comprehensive validation
   */
  async initializeAdminSession(): Promise<AdminSession | null> {
    try {
      // Get current auth session
      const { data: { session }, error: sessionError } = await this.client.auth.getSession()

      if (sessionError || !session?.user) {
        return null
      }

      // Get admin user data with role and permissions
      const { data: adminUser, error: adminError } = await this.client
        .from('admin_users')
        .select(`
          *,
          member:members!inner(
            id,
            full_name,
            email,
            member_number,
            membership_status
          )
        `)
        .eq('member_id', session.user.id)
        .eq('is_active', true)
        .single()

      if (adminError || !adminUser) {
        await this.logSecurityEvent('unauthorized_admin_access', {
          user_id: session.user.id,
          error: 'Admin user not found or inactive'
        })
        return null
      }

      // Update last login
      await this.client
        .from('admin_users')
        .update({
          last_login: new Date().toISOString()
        })
        .eq('id', adminUser.id)

      // Create admin session object
      this.adminSession = {
        user: session.user,
        adminUser: {
          id: adminUser.id,
          member_id: adminUser.member_id,
          role: adminUser.role,
          permissions: this.getEffectivePermissions(adminUser.role, adminUser.permissions),
          is_active: adminUser.is_active,
          last_login: adminUser.last_login,
          created_at: adminUser.created_at,
          member: adminUser.member
        },
        sessionId: session.access_token.slice(-10),
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      }

      // Log successful admin login
      await this.logSecurityEvent('admin_login_success', {
        admin_user_id: adminUser.id,
        role: adminUser.role,
        session_id: this.adminSession.sessionId
      })

      return this.adminSession

    } catch (error) {
      await this.logSecurityEvent('admin_session_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  /**
   * Get effective permissions for a role, including additional permissions
   */
  private getEffectivePermissions(role: AdminRole, additionalPermissions: string[] = []): string[] {
    const basePermissions = ROLE_PERMISSIONS[role] || []
    const additional = Array.isArray(additionalPermissions) ? additionalPermissions : []
    return [...new Set([...basePermissions, ...additional])]
  }

  /**
   * Validate admin permission with comprehensive checks
   */
  async validatePermission(permission: string, context?: SecurityContext): Promise<boolean> {
    if (!this.adminSession) {
      await this.logSecurityEvent('permission_check_no_session', { permission })
      return false
    }

    // Check if admin user is still active
    const { data: adminCheck } = await this.client
      .from('admin_users')
      .select('is_active, role')
      .eq('id', this.adminSession.adminUser.id)
      .single()

    if (!adminCheck?.is_active) {
      await this.logSecurityEvent('permission_check_inactive_user', {
        admin_user_id: this.adminSession.adminUser.id,
        permission
      })
      return false
    }

    // Check role-based permissions
    if (context?.requiresRole && !context.requiresRole.includes(this.adminSession.adminUser.role)) {
      await this.logSecurityEvent('permission_check_role_denied', {
        admin_user_id: this.adminSession.adminUser.id,
        permission,
        required_roles: context.requiresRole,
        user_role: this.adminSession.adminUser.role
      })
      return false
    }

    // Check specific permission
    const hasPermission = this.adminSession.adminUser.permissions.includes(permission)

    if (!hasPermission) {
      await this.logSecurityEvent('permission_check_denied', {
        admin_user_id: this.adminSession.adminUser.id,
        permission,
        user_permissions: this.adminSession.adminUser.permissions
      })
    }

    return hasPermission
  }

  /**
   * Require admin permission with automatic rejection
   */
  async requirePermission(permission: string, context?: SecurityContext): Promise<void> {
    const hasPermission = await this.validatePermission(permission, context)

    if (!hasPermission) {
      throw new Error(`Admin permission required: ${permission}`)
    }
  }

  /**
   * Execute admin operation with comprehensive security and logging
   */
  async executeAdminOperation<T>(
    operation: string,
    operationFn: () => Promise<T>,
    context: SecurityContext
  ): Promise<T> {
    const startTime = Date.now()
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // Validate all required permissions
      for (const permission of context.requiresPermission) {
        await this.requirePermission(permission, context)
      }

      // Log operation start
      await this.logAdminOperation({
        operation: `${operation}.start`,
        target_type: 'operation',
        target_id: operationId,
        admin_user_id: this.adminSession!.adminUser.id,
        permissions_checked: context.requiresPermission,
        role: this.adminSession!.adminUser.role,
        success: true,
        execution_time_ms: 0,
        context: { audit_level: context.auditLevel },
        timestamp: new Date().toISOString()
      })

      // Execute the operation
      const result = await operationFn()

      const executionTime = Date.now() - startTime

      // Log successful operation
      await this.logAdminOperation({
        operation: `${operation}.success`,
        target_type: 'operation',
        target_id: operationId,
        admin_user_id: this.adminSession!.adminUser.id,
        permissions_checked: context.requiresPermission,
        role: this.adminSession!.adminUser.role,
        success: true,
        execution_time_ms: executionTime,
        context: {
          audit_level: context.auditLevel,
          result_summary: this.summarizeResult(result)
        },
        timestamp: new Date().toISOString()
      })

      return result

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Log failed operation
      await this.logAdminOperation({
        operation: `${operation}.error`,
        target_type: 'operation',
        target_id: operationId,
        admin_user_id: this.adminSession?.adminUser.id || 'unknown',
        permissions_checked: context.requiresPermission,
        role: this.adminSession?.adminUser.role || 'unknown',
        success: false,
        error_message: errorMessage,
        execution_time_ms: executionTime,
        context: { audit_level: context.auditLevel },
        timestamp: new Date().toISOString()
      })

      throw error
    }
  }

  /**
   * Admin-specific database operations with enhanced security
   */

  // Get members with admin access (bypasses RLS)
  async getAdminMembers(filters: Record<string, any> = {}) {
    return this.executeAdminOperation(
      'get_admin_members',
      async () => {
        let query = this.client
          .from('members')
          .select(`
            *,
            savings_accounts(id, balance, status, savings_types(name)),
            admin_users(id, role, is_active)
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
        requiresPermission: ['members.read'],
        auditLevel: 'medium'
      }
    )
  }

  // Get all savings accounts with admin privileges
  async getAdminSavingsAccounts(includeInactive = false) {
    return this.executeAdminOperation(
      'get_admin_savings_accounts',
      async () => {
        let query = this.client
          .from('savings_accounts')
          .select(`
            *,
            members!inner(id, full_name, member_number, membership_status),
            savings_types!inner(id, name, code, is_mandatory),
            transactions(id, amount, payment_status, created_at)
          `)

        if (!includeInactive) {
          query = query.eq('status', 'active')
        }

        return query.order('created_at', { ascending: false })
      },
      {
        requiresPermission: ['savings.read'],
        auditLevel: 'medium'
      }
    )
  }

  // Process transactions with admin authority
  async processAdminTransaction(
    transactionId: string,
    action: 'approve' | 'reject',
    notes?: string
  ) {
    return this.executeAdminOperation(
      'process_admin_transaction',
      async () => {
        const updates = {
          payment_status: action === 'approve' ? 'completed' : 'cancelled',
          processed_at: new Date().toISOString(),
          processed_by: this.adminSession!.adminUser.member_id,
          notes: notes || null
        }

        const { data, error } = await this.client
          .from('transactions')
          .update(updates)
          .eq('id', transactionId)
          .select(`
            *,
            members!inner(full_name, member_number),
            savings_accounts(account_number, savings_types(name))
          `)

        if (error) throw error

        return data
      },
      {
        requiresPermission: ['transactions.process'],
        auditLevel: 'high'
      }
    )
  }

  // Create admin user with proper validation
  async createAdminUser(memberData: {
    member_id: string
    role: AdminRole
    additional_permissions?: string[]
  }) {
    return this.executeAdminOperation(
      'create_admin_user',
      async () => {
        // Validate member exists and is not already an admin
        const { data: existingMember } = await this.client
          .from('members')
          .select('id, full_name, email')
          .eq('id', memberData.member_id)
          .single()

        if (!existingMember) {
          throw new Error('Member not found')
        }

        const { data: existingAdmin } = await this.client
          .from('admin_users')
          .select('id')
          .eq('member_id', memberData.member_id)
          .single()

        if (existingAdmin) {
          throw new Error('Member is already an admin user')
        }

        // Create admin user
        const { data, error } = await this.client
          .from('admin_users')
          .insert({
            member_id: memberData.member_id,
            role: memberData.role,
            permissions: memberData.additional_permissions || [],
            is_active: true
          })
          .select(`
            *,
            member:members!inner(full_name, email, member_number)
          `)

        if (error) throw error

        return data
      },
      {
        requiresPermission: ['system.users'],
        requiresRole: ['super_admin'],
        auditLevel: 'critical'
      }
    )
  }

  // System settings management
  async updateSystemSetting(key: string, value: any, description?: string) {
    return this.executeAdminOperation(
      'update_system_setting',
      async () => {
        const { data, error } = await this.client
          .from('system_settings')
          .upsert({
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value),
            description,
            type: typeof value,
            updated_by: this.adminSession!.adminUser.member_id,
            updated_at: new Date().toISOString()
          })
          .select()

        if (error) throw error

        return data
      },
      {
        requiresPermission: ['system.settings'],
        requiresRole: ['super_admin', 'admin'],
        auditLevel: 'critical'
      }
    )
  }

  /**
   * Security and audit logging
   */
  private async logSecurityEvent(event: string, details: Record<string, any>) {
    try {
      await this.client
        .from('audit_logs')
        .insert({
          user_id: this.adminSession?.adminUser.member_id,
          action: `security.${event}`,
          table_name: 'admin_security',
          old_values: null,
          new_values: details,
          ip_address: details.ip_address,
          user_agent: details.user_agent,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  private async logAdminOperation(log: AdminOperationLog) {
    try {
      await this.client
        .from('audit_logs')
        .insert({
          user_id: log.admin_user_id,
          action: `admin.${log.operation}`,
          table_name: log.target_type,
          record_id: log.target_id,
          old_values: null,
          new_values: {
            permissions_checked: log.permissions_checked,
            role: log.role,
            success: log.success,
            error_message: log.error_message,
            execution_time_ms: log.execution_time_ms,
            context: log.context
          },
          created_at: log.timestamp
        })
    } catch (error) {
      console.error('Failed to log admin operation:', error)
    }
  }

  private summarizeResult(result: any): string {
    if (Array.isArray(result)) {
      return `Array with ${result.length} items`
    }
    if (typeof result === 'object' && result !== null) {
      return `Object with keys: ${Object.keys(result).join(', ')}`
    }
    return String(result).substring(0, 100)
  }

  /**
   * Session management
   */
  async refreshAdminSession(): Promise<AdminSession | null> {
    const { data: { session }, error } = await this.client.auth.refreshSession()

    if (error || !session) {
      this.adminSession = null
      return null
    }

    return this.initializeAdminSession()
  }

  async signOutAdmin(): Promise<void> {
    if (this.adminSession) {
      await this.logSecurityEvent('admin_logout', {
        admin_user_id: this.adminSession.adminUser.id,
        session_id: this.adminSession.sessionId
      })
    }

    await this.client.auth.signOut()
    this.adminSession = null
  }

  /**
   * Getters
   */
  get session(): AdminSession | null {
    return this.adminSession
  }

  get client(): SupabaseClient {
    return this.client
  }

  get isAdminAuthenticated(): boolean {
    return !!this.adminSession?.adminUser.is_active
  }

  get adminUser(): AdminUser | null {
    return this.adminSession?.adminUser || null
  }
}

// Cached server client instance
const createAdminServerClient = cache(() => new AdminSupabaseServer())

/**
 * Get admin server client instance
 */
export async function getAdminServerClient(): Promise<AdminSupabaseServer> {
  const client = createAdminServerClient()
  await client.initializeAdminSession()
  return client
}

/**
 * Get authenticated admin session
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const client = await getAdminServerClient()
  return client.session
}

/**
 * Require admin authentication
 */
export async function requireAdminAuth(): Promise<AdminSession> {
  const session = await getAdminSession()

  if (!session) {
    throw new Error('Admin authentication required')
  }

  return session
}

/**
 * Check admin permission
 */
export async function checkAdminPermission(permission: string): Promise<boolean> {
  const client = await getAdminServerClient()
  return client.validatePermission(permission)
}

/**
 * Require admin permission
 */
export async function requireAdminPermission(permission: string, context?: SecurityContext): Promise<void> {
  const client = await getAdminServerClient()
  await client.requirePermission(permission, context)
}

// Export types and constants
export type { SecurityContext, AdminOperationLog }
export { ADMIN_PERMISSIONS, ROLE_PERMISSIONS }
export default AdminSupabaseServer