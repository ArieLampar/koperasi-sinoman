'use client'

import { Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Transition } from '@headlessui/react'
import { useAuth } from '@/components/providers/auth-provider'
import { useAudit } from '@/components/providers/audit-provider'
import { cn } from '@koperasi-sinoman/utils'
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { User } from '@supabase/supabase-js'
import { AdminRole } from '@/components/providers/auth-provider'

interface AdminHeaderProps {
  onMenuClick: () => void
  user: User | null
  userRoles: AdminRole[]
}

export function AdminHeader({ onMenuClick, user, userRoles }: AdminHeaderProps) {
  const router = useRouter()
  const { signOut } = useAuth()
  const { logAuthEvent } = useAudit()

  const handleSignOut = async () => {
    try {
      await logAuthEvent('logout', {
        timestamp: new Date().toISOString(),
        user_id: user?.id,
        session_duration: 'calculated_on_backend',
      })
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error during sign out:', error)
    }
  }

  const getRoleBadgeColor = (role: AdminRole) => {
    const colors = {
      super_admin: 'bg-red-100 text-red-800 border-red-200',
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      manager: 'bg-green-100 text-green-800 border-green-200',
      auditor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      staff: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    }
    return colors[role] || colors.staff
  }

  const getDisplayName = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Admin'
  }

  return (
    <header className="admin-header flex items-center justify-between px-6 py-4">
      {/* Left side - Menu button and search */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Search bar */}
        <div className="hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Cari anggota, transaksi..."
              className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Right side - Notifications and user menu */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
        </button>

        {/* User menu */}
        <Menu as="div" className="relative">
          <div>
            <Menu.Button className="flex items-center space-x-3 p-2 rounded-lg text-sm hover:bg-neutral-100 transition-colors">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-neutral-900">
                  {getDisplayName()}
                </p>
                <div className="flex items-center space-x-1">
                  {userRoles.slice(0, 2).map((role, index) => (
                    <span
                      key={role}
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                        getRoleBadgeColor(role)
                      )}
                    >
                      {role.replace('_', ' ')}
                    </span>
                  ))}
                  {userRoles.length > 2 && (
                    <span className="text-xs text-neutral-500">
                      +{userRoles.length - 2}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <UserCircleIcon className="h-6 w-6 text-primary-600" />
              </div>
              <ChevronDownIcon className="h-4 w-4 text-neutral-400" />
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {/* User info */}
                <div className="px-4 py-3 border-b border-neutral-100">
                  <p className="text-sm font-medium text-neutral-900">
                    {getDisplayName()}
                  </p>
                  <p className="text-sm text-neutral-500">{user?.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {userRoles.map((role) => (
                      <span
                        key={role}
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                          getRoleBadgeColor(role)
                        )}
                      >
                        <ShieldCheckIcon className="h-3 w-3 mr-1" />
                        {role.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Menu items */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => router.push('/profile')}
                      className={cn(
                        'flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100',
                        active && 'bg-neutral-100'
                      )}
                    >
                      <UserCircleIcon className="h-5 w-5 mr-3 text-neutral-400" />
                      Profil Saya
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => router.push('/settings')}
                      className={cn(
                        'flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100',
                        active && 'bg-neutral-100'
                      )}
                    >
                      <Cog6ToothIcon className="h-5 w-5 mr-3 text-neutral-400" />
                      Pengaturan
                    </button>
                  )}
                </Menu.Item>

                <div className="border-t border-neutral-100">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSignOut}
                        className={cn(
                          'flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50',
                          active && 'bg-red-50'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-red-400" />
                        Keluar
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  )
}