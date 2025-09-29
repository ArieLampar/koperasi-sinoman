'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useAudit } from '@/components/providers/audit-provider'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { AccessDenied } from '@/components/ui/access-denied'
import { toast } from 'react-hot-toast'

interface AdminLayoutProps {
  children: React.ReactNode
}

// Define admin role hierarchy and permissions
const ADMIN_PERMISSIONS = {
  super_admin: [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'members.create', 'members.read', 'members.update', 'members.delete',
    'savings.create', 'savings.read', 'savings.update', 'savings.delete',
    'loans.create', 'loans.read', 'loans.update', 'loans.delete',
    'reports.create', 'reports.read', 'reports.export',
    'settings.read', 'settings.update',
    'audit.read', 'audit.export',
    'system.maintenance', 'system.backup'
  ],
  admin: [
    'members.create', 'members.read', 'members.update',
    'savings.create', 'savings.read', 'savings.update',
    'loans.create', 'loans.read', 'loans.update', 'loans.approve',
    'reports.read', 'reports.export',
    'audit.read'
  ],
  manager: [
    'members.read', 'members.update',
    'savings.read', 'savings.update',
    'loans.read', 'loans.update',
    'reports.read'
  ],
  operator: [
    'members.read',
    'savings.read',
    'loans.read',
    'reports.read'
  ]
} as const

type AdminRole = keyof typeof ADMIN_PERMISSIONS
type Permission = typeof ADMIN_PERMISSIONS[AdminRole][number]

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const {
    user,
    loading,
    initializing,
    isAuthenticated,
    isAdmin,
    adminRoles,
    permissions,
  } = useAuth()
  const { logAuthEvent, logEvent } = useAudit()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [sessionWarningShown, setSessionWarningShown] = useState(false)

  // Session timeout configuration (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  const WARNING_TIME = 5 * 60 * 1000 // 5 minutes before timeout

  // Check user permissions
  const hasPermission = useCallback((permission: Permission) => {
    if (!adminRoles || adminRoles.length === 0) return false

    return adminRoles.some((role: string) => {
      const rolePermissions = ADMIN_PERMISSIONS[role as AdminRole]
      return rolePermissions?.includes(permission)
    })
  }, [adminRoles])

  // Check if user has any admin role
  const hasAdminAccess = useCallback(() => {
    if (!adminRoles || adminRoles.length === 0) return false
    return adminRoles.some((role: string) => role in ADMIN_PERMISSIONS)
  }, [adminRoles])

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
    setSessionWarningShown(false)
  }, [])

  // Handle session timeout
  const handleSessionTimeout = useCallback(async () => {
    try {
      await logAuthEvent('session_timeout', {
        user_id: user?.id,
        last_activity: new Date(lastActivity).toISOString(),
        path: pathname,
      })

      toast.error('Sesi Anda telah berakhir karena tidak ada aktivitas')
      router.push('/auth/signin?reason=session_timeout')
    } catch (error) {
      console.error('Error logging session timeout:', error)
      router.push('/auth/signin?reason=session_timeout')
    }
  }, [user?.id, lastActivity, pathname, logAuthEvent, router])

  // Handle mounting state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Session management and activity tracking
  useEffect(() => {
    if (!mounted || !isAuthenticated) return

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    // Check session timeout
    const checkSession = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity

      if (timeSinceActivity >= SESSION_TIMEOUT) {
        handleSessionTimeout()
      } else if (timeSinceActivity >= SESSION_TIMEOUT - WARNING_TIME && !sessionWarningShown) {
        setSessionWarningShown(true)
        toast((t) => (
          <div className="flex flex-col space-y-2">
            <span className="font-medium">Sesi akan berakhir dalam 5 menit</span>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
                onClick={() => {
                  updateActivity()
                  toast.dismiss(t.id)
                }}
              >
                Perpanjang Sesi
              </button>
              <button
                className="px-3 py-1 bg-neutral-600 text-white rounded text-sm"
                onClick={() => {
                  toast.dismiss(t.id)
                  router.push('/auth/signin')
                }}
              >
                Keluar
              </button>
            </div>
          </div>
        ), {
          duration: WARNING_TIME,
          position: 'top-center',
        })
      }
    }, 60000) // Check every minute

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity)
      })
      clearInterval(checkSession)
    }
  }, [mounted, isAuthenticated, lastActivity, sessionWarningShown, updateActivity, handleSessionTimeout, router])

  // Handle authentication state changes
  useEffect(() => {
    if (!initializing && !loading && mounted) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.push('/auth/signin')
        return
      }

      if (isAuthenticated && !hasAdminAccess()) {
        // Log unauthorized access attempt
        logAuthEvent('unauthorized_access', {
          reason: 'insufficient_privileges',
          attempted_path: pathname,
          user_id: user?.id,
          user_email: user?.email,
          user_roles: adminRoles,
          timestamp: new Date().toISOString(),
        })

        toast.error('Akses ditolak: Anda tidak memiliki hak akses admin')
        return
      }

      // Log successful admin access
      if (isAuthenticated && hasAdminAccess()) {
        logEvent({
          event_type: 'admin.access',
          target_type: 'admin_panel',
          target_id: pathname,
          action_details: {
            path: pathname,
            user_roles: adminRoles,
            timestamp: new Date().toISOString(),
          },
          severity: 'low',
        })
      }
    }
  }, [
    isAuthenticated,
    isAdmin,
    initializing,
    loading,
    mounted,
    router,
    pathname,
    adminRoles,
    logAuthEvent,
    logEvent,
    user?.id,
    user?.email,
    hasAdminAccess,
  ])

  // Show loading screen during initialization
  if (!mounted || initializing || loading) {
    return (
      <LoadingScreen
        message="Memuat panel admin..."
        showProgress
        className="bg-neutral-900"
      />
    )
  }

  // Show access denied if not authenticated
  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  // Show access denied if not admin
  if (!hasAdminAccess()) {
    return (
      <AccessDenied
        title="Akses Ditolak"
        message="Anda tidak memiliki hak akses untuk menggunakan panel administrasi."
        showContactInfo={true}
      />
    )
  }

  return (
    <div className="h-full flex bg-neutral-50 admin-layout">
      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRoles={adminRoles}
        hasPermission={hasPermission}
        onNavigate={(path) => {
          // Log navigation events
          logEvent({
            event_type: 'admin.navigate',
            target_type: 'page',
            target_id: path,
            action_details: {
              from: pathname,
              to: path,
              timestamp: new Date().toISOString(),
            },
            severity: 'low',
          })
        }}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Header */}
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          userRoles={adminRoles}
          hasPermission={hasPermission}
          lastActivity={lastActivity}
          onActivityUpdate={updateActivity}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 admin-scrollbar">
          <div className="p-6 min-h-full">
            {/* Page access audit */}
            <div className="sr-only" aria-hidden="true">
              Admin Panel - {pathname} - User: {user?.email} - Roles: {adminRoles?.join(', ')}
            </div>

            {children}
          </div>
        </main>

        {/* Admin footer */}
        <footer className="bg-white border-t border-neutral-200 px-6 py-3">
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <div className="flex items-center space-x-4">
              <span>Koperasi Sinoman Admin v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
              <span>•</span>
              <span>Sesi: {new Date(lastActivity).toLocaleTimeString('id-ID')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Admin security overlay for suspicious activity */}
      {process.env.NODE_ENV === 'production' && (
        <div className="sr-only">
          <div id="admin-security-monitor" />
        </div>
      )}
    </div>
  )
}

// Export permission utilities for use in other components
export { ADMIN_PERMISSIONS, type AdminRole, type Permission }