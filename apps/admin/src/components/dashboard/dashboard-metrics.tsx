'use client'

import {
  UsersIcon,
  BanknotesIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@koperasi-sinoman/utils'

interface DashboardMetricsProps {
  totalMembers: number
  pendingKyc: number
  totalSavings: number
  totalLoans: number
  monthlyGrowth: {
    members: number
    savings: number
    loans: number
  }
}

export function DashboardMetrics({
  totalMembers,
  pendingKyc,
  totalSavings,
  totalLoans,
  monthlyGrowth,
}: DashboardMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const metrics = [
    {
      id: 'members',
      title: 'Total Anggota',
      value: formatNumber(totalMembers),
      change: monthlyGrowth.members,
      changeLabel: 'anggota baru bulan ini',
      icon: UsersIcon,
      iconBg: 'bg-blue-500',
      iconColor: 'text-white',
    },
    {
      id: 'kyc',
      title: 'Pending KYC',
      value: formatNumber(pendingKyc),
      change: null,
      changeLabel: 'menunggu verifikasi',
      icon: ShieldCheckIcon,
      iconBg: 'bg-yellow-500',
      iconColor: 'text-white',
      urgent: pendingKyc > 5,
    },
    {
      id: 'savings',
      title: 'Total Simpanan',
      value: formatCurrency(totalSavings),
      change: monthlyGrowth.savings,
      changeLabel: 'pertumbuhan bulan ini',
      icon: BanknotesIcon,
      iconBg: 'bg-green-500',
      iconColor: 'text-white',
      isCurrency: true,
    },
    {
      id: 'loans',
      title: 'Total Pinjaman',
      value: formatCurrency(totalLoans),
      change: monthlyGrowth.loans,
      changeLabel: 'pinjaman baru bulan ini',
      icon: CreditCardIcon,
      iconBg: 'bg-purple-500',
      iconColor: 'text-white',
      isCurrency: true,
    },
  ]

  const getChangeDisplay = (change: number | null, isCurrency = false) => {
    if (change === null) return null

    const isPositive = change > 0
    const isNegative = change < 0
    const displayValue = isCurrency ? formatCurrency(Math.abs(change)) : formatNumber(Math.abs(change))

    return (
      <div className={cn(
        'flex items-center text-sm font-medium',
        isPositive && 'text-green-600',
        isNegative && 'text-red-600',
        change === 0 && 'text-neutral-500'
      )}>
        {isPositive && <TrendingUpIcon className="h-4 w-4 mr-1" />}
        {isNegative && <TrendingDownIcon className="h-4 w-4 mr-1" />}
        {change === 0 ? 'Tidak ada perubahan' : displayValue}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const IconComponent = metric.icon

        return (
          <div
            key={metric.id}
            className={cn(
              'metric-card',
              metric.urgent && 'ring-2 ring-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600 mb-1">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-neutral-900">
                  {metric.value}
                </p>
              </div>
              <div className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center',
                metric.iconBg
              )}>
                <IconComponent className={cn('h-6 w-6', metric.iconColor)} />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-200">
              {getChangeDisplay(metric.change, metric.isCurrency)}
              <p className="text-xs text-neutral-500 mt-1">
                {metric.changeLabel}
              </p>
            </div>

            {/* Urgent indicator */}
            {metric.urgent && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}