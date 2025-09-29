'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError, AuthResponse, UserResponse } from '@supabase/supabase-js'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

// Member profile type for SuperApp
export interface MemberProfile {
  id: string
  member_id: string
  full_name: string
  phone: string
  address: string
  date_of_birth: string
  occupation: string
  kyc_status: 'pending' | 'verified' | 'rejected'
  membership_date: string
  status: 'active' | 'inactive' | 'suspended'
}

// Types for authentication state
export interface AuthState {
  user: User | null
  session: Session | null
  memberProfile: MemberProfile | null
  loading: boolean
  initializing: boolean
  error: AuthError | null
  isAuthenticated: boolean
  isVerified: boolean
  requiresVerification: boolean
  isMember: boolean
  membershipStatus: 'active' | 'inactive' | 'suspended' | 'pending' | null
}

// Types for authentication actions
export interface AuthActions {
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<AuthResponse>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<UserResponse>
  refreshSession: () => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  clearError: () => void
  checkEmailExists: (email: string) => Promise<boolean>
  updateMemberProfile: (profileData: Partial<MemberProfile>) => Promise<void>
  refreshMemberProfile: () => Promise<void>
  checkMembershipStatus: () => Promise<'active' | 'inactive' | 'suspended' | 'pending' | null>
}

// Combined context type
export interface AuthContextType extends AuthState, AuthActions {}

// Auth event types for better handling
export type AuthEventType =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'PASSWORD_RECOVERY'
  | 'USER_UPDATED'

// Configuration options
interface AuthProviderOptions {
  redirectTo?: string
  autoRefreshToken?: boolean
  persistSession?: boolean
  showToasts?: boolean
  onAuthStateChange?: (event: AuthEventType, session: Session | null) => void
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Default configuration
const DEFAULT_OPTIONS: AuthProviderOptions = {
  autoRefreshToken: true,
  persistSession: true,
  showToasts: true
}

export interface AuthProviderProps {
  children: React.ReactNode
  options?: AuthProviderOptions
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  options = {}
}) => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const { supabase } = useSupabase()

  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  // Computed state
  const isAuthenticated = !!user && !!session
  const isVerified = !!user?.email_confirmed_at
  const requiresVerification = !!user && !isVerified
  const isMember = !!memberProfile
  const membershipStatus = memberProfile?.status || null

  // Helper function to handle errors
  const handleError = useCallback((error: AuthError | Error | null, showToast = true) => {
    if (!error) return

    const authError = error as AuthError
    setError(authError)

    if (showToast && config.showToasts) {
      const errorMessage = authError.message || 'Terjadi kesalahan pada sistem autentikasi'
      toast.error(errorMessage)
    }

    console.error('Auth Error:', authError)
  }, [config.showToasts])

  // Helper function to handle successful operations
  const handleSuccess = useCallback((message: string, showToast = true) => {
    setError(null)

    if (showToast && config.showToasts) {
      toast.success(message)
    }
  }, [config.showToasts])

  // Clear error function
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Sign in function
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
        handleSuccess('Berhasil masuk!')
      }

      return response
    } catch (error) {
      const authError = error as AuthError
      handleError(authError)
      throw authError
    } finally {
      setLoading(false)
    }
  }, [supabase.auth, handleError, handleSuccess])

  // Sign up function
  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ): Promise<AuthResponse> => {
    try {
      setLoading(true)
      setError(null)

      const response = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: metadata || {},
          emailRedirectTo: config.redirectTo
        }
      })

      if (response.error) {
        throw response.error
      }

      if (response.data.user) {
        if (response.data.user.email_confirmed_at) {
          handleSuccess('Akun berhasil dibuat dan langsung aktif!')
        } else {
          handleSuccess('Akun berhasil dibuat! Silakan cek email untuk verifikasi.')
        }
      }

      return response
    } catch (error) {
      const authError = error as AuthError
      handleError(authError)
      throw authError
    } finally {
      setLoading(false)
    }
  }, [supabase.auth, config.redirectTo, handleError, handleSuccess])

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      // Clear local state immediately
      setUser(null)
      setSession(null)
      setMemberProfile(null)

      handleSuccess('Berhasil keluar!')
    } catch (error) {
      const authError = error as AuthError
      handleError(authError)
      throw authError
    } finally {
      setLoading(false)
    }
  }, [supabase.auth, handleError, handleSuccess])

  // Reset password function
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

  // Update password function
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

  // Refresh session function
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
      }
    } catch (error) {
      const authError = error as AuthError
      handleError(authError, false) // Don't show toast for refresh errors

      // If refresh fails, sign out the user
      await signOut()
    }
  }, [supabase.auth, handleError, signOut])

  // Resend confirmation email
  const resendConfirmation = useCallback(async (email: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: config.redirectTo
        }
      })

      if (error) {
        throw error
      }

      handleSuccess('Email konfirmasi telah dikirim ulang!')
    } catch (error) {
      const authError = error as AuthError
      handleError(authError)
      throw authError
    } finally {
      setLoading(false)
    }
  }, [supabase.auth, config.redirectTo, handleError, handleSuccess])

  // Check if email exists
  const checkEmailExists = useCallback(async (email: string): Promise<boolean> => {
    try {
      // This is a simple check by attempting to sign in with a dummy password
      // In production, you might want to implement a proper endpoint for this
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: 'dummy-password-for-email-check'
      })

      // If error is "Invalid login credentials", email doesn't exist
      // If error is something else, email might exist
      return error?.message !== 'Invalid login credentials'
    } catch (error) {
      return false
    }
  }, [supabase.auth])

  // Member profile management functions
  const refreshMemberProfile = useCallback(async (): Promise<void> => {
    if (!user) return

    try {
      const { data: profile, error } = await supabase
        .from('member_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setMemberProfile(profile || null)
    } catch (error) {
      console.error('Error refreshing member profile:', error)
      setMemberProfile(null)
    }
  }, [user, supabase])

  const updateMemberProfile = useCallback(async (profileData: Partial<MemberProfile>): Promise<void> => {
    if (!user || !memberProfile) {
      throw new Error('User must be authenticated and have a member profile')
    }

    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('member_profiles')
        .update(profileData)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      // Refresh the profile to get updated data
      await refreshMemberProfile()
      handleSuccess('Profil berhasil diperbarui!')
    } catch (error) {
      const authError = error as AuthError
      handleError(authError)
      throw authError
    } finally {
      setLoading(false)
    }
  }, [user, memberProfile, supabase, refreshMemberProfile, handleError, handleSuccess])

  const checkMembershipStatus = useCallback(async (): Promise<'active' | 'inactive' | 'suspended' | 'pending' | null> => {
    if (!user) return null

    try {
      const { data: profile, error } = await supabase
        .from('member_profiles')
        .select('status')
        .eq('user_id', user.id)
        .single()

      if (error) {
        return null
      }

      return profile?.status || null
    } catch (error) {
      console.error('Error checking membership status:', error)
      return null
    }
  }, [user, supabase])

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.email)

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setError(null)

        // Handle different auth events
        const authEvent = event as AuthEventType

        switch (authEvent) {
          case 'SIGNED_IN':
            if (config.showToasts) {
              const userName = session?.user?.user_metadata?.name || session?.user?.email
              toast.success(`Selamat datang${userName ? `, ${userName}` : ''}!`)
            }
            break
          case 'SIGNED_OUT':
            if (config.showToasts) {
              toast.success('Anda telah keluar')
            }
            break
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed successfully')
            break
          case 'PASSWORD_RECOVERY':
            if (config.showToasts) {
              toast.success('Email reset password telah dikirim')
            }
            break
          case 'USER_UPDATED':
            if (config.showToasts) {
              toast.success('Profil berhasil diperbarui')
            }
            break
          default:
            break
        }

        // Call custom auth state change handler
        if (config.onAuthStateChange) {
          config.onAuthStateChange(authEvent, session)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, config, handleError])

  // Auto refresh token
  useEffect(() => {
    if (!config.autoRefreshToken || !session) return

    const refreshInterval = setInterval(async () => {
      const expiresAt = session.expires_at
      const now = Math.floor(Date.now() / 1000)

      // Refresh if token expires in the next 5 minutes
      if (expiresAt && (expiresAt - now) < 300) {
        await refreshSession()
      }
    }, 60000) // Check every minute

    return () => clearInterval(refreshInterval)
  }, [session, config.autoRefreshToken, refreshSession])

  // Context value
  const contextValue: AuthContextType = {
    // State
    user,
    session,
    memberProfile,
    loading,
    initializing,
    error,
    isAuthenticated,
    isVerified,
    requiresVerification,
    isMember,
    membershipStatus,

    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
    resendConfirmation,
    clearError,
    checkEmailExists,
    updateMemberProfile,
    refreshMemberProfile,
    checkMembershipStatus
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

// Higher-order component for protected routes
export interface WithAuthOptions {
  requireAuth?: boolean
  requireVerification?: boolean
  redirectTo?: string
  loadingComponent?: React.ComponentType
  fallbackComponent?: React.ComponentType
}

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) => {
  const {
    requireAuth = true,
    requireVerification = false,
    loadingComponent: LoadingComponent,
    fallbackComponent: FallbackComponent
  } = options

  return function AuthWrappedComponent(props: P) {
    const { initializing, loading, isAuthenticated, isVerified } = useAuth()

    // Show loading component during initialization
    if (initializing || loading) {
      if (LoadingComponent) {
        return <LoadingComponent />
      }

      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )
    }

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      if (FallbackComponent) {
        return <FallbackComponent />
      }

      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Akses Terbatas
            </h2>
            <p className="text-neutral-600">
              Silakan login untuk mengakses halaman ini
            </p>
          </div>
        </div>
      )
    }

    // Check verification requirement
    if (requireVerification && isAuthenticated && !isVerified) {
      if (FallbackComponent) {
        return <FallbackComponent />
      }

      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Verifikasi Email Diperlukan
            </h2>
            <p className="text-neutral-600">
              Silakan verifikasi email Anda untuk melanjutkan
            </p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// Auth status component for debugging
export const AuthStatus: React.FC = () => {
  const auth = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-neutral-200 rounded-lg p-4 shadow-lg text-xs font-mono max-w-xs">
      <div className="font-semibold mb-2">Auth Status (Dev Only)</div>
      <div>Authenticated: {auth.isAuthenticated ? '✅' : '❌'}</div>
      <div>Verified: {auth.isVerified ? '✅' : '❌'}</div>
      <div>Loading: {auth.loading ? '⏳' : '✅'}</div>
      <div>Initializing: {auth.initializing ? '⏳' : '✅'}</div>
      {auth.user && (
        <div className="mt-2 pt-2 border-t border-neutral-200">
          <div>Email: {auth.user.email}</div>
          <div>ID: {auth.user.id.slice(0, 8)}...</div>
        </div>
      )}
      {auth.error && (
        <div className="mt-2 pt-2 border-t border-red-200 text-red-600">
          Error: {auth.error.message}
        </div>
      )}
    </div>
  )
}

export default AuthProvider