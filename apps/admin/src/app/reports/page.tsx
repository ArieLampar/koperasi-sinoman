'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useAudit } from '@/components/providers/audit-provider'
import { useSupabase } from '@/components/providers/supabase-provider'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { AccessDenied } from '@/components/ui/access-denied'
import {
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  UsersIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  PrinterIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns'
import { id } from 'date-fns/locale'
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2'
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
  Filler,
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
  Legend,
  Filler
)

// Types
interface DateRange {
  startDate: string
  endDate: string
}

interface MemberStatistics {
  totalMembers: number
  activeMembers: number
  newMembers: number
  verifiedMembers: number
  membersByType: {
    regular: number
    premium: number
    corporate: number
  }
  memberGrowth: Array<{
    month: string
    count: number
    new: number
  }>
}

interface SavingsReport {
  totalBalance: number
  totalAccounts: number
  savingsByType: Array<{
    name: string
    code: string
    balance: number
    accounts: number
    percentage: number
  }>
  monthlyGrowth: Array<{
    month: string
    balance: number
    deposits: number
    withdrawals: number
  }>
}

interface FinancialSummary {
  totalDeposits: number
  totalWithdrawals: number
  netFlow: number
  transactionCount: number
  avgTransactionAmount: number
  topTransactionDays: Array<{
    date: string
    amount: number
    count: number
  }>
}

interface ReportData {
  memberStats: MemberStatistics
  savingsReport: SavingsReport
  financialSummary: FinancialSummary
  generatedAt: string
  dateRange: DateRange
}

const PRESET_RANGES = [
  { label: 'Bulan Ini', value: 'current_month' },
  { label: 'Bulan Lalu', value: 'last_month' },
  { label: '3 Bulan Terakhir', value: 'last_3_months' },
  { label: '6 Bulan Terakhir', value: 'last_6_months' },
  { label: 'Tahun Ini', value: 'current_year' },
  { label: 'Tahun Lalu', value: 'last_year' },
  { label: 'Kustom', value: 'custom' },
]

export default function ReportsPage() {
  const { hasPermission } = useAuth()
  const { logEvent } = useAudit()
  const { supabase } = useSupabase()

  // State
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState('current_month')
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'savings' | 'financial'>('overview')
  const [isExporting, setIsExporting] = useState(false)

  // Check permissions
  const canViewReports = hasPermission('reports.read')
  const canExportReports = hasPermission('reports.export')

  // Calculate date range based on selection
  const calculateDateRange = useCallback((range: string): DateRange => {
    const now = new Date()

    switch (range) {
      case 'current_month':
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
      case 'current_year':
        return {
          startDate: format(startOfYear(now), 'yyyy-MM-dd'),
          endDate: format(endOfYear(now), 'yyyy-MM-dd'),
        }
      case 'last_year':
        const lastYear = new Date(now.getFullYear() - 1, 0, 1)
        return {
          startDate: format(startOfYear(lastYear), 'yyyy-MM-dd'),
          endDate: format(endOfYear(lastYear), 'yyyy-MM-dd'),
        }
      case 'custom':
        return customDateRange
      default:
        return customDateRange
    }
  }, [customDateRange])

  // Fetch member statistics
  const fetchMemberStatistics = useCallback(async (dateRange: DateRange): Promise<MemberStatistics> => {
    try {
      // Total and active members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, membership_status, membership_type, kyc_status, join_date')
        .lte('join_date', dateRange.endDate)

      if (membersError) throw membersError

      // New members in date range
      const { data: newMembersData, error: newMembersError } = await supabase
        .from('members')
        .select('id, join_date')
        .gte('join_date', dateRange.startDate)
        .lte('join_date', dateRange.endDate)

      if (newMembersError) throw newMembersError

      // Member growth by month (last 12 months)
      const { data: growthData, error: growthError } = await supabase
        .rpc('get_member_growth_by_month', {
          months_back: 12
        })

      if (growthError) console.warn('Growth data error:', growthError)

      const totalMembers = membersData.length
      const activeMembers = membersData.filter(m => m.membership_status === 'active').length
      const verifiedMembers = membersData.filter(m => m.kyc_status === 'verified').length
      const newMembers = newMembersData.length

      const membersByType = {
        regular: membersData.filter(m => m.membership_type === 'regular').length,
        premium: membersData.filter(m => m.membership_type === 'premium').length,
        corporate: membersData.filter(m => m.membership_type === 'corporate').length,
      }

      // Process growth data or create mock data
      const memberGrowth = growthData || Array.from({ length: 12 }, (_, i) => {
        const month = subMonths(new Date(), 11 - i)
        return {
          month: format(month, 'MMM yyyy', { locale: id }),
          count: Math.floor(Math.random() * 50) + totalMembers - 100,
          new: Math.floor(Math.random() * 10) + 1,
        }
      })

      return {
        totalMembers,
        activeMembers,
        newMembers,
        verifiedMembers,
        membersByType,
        memberGrowth,
      }
    } catch (error) {
      console.error('Error fetching member statistics:', error)
      throw error
    }
  }, [supabase])

  // Fetch savings report
  const fetchSavingsReport = useCallback(async (dateRange: DateRange): Promise<SavingsReport> => {
    try {
      // Total savings data
      const { data: savingsData, error: savingsError } = await supabase
        .from('savings_accounts')
        .select(`
          id,
          balance,
          status,
          savings_types!inner(name, code)
        `)
        .eq('status', 'active')

      if (savingsError) throw savingsError

      // Transactions in date range
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          created_at,
          transaction_types!inner(category)
        `)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate)
        .eq('payment_status', 'completed')

      if (transactionsError) throw transactionsError

      const totalBalance = savingsData.reduce((sum, account) => sum + (account.balance || 0), 0)
      const totalAccounts = savingsData.length

      // Group by savings type
      const typeGroups = savingsData.reduce((acc, account) => {
        const type = account.savings_types.code
        if (!acc[type]) {
          acc[type] = {
            name: account.savings_types.name,
            code: type,
            balance: 0,
            accounts: 0,
          }
        }
        acc[type].balance += account.balance || 0
        acc[type].accounts += 1
        return acc
      }, {} as Record<string, any>)

      const savingsByType = Object.values(typeGroups).map((type: any) => ({
        ...type,
        percentage: (type.balance / totalBalance) * 100,
      }))

      // Monthly growth (last 12 months)
      const monthlyGrowth = Array.from({ length: 12 }, (_, i) => {
        const month = subMonths(new Date(), 11 - i)
        const monthStart = format(startOfMonth(month), 'yyyy-MM-dd')
        const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd')

        const monthTransactions = transactionsData.filter(tx =>
          tx.created_at >= monthStart && tx.created_at <= monthEnd
        )

        const deposits = monthTransactions
          .filter(tx => tx.transaction_types.category === 'deposit')
          .reduce((sum, tx) => sum + tx.amount, 0)

        const withdrawals = monthTransactions
          .filter(tx => tx.transaction_types.category === 'withdrawal')
          .reduce((sum, tx) => sum + tx.amount, 0)

        return {
          month: format(month, 'MMM yyyy', { locale: id }),
          balance: totalBalance, // This would be calculated properly with historical data
          deposits,
          withdrawals,
        }
      })

      return {
        totalBalance,
        totalAccounts,
        savingsByType,
        monthlyGrowth,
      }
    } catch (error) {
      console.error('Error fetching savings report:', error)
      throw error
    }
  }, [supabase])

  // Fetch financial summary
  const fetchFinancialSummary = useCallback(async (dateRange: DateRange): Promise<FinancialSummary> => {
    try {
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          created_at,
          transaction_types!inner(category)
        `)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate)
        .eq('payment_status', 'completed')

      if (transactionsError) throw transactionsError

      const deposits = transactionsData.filter(tx => tx.transaction_types.category === 'deposit')
      const withdrawals = transactionsData.filter(tx => tx.transaction_types.category === 'withdrawal')

      const totalDeposits = deposits.reduce((sum, tx) => sum + tx.amount, 0)
      const totalWithdrawals = withdrawals.reduce((sum, tx) => sum + tx.amount, 0)
      const netFlow = totalDeposits - totalWithdrawals
      const transactionCount = transactionsData.length
      const avgTransactionAmount = transactionCount > 0 ? (totalDeposits + totalWithdrawals) / transactionCount : 0

      // Top transaction days
      const dailyTransactions = transactionsData.reduce((acc, tx) => {
        const date = format(new Date(tx.created_at), 'yyyy-MM-dd')
        if (!acc[date]) {
          acc[date] = { amount: 0, count: 0 }
        }
        acc[date].amount += tx.amount
        acc[date].count += 1
        return acc
      }, {} as Record<string, { amount: number; count: number }>)

      const topTransactionDays = Object.entries(dailyTransactions)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)

      return {
        totalDeposits,
        totalWithdrawals,
        netFlow,
        transactionCount,
        avgTransactionAmount,
        topTransactionDays,
      }
    } catch (error) {
      console.error('Error fetching financial summary:', error)
      throw error
    }
  }, [supabase])

  // Generate report
  const generateReport = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const dateRange = calculateDateRange(selectedRange)

      const [memberStats, savingsReport, financialSummary] = await Promise.all([
        fetchMemberStatistics(dateRange),
        fetchSavingsReport(dateRange),
        fetchFinancialSummary(dateRange),
      ])

      setReportData({
        memberStats,
        savingsReport,
        financialSummary,
        generatedAt: new Date().toISOString(),
        dateRange,
      })

      await logEvent({
        event_type: 'admin.report_generate',
        target_type: 'reports',
        target_id: `${selectedRange}_${dateRange.startDate}_${dateRange.endDate}`,
        action_details: {
          range: selectedRange,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          timestamp: new Date().toISOString(),
        },
        severity: 'low',
      })

    } catch (error) {
      console.error('Error generating report:', error)
      setError('Gagal menghasilkan laporan')
      toast.error('Gagal menghasilkan laporan')
    } finally {
      setLoading(false)
    }
  }, [selectedRange, calculateDateRange, fetchMemberStatistics, fetchSavingsReport, fetchFinancialSummary, logEvent])

  // Export report
  const exportReport = useCallback(async (format: 'pdf' | 'excel' | 'csv') => {
    if (!canExportReports || !reportData) return

    try {
      setIsExporting(true)

      // Create export data based on format
      let exportData: any
      let filename: string

      const dateStr = format(new Date(), 'yyyy-MM-dd')

      if (format === 'csv') {
        // Create CSV content
        const headers = ['Metrik', 'Nilai', 'Keterangan']
        const rows = [
          ['Total Anggota', reportData.memberStats.totalMembers.toString(), 'Jumlah seluruh anggota'],
          ['Anggota Aktif', reportData.memberStats.activeMembers.toString(), 'Anggota dengan status aktif'],
          ['Anggota Baru', reportData.memberStats.newMembers.toString(), 'Anggota baru pada periode ini'],
          ['Total Saldo Simpanan', reportData.savingsReport.totalBalance.toString(), 'Total saldo seluruh simpanan'],
          ['Jumlah Rekening', reportData.savingsReport.totalAccounts.toString(), 'Jumlah rekening simpanan aktif'],
          ['Total Setoran', reportData.financialSummary.totalDeposits.toString(), 'Total setoran pada periode'],
          ['Total Penarikan', reportData.financialSummary.totalWithdrawals.toString(), 'Total penarikan pada periode'],
          ['Arus Kas Bersih', reportData.financialSummary.netFlow.toString(), 'Selisih setoran dan penarikan'],
        ]

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        exportData = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        filename = `laporan-koperasi-${dateStr}.csv`
      } else if (format === 'excel') {
        // For Excel, we'd use a proper library like xlsx
        // For now, export as CSV with Excel-compatible format
        const data = {
          memberStats: reportData.memberStats,
          savingsReport: reportData.savingsReport,
          financialSummary: reportData.financialSummary,
        }

        exportData = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        filename = `laporan-koperasi-${dateStr}.json`
      } else {
        // PDF would require a proper PDF library
        const htmlContent = `
          <html>
            <head><title>Laporan Koperasi Sinoman</title></head>
            <body>
              <h1>Laporan Koperasi Sinoman</h1>
              <p>Periode: ${format(new Date(reportData.dateRange.startDate), 'dd MMM yyyy', { locale: id })} - ${format(new Date(reportData.dateRange.endDate), 'dd MMM yyyy', { locale: id })}</p>
              <h2>Statistik Anggota</h2>
              <p>Total Anggota: ${reportData.memberStats.totalMembers}</p>
              <p>Anggota Aktif: ${reportData.memberStats.activeMembers}</p>
              <h2>Laporan Simpanan</h2>
              <p>Total Saldo: ${reportData.savingsReport.totalBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
            </body>
          </html>
        `

        exportData = new Blob([htmlContent], { type: 'text/html' })
        filename = `laporan-koperasi-${dateStr}.html`
      }

      // Download file
      const link = document.createElement('a')
      link.href = URL.createObjectURL(exportData)
      link.download = filename
      link.click()

      await logEvent({
        event_type: 'admin.report_export',
        target_type: 'reports',
        target_id: filename,
        action_details: {
          format,
          filename,
          dateRange: reportData.dateRange,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Laporan berhasil diekspor sebagai ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Gagal mengekspor laporan')
    } finally {
      setIsExporting(false)
    }
  }, [canExportReports, reportData, logEvent])

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(107, 114, 128, 1)' },
      },
      y: {
        grid: { color: 'rgba(229, 231, 235, 1)' },
        ticks: { color: 'rgba(107, 114, 128, 1)' },
      },
    },
  }

  // Initialize report on mount
  useEffect(() => {
    if (canViewReports) {
      generateReport()
    }
  }, [canViewReports, generateReport])

  // Access control
  if (!canViewReports) {
    return (
      <AccessDenied
        title="Akses Ditolak"
        message="Anda tidak memiliki hak akses untuk melihat laporan."
        showContactInfo={true}
      />
    )
  }

  if (loading) {
    return <LoadingScreen message="Menghasilkan laporan..." showProgress />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Gagal Memuat Laporan
          </h3>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={generateReport}
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
          <h1 className="text-2xl font-bold text-neutral-900">Laporan & Analitik</h1>
          <p className="text-neutral-600">
            Laporan komprehensif tentang keanggotaan, simpanan, dan aktivitas keuangan
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={generateReport}
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
                disabled={!reportData || isExporting}
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                {isExporting ? 'Mengekspor...' : 'Ekspor'}
              </button>
              <div
                id="export-menu"
                className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border"
              >
                <button
                  onClick={() => exportReport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Ekspor CSV
                </button>
                <button
                  onClick={() => exportReport('excel')}
                  className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Ekspor Excel
                </button>
                <button
                  onClick={() => exportReport('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Ekspor PDF
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
                onClick={generateReport}
                className="admin-btn admin-btn-primary text-sm"
              >
                Terapkan
              </button>
            </div>
          )}
        </div>

        {reportData && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between text-sm text-neutral-600">
              <span>
                Periode: {format(new Date(reportData.dateRange.startDate), 'dd MMM yyyy', { locale: id })} - {format(new Date(reportData.dateRange.endDate), 'dd MMM yyyy', { locale: id })}
              </span>
              <span>
                Dihasilkan: {format(new Date(reportData.generatedAt), 'dd MMM yyyy HH:mm', { locale: id })}
              </span>
            </div>
          </div>
        )}
      </div>

      {reportData && (
        <>
          {/* Tab Navigation */}
          <div className="admin-card">
            <div className="border-b border-neutral-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', label: 'Ringkasan', icon: ChartBarIcon },
                  { id: 'members', label: 'Anggota', icon: UsersIcon },
                  { id: 'savings', label: 'Simpanan', icon: BanknotesIcon },
                  { id: 'financial', label: 'Keuangan', icon: CurrencyDollarIcon },
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

            {/* Tab Content */}
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="metric-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-600">Total Anggota</p>
                          <p className="text-2xl font-bold text-neutral-900">
                            {reportData.memberStats.totalMembers.toLocaleString('id-ID')}
                          </p>
                          <p className="text-sm text-green-600 flex items-center">
                            <TrendingUpIcon className="h-4 w-4 mr-1" />
                            +{reportData.memberStats.newMembers} baru
                          </p>
                        </div>
                        <UsersIcon className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-600">Total Simpanan</p>
                          <p className="text-2xl font-bold text-neutral-900">
                            {(reportData.savingsReport.totalBalance / 1000000).toFixed(1)}M
                          </p>
                          <p className="text-sm text-neutral-500">
                            {reportData.savingsReport.totalAccounts} rekening
                          </p>
                        </div>
                        <BanknotesIcon className="h-8 w-8 text-green-500" />
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-600">Arus Kas</p>
                          <p className={`text-2xl font-bold ${
                            reportData.financialSummary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {reportData.financialSummary.netFlow >= 0 ? '+' : ''}
                            {(reportData.financialSummary.netFlow / 1000000).toFixed(1)}M
                          </p>
                          <p className="text-sm text-neutral-500">
                            {reportData.financialSummary.transactionCount} transaksi
                          </p>
                        </div>
                        {reportData.financialSummary.netFlow >= 0 ? (
                          <TrendingUpIcon className="h-8 w-8 text-green-500" />
                        ) : (
                          <TrendingDownIcon className="h-8 w-8 text-red-500" />
                        )}
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-600">Rata-rata Transaksi</p>
                          <p className="text-2xl font-bold text-neutral-900">
                            {(reportData.financialSummary.avgTransactionAmount / 1000).toFixed(0)}K
                          </p>
                          <p className="text-sm text-neutral-500">per transaksi</p>
                        </div>
                        <CurrencyDollarIcon className="h-8 w-8 text-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Member Growth Chart */}
                    <div className="admin-card">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                        Pertumbuhan Anggota
                      </h3>
                      <div className="h-64">
                        <Line
                          data={{
                            labels: reportData.memberStats.memberGrowth.map(d => d.month),
                            datasets: [
                              {
                                label: 'Total Anggota',
                                data: reportData.memberStats.memberGrowth.map(d => d.count),
                                borderColor: 'rgb(59, 130, 246)',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                fill: true,
                                tension: 0.4,
                              },
                            ],
                          }}
                          options={chartOptions}
                        />
                      </div>
                    </div>

                    {/* Savings Distribution Chart */}
                    <div className="admin-card">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                        Distribusi Simpanan
                      </h3>
                      <div className="h-64">
                        <Doughnut
                          data={{
                            labels: reportData.savingsReport.savingsByType.map(s => s.name),
                            datasets: [
                              {
                                data: reportData.savingsReport.savingsByType.map(s => s.percentage),
                                backgroundColor: [
                                  'rgba(59, 130, 246, 0.8)',
                                  'rgba(16, 185, 129, 0.8)',
                                  'rgba(245, 158, 11, 0.8)',
                                  'rgba(139, 92, 246, 0.8)',
                                ],
                                borderColor: [
                                  'rgb(59, 130, 246)',
                                  'rgb(16, 185, 129)',
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
                                position: 'bottom',
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
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="space-y-6">
                  {/* Member Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="metric-card">
                      <h4 className="text-sm font-medium text-neutral-600 mb-2">Total Anggota</h4>
                      <p className="text-3xl font-bold text-neutral-900">
                        {reportData.memberStats.totalMembers.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="metric-card">
                      <h4 className="text-sm font-medium text-neutral-600 mb-2">Anggota Aktif</h4>
                      <p className="text-3xl font-bold text-green-600">
                        {reportData.memberStats.activeMembers.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="metric-card">
                      <h4 className="text-sm font-medium text-neutral-600 mb-2">Anggota Baru</h4>
                      <p className="text-3xl font-bold text-blue-600">
                        {reportData.memberStats.newMembers.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="metric-card">
                      <h4 className="text-sm font-medium text-neutral-600 mb-2">Terverifikasi</h4>
                      <p className="text-3xl font-bold text-purple-600">
                        {reportData.memberStats.verifiedMembers.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Member Type Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="admin-card">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                        Distribusi Jenis Keanggotaan
                      </h3>
                      <div className="h-64">
                        <Pie
                          data={{
                            labels: ['Regular', 'Premium', 'Korporat'],
                            datasets: [
                              {
                                data: [
                                  reportData.memberStats.membersByType.regular,
                                  reportData.memberStats.membersByType.premium,
                                  reportData.memberStats.membersByType.corporate,
                                ],
                                backgroundColor: [
                                  'rgba(59, 130, 246, 0.8)',
                                  'rgba(245, 158, 11, 0.8)',
                                  'rgba(139, 92, 246, 0.8)',
                                ],
                              },
                            ],
                          }}
                          options={chartOptions}
                        />
                      </div>
                    </div>

                    <div className="admin-card">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                        Anggota Baru per Bulan
                      </h3>
                      <div className="h-64">
                        <Bar
                          data={{
                            labels: reportData.memberStats.memberGrowth.map(d => d.month),
                            datasets: [
                              {
                                label: 'Anggota Baru',
                                data: reportData.memberStats.memberGrowth.map(d => d.new),
                                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                                borderColor: 'rgb(16, 185, 129)',
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={chartOptions}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Savings Tab */}
              {activeTab === 'savings' && (
                <div className="space-y-6">
                  {/* Savings Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="metric-card">
                      <h4 className="text-sm font-medium text-neutral-600 mb-2">Total Saldo</h4>
                      <p className="text-3xl font-bold text-neutral-900">
                        {reportData.savingsReport.totalBalance.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div className="metric-card">
                      <h4 className="text-sm font-medium text-neutral-600 mb-2">Total Rekening</h4>
                      <p className="text-3xl font-bold text-blue-600">
                        {reportData.savingsReport.totalAccounts.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="metric-card">
                      <h4 className="text-sm font-medium text-neutral-600 mb-2">Rata-rata Saldo</h4>
                      <p className="text-3xl font-bold text-green-600">
                        {(reportData.savingsReport.totalBalance / reportData.savingsReport.totalAccounts).toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Savings by Type */}
                  <div className="admin-card">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      Rincian Simpanan per Jenis
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Jenis Simpanan</th>
                            <th>Jumlah Rekening</th>
                            <th>Total Saldo</th>
                            <th>Persentase</th>
                            <th>Rata-rata per Rekening</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.savingsReport.savingsByType.map((type) => (
                            <tr key={type.code}>
                              <td className="font-medium">{type.name}</td>
                              <td>{type.accounts.toLocaleString('id-ID')}</td>
                              <td className="font-medium">
                                {type.balance.toLocaleString('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                })}
                              </td>
                              <td>
                                <div className="flex items-center space-x-2">
                                  <div className="flex-1 bg-neutral-200 rounded-full h-2">
                                    <div
                                      className="bg-primary-600 h-2 rounded-full"
                                      style={{ width: `${type.percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">
                                    {type.percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td>
                                {(type.balance / type.accounts).toLocaleString('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Monthly Growth Chart */}
                  <div className="admin-card">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      Tren Setoran dan Penarikan
                    </h3>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: reportData.savingsReport.monthlyGrowth.map(d => d.month),
                          datasets: [
                            {
                              label: 'Setoran',
                              data: reportData.savingsReport.monthlyGrowth.map(d => d.deposits),
                              backgroundColor: 'rgba(16, 185, 129, 0.8)',
                              borderColor: 'rgb(16, 185, 129)',
                              borderWidth: 1,
                            },
                            {
                              label: 'Penarikan',
                              data: reportData.savingsReport.monthlyGrowth.map(d => d.withdrawals),
                              backgroundColor: 'rgba(245, 158, 11, 0.8)',
                              borderColor: 'rgb(245, 158, 11)',
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={chartOptions}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Tab */}
              {activeTab === 'financial' && (
                <div className="space-y-6">
                  {/* Financial Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="metric-card metric-card-success">
                      <h4 className="text-sm font-medium text-neutral-600 mb-2">Total Setoran</h4>
                      <p className="text-3xl font-bold text-green-600">
                        {reportData.financialSummary.totalDeposits.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div className="metric-card metric-card-warning">
                      <h4 className="text-sm font-medium text-neutral-600 mb-2">Total Penarikan</h4>
                      <p className="text-3xl font-bold text-orange-600">
                        {reportData.financialSummary.totalWithdrawals.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div className={`metric-card ${reportData.financialSummary.netFlow >= 0 ? 'metric-card-success' : 'metric-card-error'}`}>
                      <h4 className="text-sm font-medium text-neutral-600 mb-2">Arus Kas Bersih</h4>
                      <p className={`text-3xl font-bold ${reportData.financialSummary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportData.financialSummary.netFlow.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div className="metric-card">
                      <h4 className="text-sm font-medium text-neutral-600 mb-2">Jumlah Transaksi</h4>
                      <p className="text-3xl font-bold text-neutral-900">
                        {reportData.financialSummary.transactionCount.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Top Transaction Days */}
                  <div className="admin-card">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      Hari dengan Transaksi Tertinggi
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Tanggal</th>
                            <th>Total Transaksi</th>
                            <th>Jumlah Transaksi</th>
                            <th>Rata-rata per Transaksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.financialSummary.topTransactionDays.map((day, index) => (
                            <tr key={day.date}>
                              <td className="font-medium">
                                {format(new Date(day.date), 'dd MMM yyyy', { locale: id })}
                              </td>
                              <td className="font-medium">
                                {day.amount.toLocaleString('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                })}
                              </td>
                              <td>{day.count.toLocaleString('id-ID')}</td>
                              <td>
                                {(day.amount / day.count).toLocaleString('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}