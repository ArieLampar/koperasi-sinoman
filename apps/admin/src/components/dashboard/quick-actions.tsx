'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useAudit } from '@/components/providers/audit-provider'
import {
  UserPlusIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CogIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

interface QuickAction {
  id: string
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  permission?: string
  badge?: string | number
}

export function QuickActions() {
  const { hasPermission } = useAuth()
  const { logEvent } = useAudit()

  const actions: QuickAction[] = [
    {
      id: 'add-member',
      title: 'Tambah Anggota',
      description: 'Registrasi anggota baru',
      href: '/members/new',
      icon: UserPlusIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      permission: 'users.create',
    },
    {
      id: 'kyc-verification',
      title: 'Verifikasi KYC',
      description: 'Review dokumen KYC',
      href: '/members/kyc',
      icon: ShieldCheckIcon,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      permission: 'users.update',
      badge: '3',
    },
    {
      id: 'approve-loans',
      title: 'Persetujuan Pinjaman',
      description: 'Review pinjaman pending',
      href: '/loans/approvals',
      icon: ExclamationTriangleIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      permission: 'loans.approve',
      badge: '12',
    },
    {
      id: 'savings-transaction',
      title: 'Transaksi Simpanan',
      description: 'Input transaksi manual',
      href: '/savings/transactions/new',
      icon: BanknotesIcon,
      color: 'bg-green-500 hover:bg-green-600',
      permission: 'savings.create',
    },
    {
      id: 'generate-report',
      title: 'Generate Laporan',
      description: 'Buat laporan keuangan',
      href: '/reports/generate',
      icon: DocumentTextIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      permission: 'reports.view',
    },
    {
      id: 'view-analytics',
      title: 'Analitik',
      description: 'Dashboard analitik detail',
      href: '/analytics',
      icon: ChartBarIcon,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      permission: 'reports.view',
    },
    {
      id: 'audit-logs',
      title: 'Audit Log',
      description: 'Review aktivitas sistem',
      href: '/audit',
      icon: ClipboardDocumentListIcon,
      color: 'bg-neutral-500 hover:bg-neutral-600',
      permission: 'audit.view',
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Download data backup',
      href: '/export',
      icon: ArrowDownTrayIcon,
      color: 'bg-teal-500 hover:bg-teal-600',
      permission: 'data.export',
    },
    {
      id: 'system-settings',
      title: 'Pengaturan',
      description: 'Konfigurasi sistem',
      href: '/settings',
      icon: CogIcon,
      color: 'bg-red-500 hover:bg-red-600',
      permission: 'settings.update',
    },
  ]

  const handleActionClick = async (action: QuickAction) => {
    await logEvent({
      event_type: 'user.view',
      target_type: 'quick_action',
      target_id: action.id,
      action_details: {
        action_title: action.title,
        destination: action.href,
        timestamp: new Date().toISOString(),
      },
      severity: 'low',
    })
  }

  const visibleActions = actions.filter(action =>
    !action.permission || hasPermission(action.permission)
  )

  return (
    <div className="admin-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Aksi Cepat</h3>
        <span className="text-sm text-neutral-500">
          {visibleActions.length} tersedia
        </span>
      </div>

      <div className="space-y-3">
        {visibleActions.map((action) => {
          const IconComponent = action.icon

          return (
            <Link
              key={action.id}
              href={action.href}
              onClick={() => handleActionClick(action)}
              className="group block p-4 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center transition-colors`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-800">
                      {action.title}
                    </h4>
                    {action.badge && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 group-hover:text-neutral-600">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {visibleActions.length === 0 && (
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">
            Tidak ada aksi yang tersedia untuk role Anda
          </p>
        </div>
      )}
    </div>
  )
}