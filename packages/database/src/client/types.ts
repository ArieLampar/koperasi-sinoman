import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'

// Re-export Database type for client usage
export type { Database }

// Supabase client type with our database schema
export type SupabaseClientType = SupabaseClient<Database>

// Configuration types
export interface SupabaseConfig {
  url: string
  anonKey?: string
  serviceRoleKey?: string
  options?: {
    auth?: {
      autoRefreshToken?: boolean
      persistSession?: boolean
      detectSessionInUrl?: boolean
    }
    global?: {
      headers?: Record<string, string>
    }
    realtime?: {
      enabled?: boolean
      timeout?: number
    }
  }
}

// Client factory options
export interface ClientOptions {
  type: 'client' | 'server' | 'admin'
  config: SupabaseConfig
}

// Error types
export interface DatabaseClientError {
  code: string
  message: string
  details?: any
  hint?: string
}

// Query builder options
export interface QueryBuilderOptions {
  table: keyof Database['public']['Tables']
  select?: string
  filters?: Record<string, any>
  orderBy?: {
    column: string
    ascending?: boolean
  }[]
  limit?: number
  offset?: number
  single?: boolean
}

// Batch operation types
export interface BatchOperation {
  table: keyof Database['public']['Tables']
  operation: 'insert' | 'update' | 'delete'
  data: any
  filters?: Record<string, any>
}

// Real-time subscription options
export interface RealtimeOptions {
  table: keyof Database['public']['Tables']
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  callback: (payload: any) => void
}

// Client capabilities
export interface ClientCapabilities {
  read: boolean
  write: boolean
  admin: boolean
  realtime: boolean
}