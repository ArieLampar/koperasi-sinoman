'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useAudit } from '@/components/providers/audit-provider'
import { useSupabase } from '@/components/providers/supabase-provider'
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { RecentActivities } from '@/components/dashboard/recent-activities'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { LoadingScreen } from '@/components/ui/loading-screen'

interface DashboardData {
  totalMembers: number
  pendingKyc: number
  totalSavings: number
  totalLoans: number
  monthlyGrowth: {
    members: number
    savings: number
    loans: number
  }
  recentActivities: Array<{
    id: string
    type: 'member' | 'savings' | 'loan' | 'system'
    title: string
    description: string
    timestamp: string
    user: string
    status: 'success' | 'pending' | 'error'
  }>
  alerts: Array<{
    id: string
    type: 'warning' | 'error' | 'info'
    title: string
    message: string
    timestamp: string
    priority: 'low' | 'medium' | 'high'
  }>
}

export default function AdminDashboard() {
  const { user, hasPermission } = useAuth()
  const { logEvent } = useAudit()
  const { supabase } = useSupabase()

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Simulate API calls - replace with actual Supabase queries
        const [
          membersResult,
          savingsResult,
          loansResult,
          activitiesResult,
        ] = await Promise.all([
          // Fetch members data
          supabase
            .from('members')
            .select('id, status, created_at')
            .order('created_at', { ascending: false }),

          // Fetch savings data
          supabase
            .from('savings_accounts')
            .select('id, balance, type, created_at'),

          // Fetch loans data
          supabase
            .from('loans')
            .select('id, amount, status, created_at'),

          // Fetch recent activities from audit logs
          supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(10),
        ])

        // Process members data
        const members = membersResult.data || []
        const totalMembers = members.length
        const pendingKyc = members.filter(m => m.status === 'pending_kyc').length

        // Process savings data
        const savings = savingsResult.data || []
        const totalSavings = savings.reduce((sum, s) => sum + (s.balance || 0), 0)

        // Process loans data
        const loans = loansResult.data || []
        const totalLoans = loans.reduce((sum, l) => sum + (l.amount || 0), 0)

        // Calculate monthly growth (simplified - should be based on actual date ranges)
        const thisMonth = new Date().getMonth()
        const thisYear = new Date().getFullYear()

        const thisMonthMembers = members.filter(m => {
          const created = new Date(m.created_at)
          return created.getMonth() === thisMonth && created.getFullYear() === thisYear
        }).length

        const thisMonthSavings = savings.filter(s => {
          const created = new Date(s.created_at)
          return created.getMonth() === thisMonth && created.getFullYear() === thisYear
        }).reduce((sum, s) => sum + (s.balance || 0), 0)

        const thisMonthLoans = loans.filter(l => {
          const created = new Date(l.created_at)
          return created.getMonth() === thisMonth && created.getFullYear() === thisYear
        }).reduce((sum, l) => sum + (l.amount || 0), 0)

        // Process recent activities
        const activities = (activitiesResult.data || []).map(log => ({
          id: log.id,
          type: log.event_type.split('.')[0] as 'member' | 'savings' | 'loan' | 'system',
          title: getActivityTitle(log.event_type),
          description: log.action_details?.description || 'Aktivitas sistem',
          timestamp: log.timestamp,
          user: log.actor_email,
          status: log.severity === 'high' ? 'error' : log.severity === 'medium' ? 'pending' : 'success',
        }))

        // Generate sample alerts (in real app, these would come from system monitoring)
        const alerts = [
          {
            id: '1',
            type: 'warning' as const,
            title: 'KYC Pending',
            message: `${pendingKyc} anggota menunggu verifikasi KYC`,
            timestamp: new Date().toISOString(),
            priority: 'medium' as const,
          },
          {
            id: '2',
            type: 'info' as const,
            title: 'Backup Terjadwal',
            message: 'Backup database akan dilakukan pada 02:00 WIB',
            timestamp: new Date().toISOString(),
            priority: 'low' as const,
          },
        ]

        const dashboardData: DashboardData = {
          totalMembers,
          pendingKyc,
          totalSavings,
          totalLoans,
          monthlyGrowth: {
            members: thisMonthMembers,
            savings: thisMonthSavings,
            loans: thisMonthLoans,
          },
          recentActivities: activities,
          alerts,
        }

        setDashboardData(dashboardData)

        // Log dashboard access
        await logEvent({
          event_type: 'user.view',
          target_type: 'dashboard',
          target_id: 'admin_dashboard',
          action_details: {
            page: 'admin_dashboard',
            timestamp: new Date().toISOString(),
          },
          severity: 'low',
        })

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError('Gagal memuat data dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, supabase, logEvent])

  // Helper function to get activity title
  const getActivityTitle = (eventType: string): string => {
    const titles: Record<string, string> = {
      'auth.login': 'Admin Login',
      'auth.logout': 'Admin Logout',
      'user.create': 'Anggota Baru',
      'user.update': 'Update Anggota',
      'savings.create': 'Simpanan Baru',
      'savings.update': 'Update Simpanan',
      'loan.create': 'Pinjaman Baru',
      'loan.approve': 'Persetujuan Pinjaman',
      'report.generate': 'Generate Laporan',
      'settings.update': 'Update Pengaturan',
    }
    return titles[eventType] || 'Aktivitas Sistem'
  }

  if (loading) {
    return <LoadingScreen message="Memuat dashboard admin..." showProgress />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Gagal Memuat Dashboard
          </h3>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard Admin</h1>
        <p className="text-neutral-600">
          Selamat datang di panel administrasi Koperasi Sinoman
        </p>
      </div>

      {/* Alerts panel */}
      <AlertsPanel alerts={dashboardData.alerts} />

      {/* Key metrics */}
      <DashboardMetrics
        totalMembers={dashboardData.totalMembers}
        pendingKyc={dashboardData.pendingKyc}
        totalSavings={dashboardData.totalSavings}
        totalLoans={dashboardData.totalLoans}
        monthlyGrowth={dashboardData.monthlyGrowth}
      />

      {/* Charts and quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCharts data={dashboardData} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Recent activities */}
      <RecentActivities activities={dashboardData.recentActivities} />
    </div>
  )
}