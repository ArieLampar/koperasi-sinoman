'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useAudit } from '@/components/providers/audit-provider'
import { useSupabase } from '@/components/providers/supabase-provider'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { AccessDenied } from '@/components/ui/access-denied'
import {
  UsersIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  GiftIcon,
  StarIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { id } from 'date-fns/locale'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// Types
interface ReferralMember {
  id: string
  full_name: string
  email: string
  member_number: string
  referral_code: string
  total_referrals: number
  total_rewards: number
  pending_rewards: number
  rank: string
  created_at: string
  last_referral_date?: string
}

interface ReferralTransaction {
  id: string
  referrer: {
    id: string
    name: string
    member_number: string
  }
  referred: {
    id: string
    name: string
    member_number: string
  }
  referral_type: 'signup' | 'purchase' | 'activity'
  bonus_amount: number
  bonus_status: 'pending' | 'paid' | 'cancelled'
  created_at: string
  paid_at?: string
}

interface ReferralReward {
  id: string
  member: {
    id: string
    name: string
    member_number: string
  }
  type: 'referral_bonus' | 'welcome_bonus' | 'milestone_bonus'
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  description: string
  created_at: string
  paid_at?: string
  reference_id?: string
}

interface ReferralStats {
  totalMembers: number
  totalReferrals: number
  totalRewards: number
  pendingPayouts: number
  completionRate: number
  averageRewardPerReferral: number
  topPerformers: Array<{
    member_name: string
    referrals: number
    rewards: number
    rank: string
  }>
  monthlyGrowth: Array<{
    month: string
    referrals: number
    rewards: number
    new_members: number
  }>
  rankDistribution: Array<{
    rank: string
    count: number
    percentage: number
  }>
  rewardsByType: Array<{
    type: string
    amount: number
    count: number
  }>
}

const PRESET_RANGES = [
  { label: 'Bulan Ini', value: 'this_month' },
  { label: 'Bulan Lalu', value: 'last_month' },
  { label: '3 Bulan Terakhir', value: 'last_3_months' },
  { label: '6 Bulan Terakhir', value: 'last_6_months' },
  { label: 'Tahun Ini', value: 'this_year' },
  { label: 'Kustom', value: 'custom' },
]

export default function ReferralPage() {
  const { hasPermission } = useAuth()
  const { logEvent } = useAudit()
  const { supabase } = useSupabase()

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'rewards' | 'analytics'>('overview')
  const [selectedRange, setSelectedRange] = useState('this_month')
  const [customDateRange, setCustomDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  })

  // Data state
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null)
  const [referralMembers, setReferralMembers] = useState<ReferralMember[]>([])
  const [referralTransactions, setReferralTransactions] = useState<ReferralTransaction[]>([])
  const [referralRewards, setReferralRewards] = useState<ReferralReward[]>([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Check permissions
  const canViewReferrals = hasPermission('referrals.read')
  const canManageReferrals = hasPermission('referrals.update')
  const canExportReports = hasPermission('reports.export')

  // Calculate date range
  const calculateDateRange = useCallback((range: string) => {
    const now = new Date()

    switch (range) {
      case 'this_month':
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
        }
      case 'last_month':
        const lastMonth = subMonths(now, 1)
        return {
          startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
        }
      case 'last_3_months':
        return {
          startDate: format(subMonths(now, 3), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd'),
        }
      case 'last_6_months':
        return {
          startDate: format(subMonths(now, 6), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd'),
        }
      case 'this_year':
        return {
          startDate: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd'),
        }
      case 'custom':
        return customDateRange
      default:
        return customDateRange
    }
  }, [customDateRange])

  // Fetch referral data
  const fetchReferralData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const dateRange = calculateDateRange(selectedRange)

      // Fetch referral members with stats
      const { data: membersData, error: membersError } = await supabase
        .from('cooperative_members')
        .select(`
          id,
          full_name,
          email,
          member_number,
          referral_code,
          created_at,
          member_referrals!referrer_id(
            id,
            bonus_amount,
            bonus_status,
            created_at
          )
        `)
        .not('referral_code', 'is', null)

      if (membersError) throw membersError

      // Process members data
      const processedMembers = membersData.map((member: any) => {
        const referrals = member.member_referrals || []
        const totalReferrals = referrals.length
        const totalRewards = referrals
          .filter((r: any) => r.bonus_status === 'paid')
          .reduce((sum: number, r: any) => sum + r.bonus_amount, 0)
        const pendingRewards = referrals
          .filter((r: any) => r.bonus_status === 'pending')
          .reduce((sum: number, r: any) => sum + r.bonus_amount, 0)

        // Calculate rank based on referrals
        let rank = 'bronze'
        if (totalReferrals >= 50) rank = 'platinum'
        else if (totalReferrals >= 15) rank = 'gold'
        else if (totalReferrals >= 5) rank = 'silver'

        const lastReferral = referrals.length > 0 ?
          referrals.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] : null

        return {
          id: member.id,
          full_name: member.full_name,
          email: member.email,
          member_number: member.member_number,
          referral_code: member.referral_code,
          total_referrals: totalReferrals,
          total_rewards: totalRewards,
          pending_rewards: pendingRewards,
          rank,
          created_at: member.created_at,
          last_referral_date: lastReferral?.created_at
        }
      })

      setReferralMembers(processedMembers)

      // Fetch referral transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('member_referrals')
        .select(`
          id,
          referral_type,
          bonus_amount,
          bonus_status,
          created_at,
          referrer:cooperative_members!referrer_id(
            id,
            full_name,
            member_number
          ),
          referred:cooperative_members!referred_id(
            id,
            full_name,
            member_number
          )
        `)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate)
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError

      const processedTransactions = transactionsData.map((tx: any) => ({
        id: tx.id,
        referrer: {
          id: tx.referrer?.id || '',
          name: tx.referrer?.full_name || 'Unknown',
          member_number: tx.referrer?.member_number || ''
        },
        referred: {
          id: tx.referred?.id || '',
          name: tx.referred?.full_name || 'Unknown',
          member_number: tx.referred?.member_number || ''
        },
        referral_type: tx.referral_type,
        bonus_amount: tx.bonus_amount,
        bonus_status: tx.bonus_status,
        created_at: tx.created_at
      }))

      setReferralTransactions(processedTransactions)

      // Fetch reward transactions
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('member_transactions')
        .select(`
          id,
          type,
          amount,
          description,
          status,
          created_at,
          reference_id,
          cooperative_members!member_id(
            id,
            full_name,
            member_number
          )
        `)
        .in('type', ['referral_bonus', 'welcome_bonus', 'milestone_bonus'])
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate)
        .order('created_at', { ascending: false })

      if (rewardsError) throw rewardsError

      const processedRewards = rewardsData.map((reward: any) => ({
        id: reward.id,
        member: {
          id: reward.cooperative_members?.id || '',
          name: reward.cooperative_members?.full_name || 'Unknown',
          member_number: reward.cooperative_members?.member_number || ''
        },
        type: reward.type,
        amount: reward.amount,
        status: reward.status === 'completed' ? 'paid' : reward.status,
        description: reward.description,
        created_at: reward.created_at,
        reference_id: reward.reference_id
      }))

      setReferralRewards(processedRewards)

      // Calculate statistics
      const totalMembers = processedMembers.length
      const totalReferrals = processedMembers.reduce((sum, m) => sum + m.total_referrals, 0)
      const totalRewards = processedMembers.reduce((sum, m) => sum + m.total_rewards, 0)
      const pendingPayouts = processedMembers.reduce((sum, m) => sum + m.pending_rewards, 0)
      const completionRate = totalReferrals > 0 ?
        (processedTransactions.filter(t => t.bonus_status === 'paid').length / totalReferrals) * 100 : 0
      const averageRewardPerReferral = totalReferrals > 0 ? totalRewards / totalReferrals : 0

      // Top performers
      const topPerformers = processedMembers
        .sort((a, b) => b.total_referrals - a.total_referrals)
        .slice(0, 10)
        .map(m => ({
          member_name: m.full_name,
          referrals: m.total_referrals,
          rewards: m.total_rewards,
          rank: m.rank
        }))

      // Monthly growth (last 6 months)
      const monthlyGrowth = Array.from({ length: 6 }, (_, i) => {
        const month = subMonths(new Date(), 5 - i)
        const monthStart = format(startOfMonth(month), 'yyyy-MM-dd')
        const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd')

        const monthTransactions = processedTransactions.filter(tx =>
          tx.created_at >= monthStart && tx.created_at <= monthEnd
        )

        const monthNewMembers = processedMembers.filter(m =>
          m.created_at >= monthStart && m.created_at <= monthEnd
        )

        return {
          month: format(month, 'MMM yyyy', { locale: id }),
          referrals: monthTransactions.length,
          rewards: monthTransactions.reduce((sum, tx) => sum + tx.bonus_amount, 0),
          new_members: monthNewMembers.length
        }
      })

      // Rank distribution
      const rankCounts = processedMembers.reduce((acc, member) => {
        acc[member.rank] = (acc[member.rank] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const rankDistribution = Object.entries(rankCounts).map(([rank, count]) => ({
        rank,
        count,
        percentage: (count / totalMembers) * 100
      }))

      // Rewards by type
      const rewardsByType = processedRewards.reduce((acc, reward) => {
        const existing = acc.find(r => r.type === reward.type)
        if (existing) {
          existing.amount += reward.amount
          existing.count += 1
        } else {
          acc.push({
            type: reward.type,
            amount: reward.amount,
            count: 1
          })
        }
        return acc
      }, [] as Array<{ type: string; amount: number; count: number }>)

      setReferralStats({
        totalMembers,
        totalReferrals,
        totalRewards,
        pendingPayouts,
        completionRate,
        averageRewardPerReferral,
        topPerformers,
        monthlyGrowth,
        rankDistribution,
        rewardsByType
      })

      // Log access
      await logEvent({
        event_type: 'admin.view',
        target_type: 'referral_program',
        target_id: 'dashboard',
        action_details: {
          date_range: dateRange,
          timestamp: new Date().toISOString(),
        },
        severity: 'low',
      })

    } catch (error) {
      console.error('Error fetching referral data:', error)
      setError('Gagal memuat data program referral')
      toast.error('Gagal memuat data program referral')
    } finally {
      setLoading(false)
    }
  }, [supabase, logEvent, selectedRange, calculateDateRange])

  // Process reward payout
  const processRewardPayout = async (rewardIds: string[]) => {
    if (!canManageReferrals) return

    try {
      const { error } = await supabase
        .from('member_transactions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .in('id', rewardIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.update',
        target_type: 'referral_rewards',
        target_id: rewardIds.join(','),
        action_details: {
          action: 'process_payout',
          count: rewardIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil memproses ${rewardIds.length} reward payout`)
      fetchReferralData()
    } catch (error) {
      console.error('Error processing reward payout:', error)
      toast.error('Gagal memproses reward payout')
    }
  }

  // Export report
  const exportReport = async (type: 'members' | 'transactions' | 'rewards') => {
    if (!canExportReports) return

    try {
      let data: any[] = []
      let headers: string[] = []
      let filename = ''

      switch (type) {
        case 'members':
          data = referralMembers
          headers = ['Nama', 'Member Number', 'Kode Referral', 'Total Referrals', 'Total Rewards', 'Pending Rewards', 'Rank', 'Bergabung']
          filename = `referral_members_${format(new Date(), 'yyyy-MM-dd')}.csv`
          break
        case 'transactions':
          data = referralTransactions
          headers = ['Referrer', 'Referred', 'Type', 'Bonus Amount', 'Status', 'Date']
          filename = `referral_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`
          break
        case 'rewards':
          data = referralRewards
          headers = ['Member', 'Type', 'Amount', 'Status', 'Description', 'Date']
          filename = `referral_rewards_${format(new Date(), 'yyyy-MM-dd')}.csv`
          break
      }

      const csvContent = [
        headers.join(','),
        ...data.map(item => {
          switch (type) {
            case 'members':
              return [
                `"${item.full_name}"`,
                item.member_number,
                item.referral_code,
                item.total_referrals,
                item.total_rewards,
                item.pending_rewards,
                item.rank,
                format(new Date(item.created_at), 'dd/MM/yyyy')
              ].join(',')
            case 'transactions':
              return [
                `"${item.referrer.name}"`,
                `"${item.referred.name}"`,
                item.referral_type,
                item.bonus_amount,
                item.bonus_status,
                format(new Date(item.created_at), 'dd/MM/yyyy')
              ].join(',')
            case 'rewards':
              return [
                `"${item.member.name}"`,
                item.type,
                item.amount,
                item.status,
                `"${item.description}"`,
                format(new Date(item.created_at), 'dd/MM/yyyy')
              ].join(',')
            default:
              return ''
          }
        })
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()

      await logEvent({
        event_type: 'admin.export',
        target_type: 'referral_data',
        target_id: type,
        action_details: {
          export_type: type,
          count: data.length,
          filename,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil mengekspor data ${type}`)
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Gagal mengekspor laporan')
    }
  }

  // Pagination for current tab
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'members':
        return referralMembers
      case 'rewards':
        return referralRewards
      default:
        return referralTransactions
    }
  }

  const paginatedData = useMemo(() => {
    const data = getCurrentTabData()
    const startIndex = (currentPage - 1) * itemsPerPage
    return data.slice(startIndex, startIndex + itemsPerPage)
  }, [activeTab, referralMembers, referralRewards, referralTransactions, currentPage, itemsPerPage])

  const totalPages = Math.ceil(getCurrentTabData().length / itemsPerPage)

  // Initial data fetch
  useEffect(() => {
    if (canViewReferrals) {
      fetchReferralData()
    }
  }, [canViewReferrals, fetchReferralData])

  // Access control
  if (!canViewReferrals) {
    return (
      <AccessDenied
        title="Akses Ditolak"
        message="Anda tidak memiliki hak akses untuk melihat data program referral."
        showContactInfo={true}
      />
    )
  }

  if (loading) {
    return <LoadingScreen message="Memuat data program referral..." showProgress />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Gagal Memuat Data
          </h3>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={fetchReferralData}
            className="admin-btn admin-btn-primary"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Program Referral</h1>
          <p className="text-neutral-600">
            Monitor performa program referral, kelola reward, dan analitik member
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchReferralData}
            className="admin-btn admin-btn-secondary"
            disabled={loading}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
          {canExportReports && (
            <div className="relative">
              <button
                onClick={() => document.getElementById('export-menu')?.classList.toggle('hidden')}
                className="admin-btn admin-btn-primary"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Ekspor
              </button>
              <div
                id="export-menu"
                className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border"
              >
                <button
                  onClick={() => exportReport('members')}
                  className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Ekspor Data Member
                </button>
                <button
                  onClick={() => exportReport('transactions')}
                  className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Ekspor Transaksi
                </button>
                <button
                  onClick={() => exportReport('rewards')}
                  className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Ekspor Rewards
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="admin-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="h-5 w-5 text-neutral-400" />
            <span className="font-medium text-neutral-900">Periode:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setSelectedRange(range.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  selectedRange === range.value
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {selectedRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="admin-form-input text-sm"
              />
              <span className="text-neutral-500">sampai</span>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="admin-form-input text-sm"
              />
              <button
                onClick={fetchReferralData}
                className="admin-btn admin-btn-primary text-sm"
              >
                Terapkan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-card">
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'members', label: 'Member Referral', icon: UsersIcon },
              { id: 'rewards', label: 'Reward Management', icon: GiftIcon },
              { id: 'analytics', label: 'Analitik', icon: TrendingUpIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {referralStats && (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="metric-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Member Referral</p>
                      <p className="text-2xl font-semibold text-neutral-900">
                        {referralStats.totalMembers.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UsersIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="metric-card metric-card-success">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Referrals</p>
                      <p className="text-2xl font-semibold text-green-600">
                        {referralStats.totalReferrals.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUpIcon className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Rewards</p>
                      <p className="text-2xl font-semibold text-neutral-900">
                        {(referralStats.totalRewards / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="metric-card metric-card-warning">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Pending Payouts</p>
                      <p className="text-2xl font-semibold text-yellow-600">
                        {(referralStats.pendingPayouts / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <GiftIcon className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="metric-card">
                  <h4 className="text-sm font-medium text-neutral-600 mb-2">Tingkat Completion</h4>
                  <p className="text-3xl font-bold text-neutral-900">
                    {referralStats.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Dari total referrals yang berhasil diselesaikan
                  </p>
                </div>

                <div className="metric-card">
                  <h4 className="text-sm font-medium text-neutral-600 mb-2">Rata-rata Reward</h4>
                  <p className="text-3xl font-bold text-neutral-900">
                    {referralStats.averageRewardPerReferral.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Per referral yang berhasil
                  </p>
                </div>
              </div>

              {/* Top Performers */}
              <div className="admin-card">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Top Performers
                </h3>
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Ranking</th>
                        <th>Member</th>
                        <th>Total Referrals</th>
                        <th>Total Rewards</th>
                        <th>Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralStats.topPerformers.map((performer, index) => (
                        <tr key={index}>
                          <td>
                            <div className="flex items-center">
                              {index === 0 && <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />}
                              {index === 1 && <TrophyIcon className="h-5 w-5 text-gray-400 mr-2" />}
                              {index === 2 && <TrophyIcon className="h-5 w-5 text-orange-500 mr-2" />}
                              <span className="font-medium">#{index + 1}</span>
                            </div>
                          </td>
                          <td className="font-medium">{performer.member_name}</td>
                          <td>{performer.referrals.toLocaleString('id-ID')}</td>
                          <td>
                            {performer.rewards.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                          </td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              performer.rank === 'platinum' ? 'bg-purple-100 text-purple-700' :
                              performer.rank === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                              performer.rank === 'silver' ? 'bg-gray-100 text-gray-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {performer.rank}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="admin-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Member Referral ({referralMembers.length})
                  </h3>
                  <button
                    onClick={() => exportReport('members')}
                    className="admin-btn admin-btn-secondary"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Ekspor
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Kode Referral</th>
                        <th>Total Referrals</th>
                        <th>Total Rewards</th>
                        <th>Pending</th>
                        <th>Rank</th>
                        <th>Terakhir Referral</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((member: any) => (
                        <tr key={member.id}>
                          <td>
                            <div>
                              <div className="font-medium text-neutral-900">{member.full_name}</div>
                              <div className="text-sm text-neutral-500">{member.member_number}</div>
                            </div>
                          </td>
                          <td>
                            <code className="bg-neutral-100 px-2 py-1 rounded text-sm">
                              {member.referral_code}
                            </code>
                          </td>
                          <td className="font-medium">{member.total_referrals}</td>
                          <td>
                            {member.total_rewards.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                          </td>
                          <td>
                            {member.pending_rewards > 0 && (
                              <span className="text-yellow-600 font-medium">
                                {member.pending_rewards.toLocaleString('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                })}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.rank === 'platinum' ? 'bg-purple-100 text-purple-700' :
                              member.rank === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                              member.rank === 'silver' ? 'bg-gray-100 text-gray-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {member.rank}
                            </span>
                          </td>
                          <td>
                            {member.last_referral_date ? (
                              <div className="text-sm text-neutral-900">
                                {format(new Date(member.last_referral_date), 'dd MMM yyyy', { locale: id })}
                              </div>
                            ) : (
                              <span className="text-neutral-400">-</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                // TODO: Navigate to member detail
                              }}
                              className="p-1 text-neutral-400 hover:text-neutral-600"
                              title="Lihat Detail"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-neutral-700">
                      Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, referralMembers.length)} dari {referralMembers.length} member
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="admin-btn admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sebelumnya
                      </button>
                      <span className="text-sm text-neutral-700">
                        Halaman {currentPage} dari {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="admin-btn admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <div className="admin-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Reward Management ({referralRewards.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    {canManageReferrals && (
                      <button
                        onClick={() => {
                          const pendingRewards = referralRewards
                            .filter(r => r.status === 'pending')
                            .map(r => r.id)
                          if (pendingRewards.length > 0) {
                            processRewardPayout(pendingRewards)
                          }
                        }}
                        className="admin-btn admin-btn-primary"
                        disabled={!referralRewards.some(r => r.status === 'pending')}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Proses Semua Pending
                      </button>
                    )}
                    <button
                      onClick={() => exportReport('rewards')}
                      className="admin-btn admin-btn-secondary"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Ekspor
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Tipe Reward</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Deskripsi</th>
                        <th>Tanggal</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((reward: any) => (
                        <tr key={reward.id}>
                          <td>
                            <div>
                              <div className="font-medium text-neutral-900">{reward.member.name}</div>
                              <div className="text-sm text-neutral-500">{reward.member.member_number}</div>
                            </div>
                          </td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              reward.type === 'referral_bonus' ? 'bg-blue-100 text-blue-700' :
                              reward.type === 'welcome_bonus' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {reward.type === 'referral_bonus' ? 'Referral Bonus' :
                               reward.type === 'welcome_bonus' ? 'Welcome Bonus' : 'Milestone Bonus'}
                            </span>
                          </td>
                          <td className="font-medium">
                            {reward.amount.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                          </td>
                          <td>
                            <span className={`status-indicator ${
                              reward.status === 'paid' ? 'status-success' :
                              reward.status === 'pending' ? 'status-warning' : 'status-error'
                            }`}>
                              {reward.status === 'paid' ? 'Dibayar' :
                               reward.status === 'pending' ? 'Pending' : 'Dibatalkan'}
                            </span>
                          </td>
                          <td className="text-sm">{reward.description}</td>
                          <td>
                            <div className="text-sm text-neutral-900">
                              {format(new Date(reward.created_at), 'dd MMM yyyy', { locale: id })}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              {canManageReferrals && reward.status === 'pending' && (
                                <button
                                  onClick={() => processRewardPayout([reward.id])}
                                  className="p-1 text-green-400 hover:text-green-600"
                                  title="Proses Pembayaran"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  // TODO: Navigate to reward detail
                                }}
                                className="p-1 text-neutral-400 hover:text-neutral-600"
                                title="Lihat Detail"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-neutral-700">
                      Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, referralRewards.length)} dari {referralRewards.length} rewards
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="admin-btn admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sebelumnya
                      </button>
                      <span className="text-sm text-neutral-700">
                        Halaman {currentPage} dari {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="admin-btn admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Growth Chart */}
                <div className="admin-card">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    Tren Referral Bulanan
                  </h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: referralStats.monthlyGrowth.map(d => d.month),
                        datasets: [
                          {
                            label: 'Referrals',
                            data: referralStats.monthlyGrowth.map(d => d.referrals),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.4,
                          },
                          {
                            label: 'Member Baru',
                            data: referralStats.monthlyGrowth.map(d => d.new_members),
                            borderColor: 'rgb(16, 185, 129)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                        },
                        scales: {
                          x: {
                            grid: { display: false },
                          },
                          y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(229, 231, 235, 1)' },
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                {/* Rank Distribution Chart */}
                <div className="admin-card">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    Distribusi Rank Member
                  </h3>
                  <div className="h-64">
                    <Doughnut
                      data={{
                        labels: referralStats.rankDistribution.map(r => r.rank),
                        datasets: [
                          {
                            data: referralStats.rankDistribution.map(r => r.percentage),
                            backgroundColor: [
                              'rgba(245, 158, 11, 0.8)',  // bronze
                              'rgba(156, 163, 175, 0.8)', // silver
                              'rgba(245, 158, 11, 0.8)',  // gold
                              'rgba(139, 92, 246, 0.8)',  // platinum
                            ],
                            borderColor: [
                              'rgb(245, 158, 11)',
                              'rgb(156, 163, 175)',
                              'rgb(245, 158, 11)',
                              'rgb(139, 92, 246)',
                            ],
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom' as const,
                            labels: { padding: 20, usePointStyle: true },
                          },
                          tooltip: {
                            callbacks: {
                              label: (context: any) => {
                                return `${context.label}: ${context.parsed.toFixed(1)}%`
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Rewards Chart */}
              <div className="admin-card">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Tren Rewards Bulanan
                </h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: referralStats.monthlyGrowth.map(d => d.month),
                      datasets: [
                        {
                          label: 'Total Rewards (Juta)',
                          data: referralStats.monthlyGrowth.map(d => d.rewards / 1000000),
                          backgroundColor: 'rgba(139, 92, 246, 0.8)',
                          borderColor: 'rgb(139, 92, 246)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                        },
                        y: {
                          beginAtZero: true,
                          grid: { color: 'rgba(229, 231, 235, 1)' },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}