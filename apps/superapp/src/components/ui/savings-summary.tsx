'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import {
  TrendingUp, TrendingDown, Eye, EyeOff, ArrowUpCircle, ArrowDownCircle,
  PiggyBank, Target, Shield, Clock, Plus, Download, History,
  Calculator, BarChart3, PieChart, Activity, Zap, DollarSign,
  Calendar, RefreshCw, ChevronRight, Info, Award
} from 'lucide-react'

interface SavingsAccount {
  id: string
  type: 'pokok' | 'wajib' | 'sukarela' | 'berjangka'
  balance: number
  interestRate: number
  monthlyGrowth: number
  accountNumber: string
}

interface SavingsGrowth {
  month: string
  balance: number
  deposits: number
  interest: number
}

interface SavingsSummaryProps {
  accounts: SavingsAccount[]
  totalBalance: number
  totalGrowth: number
  totalInterestEarned: number
  monthlyTarget?: number
  growthData: SavingsGrowth[]
  lastUpdated: string
  className?: string
  showBalance?: boolean
  onToggleBalance?: () => void
  onQuickDeposit?: () => void
  onQuickWithdraw?: () => void
  onViewHistory?: () => void
  onCalculator?: () => void
  onExportData?: () => void
  onRefresh?: () => void
  loading?: boolean
  variant?: 'default' | 'compact' | 'dashboard'
}

const SAVINGS_TYPES = {
  pokok: {
    name: 'Simpanan Pokok',
    shortName: 'Pokok',
    icon: Shield,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-200',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-indigo-700'
  },
  wajib: {
    name: 'Simpanan Wajib',
    shortName: 'Wajib',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-700'
  },
  sukarela: {
    name: 'Simpanan Sukarela',
    shortName: 'Sukarela',
    icon: PiggyBank,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-green-700'
  },
  berjangka: {
    name: 'Simpanan Berjangka',
    shortName: 'Berjangka',
    icon: Clock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-purple-700'
  }
}

export const SavingsSummary = React.forwardRef<HTMLDivElement, SavingsSummaryProps>(
  ({
    accounts,
    totalBalance,
    totalGrowth,
    totalInterestEarned,
    monthlyTarget,
    growthData,
    lastUpdated,
    className,
    showBalance = true,
    onToggleBalance,
    onQuickDeposit,
    onQuickWithdraw,
    onViewHistory,
    onCalculator,
    onExportData,
    onRefresh,
    loading = false,
    variant = 'default',
    ...props
  }, ref) => {
    const [selectedTimeRange, setSelectedTimeRange] = React.useState('6M')
    const [activeChart, setActiveChart] = React.useState<'balance' | 'growth'>('balance')

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount)
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const calculateBreakdown = () => {
      const breakdown = accounts.reduce((acc, account) => {
        const existing = acc.find(item => item.type === account.type)
        if (existing) {
          existing.balance += account.balance
          existing.count += 1
        } else {
          acc.push({
            type: account.type,
            balance: account.balance,
            count: 1,
            percentage: 0
          })
        }
        return acc
      }, [] as Array<{ type: string; balance: number; count: number; percentage: number }>)

      // Calculate percentages
      breakdown.forEach(item => {
        item.percentage = totalBalance > 0 ? (item.balance / totalBalance) * 100 : 0
      })

      return breakdown.sort((a, b) => b.balance - a.balance)
    }

    const breakdown = calculateBreakdown()
    const growthPercentage = totalBalance > 0 ? (totalGrowth / totalBalance) * 100 : 0
    const isGrowthPositive = totalGrowth >= 0

    const getTargetProgress = () => {
      if (!monthlyTarget) return null
      const progress = Math.min((totalGrowth / monthlyTarget) * 100, 100)
      return progress
    }

    const targetProgress = getTargetProgress()

    const getCompactView = () => variant === 'compact'
    const getDashboardView = () => variant === 'dashboard'

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-neutral-200 bg-white shadow-sm',
          getCompactView() && 'max-w-sm',
          getDashboardView() && 'max-w-none',
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="border-b border-neutral-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                {getCompactView() ? 'Simpanan' : 'Ringkasan Simpanan'}
              </h2>
              <p className="text-sm text-neutral-600">
                Terakhir update: {formatDate(lastUpdated)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onToggleBalance && (
                <button
                  onClick={onToggleBalance}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  title={showBalance ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
                >
                  {showBalance ? (
                    <EyeOff className="h-4 w-4 text-neutral-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-500" />
                  )}
                </button>
              )}

              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={cn('h-4 w-4 text-neutral-500', loading && 'animate-spin')} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Summary */}
        <div className="p-6">
          {/* Total Balance Card */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-white mb-6">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-primary-100 text-sm">Total Simpanan</p>
                  <p className="text-3xl font-bold">
                    {showBalance ? formatCurrency(totalBalance) : '****'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <PiggyBank className="h-6 w-6" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {isGrowthPositive ? (
                    <TrendingUp className="h-4 w-4 text-success-300" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-error-300" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    isGrowthPositive ? 'text-success-300' : 'text-error-300'
                  )}>
                    {isGrowthPositive ? '+' : ''}{growthPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-primary-100">
                  {showBalance ? formatCurrency(totalGrowth) : '****'} bulan ini
                </div>
              </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="h-full w-full" fill="currentColor" viewBox="0 0 100 100">
                <defs>
                  <pattern id="savingsPattern" patternUnits="userSpaceOnUse" width="20" height="20">
                    <circle cx="10" cy="10" r="1" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#savingsPattern)" />
              </svg>
            </div>
          </div>

          {/* Stats Grid */}
          {!getCompactView() && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-success-50 rounded-lg p-4 border border-success-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-success-600" />
                  <span className="text-sm font-medium text-success-700">Bunga Diterima</span>
                </div>
                <p className="text-lg font-bold text-success-900">
                  {showBalance ? formatCurrency(totalInterestEarned) : '****'}
                </p>
                <p className="text-xs text-success-600">Tahun ini</p>
              </div>

              <div className="bg-info-50 rounded-lg p-4 border border-info-200">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-info-600" />
                  <span className="text-sm font-medium text-info-700">Rekening Aktif</span>
                </div>
                <p className="text-lg font-bold text-info-900">
                  {accounts.length}
                </p>
                <p className="text-xs text-info-600">Simpanan</p>
              </div>

              {monthlyTarget && (
                <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-warning-600" />
                    <span className="text-sm font-medium text-warning-700">Target Bulanan</span>
                  </div>
                  <p className="text-lg font-bold text-warning-900">
                    {targetProgress?.toFixed(1)}%
                  </p>
                  <div className="w-full bg-warning-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-warning-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(targetProgress || 0, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Savings Breakdown */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900">Breakdown Simpanan</h3>
              {!getCompactView() && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveChart('balance')}
                    className={cn(
                      'px-3 py-1 text-xs rounded-full transition-colors',
                      activeChart === 'balance'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    )}
                  >
                    Saldo
                  </button>
                  <button
                    onClick={() => setActiveChart('growth')}
                    className={cn(
                      'px-3 py-1 text-xs rounded-full transition-colors',
                      activeChart === 'growth'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    )}
                  >
                    Pertumbuhan
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {breakdown.map((item) => {
                const typeInfo = SAVINGS_TYPES[item.type as keyof typeof SAVINGS_TYPES]
                const Icon = typeInfo.icon

                return (
                  <div
                    key={item.type}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', typeInfo.bgColor)}>
                        <Icon className={cn('h-5 w-5', typeInfo.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {getCompactView() ? typeInfo.shortName : typeInfo.name}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {item.count} rekening
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-neutral-900">
                        {showBalance ? formatCurrency(item.balance) : '****'}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-neutral-600">
                          {item.percentage.toFixed(1)}%
                        </p>
                        <div className="w-16 bg-neutral-200 rounded-full h-1.5">
                          <div
                            className={cn(
                              'h-1.5 rounded-full transition-all duration-300',
                              `bg-gradient-to-r ${typeInfo.gradientFrom} ${typeInfo.gradientTo}`
                            )}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Growth Chart */}
          {!getCompactView() && growthData.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900">Grafik Pertumbuhan</h3>
                <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
                  {['3M', '6M', '1Y'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setSelectedTimeRange(range)}
                      className={cn(
                        'px-3 py-1 text-xs rounded-md transition-colors',
                        selectedTimeRange === range
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simple Chart Visualization */}
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-end justify-between h-32 gap-2">
                  {growthData.slice(-6).map((data, index) => {
                    const maxValue = Math.max(...growthData.map(d => d.balance))
                    const height = (data.balance / maxValue) * 100

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-sm transition-all duration-300 hover:from-primary-600 hover:to-primary-500"
                          style={{ height: `${height}%` }}
                          title={`${data.month}: ${formatCurrency(data.balance)}`}
                        />
                        <span className="text-xs text-neutral-600 mt-2">{data.month}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {onQuickDeposit && (
              <button
                onClick={onQuickDeposit}
                className="flex flex-col items-center gap-2 p-4 bg-success-50 hover:bg-success-100 rounded-lg transition-colors border border-success-200"
              >
                <div className="w-8 h-8 bg-success-600 rounded-full flex items-center justify-center">
                  <ArrowUpCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-success-700">Setor</span>
              </button>
            )}

            {onQuickWithdraw && (
              <button
                onClick={onQuickWithdraw}
                className="flex flex-col items-center gap-2 p-4 bg-error-50 hover:bg-error-100 rounded-lg transition-colors border border-error-200"
              >
                <div className="w-8 h-8 bg-error-600 rounded-full flex items-center justify-center">
                  <ArrowDownCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-error-700">Tarik</span>
              </button>
            )}

            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="flex flex-col items-center gap-2 p-4 bg-info-50 hover:bg-info-100 rounded-lg transition-colors border border-info-200"
              >
                <div className="w-8 h-8 bg-info-600 rounded-full flex items-center justify-center">
                  <History className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-info-700">Riwayat</span>
              </button>
            )}

            {onCalculator && (
              <button
                onClick={onCalculator}
                className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
              >
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <Calculator className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-purple-700">
                  {getCompactView() ? 'Calc' : 'Kalkulator'}
                </span>
              </button>
            )}
          </div>

          {/* Additional Actions (Non-compact) */}
          {!getCompactView() && (
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {onExportData && (
                    <button
                      onClick={onExportData}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-neutral-500">
                  <Activity className="h-3 w-3" />
                  <span>Real-time data</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

SavingsSummary.displayName = 'SavingsSummary'

// Skeleton component for loading state
export const SavingsSummarySkeleton = ({ variant = 'default' }: { variant?: 'default' | 'compact' | 'dashboard' }) => {
  const isCompact = variant === 'compact'

  return (
    <div className={cn(
      'rounded-lg border border-neutral-200 bg-white shadow-sm',
      isCompact && 'max-w-sm'
    )}>
      {/* Header Skeleton */}
      <div className="border-b border-neutral-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-neutral-200 rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-neutral-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6">
        {/* Total Balance Card Skeleton */}
        <div className="rounded-xl bg-gradient-to-br from-neutral-300 to-neutral-400 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-4 w-20 bg-white bg-opacity-30 rounded mb-2" />
              <div className="h-8 w-32 bg-white bg-opacity-30 rounded" />
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-16 bg-white bg-opacity-20 rounded" />
            <div className="h-4 w-24 bg-white bg-opacity-20 rounded" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        {!isCompact && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-4 bg-neutral-300 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-neutral-300 rounded animate-pulse" />
                </div>
                <div className="h-6 w-20 bg-neutral-300 rounded animate-pulse mb-1" />
                <div className="h-3 w-12 bg-neutral-300 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Breakdown Skeleton */}
        <div className="mb-6">
          <div className="h-5 w-32 bg-neutral-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-300 rounded-lg animate-pulse" />
                  <div>
                    <div className="h-4 w-24 bg-neutral-300 rounded animate-pulse mb-1" />
                    <div className="h-3 w-16 bg-neutral-300 rounded animate-pulse" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-20 bg-neutral-300 rounded animate-pulse mb-1" />
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-8 bg-neutral-300 rounded animate-pulse" />
                    <div className="w-16 h-1.5 bg-neutral-300 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="w-8 h-8 bg-neutral-300 rounded-full animate-pulse" />
              <div className="h-3 w-12 bg-neutral-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SavingsSummary