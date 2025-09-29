'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError, AuthResponse, UserResponse } from '@supabase/supabase-js'
import { useSupabase } from './supabase-provider'
import toast from 'react-hot-toast'

// Admin role types
export type AdminRole = 'super_admin' | 'admin' | 'manager' | 'auditor' | 'staff'

// Enhanced auth state for admin interface
export interface AdminAuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initializing: boolean
  error: AuthError | null
  isAuthenticated: boolean
  isVerified: boolean
  requiresVerification: boolean
  isAdmin: boolean
  adminRoles: AdminRole[]
  permissions: string[]
}

// Admin-specific auth actions
export interface AdminAuthActions {
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<UserResponse>
  refreshSession: () => Promise<void>
  clearError: () => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: AdminRole) => boolean
  checkAdminAccess: () => Promise<boolean>
}

export interface AdminAuthContextType extends AdminAuthState, AdminAuthActions {}

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ['*'], // All permissions
  admin: [
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'savings.view',
    'savings.create',
    'savings.update',
    'loans.view',
    'loans.create',
    'loans.update',
    'loans.approve',
    'reports.view',
    'reports.export',
    'audit.view',
    'settings.update',
  ],
  manager: [
    'users.view',
    'users.update',
    'savings.view',
    'savings.create',
    'savings.update',
    'loans.view',
    'loans.create',
    'loans.update',
    'reports.view',
    'reports.export',
    'audit.view',
  ],
  auditor: [
    'users.view',
    'savings.view',
    'loans.view',
    'reports.view',
    'reports.export',
    'audit.view',
    'audit.export',
  ],
  staff: [
    'users.view',
    'savings.view',
    'savings.create',
    'savings.update',
    'loans.view',
    'loans.create',
    'reports.view',
  ],
}

// Auth provider options
interface AdminAuthProviderOptions {
  redirectTo?: string
  autoRefreshToken?: boolean
  persistSession?: boolean
  showToasts?: boolean
  onAuthStateChange?: (event: string, session: Session | null) => void
}

const AuthContext = createContext<AdminAuthContextType | undefined>(undefined)

const DEFAULT_OPTIONS: AdminAuthProviderOptions = {
  autoRefreshToken: true,
  persistSession: true,
  showToasts: true,
}

export interface AuthProviderProps {
  children: React.ReactNode
  options?: AdminAuthProviderOptions
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  options = {},
}) => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const { supabase } = useSupabase()

  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([])
  const [permissions, setPermissions] = useState<string[]>([])

  // Computed state
  const isAuthenticated = !!user && !!session
  const isVerified = !!user?.email_confirmed_at
  const requiresVerification = !!user && !isVerified
  const isAdmin = adminRoles.length > 0

  // Helper functions
  const handleError = useCallback((error: AuthError | Error | null, showToast = true) => {
    if (!error) return

    const authError = error as AuthError
    setError(authError)

    if (showToast && config.showToasts) {
      const errorMessage = authError.message || 'Terjadi kesalahan pada sistem autentikasi'
      toast.error(errorMessage)
    }

    console.error('Admin Auth Error:', authError)
  }, [config.showToasts])

  const handleSuccess = useCallback((message: string, showToast = true) => {
    setError(null)
    if (showToast && config.showToasts) {
      toast.success(message)
    }
  }, [config.showToasts])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Permission checking functions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!isAdmin) return false
    if (permissions.includes('*')) return true
    return permissions.includes(permission)
  }, [isAdmin, permissions])

  const hasRole = useCallback((role: AdminRole): boolean => {
    return adminRoles.includes(role)
  }, [adminRoles])

  // Check admin access and load roles/permissions
  const checkAdminAccess = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    try {
      // Check if user has admin metadata
      const userRoles = user.user_metadata?.admin_roles as AdminRole[] || []

      if (userRoles.length === 0) {
        // Try to fetch from admin_users table
        const { data: adminUser, error } = await supabase
          .from('admin_users')
          .select('roles, permissions, active')
          .eq('user_id', user.id)
          .single()

        if (error || !adminUser || !adminUser.active) {
          return false
        }

        setAdminRoles(adminUser.roles || [])
        setPermissions(adminUser.permissions || [])
      } else {
        // Use metadata roles
        setAdminRoles(userRoles)

        // Calculate permissions based on roles
        const allPermissions = userRoles.reduce((perms: string[], role: AdminRole) => {
          return [...perms, ...ROLE_PERMISSIONS[role]]
        }, [])

        setPermissions([...new Set(allPermissions)])
      }

      return true
    } catch (error) {
      console.error('Error checking admin access:', error)
      return false
    }
  }, [user, supabase])

  // Auth actions
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setLoading(true)
      setError(null)

      const response = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })

      if (response.error) {
        throw response.error
      }

      if (response.data.user && response.data.session) {
        // Check admin access after successful login
        const hasAccess = await checkAdminAccess()
        if (!hasAccess) {
          await supabase.auth.signOut()
          throw new Error('Akses ditolak: Anda tidak memiliki izin admin')
        }

        handleSuccess('Berhasil masuk ke dashboard admin!')
      }

      return response
    } catch (error) {
      const authError = error as AuthError
      handleError(authError)
      throw authError
    } finally {
      setLoading(false)
    }
  }, [supabase.auth, handleError, handleSuccess, checkAdminAccess])

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      // Clear admin state
      setUser(null)
      setSession(null)
      setAdminRoles([])
      setPermissions([])

      handleSuccess('Berhasil keluar dari dashboard admin!')
    } catch (error) {
      const authError = error as AuthError
      handleError(authError)
      throw authError
    } finally {
      setLoading(false)
    }
  }, [supabase.auth, handleError, handleSuccess])

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: config.redirectTo
      })

      if (error) {
        throw error
      }

      handleSuccess('Email reset password telah dikirim!')
    } catch (error) {
      const authError = error as AuthError
      handleError(authError)
      throw authError
    } finally {
      setLoading(false)
    }
  }, [supabase.auth, config.redirectTo, handleError, handleSuccess])

  const updatePassword = useCallback(async (password: string): Promise<UserResponse> => {
    try {
      setLoading(true)
      setError(null)

      const response = await supabase.auth.updateUser({ password })

      if (response.error) {
        throw response.error
      }

      handleSuccess('Password berhasil diperbarui!')
      return response
    } catch (error) {
      const authError = error as AuthError
      handleError(authError)
      throw authError
    } finally {
      setLoading(false)
    }
  }, [supabase.auth, handleError, handleSuccess])

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      setError(null)

      const { data: { session }, error } = await supabase.auth.refreshSession()

      if (error) {
        throw error
      }

      if (session) {
        setSession(session)
        setUser(session.user)
        await checkAdminAccess()
      }
    } catch (error) {
      const authError = error as AuthError
      handleError(authError, false)
      await signOut()
    }
  }, [supabase.auth, handleError, signOut, checkAdminAccess])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (mounted && session) {
          setSession(session)
          setUser(session.user)
          await checkAdminAccess()
        }
      } catch (error) {
        if (mounted) {
          handleError(error as AuthError, false)
        }
      } finally {
        if (mounted) {
          setInitializing(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Admin auth state changed:', event, session?.user?.email)

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setError(null)

        if (session?.user) {
          await checkAdminAccess()
        } else {
          setAdminRoles([])
          setPermissions([])
        }

        if (config.onAuthStateChange) {
          config.onAuthStateChange(event, session)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, config, handleError, checkAdminAccess])

  // Auto refresh token
  useEffect(() => {
    if (!config.autoRefreshToken || !session) return

    const refreshInterval = setInterval(async () => {
      const expiresAt = session.expires_at
      const now = Math.floor(Date.now() / 1000)

      if (expiresAt && (expiresAt - now) < 300) {
        await refreshSession()
      }
    }, 60000)

    return () => clearInterval(refreshInterval)
  }, [session, config.autoRefreshToken, refreshSession])

  const contextValue: AdminAuthContextType = {
    // State
    user,
    session,
    loading,
    initializing,
    error,
    isAuthenticated,
    isVerified,
    requiresVerification,
    isAdmin,
    adminRoles,
    permissions,

    // Actions
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
    clearError,
    hasPermission,
    hasRole,
    checkAdminAccess,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AdminAuthContextType => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export default AuthProvider