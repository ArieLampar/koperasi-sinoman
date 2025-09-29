'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  UsersIcon,
  BanknotesIcon,
  CreditCardIcon,
  CogIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@koperasi-sinoman/utils'

interface Activity {
  id: string
  type: 'member' | 'savings' | 'loan' | 'system'
  title: string
  description: string
  timestamp: string
  user: string
  status: 'success' | 'pending' | 'error'
}

interface RecentActivitiesProps {
  activities: Activity[]
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const [filter, setFilter] = useState<'all' | 'member' | 'savings' | 'loan' | 'system'>('all')

  const getActivityIcon = (type: string) => {
    const icons = {
      member: UsersIcon,
      savings: BanknotesIcon,
      loan: CreditCardIcon,
      system: CogIcon,
    }
    return icons[type as keyof typeof icons] || CogIcon
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      success: CheckCircleIcon,
      pending: ClockIcon,
      error: XCircleIcon,
    }
    return icons[status as keyof typeof icons] || ClockIcon
  }

  const getStatusColor = (status: string) => {
    const colors = {
      success: 'text-green-500',
      pending: 'text-yellow-500',
      error: 'text-red-500',
    }
    return colors[status as keyof typeof colors] || 'text-neutral-500'
  }

  const getActivityColor = (type: string) => {
    const colors = {
      member: 'bg-blue-100 text-blue-600',
      savings: 'bg-green-100 text-green-600',
      loan: 'bg-purple-100 text-purple-600',
      system: 'bg-neutral-100 text-neutral-600',
    }
    return colors[type as keyof typeof colors] || 'bg-neutral-100 text-neutral-600'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Baru saja'
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(activity => activity.type === filter)

  const filterOptions = [
    { value: 'all', label: 'Semua', count: activities.length },
    { value: 'member', label: 'Anggota', count: activities.filter(a => a.type === 'member').length },
    { value: 'savings', label: 'Simpanan', count: activities.filter(a => a.type === 'savings').length },
    { value: 'loan', label: 'Pinjaman', count: activities.filter(a => a.type === 'loan').length },
    { value: 'system', label: 'Sistem', count: activities.filter(a => a.type === 'system').length },
  ]

  return (
    <div className="admin-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Aktivitas Terbaru</h3>
        <Link
          href="/audit"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Lihat semua →
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value as any)}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
              filter === option.value
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            )}
          >
            {option.label}
            {option.count > 0 && (
              <span className={cn(
                'ml-2 px-2 py-0.5 text-xs rounded-full',
                filter === option.value
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-neutral-200 text-neutral-600'
              )}>
                {option.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Activities list */}
      <div className="space-y-4 max-h-96 overflow-y-auto admin-scrollbar">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.type)
            const StatusIcon = getStatusIcon(activity.status)

            return (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all"
              >
                {/* Activity type icon */}
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  getActivityColor(activity.type)
                )}>
                  <ActivityIcon className="h-4 w-4" />
                </div>

                {/* Activity content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-neutral-900">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-neutral-600 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-xs text-neutral-500">
                          oleh {activity.user}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Status icon */}
                    <div className={cn('shrink-0 ml-3', getStatusColor(activity.status))}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <ClockIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">
              {filter === 'all' ? 'Belum ada aktivitas' : `Belum ada aktivitas untuk ${filterOptions.find(o => o.value === filter)?.label.toLowerCase()}`}
            </p>
          </div>
        )}
      </div>

      {/* Activity summary */}
      {activities.length > 0 && (
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-green-600">
                {activities.filter(a => a.status === 'success').length}
              </p>
              <p className="text-xs text-neutral-600">Berhasil</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-yellow-600">
                {activities.filter(a => a.status === 'pending').length}
              </p>
              <p className="text-xs text-neutral-600">Pending</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-red-600">
                {activities.filter(a => a.status === 'error').length}
              </p>
              <p className="text-xs text-neutral-600">Error</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}