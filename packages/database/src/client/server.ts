import { BaseDatabaseClient } from './base'
import type { SupabaseConfig } from './types'

/**
 * Server-side database client
 * For use in API routes and server-side rendering
 */
export class ServerDatabaseClient extends BaseDatabaseClient {
  constructor(config: SupabaseConfig) {
    super({
      type: 'server',
      config,
    })
  }

  /**
   * Set auth token for server-side operations
   */
  setAuth(token: string) {
    this.client.auth.setSession({
      access_token: token,
      refresh_token: '',
    } as any)
  }

  /**
   * Get user from JWT token
   */
  async getUserFromToken(token: string) {
    const { data, error } = await this.client.auth.getUser(token)
    return {
      data: data.user,
      error: error ? this.formatError(error) : null,
    }
  }

  /**
   * Verify and decode JWT token
   */
  async verifyToken(token: string) {
    try {
      const { data, error } = await this.client.auth.getUser(token)

      if (error || !data.user) {
        return {
          valid: false,
          user: null,
          error: error ? this.formatError(error) : null,
        }
      }

      return {
        valid: true,
        user: data.user,
        error: null,
      }
    } catch (error) {
      return {
        valid: false,
        user: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Execute query with user context
   */
  async queryWithAuth<T = any>(
    token: string,
    table: keyof import('./types').Database['public']['Tables'],
    options: Omit<import('./types').QueryBuilderOptions, 'table'>
  ) {
    // Verify token first
    const { valid, error } = await this.verifyToken(token)

    if (!valid) {
      return {
        data: null,
        error: error || {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      }
    }

    // Set auth context
    this.setAuth(token)

    // Execute query
    return this.query<T>({ table, ...options })
  }

  /**
   * Execute RPC (Remote Procedure Call) function
   */
  async rpc<T = any>(
    functionName: string,
    params?: Record<string, any>
  ): Promise<{
    data: T | null
    error: any | null
  }> {
    try {
      const { data, error } = await this.client.rpc(functionName, params)

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
   * Execute transaction (multiple operations atomically)
   */
  async transaction<T = any>(
    operations: (() => Promise<any>)[]
  ): Promise<{
    data: T[] | null
    error: any | null
  }> {
    try {
      // Note: Supabase doesn't have built-in transaction support
      // This is a simulation - in a real implementation, you'd use database transactions
      const results: any[] = []

      for (const operation of operations) {
        const result = await operation()
        if (result.error) {
          throw result.error
        }
        results.push(result.data)
      }

      return {
        data: results,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Generate signed URLs for multiple files
   */
  async createSignedUrls(
    bucket: string,
    paths: string[],
    expiresIn: number = 3600
  ) {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .createSignedUrls(paths, expiresIn)

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
   * Get file metadata
   */
  async getFileMetadata(bucket: string, path: string) {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .list(path, { limit: 1 })

      return {
        data: data?.[0] || null,
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
   * Copy file within storage
   */
  async copyFile(bucket: string, fromPath: string, toPath: string) {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .copy(fromPath, toPath)

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
   * Move file within storage
   */
  async moveFile(bucket: string, fromPath: string, toPath: string) {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .move(fromPath, toPath)

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
}

/**
 * Factory function to create server-side database client
 */
export function createServerDatabaseClient(config: SupabaseConfig): ServerDatabaseClient {
  return new ServerDatabaseClient(config)
}