'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Wallet, PiggyBank, TrendingUp, Plus, ArrowUpCircle, ArrowDownCircle,
  Calendar, DollarSign, Target, Clock, ChevronRight, Eye, EyeOff,
  CreditCard, BarChart3, Calculator, History, AlertCircle, CheckCircle,
  Zap, Shield, Gift, Award, Users, RefreshCw
} from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

interface SavingsAccount {
  id: number
  member_id: number
  account_number: string
  account_type: string
  balance: number
  status: string
  interest_rate: number
  auto_debit: boolean
  auto_debit_amount?: number
  target_amount?: number
  created_at: string
  updated_at: string
}

interface RecentTransaction {
  id: number
  type: 'deposit' | 'withdrawal' | 'interest' | 'fee'
  amount: number
  description: string
  balance_after: number
  created_at: string
  status: string
}

interface SavingsStats {
  total_balance: number
  total_accounts: number
  monthly_growth: number
  total_interest_earned: number
  savings_goal_progress: number
  auto_debit_total: number
}

const SAVINGS_TYPES = {
  wajib: {
    name: 'Simpanan Wajib',
    description: 'Simpanan rutin bulanan anggota',
    icon: Target,
    color: 'from-blue-500 to-blue-700',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    minDeposit: 50000,
    interestRate: 3.5,
    features: ['Bunga kompetitif', 'Setoran rutin', 'Mudah dikelola']
  },
  sukarela: {
    name: 'Simpanan Sukarela',
    description: 'Simpanan fleksibel dengan bunga menarik',
    icon: PiggyBank,
    color: 'from-green-500 to-green-700',
    textColor: 'text-green-600',
    bgColor: 'bg-green-100',
    minDeposit: 100000,
    interestRate: 4.0,
    features: ['Setoran fleksibel', 'Bunga tinggi', 'Bebas biaya admin']
  },
  berjangka: {
    name: 'Simpanan Berjangka',
    description: 'Deposito dengan tenor dan bunga tetap',
    icon: Clock,
    color: 'from-purple-500 to-purple-700',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    minDeposit: 1000000,
    interestRate: 5.5,
    features: ['Bunga tetap', 'Jangka waktu tertentu', 'Return optimal']
  }
}

export default function SavingsPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([])
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [savingsStats, setSavingsStats] = useState<SavingsStats>({
    total_balance: 0,
    total_accounts: 0,
    monthly_growth: 0,
    total_interest_earned: 0,
    savings_goal_progress: 0,
    auto_debit_total: 0
  })
  const [showBalance, setShowBalance] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('1M')

  useEffect(() => {
    if (user) {
      fetchSavingsData()
    }
  }, [user])

  const fetchSavingsData = async () => {
    try {
      // Get member ID first
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (memberError) {
        toast.error('Data anggota tidak ditemukan')
        return
      }

      // Fetch savings accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('member_id', memberData.id)
        .order('created_at', { ascending: false })

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError)
      } else {
        setSavingsAccounts(accountsData || [])
      }

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('member_id', memberData.id)
        .in('type', ['deposit', 'withdrawal', 'interest', 'fee'])
        .order('created_at', { ascending: false })
        .limit(10)

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
      } else {
        setRecentTransactions(transactionsData || [])
      }

      // Calculate stats
      calculateSavingsStats(accountsData || [], transactionsData || [])

    } catch (error: any) {
      console.error('Error fetching savings data:', error)
      toast.error('Gagal memuat data simpanan')
    } finally {
      setLoading(false)
    }
  }

  const calculateSavingsStats = (accounts: SavingsAccount[], transactions: RecentTransaction[]) => {
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
    const totalAccounts = accounts.length
    const autoDebitTotal = accounts
      .filter(account => account.auto_debit)
      .reduce((sum, account) => sum + (account.auto_debit_amount || 0), 0)

    // Calculate monthly growth (simplified)
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    const monthlyDeposits = transactions
      .filter(t => t.type === 'deposit' && new Date(t.created_at) >= lastMonth)
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyWithdrawals = transactions
      .filter(t => t.type === 'withdrawal' && new Date(t.created_at) >= lastMonth)
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyGrowth = monthlyDeposits - monthlyWithdrawals

    // Calculate interest earned (simplified)
    const interestEarned = transactions
      .filter(t => t.type === 'interest')
      .reduce((sum, t) => sum + t.amount, 0)

    // Calculate savings goal progress (example: 50M target)
    const savingsGoal = 50000000
    const goalProgress = Math.min((totalBalance / savingsGoal) * 100, 100)

    setSavingsStats({
      total_balance: totalBalance,
      total_accounts: totalAccounts,
      monthly_growth: monthlyGrowth,
      total_interest_earned: interestEarned,
      savings_goal_progress: goalProgress,
      auto_debit_total: autoDebitTotal
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getAccountTypeInfo = (type: string) => {
    return SAVINGS_TYPES[type as keyof typeof SAVINGS_TYPES] || SAVINGS_TYPES.sukarela
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowUpCircle className="h-5 w-5 text-success-600" />
      case 'withdrawal': return <ArrowDownCircle className="h-5 w-5 text-error-600" />
      case 'interest': return <TrendingUp className="h-5 w-5 text-info-600" />
      case 'fee': return <DollarSign className="h-5 w-5 text-warning-600" />
      default: return <DollarSign className="h-5 w-5 text-neutral-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-success-600'
      case 'withdrawal': return 'text-error-600'
      case 'interest': return 'text-info-600'
      case 'fee': return 'text-warning-600'
      default: return 'text-neutral-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat data simpanan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Simpanan Saya
            </h1>
            <p className="text-neutral-600">
              Kelola dan pantau semua simpanan Anda di Koperasi Sinoman
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Link href="/savings/deposit" className="btn-primary flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Setor Simpanan
            </Link>
            <button
              onClick={fetchSavingsData}
              disabled={loading}
              className="btn-outline flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary-600" />
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <h3 className="text-sm text-neutral-600 mb-1">Total Simpanan</h3>
            <p className="text-2xl font-bold text-neutral-900">
              {showBalance ? formatCurrency(savingsStats.total_balance) : '****'}
            </p>
            <p className="text-sm text-success-600 mt-1">
              {savingsStats.total_accounts} rekening aktif
            </p>
          </div>

          <div className="card">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-success-600" />
            </div>
            <h3 className="text-sm text-neutral-600 mb-1">Pertumbuhan Bulan Ini</h3>
            <p className="text-2xl font-bold text-neutral-900">
              {showBalance ? formatCurrency(savingsStats.monthly_growth) : '****'}
            </p>
            <p className={`text-sm mt-1 ${savingsStats.monthly_growth >= 0 ? 'text-success-600' : 'text-error-600'}`}>
              {savingsStats.monthly_growth >= 0 ? '+' : ''}{((savingsStats.monthly_growth / savingsStats.total_balance) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="card">
            <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center mb-2">
              <Gift className="h-5 w-5 text-info-600" />
            </div>
            <h3 className="text-sm text-neutral-600 mb-1">Bunga Diterima</h3>
            <p className="text-2xl font-bold text-neutral-900">
              {showBalance ? formatCurrency(savingsStats.total_interest_earned) : '****'}
            </p>
            <p className="text-sm text-info-600 mt-1">
              Tahun ini
            </p>
          </div>

          <div className="card">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-warning-600" />
            </div>
            <h3 className="text-sm text-neutral-600 mb-1">Target Simpanan</h3>
            <p className="text-2xl font-bold text-neutral-900">
              {savingsStats.savings_goal_progress.toFixed(1)}%
            </p>
            <div className="w-full bg-neutral-200 rounded-full h-2 mt-2">
              <div
                className="bg-warning-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(savingsStats.savings_goal_progress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/savings/deposit" className="card hover:shadow-lg transition-shadow cursor-pointer text-center p-4">
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowUpCircle className="h-6 w-6 text-success-600" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Setor</h3>
            <p className="text-sm text-neutral-600">Tambah simpanan</p>
          </Link>

          <Link href="/savings/withdraw" className="card hover:shadow-lg transition-shadow cursor-pointer text-center p-4">
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowDownCircle className="h-6 w-6 text-error-600" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Tarik</h3>
            <p className="text-sm text-neutral-600">Ambil simpanan</p>
          </Link>

          <Link href="/savings/history" className="card hover:shadow-lg transition-shadow cursor-pointer text-center p-4">
            <div className="w-12 h-12 bg-info-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <History className="h-6 w-6 text-info-600" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Riwayat</h3>
            <p className="text-sm text-neutral-600">Lihat transaksi</p>
          </Link>

          <Link href="/savings/calculator" className="card hover:shadow-lg transition-shadow cursor-pointer text-center p-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Kalkulator</h3>
            <p className="text-sm text-neutral-600">Hitung bunga</p>
          </Link>
        </div>

        {/* Savings Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Accounts */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">Rekening Simpanan</h2>
              <Link href="/savings/accounts" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                Lihat Semua
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {savingsAccounts.length > 0 ? (
              <div className="space-y-4">
                {savingsAccounts.slice(0, 3).map((account) => {
                  const typeInfo = getAccountTypeInfo(account.account_type)
                  const Icon = typeInfo.icon

                  return (
                    <div key={account.id} className="card hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeInfo.bgColor}`}>
                            <Icon className={`h-6 w-6 ${typeInfo.textColor}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-neutral-900">{typeInfo.name}</h3>
                            <p className="text-sm text-neutral-600">No. {account.account_number}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                account.status === 'active' ? 'text-success-600 bg-success-100' : 'text-error-600 bg-error-100'
                              }`}>
                                {account.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                              </span>
                              {account.auto_debit && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium text-info-600 bg-info-100">
                                  Auto Debit
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-neutral-900">
                            {showBalance ? formatCurrency(account.balance) : '****'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            Bunga {account.interest_rate}% p.a.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="card text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PiggyBank className="h-8 w-8 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Belum Ada Rekening Simpanan
                </h3>
                <p className="text-neutral-600 mb-6">
                  Mulai menabung dengan membuka rekening simpanan pertama Anda
                </p>
                <Link href="/savings/accounts" className="btn-primary">
                  Buka Rekening Baru
                </Link>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">Transaksi Terbaru</h2>
              <Link href="/savings/history" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                Lihat Semua
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium text-neutral-900 text-sm">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-sm ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'withdrawal' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Saldo: {showBalance ? formatCurrency(transaction.balance_after) : '****'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card text-center py-8">
                  <History className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
                  <p className="text-neutral-600">Belum ada transaksi</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Savings Products */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Produk Simpanan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(SAVINGS_TYPES).map(([key, product]) => {
              const Icon = product.icon
              const hasAccount = savingsAccounts.some(account => account.account_type === key)

              return (
                <div key={key} className="card relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-5`}></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${product.bgColor}`}>
                        <Icon className={`h-6 w-6 ${product.textColor}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{product.name}</h3>
                        <p className="text-sm text-neutral-600">{product.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Setoran Minimal</span>
                        <span className="font-medium">{formatCurrency(product.minDeposit)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Bunga</span>
                        <span className="font-medium">{product.interestRate}% p.a.</span>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      {product.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-neutral-600">
                          <CheckCircle className="h-4 w-4 text-success-600" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <Link
                      href={hasAccount ? `/savings/accounts?type=${key}` : `/savings/accounts/new?type=${key}`}
                      className={`btn-outline w-full ${hasAccount ? 'border-success-300 text-success-600 hover:bg-success-50' : ''}`}
                    >
                      {hasAccount ? 'Lihat Rekening' : 'Buka Rekening'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tips and Education */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-info-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Tips Menabung</h3>
            </div>
            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success-600 mt-0.5 flex-shrink-0" />
                <p>Sisihkan 20% dari penghasilan untuk simpanan rutin</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success-600 mt-0.5 flex-shrink-0" />
                <p>Manfaatkan auto debit untuk konsistensi menabung</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success-600 mt-0.5 flex-shrink-0" />
                <p>Diversifikasi dengan beberapa jenis simpanan</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-warning-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Keamanan Simpanan</h3>
            </div>
            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success-600 mt-0.5 flex-shrink-0" />
                <p>Simpanan dijamin oleh Lembaga Penjamin Simpanan (LPS)</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success-600 mt-0.5 flex-shrink-0" />
                <p>Sistem keamanan berlapis untuk melindungi dana Anda</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success-600 mt-0.5 flex-shrink-0" />
                <p>Akses 24/7 untuk memantau perkembangan simpanan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}