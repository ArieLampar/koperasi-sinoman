import { BaseDatabaseClient } from './base'
import type { SupabaseConfig } from './types'

/**
 * Client-side database client
 * For use in React components and client-side code
 */
export class DatabaseClient extends BaseDatabaseClient {
  constructor(config: SupabaseConfig) {
    super({
      type: 'client',
      config,
    })
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    })

    return {
      data,
      error: error ? this.formatError(error) : null,
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    return {
      data,
      error: error ? this.formatError(error) : null,
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await this.client.auth.signOut()
    return {
      error: error ? this.formatError(error) : null,
    }
  }

  /**
   * Get current user
   */
  async getUser() {
    const { data, error } = await this.client.auth.getUser()
    return {
      data: data.user,
      error: error ? this.formatError(error) : null,
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await this.client.auth.getSession()
    return {
      data: data.session,
      error: error ? this.formatError(error) : null,
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.client.auth.onAuthStateChange(callback)
  }

  /**
   * Upload file to storage
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: {
      cacheControl?: string
      contentType?: string
      upsert?: boolean
    }
  ) {
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(path, file, options)

    return {
      data,
      error: error ? this.formatError(error) : null,
    }
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(bucket: string, path: string) {
    const { data } = this.client.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, paths: string[]) {
    const { data, error } = await this.client.storage.from(bucket).remove(paths)

    return {
      data,
      error: error ? this.formatError(error) : null,
    }
  }

  /**
   * Generate signed URL for private file
   */
  async createSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ) {
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    return {
      data,
      error: error ? this.formatError(error) : null,
    }
  }
}

/**
 * Factory function to create client-side database client
 */
export function createDatabaseClient(config: SupabaseConfig): DatabaseClient {
  return new DatabaseClient(config)
}