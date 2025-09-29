import { BaseDatabaseClient } from './base'
import type { SupabaseConfig } from './types'

/**
 * Admin database client
 * For administrative operations with elevated permissions
 */
export class AdminDatabaseClient extends BaseDatabaseClient {
  constructor(config: SupabaseConfig) {
    super({
      type: 'admin',
      config,
    })
  }

  /**
   * Create a new user with admin privileges
   */
  async createUser(email: string, password: string, metadata?: Record<string, any>) {
    if (!this.capabilities.admin) {
      return {
        data: null,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Admin operations not allowed for this client type',
        },
      }
    }

    try {
      const { data, error } = await this.client.auth.admin.createUser({
        email,
        password,
        user_metadata: metadata,
        email_confirm: true,
      })

      return {
        data,
        error: error ? this.formatError(error) : null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string) {
    if (!this.capabilities.admin) {
      return {
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Admin operations not allowed for this client type',
        },
      }
    }

    try {
      const { error } = await this.client.auth.admin.deleteUser(userId)

      return {
        error: error ? this.formatError(error) : null,
      }
    } catch (error) {
      return {
        error: this.formatError(error),
      }
    }
  }

  /**
   * Update user metadata
   */
  async updateUser(userId: string, updates: {
    email?: string
    password?: string
    user_metadata?: Record<string, any>
    app_metadata?: Record<string, any>
  }) {
    if (!this.capabilities.admin) {
      return {
        data: null,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Admin operations not allowed for this client type',
        },
      }
    }

    try {
      const { data, error } = await this.client.auth.admin.updateUserById(userId, updates)

      return {
        data,
        error: error ? this.formatError(error) : null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * List all users with pagination
   */
  async listUsers(options?: {
    page?: number
    perPage?: number
  }) {
    if (!this.capabilities.admin) {
      return {
        data: null,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Admin operations not allowed for this client type',
        },
      }
    }

    try {
      const { data, error } = await this.client.auth.admin.listUsers({
        page: options?.page || 1,
        perPage: options?.perPage || 50,
      })

      return {
        data,
        error: error ? this.formatError(error) : null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string) {
    if (!this.capabilities.admin) {
      return {
        data: null,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Admin operations not allowed for this client type',
        },
      }
    }

    try {
      const { data, error } = await this.client.auth.admin.getUserById(userId)

      return {
        data,
        error: error ? this.formatError(error) : null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(email: string) {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email)

      return {
        error: error ? this.formatError(error) : null,
      }
    } catch (error) {
      return {
        error: this.formatError(error),
      }
    }
  }

  /**
   * Execute raw SQL query (admin only)
   */
  async rawQuery<T = any>(query: string, params?: any[]): Promise<{
    data: T[] | null
    error: any | null
  }> {
    if (!this.capabilities.admin) {
      return {
        data: null,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Raw queries not allowed for this client type',
        },
      }
    }

    try {
      // Note: This would require a custom RPC function in Supabase
      // or a direct connection to the database
      const { data, error } = await this.client.rpc('execute_raw_sql', {
        query,
        params,
      })

      return {
        data,
        error: error ? this.formatError(error) : null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Backup table data
   */
  async backupTable(tableName: string): Promise<{
    data: any[] | null
    error: any | null
  }> {
    if (!this.capabilities.admin) {
      return {
        data: null,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Backup operations not allowed for this client type',
        },
      }
    }

    try {
      const { data, error } = await this.client
        .from(tableName)
        .select('*')

      return {
        data,
        error: error ? this.formatError(error) : null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    data: {
      tables: {
        name: string
        row_count: number
        size_bytes: number
      }[]
      total_size: number
      connection_count: number
    } | null
    error: any | null
  }> {
    if (!this.capabilities.admin) {
      return {
        data: null,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Statistics not available for this client type',
        },
      }
    }

    try {
      const { data, error } = await this.client.rpc('get_database_stats')

      return {
        data,
        error: error ? this.formatError(error) : null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Truncate table (admin only - dangerous operation)
   */
  async truncateTable(tableName: string, cascade: boolean = false): Promise<{
    error: any | null
  }> {
    if (!this.capabilities.admin) {
      return {
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Truncate operations not allowed for this client type',
        },
      }
    }

    try {
      const { error } = await this.client.rpc('truncate_table', {
        table_name: tableName,
        cascade,
      })

      return {
        error: error ? this.formatError(error) : null,
      }
    } catch (error) {
      return {
        error: this.formatError(error),
      }
    }
  }

  /**
   * Create storage bucket
   */
  async createBucket(name: string, options?: {
    public?: boolean
    fileSizeLimit?: number
    allowedMimeTypes?: string[]
  }) {
    if (!this.capabilities.admin) {
      return {
        data: null,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bucket creation not allowed for this client type',
        },
      }
    }

    try {
      const { data, error } = await this.client.storage.createBucket(name, options)

      return {
        data,
        error: error ? this.formatError(error) : null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Delete storage bucket
   */
  async deleteBucket(name: string) {
    if (!this.capabilities.admin) {
      return {
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bucket deletion not allowed for this client type',
        },
      }
    }

    try {
      const { error } = await this.client.storage.deleteBucket(name)

      return {
        error: error ? this.formatError(error) : null,
      }
    } catch (error) {
      return {
        error: this.formatError(error),
      }
    }
  }
}

/**
 * Factory function to create admin database client
 */
export function createAdminDatabaseClient(config: SupabaseConfig): AdminDatabaseClient {
  return new AdminDatabaseClient(config)
}