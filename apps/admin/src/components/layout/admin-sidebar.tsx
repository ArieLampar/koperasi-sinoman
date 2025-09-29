'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { cn } from '@koperasi-sinoman/utils'
import {
  HomeIcon,
  UsersIcon,
  BanknotesIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CogIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  BellIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  BanknotesIcon as BanknotesIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CogIcon as CogIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ArchiveBoxIcon as ArchiveBoxIconSolid,
  BellIcon as BellIconSolid,
} from '@heroicons/react/24/solid'

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  iconSolid: React.ComponentType<{ className?: string }>
  permission?: string
  badge?: string | number
  children?: NavigationItem[]
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
  },
  {
    name: 'Anggota',
    href: '/members',
    icon: UsersIcon,
    iconSolid: UsersIconSolid,
    permission: 'users.view',
    children: [
      {
        name: 'Daftar Anggota',
        href: '/members',
        icon: UserGroupIcon,
        iconSolid: UserGroupIconSolid,
        permission: 'users.view',
      },
      {
        name: 'Verifikasi KYC',
        href: '/members/kyc',
        icon: ShieldCheckIcon,
        iconSolid: ShieldCheckIconSolid,
        permission: 'users.update',
        badge: '3',
      },
      {
        name: 'Registrasi Pending',
        href: '/members/pending',
        icon: ExclamationTriangleIcon,
        iconSolid: ExclamationTriangleIconSolid,
        permission: 'users.create',
        badge: '7',
      },
    ],
  },
  {
    name: 'Simpanan',
    href: '/savings',
    icon: BanknotesIcon,
    iconSolid: BanknotesIconSolid,
    permission: 'savings.view',
    children: [
      {
        name: 'Kelola Simpanan',
        href: '/savings',
        icon: BanknotesIcon,
        iconSolid: BanknotesIconSolid,
        permission: 'savings.view',
      },
      {
        name: 'Simpanan Berjangka',
        href: '/savings/time-deposits',
        icon: ArchiveBoxIcon,
        iconSolid: ArchiveBoxIconSolid,
        permission: 'savings.view',
      },
      {
        name: 'Transaksi',
        href: '/savings/transactions',
        icon: ClipboardDocumentListIcon,
        iconSolid: ClipboardDocumentListIconSolid,
        permission: 'savings.view',
      },
    ],
  },
  {
    name: 'Pinjaman',
    href: '/loans',
    icon: CreditCardIcon,
    iconSolid: CreditCardIconSolid,
    permission: 'loans.view',
    children: [
      {
        name: 'Daftar Pinjaman',
        href: '/loans',
        icon: CreditCardIcon,
        iconSolid: CreditCardIconSolid,
        permission: 'loans.view',
      },
      {
        name: 'Persetujuan',
        href: '/loans/approvals',
        icon: ShieldCheckIcon,
        iconSolid: ShieldCheckIconSolid,
        permission: 'loans.approve',
        badge: '12',
      },
      {
        name: 'Pembayaran',
        href: '/loans/payments',
        icon: BanknotesIcon,
        iconSolid: BanknotesIconSolid,
        permission: 'loans.view',
      },
    ],
  },
  {
    name: 'Laporan',
    href: '/reports',
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
    permission: 'reports.view',
    children: [
      {
        name: 'Dashboard Laporan',
        href: '/reports',
        icon: ChartBarIcon,
        iconSolid: ChartBarIconSolid,
        permission: 'reports.view',
      },
      {
        name: 'Laporan Keuangan',
        href: '/reports/financial',
        icon: DocumentTextIcon,
        iconSolid: DocumentTextIconSolid,
        permission: 'reports.view',
      },
      {
        name: 'Laporan Anggota',
        href: '/reports/members',
        icon: UsersIcon,
        iconSolid: UsersIconSolid,
        permission: 'reports.view',
      },
    ],
  },
  {
    name: 'Audit Log',
    href: '/audit',
    icon: ClipboardDocumentListIcon,
    iconSolid: ClipboardDocumentListIconSolid,
    permission: 'audit.view',
  },
  {
    name: 'Notifikasi',
    href: '/notifications',
    icon: BellIcon,
    iconSolid: BellIconSolid,
    badge: '5',
  },
  {
    name: 'Pengaturan',
    href: '/settings',
    icon: CogIcon,
    iconSolid: CogIconSolid,
    permission: 'settings.update',
  },
]

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { hasPermission, adminRoles } = useAuth()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    )
  }

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const hasAccess = (item: NavigationItem) => {
    if (!item.permission) return true
    return hasPermission(item.permission)
  }

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    if (!hasAccess(item)) return null

    const isActive = isItemActive(item.href)
    const isExpanded = expandedItems.includes(item.href)
    const hasChildren = item.children && item.children.length > 0
    const IconComponent = isActive ? item.iconSolid : item.icon

    return (
      <div key={item.href}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.href)}
            className={cn(
              'w-full admin-nav-item',
              isActive && 'admin-nav-item-active',
              level > 0 && 'ml-4 text-xs'
            )}
          >
            <IconComponent className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">{item.name}</span>
            {item.badge && (
              <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            <svg
              className={cn(
                'h-4 w-4 transition-transform',
                isExpanded && 'rotate-90'
              )}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : (
          <Link
            href={item.href}
            onClick={onClose}
            className={cn(
              'admin-nav-item',
              isActive && 'admin-nav-item-active',
              level > 0 && 'ml-4 text-xs'
            )}
          >
            <IconComponent className="h-5 w-5 shrink-0" />
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        )}

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:z-50 lg:w-64">
        <div className="admin-sidebar flex flex-col flex-1">
          {/* Logo area */}
          <div className="flex items-center justify-center h-16 px-6 bg-primary-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-600 font-bold text-sm">KS</span>
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">Admin Panel</h1>
                <p className="text-primary-100 text-xs">Koperasi Sinoman</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 admin-scrollbar overflow-y-auto">
            {navigationItems.map(item => renderNavigationItem(item))}
          </nav>

          {/* User info / role badge */}
          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium text-sm">
                  {adminRoles[0]?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-900 truncate">
                  {adminRoles.join(', ')}
                </p>
                <p className="text-xs text-neutral-500">Admin Role</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="admin-sidebar flex flex-col flex-1">
          {/* Logo area with close button */}
          <div className="flex items-center justify-between h-16 px-6 bg-primary-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-600 font-bold text-sm">KS</span>
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">Admin Panel</h1>
                <p className="text-primary-100 text-xs">Koperasi Sinoman</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-primary-100 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 admin-scrollbar overflow-y-auto">
            {navigationItems.map(item => renderNavigationItem(item))}
          </nav>

          {/* User info / role badge */}
          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium text-sm">
                  {adminRoles[0]?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-900 truncate">
                  {adminRoles.join(', ')}
                </p>
                <p className="text-xs text-neutral-500">Admin Role</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}