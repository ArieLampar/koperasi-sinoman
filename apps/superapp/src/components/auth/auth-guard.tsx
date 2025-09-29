'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import { LoadingOverlay } from '@/components/ui/spinner'

export interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireVerification?: boolean
  requiredRoles?: string[]
  redirectTo?: string
  fallback?: React.ComponentType
  loadingComponent?: React.ComponentType
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  requireVerification = false,
  requiredRoles = [],
  redirectTo = '/auth/login',
  fallback: FallbackComponent,
  loadingComponent: LoadingComponent = LoadingOverlay
}) => {
  const router = useRouter()
  const {
    user,
    loading,
    initializing,
    isAuthenticated,
    isVerified
  } = useAuth()

  // Show loading during initialization
  if (initializing || loading) {
    return <LoadingComponent />
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    if (FallbackComponent) {
      return <FallbackComponent />
    }

    // Redirect to login
    React.useEffect(() => {
      router.push(redirectTo)
    }, [router, redirectTo])

    return null
  }

  // Check verification requirement
  if (requireVerification && isAuthenticated && !isVerified) {
    if (FallbackComponent) {
      return <FallbackComponent />
    }

    // Redirect to verification page
    React.useEffect(() => {
      router.push('/auth/verify')
    }, [router])

    return null
  }

  // Check role requirements
  if (requiredRoles.length > 0 && user) {
    const userRoles = user.user_metadata?.roles || []
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role))

    if (!hasRequiredRole) {
      if (FallbackComponent) {
        return <FallbackComponent />
      }

      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Akses Ditolak
            </h2>
            <p className="text-neutral-600">
              Anda tidak memiliki izin untuk mengakses halaman ini
            </p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

export default AuthGuard