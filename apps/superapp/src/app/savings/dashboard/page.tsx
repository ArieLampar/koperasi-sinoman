'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Wallet, PiggyBank, TrendingUp, Plus, ArrowUpCircle, ArrowDownCircle,
  Calendar, DollarSign, Target, Clock, ChevronRight, Eye, EyeOff,
  CreditCard, BarChart3, Calculator, History, AlertCircle, CheckCircle,
  Zap, Shield, Gift, Award, Users, RefreshCw, TrendingDown, Percent,
  Timer, Banknote, LineChart, PieChart, Activity
} from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

interface SavingsAccount {
  id: number
  member_id: number
  account_number: string
  account_type: 'pokok' | 'wajib' | 'sukarela' | 'berjangka'
  balance: number
  status: string
  interest_rate: number
  auto_debit: boolean
  auto_debit_amount?: number
  target_amount?: number
  maturity_date?: string
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
  account_id: number
}

interface SavingsStats {
  total_balance: number
  total_accounts: number
  monthly_growth: number
  total_interest_earned: number
  savings_goal_progress: number
  auto_debit_total: number
}

interface ChartData {
  month: string
  balance: number
  deposits: number
  interest: number
}

interface SHUProjection {
  current_balance: number
  projected_interest: number
  estimated_shu: number
  total_projection: number
}

const SAVINGS_TYPES = {
  pokok: {
    name: 'Simpanan Pokok',
    description: 'Simpanan wajib saat menjadi anggota',
    icon: Shield,
    color: 'from-indigo-500 to-indigo-700',
    textColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    minDeposit: 100000,
    interestRate: 0,
    features: ['Tidak dapat ditarik', 'Dasar keanggotaan', 'Berlaku seumur hidup']
  },
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

export default function SavingsDashboard() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([])
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [shuProjection, setShuProjection] = useState<SHUProjection>({
    current_balance: 0,
    projected_interest: 0,
    estimated_shu: 0,
    total_projection: 0
  })
  const [savingsStats, setSavingsStats] = useState<SavingsStats>({
    total_balance: 0,
    total_accounts: 0,
    monthly_growth: 0,
    total_interest_earned: 0,
    savings_goal_progress: 0,
    auto_debit_total: 0
  })
  const [showBalance, setShowBalance] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('6M')
  const [quickDepositAmount, setQuickDepositAmount] = useState('')
  const [quickDepositAccount, setQuickDepositAccount] = useState('')

  useEffect(() => {
    if (user) {
      fetchSavingsData()
    }
  }, [user])

  const fetchSavingsData = async () => {
    try {
      setLoading(true)

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

      // Fetch recent transactions with account details
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('member_id', memberData.id)
        .in('type', ['deposit', 'withdrawal', 'interest', 'fee'])
        .order('created_at', { ascending: false })
        .limit(20)

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
      } else {
        setRecentTransactions(transactionsData || [])
      }

      // Calculate stats and projections
      calculateSavingsStats(accountsData || [], transactionsData || [])
      generateChartData(transactionsData || [])
      calculateSHUProjection(accountsData || [], transactionsData || [])

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

    // Calculate monthly growth
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    const monthlyDeposits = transactions
      .filter(t => t.type === 'deposit' && new Date(t.created_at) >= lastMonth)
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyWithdrawals = transactions
      .filter(t => t.type === 'withdrawal' && new Date(t.created_at) >= lastMonth)
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyGrowth = monthlyDeposits - monthlyWithdrawals

    // Calculate interest earned this year
    const currentYear = new Date().getFullYear()
    const interestEarned = transactions
      .filter(t => t.type === 'interest' && new Date(t.created_at).getFullYear() === currentYear)
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

  const generateChartData = (transactions: RecentTransaction[]) => {
    const months = []
    const currentDate = new Date()

    // Generate last 6 months data
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthKey = date.toISOString().slice(0, 7)
      const monthName = date.toLocaleDateString('id-ID', { month: 'short' })

      const monthTransactions = transactions.filter(t =>
        t.created_at.startsWith(monthKey)
      )

      const deposits = monthTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0)

      const interest = monthTransactions
        .filter(t => t.type === 'interest')
        .reduce((sum, t) => sum + t.amount, 0)

      // Calculate cumulative balance (simplified)
      const balance = deposits + interest

      months.push({
        month: monthName,
        balance,
        deposits,
        interest
      })
    }

    setChartData(months)
  }

  const calculateSHUProjection = (accounts: SavingsAccount[], transactions: RecentTransaction[]) => {
    const currentBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

    // Calculate projected annual interest based on account types and balances
    const projectedInterest = accounts.reduce((sum, account) => {
      return sum + (account.balance * (account.interest_rate / 100))
    }, 0)

    // Estimate SHU based on cooperative performance (simplified calculation)
    // Assume 2% of total balance as estimated SHU distribution
    const estimatedShu = currentBalance * 0.02

    const totalProjection = currentBalance + projectedInterest + estimatedShu

    setShuProjection({
      current_balance: currentBalance,
      projected_interest: projectedInterest,
      estimated_shu: estimatedShu,
      total_projection: totalProjection
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

  const handleQuickDeposit = async () => {
    if (!quickDepositAccount || !quickDepositAmount) {
      toast.error('Pilih rekening dan masukkan jumlah setoran')
      return
    }

    const amount = parseFloat(quickDepositAmount)
    if (amount < 10000) {
      toast.error('Minimal setoran Rp 10.000')
      return
    }

    try {
      // Here you would implement the actual deposit logic
      toast.success(`Setoran Rp ${formatCurrency(amount)} berhasil diproses`)
      setQuickDepositAmount('')
      fetchSavingsData() // Refresh data
    } catch (error) {
      toast.error('Gagal memproses setoran')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat dashboard simpanan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Dashboard Simpanan
            </h1>
            <p className="text-neutral-600">
              Pantau semua simpanan dan proyeksi SHU Anda
            </p>
          </div>
          <div className="flex gap-3 mt-4 lg:mt-0">
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
              {savingsStats.monthly_growth >= 0 ? '+' : ''}{((savingsStats.monthly_growth / Math.max(savingsStats.total_balance, 1)) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="card">
            <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center mb-2">
              <Gift className="h-5 w-5 text-info-600" />
            </div>
            <h3 className="text-sm text-neutral-600 mb-1">Bunga Tahun Ini</h3>
            <p className="text-2xl font-bold text-neutral-900">
              {showBalance ? formatCurrency(savingsStats.total_interest_earned) : '****'}
            </p>
            <p className="text-sm text-info-600 mt-1">
              Dari bunga simpanan
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

        {/* Savings by Type & Growth Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Savings by Type */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">Simpanan per Jenis</h2>
              <PieChart className="h-5 w-5 text-neutral-400" />
            </div>

            <div className="space-y-4">
              {Object.entries(SAVINGS_TYPES).map(([key, type]) => {
                const Icon = type.icon
                const accountsOfType = savingsAccounts.filter(acc => acc.account_type === key)
                const totalBalance = accountsOfType.reduce((sum, acc) => sum + acc.balance, 0)
                const percentage = savingsStats.total_balance > 0 ? (totalBalance / savingsStats.total_balance) * 100 : 0

                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type.bgColor}`}>
                        <Icon className={`h-4 w-4 ${type.textColor}`} />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{type.name}</p>
                        <p className="text-sm text-neutral-600">{accountsOfType.length} rekening</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-900">
                        {showBalance ? formatCurrency(totalBalance) : '****'}
                      </p>
                      <p className="text-sm text-neutral-600">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Growth Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">Grafik Pertumbuhan</h2>
              <LineChart className="h-5 w-5 text-neutral-400" />
            </div>

            <div className="space-y-4">
              {chartData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    <span className="text-sm font-medium text-neutral-900">{data.month}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">
                      {showBalance ? formatCurrency(data.deposits) : '****'}
                    </p>
                    <p className="text-xs text-success-600">
                      +{showBalance ? formatCurrency(data.interest) : '****'} bunga
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Deposit & SHU Projection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Deposit */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-success-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">Setor Cepat</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Pilih Rekening
                </label>
                <select
                  value={quickDepositAccount}
                  onChange={(e) => setQuickDepositAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Pilih rekening simpanan</option>
                  {savingsAccounts.filter(acc => acc.status === 'active').map((account) => {
                    const typeInfo = getAccountTypeInfo(account.account_type)
                    return (
                      <option key={account.id} value={account.id}>
                        {typeInfo.name} - {account.account_number}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Jumlah Setoran
                </label>
                <input
                  type="number"
                  value={quickDepositAmount}
                  onChange={(e) => setQuickDepositAmount(e.target.value)}
                  placeholder="Masukkan jumlah"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleQuickDeposit}
                disabled={!quickDepositAccount || !quickDepositAmount}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Setor Sekarang
              </button>

              <div className="bg-info-50 p-3 rounded-lg">
                <p className="text-sm text-info-700">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Minimal setoran Rp 10.000. Transaksi akan diproses segera.
                </p>
              </div>
            </div>
          </div>

          {/* SHU Projection Calculator */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calculator className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">Proyeksi SHU</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Simpanan Saat Ini</p>
                    <p className="text-lg font-bold text-neutral-900">
                      {showBalance ? formatCurrency(shuProjection.current_balance) : '****'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Proyeksi Bunga</p>
                    <p className="text-lg font-bold text-success-600">
                      {showBalance ? formatCurrency(shuProjection.projected_interest) : '****'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Estimasi SHU</span>
                  <span className="font-semibold text-purple-600">
                    {showBalance ? formatCurrency(shuProjection.estimated_shu) : '****'}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-neutral-900">Total Proyeksi</span>
                    <span className="text-xl font-bold text-primary-600">
                      {showBalance ? formatCurrency(shuProjection.total_projection) : '****'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-warning-50 p-3 rounded-lg">
                <p className="text-xs text-warning-700">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  Proyeksi berdasarkan kinerja historis. Nilai SHU aktual dapat berbeda.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">Transaksi Terbaru</h2>
            <Link href="/savings/history" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
              Lihat Semua
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">Transaksi</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">Rekening</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">Tanggal</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-600">Jumlah</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-600">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.slice(0, 8).map((transaction) => {
                  const account = savingsAccounts.find(acc => acc.id === transaction.account_id)
                  const typeInfo = account ? getAccountTypeInfo(account.account_type) : null

                  return (
                    <tr key={transaction.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="font-medium text-neutral-900">{transaction.description}</p>
                            <p className="text-sm text-neutral-500 capitalize">{transaction.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-neutral-900">{typeInfo?.name || 'Unknown'}</p>
                        <p className="text-xs text-neutral-500">{account?.account_number}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-neutral-900">
                          {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(transaction.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'withdrawal' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="text-sm text-neutral-900">
                          {showBalance ? formatCurrency(transaction.balance_after) : '****'}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {recentTransactions.length === 0 && (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">Belum ada transaksi</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <p className="text-sm text-neutral-600">Hitung bunga & SHU</p>
          </Link>
        </div>
      </div>
    </div>
  )
}