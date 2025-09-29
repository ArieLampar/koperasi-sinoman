import { createClient } from '@supabase/supabase-js'
import type {
  SupabaseClientType,
  SupabaseConfig,
  ClientOptions,
  DatabaseClientError,
  QueryBuilderOptions,
  BatchOperation,
  RealtimeOptions,
  ClientCapabilities,
  Database,
} from './types'

/**
 * Base database client class
 * Provides common functionality for all client types
 */
export abstract class BaseDatabaseClient {
  protected client: SupabaseClientType
  protected config: SupabaseConfig
  protected capabilities: ClientCapabilities

  constructor(options: ClientOptions) {
    this.config = options.config
    this.capabilities = this.getCapabilities(options.type)
    this.client = this.createClient(options)
  }

  /**
   * Create Supabase client based on type
   */
  protected createClient(options: ClientOptions): SupabaseClientType {
    const { config, type } = options

    let key: string
    let clientOptions = config.options || {}

    switch (type) {
      case 'client':
        if (!config.anonKey) {
          throw new Error('Anonymous key is required for client-side usage')
        }
        key = config.anonKey
        break

      case 'server':
        if (!config.anonKey) {
          throw new Error('Anonymous key is required for server-side usage')
        }
        key = config.anonKey
        // Disable session persistence for server-side
        clientOptions = {
          ...clientOptions,
          auth: {
            ...clientOptions.auth,
            persistSession: false,
            autoRefreshToken: false,
          },
        }
        break

      case 'admin':
        if (!config.serviceRoleKey) {
          throw new Error('Service role key is required for admin usage')
        }
        key = config.serviceRoleKey
        // Disable session persistence and auth for admin
        clientOptions = {
          ...clientOptions,
          auth: {
            ...clientOptions.auth,
            persistSession: false,
            autoRefreshToken: false,
          },
        }
        break

      default:
        throw new Error(`Unknown client type: ${type}`)
    }

    return createClient<Database>(config.url, key, clientOptions)
  }

  /**
   * Get client capabilities based on type
   */
  protected getCapabilities(type: string): ClientCapabilities {
    switch (type) {
      case 'client':
        return {
          read: true,
          write: true,
          admin: false,
          realtime: true,
        }
      case 'server':
        return {
          read: true,
          write: true,
          admin: false,
          realtime: false,
        }
      case 'admin':
        return {
          read: true,
          write: true,
          admin: true,
          realtime: false,
        }
      default:
        return {
          read: false,
          write: false,
          admin: false,
          realtime: false,
        }
    }
  }

  /**
   * Get the underlying Supabase client
   */
  getClient(): SupabaseClientType {
    return this.client
  }

  /**
   * Get client capabilities
   */
  getCapabilities(): ClientCapabilities {
    return this.capabilities
  }

  /**
   * Execute a query with options
   */
  async query<T = any>(options: QueryBuilderOptions): Promise<{
    data: T | T[] | null
    error: DatabaseClientError | null
    count?: number
  }> {
    try {
      let query = this.client.from(options.table)

      // Apply select
      if (options.select) {
        query = query.select(options.select, { count: 'exact' })
      } else {
        query = query.select('*', { count: 'exact' })
      }

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value)
            } else if (typeof value === 'string' && value.includes('%')) {
              query = query.like(key, value)
            } else {
              query = query.eq(key, value)
            }
          }
        })
      }

      // Apply ordering
      if (options.orderBy) {
        options.orderBy.forEach(({ column, ascending = true }) => {
          query = query.order(column, { ascending })
        })
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      // Execute query
      const result = options.single ? await query.single() : await query

      return {
        data: result.data,
        error: result.error ? this.formatError(result.error) : null,
        count: result.count || undefined,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Insert data
   */
  async insert<T = any>(
    table: keyof Database['public']['Tables'],
    data: any | any[]
  ): Promise<{
    data: T | T[] | null
    error: DatabaseClientError | null
  }> {
    if (!this.capabilities.write) {
      return {
        data: null,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Write operations not allowed for this client type',
        },
      }
    }

    try {
      const result = await this.client
        .from(table)
        .insert(data)
        .select()

      return {
        data: result.data,
        error: result.error ? this.formatError(result.error) : null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Update data
   */
  async update<T = any>(
    table: keyof Database['public']['Tables'],
    data: any,
    filters: Record<string, any>
  ): Promise<{
    data: T | T[] | null
    error: DatabaseClientError | null
  }> {
    if (!this.capabilities.write) {
      return {
        data: null,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Write operations not allowed for this client type',
        },
      }
    }

    try {
      let query = this.client.from(table).update(data)

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const result = await query.select()

      return {
        data: result.data,
        error: result.error ? this.formatError(result.error) : null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Delete data
   */
  async delete<T = any>(
    table: keyof Database['public']['Tables'],
    filters: Record<string, any>
  ): Promise<{
    data: T | T[] | null
    error: DatabaseClientError | null
  }> {
    if (!this.capabilities.write) {
      return {
        data: null,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Write operations not allowed for this client type',
        },
      }
    }

    try {
      let query = this.client.from(table).delete()

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const result = await query.select()

      return {
        data: result.data,
        error: result.error ? this.formatError(result.error) : null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Execute batch operations
   */
  async batch(operations: BatchOperation[]): Promise<{
    success: boolean
    results: any[]
    errors: (DatabaseClientError | null)[]
  }> {
    if (!this.capabilities.write) {
      return {
        success: false,
        results: [],
        errors: [
          {
            code: 'PERMISSION_DENIED',
            message: 'Write operations not allowed for this client type',
          },
        ],
      }
    }

    const results: any[] = []
    const errors: (DatabaseClientError | null)[] = []

    for (const operation of operations) {
      try {
        let result: any

        switch (operation.operation) {
          case 'insert':
            result = await this.insert(operation.table, operation.data)
            break
          case 'update':
            result = await this.update(operation.table, operation.data, operation.filters || {})
            break
          case 'delete':
            result = await this.delete(operation.table, operation.filters || {})
            break
          default:
            throw new Error(`Unknown operation: ${operation.operation}`)
        }

        results.push(result.data)
        errors.push(result.error)
      } catch (error) {
        results.push(null)
        errors.push(this.formatError(error))
      }
    }

    return {
      success: errors.every((error) => error === null),
      results,
      errors,
    }
  }

  /**
   * Subscribe to real-time changes
   */
  subscribe(options: RealtimeOptions) {
    if (!this.capabilities.realtime) {
      throw new Error('Real-time subscriptions not supported for this client type')
    }

    const channel = this.client
      .channel(`${options.table}_changes`)
      .on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: 'public',
          table: options.table as string,
          filter: options.filter,
        },
        options.callback
      )
      .subscribe()

    return channel
  }

  /**
   * Format error for consistent error handling
   */
  protected formatError(error: any): DatabaseClientError {
    if (typeof error === 'string') {
      return {
        code: 'UNKNOWN_ERROR',
        message: error,
      }
    }

    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error.details,
      hint: error.hint,
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const { error } = await this.client.from('members').select('id').limit(1)
      return { healthy: !error }
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}