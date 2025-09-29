'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  PiggyBank,
  CreditCard,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
  User
} from 'lucide-react'

// Hooks and utilities
import { useAuth } from '@/components/providers/auth-provider'
import { useMemberData, useSavingsData, useRecentTransactions } from '@/hooks/use-member-data'
import { formatCurrency } from '@/lib/utils/currency'
import { formatRelativeTime, formatTime } from '@/lib/utils/date'

// Components
import {
  MemberCardSkeleton,
  SavingsCardSkeleton,
  TransactionItemSkeleton
} from '@/components/ui/loading-skeleton'

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Data hooks
  const { data: memberData, isLoading: memberLoading } = useMemberData()
  const { data: savingsData, isLoading: savingsLoading } = useSavingsData()
  const { data: transactions, isLoading: transactionsLoading } = useRecentTransactions()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Show loading or redirect if not authenticated
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // Calculate total balance
  const totalBalance = savingsData?.reduce((sum, saving) => sum + saving.balance, 0) || 0

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Header */}
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
            Selamat Datang, {memberData?.full_name?.split(' ')[0] || 'Anggota'}!
          </h1>
          <p className="text-neutral-600">
            Kelola keuangan koperasi Anda dengan mudah dan aman
          </p>
        </div>

        {/* Member Overview Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {memberLoading ? (
              <MemberCardSkeleton />
            ) : (
              <div className="member-card">
                <div className="member-card-header">
                  <div className="flex items-center">
                    <div className="member-card-avatar">
                      {memberData?.profile_image ? (
                        <img
                          src={memberData.profile_image}
                          alt={memberData.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6" />
                      )}
                    </div>
                    <div className="member-card-info">
                      <h3 className="member-card-name">{memberData?.full_name}</h3>
                      <p className="member-card-id">ID: {memberData?.member_id}</p>
                    </div>
                  </div>
                  <span className="status-active">
                    {memberData?.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-neutral-600 mb-1">Total Saldo</p>
                  <p className="member-card-balance">{formatCurrency(totalBalance)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Aksi Cepat</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              <Link
                href="/savings"
                className="flex items-center p-4 bg-white rounded-lg border border-neutral-200 hover:shadow-md transition-shadow group"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <PiggyBank className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 group-hover:text-primary-600">
                    Simpanan
                  </p>
                  <p className="text-sm text-neutral-600">Kelola simpanan</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-primary-600" />
              </Link>

              <Link
                href="/loans"
                className="flex items-center p-4 bg-white rounded-lg border border-neutral-200 hover:shadow-md transition-shadow group"
              >
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center mr-3">
                  <CreditCard className="h-5 w-5 text-secondary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 group-hover:text-secondary-600">
                    Pinjaman
                  </p>
                  <p className="text-sm text-neutral-600">Ajukan pinjaman</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-secondary-600" />
              </Link>

              <Link
                href="/transactions"
                className="flex items-center p-4 bg-white rounded-lg border border-neutral-200 hover:shadow-md transition-shadow group"
              >
                <div className="w-10 h-10 bg-accent-gold/20 rounded-lg flex items-center justify-center mr-3">
                  <Receipt className="h-5 w-5 text-accent-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 group-hover:text-accent-gold">
                    Transaksi
                  </p>
                  <p className="text-sm text-neutral-600">Riwayat transaksi</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-accent-gold" />
              </Link>
            </div>
          </div>
        </div>

        {/* Savings Summary */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Ringkasan Simpanan</h3>
            <Link
              href="/savings"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
            >
              Lihat Semua
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savingsLoading ? (
              <>
                <SavingsCardSkeleton />
                <SavingsCardSkeleton />
                <SavingsCardSkeleton />
              </>
            ) : (
              savingsData?.map((saving) => (
                <div key={saving.id} className="savings-card">
                  <div className="savings-header">
                    <span className="savings-type">
                      {saving.type === 'pokok' ? 'Simpanan Pokok' :
                       saving.type === 'wajib' ? 'Simpanan Wajib' :
                       'Simpanan Sukarela'}
                    </span>
                    {saving.interest_rate > 0 && (
                      <div className="flex items-center text-accent-teal">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span className="text-xs">{saving.interest_rate}%</span>
                      </div>
                    )}
                  </div>
                  <div className="savings-amount">{formatCurrency(saving.balance)}</div>
                  <div className="savings-label">
                    Terakhir: {formatRelativeTime(saving.last_transaction)}
                  </div>
                  {saving.monthly_target && (
                    <div className="savings-growth">
                      <span>Target: {formatCurrency(saving.monthly_target)}/bulan</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Transaksi Terbaru</h3>
            <Link
              href="/transactions"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
            >
              Lihat Semua
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="card">
            {transactionsLoading ? (
              <div className="space-y-4">
                <TransactionItemSkeleton />
                <TransactionItemSkeleton />
                <TransactionItemSkeleton />
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'deposit' ? 'bg-success-100' :
                        transaction.type === 'withdrawal' ? 'bg-warning-100' :
                        transaction.type === 'payment' ? 'bg-secondary-100' :
                        'bg-primary-100'
                      }`}>
                        {transaction.type === 'deposit' ? (
                          <ArrowDownRight className="h-5 w-5 text-success-600" />
                        ) : transaction.type === 'withdrawal' ? (
                          <ArrowUpRight className="h-5 w-5 text-warning-600" />
                        ) : (
                          <Receipt className="h-5 w-5 text-secondary-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{transaction.description}</p>
                        <div className="flex items-center text-sm text-neutral-600">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatRelativeTime(transaction.date)} • {formatTime(transaction.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'deposit' ? 'text-success-600' :
                        transaction.type === 'withdrawal' ? 'text-warning-600' :
                        'text-neutral-900'
                      }`}>
                        {transaction.type === 'withdrawal' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className={`text-xs px-2 py-1 rounded-full ${
                        transaction.status === 'completed' ? 'bg-success-100 text-success-700' :
                        transaction.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                        'bg-error-100 text-error-700'
                      }`}>
                        {transaction.status === 'completed' ? 'Selesai' :
                         transaction.status === 'pending' ? 'Proses' : 'Gagal'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-600">
                <Receipt className="h-12 w-12 mx-auto mb-3 text-neutral-400" />
                <p>Belum ada transaksi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}