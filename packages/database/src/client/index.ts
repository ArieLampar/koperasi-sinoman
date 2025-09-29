// Client exports
export { DatabaseClient, createDatabaseClient } from './client'
export { ServerDatabaseClient, createServerDatabaseClient } from './server'
export { AdminDatabaseClient, createAdminDatabaseClient } from './admin'
export { BaseDatabaseClient } from './base'

// Types
export type {
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

// Factory functions for different environments
export function createClient(config: {
  url: string
  anonKey: string
  options?: any
}) {
  return createDatabaseClient(config)
}

export function createServerClient(config: {
  url: string
  anonKey: string
  options?: any
}) {
  return createServerDatabaseClient(config)
}

export function createAdminClient(config: {
  url: string
  serviceRoleKey: string
  options?: any
}) {
  return createAdminDatabaseClient(config)
}

// Environment-specific factories
export function createClientForEnvironment(
  env: 'client' | 'server' | 'admin',
  config: {
    url: string
    anonKey?: string
    serviceRoleKey?: string
    options?: any
  }
) {
  switch (env) {
    case 'client':
      if (!config.anonKey) {
        throw new Error('anonKey is required for client environment')
      }
      return createDatabaseClient({
        url: config.url,
        anonKey: config.anonKey,
        options: config.options,
      })

    case 'server':
      if (!config.anonKey) {
        throw new Error('anonKey is required for server environment')
      }
      return createServerDatabaseClient({
        url: config.url,
        anonKey: config.anonKey,
        options: config.options,
      })

    case 'admin':
      if (!config.serviceRoleKey) {
        throw new Error('serviceRoleKey is required for admin environment')
      }
      return createAdminDatabaseClient({
        url: config.url,
        serviceRoleKey: config.serviceRoleKey,
        options: config.options,
      })

    default:
      throw new Error(`Unknown environment: ${env}`)
  }
}