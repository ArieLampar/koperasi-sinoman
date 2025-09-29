'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Clock, Calculator, TrendingUp, AlertTriangle, Shield,
  Calendar, DollarSign, Info, CheckCircle, X, Eye, EyeOff,
  FileText, Award, Zap, Target, Percent, Timer, Banknote,
  ArrowRight, RefreshCw, PiggyBank, Users, Lock, Bell
} from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

interface TimeDepositTenor {
  months: number
  label: string
  interestRate: number
  minDeposit: number
  maxDeposit: number
  isPopular?: boolean
  features: string[]
}

interface TimeDepositCalculation {
  principal: number
  tenor: number
  interestRate: number
  grossInterest: number
  tax: number
  netInterest: number
  maturityAmount: number
  maturityDate: Date
}

interface TimeDepositAccount {
  id: number
  account_number: string
  principal_amount: number
  interest_rate: number
  tenor_months: number
  maturity_date: string
  status: string
  created_at: string
}

const TIME_DEPOSIT_TENORS: TimeDepositTenor[] = [
  {
    months: 3,
    label: '3 Bulan',
    interestRate: 4.5,
    minDeposit: 1000000,
    maxDeposit: 100000000,
    features: ['Fleksibel jangka pendek', 'Bunga kompetitif', 'Dapat diperpanjang otomatis']
  },
  {
    months: 6,
    label: '6 Bulan',
    interestRate: 5.25,
    minDeposit: 1000000,
    maxDeposit: 100000000,
    isPopular: true,
    features: ['Pilihan terpopuler', 'Bunga lebih tinggi', 'Balance optimal tenor & return']
  },
  {
    months: 12,
    label: '12 Bulan',
    interestRate: 6.0,
    minDeposit: 1000000,
    maxDeposit: 100000000,
    features: ['Bunga tertinggi', 'Jangka panjang stabil', 'Return maksimal']
  }
]

const EARLY_WITHDRAWAL_PENALTY = {
  '0-30': { rate: 2.0, description: 'Bunga 0% + penalti 2% dari pokok' },
  '31-90': { rate: 1.5, description: 'Bunga 50% + penalti 1.5% dari pokok' },
  '91-180': { rate: 1.0, description: 'Bunga 75% + penalti 1% dari pokok' },
  '181+': { rate: 0.5, description: 'Bunga 90% + penalti 0.5% dari pokok' }
}

export default function TimeDepositPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingDeposits, setExistingDeposits] = useState<TimeDepositAccount[]>([])
  const [selectedTenor, setSelectedTenor] = useState<TimeDepositTenor>(TIME_DEPOSIT_TENORS[1]) // Default to 6 months
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [calculation, setCalculation] = useState<TimeDepositCalculation | null>(null)
  const [showCalculation, setShowCalculation] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [autoRenewal, setAutoRenewal] = useState(false)
  const [showBalance, setShowBalance] = useState(true)

  useEffect(() => {
    if (user) {
      fetchExistingDeposits()
    }
  }, [user])

  useEffect(() => {
    if (depositAmount > 0 && selectedTenor) {
      calculateDeposit()
    }
  }, [depositAmount, selectedTenor])

  const fetchExistingDeposits = async () => {
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

      // Fetch existing time deposits
      const { data: depositsData, error: depositsError } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('member_id', memberData.id)
        .eq('account_type', 'berjangka')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (depositsError) {
        console.error('Error fetching deposits:', depositsError)
      } else {
        setExistingDeposits(depositsData || [])
      }

    } catch (error: any) {
      console.error('Error fetching existing deposits:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const calculateDeposit = () => {
    if (!depositAmount || !selectedTenor) return

    const principal = depositAmount
    const annualRate = selectedTenor.interestRate / 100
    const tenorInYears = selectedTenor.months / 12

    // Calculate gross interest
    const grossInterest = principal * annualRate * tenorInYears

    // Calculate tax (20% on interest for deposits > 7.5M)
    const taxRate = principal > 7500000 ? 0.20 : 0
    const tax = grossInterest * taxRate

    // Calculate net interest and maturity amount
    const netInterest = grossInterest - tax
    const maturityAmount = principal + netInterest

    // Calculate maturity date
    const maturityDate = new Date()
    maturityDate.setMonth(maturityDate.getMonth() + selectedTenor.months)

    setCalculation({
      principal,
      tenor: selectedTenor.months,
      interestRate: selectedTenor.interestRate,
      grossInterest,
      tax,
      netInterest,
      maturityAmount,
      maturityDate
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const validateDeposit = () => {
    if (!depositAmount) {
      toast.error('Masukkan jumlah deposito')
      return false
    }

    if (depositAmount < selectedTenor.minDeposit) {
      toast.error(`Minimal deposito ${formatCurrency(selectedTenor.minDeposit)}`)
      return false
    }

    if (depositAmount > selectedTenor.maxDeposit) {
      toast.error(`Maksimal deposito ${formatCurrency(selectedTenor.maxDeposit)}`)
      return false
    }

    if (!agreeToTerms) {
      toast.error('Harap setujui syarat dan ketentuan')
      return false
    }

    return true
  }

  const createTimeDeposit = async () => {
    if (!validateDeposit() || !calculation) return

    try {
      setSubmitting(true)

      // Get member ID
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (memberError) throw memberError

      // Generate account number
      const accountNumber = `TD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`

      // Create time deposit account
      const { data: accountData, error: accountError } = await supabase
        .from('savings_accounts')
        .insert({
          member_id: memberData.id,
          account_number: accountNumber,
          account_type: 'berjangka',
          balance: calculation.principal,
          status: 'active',
          interest_rate: selectedTenor.interestRate,
          target_amount: calculation.maturityAmount,
          maturity_date: calculation.maturityDate.toISOString(),
          auto_debit: autoRenewal,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (accountError) throw accountError

      // Record initial deposit transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          member_id: memberData.id,
          account_id: accountData.id,
          type: 'deposit',
          amount: calculation.principal,
          description: `Pembukaan Deposito Berjangka ${selectedTenor.label}`,
          balance_after: calculation.principal,
          status: 'completed',
          reference_id: `DEP${accountData.id}${Date.now()}`,
          created_at: new Date().toISOString()
        })

      if (transactionError) throw transactionError

      toast.success('Deposito berjangka berhasil dibuat!')

      // Refresh data
      fetchExistingDeposits()

      // Reset form
      setDepositAmount(0)
      setAgreeToTerms(false)
      setAutoRenewal(false)
      setCalculation(null)

    } catch (error: any) {
      console.error('Error creating time deposit:', error)
      toast.error('Gagal membuat deposito berjangka')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateEarlyWithdrawalPenalty = (deposit: TimeDepositAccount) => {
    const now = new Date()
    const created = new Date(deposit.created_at)
    const daysSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))

    let penaltyInfo
    if (daysSinceCreation <= 30) {
      penaltyInfo = EARLY_WITHDRAWAL_PENALTY['0-30']
    } else if (daysSinceCreation <= 90) {
      penaltyInfo = EARLY_WITHDRAWAL_PENALTY['31-90']
    } else if (daysSinceCreation <= 180) {
      penaltyInfo = EARLY_WITHDRAWAL_PENALTY['91-180']
    } else {
      penaltyInfo = EARLY_WITHDRAWAL_PENALTY['181+']
    }

    const penalty = deposit.principal_amount * (penaltyInfo.rate / 100)

    return {
      penalty,
      description: penaltyInfo.description,
      daysSinceCreation
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat data deposito...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Simpanan Berjangka</h1>
            <p className="text-neutral-600">Deposito dengan bunga tetap dan jangka waktu tertentu</p>
          </div>
        </div>

        {/* Existing Deposits */}
        {existingDeposits.length > 0 && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">Deposito Aktif</h2>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="space-y-4">
              {existingDeposits.map((deposit) => {
                const maturityDate = new Date(deposit.maturity_date)
                const isMatured = maturityDate <= new Date()
                const daysToMaturity = Math.ceil((maturityDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                const earlyWithdrawal = calculateEarlyWithdrawalPenalty(deposit)

                return (
                  <div key={deposit.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Clock className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900">
                            Deposito {deposit.tenor_months} Bulan
                          </h3>
                          <p className="text-sm text-neutral-600">No. {deposit.account_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-neutral-900">
                          {showBalance ? formatCurrency(deposit.principal_amount) : '****'}
                        </p>
                        <p className="text-sm text-purple-600">Bunga {deposit.interest_rate}% p.a.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-500">Tanggal Pembukaan</p>
                        <p className="font-medium">{formatDate(deposit.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Jatuh Tempo</p>
                        <p className="font-medium">{formatDate(deposit.maturity_date)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Status</p>
                        <div className="flex items-center gap-2">
                          {isMatured ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium text-success-600 bg-success-100">
                              Jatuh Tempo
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium text-info-600 bg-info-100">
                              Aktif ({daysToMaturity} hari lagi)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isMatured && (
                      <div className="mt-4 p-3 bg-warning-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-warning-700">
                            <p className="font-medium">Pencairan Sebelum Jatuh Tempo</p>
                            <p className="text-xs mt-1">
                              {earlyWithdrawal.description} = Penalti: {formatCurrency(earlyWithdrawal.penalty)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* New Deposit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deposit Form */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">Buka Deposito Baru</h2>
            </div>

            <div className="space-y-6">
              {/* Tenor Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Pilih Jangka Waktu
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {TIME_DEPOSIT_TENORS.map((tenor) => (
                    <div
                      key={tenor.months}
                      onClick={() => setSelectedTenor(tenor)}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedTenor.months === tenor.months
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {tenor.isPopular && (
                        <div className="absolute -top-2 -right-2">
                          <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                            Populer
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-neutral-900">{tenor.label}</h3>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">{tenor.interestRate}%</p>
                          <p className="text-xs text-neutral-500">per tahun</p>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-neutral-600">
                        <p>Minimal: {formatCurrency(tenor.minDeposit)}</p>
                        <p>Maksimal: {formatCurrency(tenor.maxDeposit)}</p>
                      </div>

                      <div className="mt-3 space-y-1">
                        {tenor.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-neutral-600">
                            <CheckCircle className="h-3 w-3 text-success-600" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Jumlah Deposito
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={depositAmount || ''}
                    onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0
                      setDepositAmount(amount)
                    }}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="mt-3">
                  <p className="text-sm font-medium text-neutral-700 mb-2">Jumlah Cepat</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1000000, 5000000, 10000000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setDepositAmount(amount)}
                        className="py-2 px-3 text-sm border border-neutral-300 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-colors"
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Validation Info */}
                {selectedTenor && (
                  <div className="mt-3 p-3 bg-info-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-info-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-info-700">
                        <p className="font-medium mb-1">Syarat Deposito</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Minimal deposito: {formatCurrency(selectedTenor.minDeposit)}</li>
                          <li>• Maksimal deposito: {formatCurrency(selectedTenor.maxDeposit)}</li>
                          <li>• Bunga dibayar setiap bulan</li>
                          <li>• Dapat diperpanjang otomatis</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto Renewal */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoRenewal"
                  checked={autoRenewal}
                  onChange={(e) => setAutoRenewal(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-neutral-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="autoRenewal" className="text-sm text-neutral-700">
                  Perpanjang otomatis saat jatuh tempo
                </label>
              </div>

              {/* Terms Agreement */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-neutral-300 rounded focus:ring-purple-500 mt-0.5"
                  />
                  <label htmlFor="agreeTerms" className="text-sm text-neutral-700">
                    Saya setuju dengan{' '}
                    <button
                      onClick={() => setShowTerms(true)}
                      className="text-purple-600 hover:text-purple-700 underline"
                    >
                      syarat dan ketentuan
                    </button>
                    {' '}deposito berjangka
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={createTimeDeposit}
                disabled={!depositAmount || !agreeToTerms || submitting}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Membuat Deposito...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Buka Deposito
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Calculation & Information */}
          <div className="space-y-6">
            {/* Calculator */}
            {calculation && (
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                    <Calculator className="h-4 w-4 text-success-600" />
                  </div>
                  <h3 className="font-semibold text-neutral-900">Simulasi Hasil</h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-neutral-600 mb-1">Nilai Jatuh Tempo</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(calculation.maturityAmount)}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        pada {formatDate(calculation.maturityDate)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Pokok Deposito</span>
                      <span className="font-medium">{formatCurrency(calculation.principal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Bunga Kotor</span>
                      <span className="font-medium text-success-600">
                        +{formatCurrency(calculation.grossInterest)}
                      </span>
                    </div>
                    {calculation.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Pajak (20%)</span>
                        <span className="font-medium text-error-600">
                          -{formatCurrency(calculation.tax)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Bunga Bersih</span>
                      <span className="font-medium text-success-600">
                        +{formatCurrency(calculation.netInterest)}
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-neutral-900">Total Diterima</span>
                        <span className="text-lg font-bold text-purple-600">
                          {formatCurrency(calculation.maturityAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-info-50 p-3 rounded-lg">
                    <p className="text-xs text-info-700">
                      <Info className="h-3 w-3 inline mr-1" />
                      Perhitungan ini bersifat simulasi. Bunga dibayar setiap bulan ke rekening Anda.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Product Features */}
            <div className="card">
              <h3 className="font-semibold text-neutral-900 mb-4">Keunggulan Deposito</h3>
              <div className="space-y-3">
                {[
                  { icon: Shield, title: 'Dijamin LPS', desc: 'Penjaminan hingga Rp 2 Miliar' },
                  { icon: Percent, title: 'Bunga Kompetitif', desc: 'Hingga 6% per tahun' },
                  { icon: Calendar, title: 'Fleksibel Tenor', desc: '3, 6, atau 12 bulan' },
                  { icon: RefreshCw, title: 'Auto Renewal', desc: 'Perpanjangan otomatis' },
                  { icon: Bell, title: 'Notifikasi', desc: 'Pengingat jatuh tempo' }
                ].map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-0.5">
                        <Icon className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{feature.title}</p>
                        <p className="text-sm text-neutral-600">{feature.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Early Withdrawal Info */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-warning-600" />
                </div>
                <h3 className="font-semibold text-neutral-900">Pencairan Dipercepat</h3>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-neutral-600">
                  Pencairan sebelum jatuh tempo dikenakan penalti sesuai jangka waktu:
                </p>

                {Object.entries(EARLY_WITHDRAWAL_PENALTY).map(([period, info]) => (
                  <div key={period} className="flex justify-between items-start">
                    <span className="text-neutral-600 w-20">
                      {period === '181+' ? '6+ bulan' :
                       period === '91-180' ? '3-6 bulan' :
                       period === '31-90' ? '1-3 bulan' : '< 1 bulan'}
                    </span>
                    <span className="text-neutral-900 text-right flex-1 text-xs">
                      {info.description}
                    </span>
                  </div>
                ))}

                <div className="bg-warning-50 p-3 rounded-lg mt-3">
                  <p className="text-xs text-warning-700">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    Disarankan untuk tidak mencairkan sebelum jatuh tempo agar mendapat hasil optimal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions Modal */}
        {showTerms && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Syarat dan Ketentuan Deposito Berjangka
                </h3>
                <button
                  onClick={() => setShowTerms(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-sm text-neutral-700">
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-2">1. Ketentuan Umum</h4>
                  <ul className="space-y-1 pl-4">
                    <li>• Deposito berjangka adalah simpanan dengan jangka waktu tertentu</li>
                    <li>• Minimum penempatan Rp 1.000.000 (satu juta rupiah)</li>
                    <li>• Maksimum penempatan Rp 100.000.000 (seratus juta rupiah)</li>
                    <li>• Jangka waktu tersedia: 3, 6, dan 12 bulan</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-900 mb-2">2. Bunga dan Pajak</h4>
                  <ul className="space-y-1 pl-4">
                    <li>• Bunga dihitung berdasarkan saldo harian</li>
                    <li>• Bunga dibayarkan setiap bulan ke rekening simpanan</li>
                    <li>• Pajak bunga 20% dikenakan untuk deposito di atas Rp 7.500.000</li>
                    <li>• Suku bunga dapat berubah sewaktu-waktu</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-900 mb-2">3. Pencairan Dipercepat</h4>
                  <ul className="space-y-1 pl-4">
                    <li>• Deposito dapat dicairkan sebelum jatuh tempo dengan penalti</li>
                    <li>• Penalti dihitung berdasarkan jangka waktu sejak penempatan</li>
                    <li>• Bunga yang telah dibayar dapat dikurangkan dari pokok</li>
                    <li>• Pencairan dipercepat memerlukan persetujuan khusus</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-900 mb-2">4. Perpanjangan Otomatis</h4>
                  <ul className="space-y-1 pl-4">
                    <li>• Deposito dapat diperpanjang otomatis dengan tenor yang sama</li>
                    <li>• Suku bunga mengikuti ketentuan yang berlaku saat perpanjangan</li>
                    <li>• Nasabah dapat membatalkan perpanjangan otomatis kapan saja</li>
                    <li>• Pemberitahuan perpanjangan dikirim 7 hari sebelum jatuh tempo</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-900 mb-2">5. Lain-lain</h4>
                  <ul className="space-y-1 pl-4">
                    <li>• Deposito dijamin oleh Lembaga Penjamin Simpanan (LPS)</li>
                    <li>• Koperasi berhak mengubah syarat dan ketentuan dengan pemberitahuan</li>
                    <li>• Sengketa diselesaikan melalui musyawarah atau jalur hukum</li>
                    <li>• Syarat dan ketentuan ini berlaku sejak penandatanganan</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 border-t">
                <button
                  onClick={() => {
                    setAgreeToTerms(true)
                    setShowTerms(false)
                  }}
                  className="w-full btn-primary"
                >
                  Saya Setuju dengan Syarat dan Ketentuan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}