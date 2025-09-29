'use client'

import { useState } from 'react'
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  BellIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@koperasi-sinoman/utils'

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: string
  priority: 'low' | 'medium' | 'high'
}

interface AlertsPanelProps {
  alerts: Alert[]
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState(false)

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id))

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId])
  }

  const getAlertIcon = (type: string) => {
    const icons = {
      warning: ExclamationTriangleIcon,
      error: XCircleIcon,
      info: InformationCircleIcon,
    }
    return icons[type as keyof typeof icons] || InformationCircleIcon
  }

  const getAlertStyles = (type: string) => {
    const styles = {
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
    }
    return styles[type as keyof typeof styles] || styles.info
  }

  const getIconStyles = (type: string) => {
    const styles = {
      warning: 'text-yellow-600',
      error: 'text-red-600',
      info: 'text-blue-600',
    }
    return styles[type as keyof typeof styles] || styles.info
  }

  const getPriorityDot = (priority: string) => {
    const colors = {
      low: 'bg-green-400',
      medium: 'bg-yellow-400',
      high: 'bg-red-400',
    }
    return colors[priority as keyof typeof colors] || colors.low
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (visibleAlerts.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BellIcon className="h-5 w-5 text-neutral-600" />
          <h3 className="text-sm font-medium text-neutral-900">
            Notifikasi Sistem
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {visibleAlerts.length}
          </span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-sm text-neutral-500 hover:text-neutral-700 font-medium"
        >
          {collapsed ? 'Tampilkan' : 'Sembunyikan'}
        </button>
      </div>

      {/* Alerts list */}
      {!collapsed && (
        <div className="space-y-3">
          {visibleAlerts.map((alert) => {
            const AlertIcon = getAlertIcon(alert.type)

            return (
              <div
                key={alert.id}
                className={cn(
                  'rounded-lg border p-4 relative',
                  getAlertStyles(alert.type)
                )}
              >
                <div className="flex items-start space-x-3">
                  {/* Alert icon */}
                  <div className="shrink-0">
                    <AlertIcon className={cn('h-5 w-5', getIconStyles(alert.type))} />
                  </div>

                  {/* Alert content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium">
                            {alert.title}
                          </h4>
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            getPriorityDot(alert.priority)
                          )} />
                        </div>
                        <p className="text-sm opacity-90">
                          {alert.message}
                        </p>
                        <p className="text-xs opacity-75 mt-2">
                          {formatTime(alert.timestamp)}
                        </p>
                      </div>

                      {/* Dismiss button */}
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="shrink-0 ml-3 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Priority indicator bar */}
                {alert.priority === 'high' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Collapsed state */}
      {collapsed && visibleAlerts.length > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
          <BellIcon className="h-4 w-4 text-neutral-500" />
          <span className="text-sm text-neutral-600">
            {visibleAlerts.length} notifikasi tersembunyi
          </span>
          {visibleAlerts.some(a => a.priority === 'high') && (
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          )}
        </div>
      )}
    </div>
  )
}