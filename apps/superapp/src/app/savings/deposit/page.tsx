'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Wallet, CreditCard, Smartphone, Building, QrCode,
  CheckCircle, AlertCircle, Lock, Shield, Clock, ArrowRight,
  PiggyBank, Target, Calendar, Info, Receipt, Banknote,
  Eye, EyeOff, RefreshCw, ChevronDown, ChevronRight
} from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

interface SavingsAccount {
  id: number
  member_id: number
  account_number: string
  account_type: 'wajib' | 'sukarela' | 'berjangka'
  balance: number
  status: string
  interest_rate: number
  auto_debit: boolean
  auto_debit_amount?: number
  target_amount?: number
  created_at: string
}

interface PaymentMethod {
  id: string
  name: string
  type: 'bank_transfer' | 'virtual_account' | 'e_wallet' | 'cash'
  icon: any
  description: string
  fee: number
  processingTime: string
  isAvailable: boolean
  color: string
  bgColor: string
}

interface DepositData {
  accountId: string
  amount: number
  paymentMethod: string
  notes: string
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'bank_transfer',
    name: 'Transfer Bank',
    type: 'bank_transfer',
    icon: Building,
    description: 'Transfer melalui ATM, internet banking, atau mobile banking',
    fee: 0,
    processingTime: '1-2 jam kerja',
    isAvailable: true,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: 'virtual_account',
    name: 'Virtual Account',
    type: 'virtual_account',
    icon: CreditCard,
    description: 'Bayar melalui virtual account bank',
    fee: 2500,
    processingTime: 'Instan',
    isAvailable: true,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: 'e_wallet',
    name: 'E-Wallet',
    type: 'e_wallet',
    icon: Smartphone,
    description: 'GoPay, OVO, DANA, ShopeePay',
    fee: 1500,
    processingTime: 'Instan',
    isAvailable: true,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    id: 'qris',
    name: 'QRIS',
    type: 'e_wallet',
    icon: QrCode,
    description: 'Scan QR code dengan aplikasi mobile banking',
    fee: 0,
    processingTime: 'Instan',
    isAvailable: true,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    id: 'cash',
    name: 'Tunai',
    type: 'cash',
    icon: Banknote,
    description: 'Setoran tunai di kantor koperasi',
    fee: 0,
    processingTime: 'Instan',
    isAvailable: true,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  }
]

const SAVINGS_TYPES = {
  wajib: {
    name: 'Simpanan Wajib',
    description: 'Simpanan rutin bulanan anggota',
    minDeposit: 50000,
    maxDeposit: 10000000,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  sukarela: {
    name: 'Simpanan Sukarela',
    description: 'Simpanan fleksibel dengan bunga menarik',
    minDeposit: 100000,
    maxDeposit: 50000000,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  berjangka: {
    name: 'Simpanan Berjangka',
    description: 'Deposito dengan tenor dan bunga tetap',
    minDeposit: 1000000,
    maxDeposit: 100000000,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  }
}

type DepositStep = 'amount' | 'payment' | 'confirmation' | 'processing' | 'success'

export default function DepositPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<DepositStep>('amount')
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null)
  const [depositData, setDepositData] = useState<DepositData>({
    accountId: '',
    amount: 0,
    paymentMethod: '',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showBalance, setShowBalance] = useState(true)
  const [transactionId, setTransactionId] = useState<string>('')

  useEffect(() => {
    if (user) {
      fetchSavingsAccounts()
    }
  }, [user])

  const fetchSavingsAccounts = async () => {
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

      // Fetch active savings accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('member_id', memberData.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError)
        toast.error('Gagal memuat rekening simpanan')
      } else {
        setSavingsAccounts(accountsData || [])
      }

    } catch (error: any) {
      console.error('Error fetching savings accounts:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const validateAmount = (amount: number, accountType: string) => {
    const typeInfo = SAVINGS_TYPES[accountType as keyof typeof SAVINGS_TYPES]
    if (!typeInfo) return 'Jenis simpanan tidak valid'

    if (amount < typeInfo.minDeposit) {
      return `Minimal setoran ${formatCurrency(typeInfo.minDeposit)}`
    }

    if (amount > typeInfo.maxDeposit) {
      return `Maksimal setoran ${formatCurrency(typeInfo.maxDeposit)}`
    }

    return null
  }

  const handleAmountSubmit = () => {
    const newErrors: Record<string, string> = {}

    if (!depositData.accountId) {
      newErrors.accountId = 'Pilih rekening simpanan'
    }

    if (!depositData.amount || depositData.amount <= 0) {
      newErrors.amount = 'Masukkan jumlah setoran'
    } else if (selectedAccount) {
      const validationError = validateAmount(depositData.amount, selectedAccount.account_type)
      if (validationError) {
        newErrors.amount = validationError
      }
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setCurrentStep('payment')
    }
  }

  const handlePaymentSubmit = () => {
    const newErrors: Record<string, string> = {}

    if (!depositData.paymentMethod) {
      newErrors.paymentMethod = 'Pilih metode pembayaran'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setCurrentStep('confirmation')
    }
  }

  const processDeposit = async () => {
    try {
      setSubmitting(true)
      setCurrentStep('processing')

      // Phase 1: Simulate payment gateway integration
      const paymentMethod = PAYMENT_METHODS.find(p => p.id === depositData.paymentMethod)

      // Generate transaction ID
      const txId = `DEP${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      setTransactionId(txId)

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate payment gateway response (stub for Phase 1)
      const paymentResult = await simulatePaymentGateway({
        transactionId: txId,
        amount: depositData.amount,
        paymentMethod: depositData.paymentMethod,
        accountId: depositData.accountId
      })

      if (paymentResult.success) {
        // In real implementation, this would be handled by webhook
        await recordDeposit(txId, paymentResult)
        setCurrentStep('success')
        toast.success('Setoran berhasil diproses!')
      } else {
        throw new Error(paymentResult.message || 'Pembayaran gagal')
      }

    } catch (error: any) {
      console.error('Error processing deposit:', error)
      toast.error(error.message || 'Gagal memproses setoran')
      setCurrentStep('confirmation')
    } finally {
      setSubmitting(false)
    }
  }

  // Phase 1: Payment gateway stub
  const simulatePaymentGateway = async (data: any) => {
    // Simulate different payment scenarios
    const scenarios = [
      { success: true, message: 'Payment successful' },
      { success: false, message: 'Insufficient balance' },
      { success: false, message: 'Payment gateway timeout' }
    ]

    // For demo purposes, always return success
    return scenarios[0]
  }

  const recordDeposit = async (transactionId: string, paymentResult: any) => {
    try {
      // Get member ID
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (memberError) throw memberError

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          member_id: memberData.id,
          account_id: parseInt(depositData.accountId),
          type: 'deposit',
          amount: depositData.amount,
          description: `Setoran ${selectedAccount?.account_type} - ${depositData.paymentMethod}`,
          status: 'completed',
          reference_id: transactionId,
          notes: depositData.notes || null
        })

      if (transactionError) throw transactionError

      // Update account balance
      const { error: balanceError } = await supabase
        .from('savings_accounts')
        .update({
          balance: selectedAccount!.balance + depositData.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(depositData.accountId))

      if (balanceError) throw balanceError

    } catch (error) {
      console.error('Error recording deposit:', error)
      throw error
    }
  }

  const handleAccountSelect = (accountId: string) => {
    const account = savingsAccounts.find(acc => acc.id.toString() === accountId)
    setSelectedAccount(account || null)
    setDepositData(prev => ({ ...prev, accountId }))
    setErrors(prev => ({ ...prev, accountId: '' }))
  }

  const getSelectedPaymentMethod = () => {
    return PAYMENT_METHODS.find(p => p.id === depositData.paymentMethod)
  }

  const getTotalAmount = () => {
    const paymentMethod = getSelectedPaymentMethod()
    return depositData.amount + (paymentMethod?.fee || 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat data rekening...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Setor Simpanan</h1>
            <p className="text-neutral-600">Tambah saldo ke rekening simpanan Anda</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[
            { key: 'amount', label: 'Jumlah', icon: Wallet },
            { key: 'payment', label: 'Pembayaran', icon: CreditCard },
            { key: 'confirmation', label: 'Konfirmasi', icon: CheckCircle }
          ].map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.key
            const isCompleted = ['amount', 'payment'].indexOf(currentStep) > ['amount', 'payment'].indexOf(step.key)

            return (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  isCompleted ? 'bg-success-600 text-white' :
                  isActive ? 'bg-primary-600 text-white' :
                  'bg-neutral-200 text-neutral-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-primary-600' : 'text-neutral-500'
                }`}>
                  {step.label}
                </span>
                {index < 2 && (
                  <ChevronRight className="h-4 w-4 text-neutral-400 mx-4" />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="card">
          {/* Step 1: Amount */}
          {currentStep === 'amount' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">Pilih Rekening & Jumlah</h2>
              </div>

              {savingsAccounts.length === 0 ? (
                <div className="text-center py-12">
                  <PiggyBank className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Belum Ada Rekening Simpanan
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    Buka rekening simpanan terlebih dahulu untuk mulai menabung
                  </p>
                  <Link href="/savings/accounts/new" className="btn-primary">
                    Buka Rekening Baru
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Account Selection */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Pilih Rekening Simpanan
                    </label>
                    <div className="space-y-3">
                      {savingsAccounts.map((account) => {
                        const typeInfo = SAVINGS_TYPES[account.account_type as keyof typeof SAVINGS_TYPES]
                        const isSelected = depositData.accountId === account.id.toString()

                        return (
                          <div
                            key={account.id}
                            onClick={() => handleAccountSelect(account.id.toString())}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.bgColor}`}>
                                  <Target className={`h-5 w-5 ${typeInfo.color}`} />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-neutral-900">{typeInfo.name}</h3>
                                  <p className="text-sm text-neutral-600">No. {account.account_number}</p>
                                  <p className="text-xs text-neutral-500">
                                    Bunga {account.interest_rate}% per tahun
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-neutral-900">
                                  {showBalance ? formatCurrency(account.balance) : '****'}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowBalance(!showBalance)
                                  }}
                                  className="text-xs text-neutral-500 hover:text-neutral-700"
                                >
                                  {showBalance ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {errors.accountId && (
                      <p className="text-sm text-error-600 mt-2">{errors.accountId}</p>
                    )}
                  </div>

                  {/* Amount Input */}
                  {selectedAccount && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Jumlah Setoran
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                          Rp
                        </span>
                        <input
                          type="number"
                          value={depositData.amount || ''}
                          onChange={(e) => {
                            const amount = parseFloat(e.target.value) || 0
                            setDepositData(prev => ({ ...prev, amount }))
                            setErrors(prev => ({ ...prev, amount: '' }))
                          }}
                          placeholder="0"
                          className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.amount ? 'border-error-300' : 'border-neutral-300'
                          }`}
                        />
                      </div>
                      {errors.amount && (
                        <p className="text-sm text-error-600 mt-2">{errors.amount}</p>
                      )}

                      {/* Amount Info */}
                      {selectedAccount && (
                        <div className="mt-3 p-3 bg-info-50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-info-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-info-700">
                              <p className="font-medium mb-1">Informasi Setoran</p>
                              <ul className="space-y-1 text-xs">
                                <li>• Minimal: {formatCurrency(SAVINGS_TYPES[selectedAccount.account_type as keyof typeof SAVINGS_TYPES].minDeposit)}</li>
                                <li>• Maksimal: {formatCurrency(SAVINGS_TYPES[selectedAccount.account_type as keyof typeof SAVINGS_TYPES].maxDeposit)}</li>
                                <li>• Bunga: {selectedAccount.interest_rate}% per tahun</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quick Amount Buttons */}
                      <div className="mt-4">
                        <p className="text-sm font-medium text-neutral-700 mb-2">Jumlah Cepat</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[100000, 500000, 1000000].map((amount) => (
                            <button
                              key={amount}
                              onClick={() => {
                                setDepositData(prev => ({ ...prev, amount }))
                                setErrors(prev => ({ ...prev, amount: '' }))
                              }}
                              className="py-2 px-3 text-sm border border-neutral-300 rounded-lg hover:border-primary-500 hover:text-primary-600 transition-colors"
                            >
                              {formatCurrency(amount)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Catatan (Opsional)
                    </label>
                    <textarea
                      value={depositData.notes}
                      onChange={(e) => setDepositData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Tambahkan catatan untuk setoran ini..."
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleAmountSubmit}
                    disabled={!selectedAccount || !depositData.amount}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lanjutkan ke Pembayaran
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Payment Method */}
          {currentStep === 'payment' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">Pilih Metode Pembayaran</h2>
              </div>

              <div className="space-y-6">
                {/* Amount Summary */}
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Jumlah Setoran</span>
                    <span className="font-semibold text-neutral-900">
                      {formatCurrency(depositData.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-neutral-500 mt-1">
                    <span>Ke {selectedAccount?.account_number}</span>
                    <span>{SAVINGS_TYPES[selectedAccount?.account_type as keyof typeof SAVINGS_TYPES]?.name}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Metode Pembayaran
                  </label>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.filter(method => method.isAvailable).map((method) => {
                      const Icon = method.icon
                      const isSelected = depositData.paymentMethod === method.id

                      return (
                        <div
                          key={method.id}
                          onClick={() => {
                            setDepositData(prev => ({ ...prev, paymentMethod: method.id }))
                            setErrors(prev => ({ ...prev, paymentMethod: '' }))
                          }}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method.bgColor}`}>
                                <Icon className={`h-5 w-5 ${method.color}`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-neutral-900">{method.name}</h3>
                                <p className="text-sm text-neutral-600">{method.description}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-neutral-500">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    {method.processingTime}
                                  </span>
                                  {method.fee > 0 && (
                                    <span className="text-xs text-warning-600">
                                      Biaya: {formatCurrency(method.fee)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {method.fee === 0 && (
                              <span className="text-xs bg-success-100 text-success-600 px-2 py-1 rounded-full">
                                Gratis
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-sm text-error-600 mt-2">{errors.paymentMethod}</p>
                  )}
                </div>

                {/* Total Amount */}
                {depositData.paymentMethod && (
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Total Pembayaran</span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatCurrency(getTotalAmount())}
                      </span>
                    </div>
                    {getSelectedPaymentMethod()?.fee! > 0 && (
                      <div className="flex justify-between items-center text-sm text-neutral-500 mt-1">
                        <span>Termasuk biaya administrasi</span>
                        <span>{formatCurrency(getSelectedPaymentMethod()?.fee!)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep('amount')}
                    className="flex-1 btn-outline"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handlePaymentSubmit}
                    disabled={!depositData.paymentMethod}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lanjutkan
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 'confirmation' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">Konfirmasi Setoran</h2>
              </div>

              <div className="space-y-6">
                {/* Transaction Summary */}
                <div className="bg-neutral-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-neutral-900 mb-4">Detail Transaksi</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Rekening Tujuan</span>
                      <div className="text-right">
                        <p className="font-medium text-neutral-900">
                          {SAVINGS_TYPES[selectedAccount?.account_type as keyof typeof SAVINGS_TYPES]?.name}
                        </p>
                        <p className="text-sm text-neutral-500">{selectedAccount?.account_number}</p>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-600">Jumlah Setoran</span>
                      <span className="font-semibold text-neutral-900">
                        {formatCurrency(depositData.amount)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-600">Metode Pembayaran</span>
                      <span className="font-medium text-neutral-900">
                        {getSelectedPaymentMethod()?.name}
                      </span>
                    </div>

                    {getSelectedPaymentMethod()?.fee! > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Biaya Admin</span>
                        <span className="font-medium text-neutral-900">
                          {formatCurrency(getSelectedPaymentMethod()?.fee!)}
                        </span>
                      </div>
                    )}

                    {depositData.notes && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Catatan</span>
                        <span className="font-medium text-neutral-900 text-right max-w-48">
                          {depositData.notes}
                        </span>
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-neutral-900">Total Pembayaran</span>
                        <span className="text-xl font-bold text-primary-600">
                          {formatCurrency(getTotalAmount())}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-info-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-info-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-info-700">
                      <p className="font-medium mb-1">Keamanan Transaksi</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Transaksi dienkripsi dengan SSL 256-bit</li>
                        <li>• Data Anda dilindungi sistem keamanan berlapis</li>
                        <li>• Notifikasi real-time untuk setiap transaksi</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep('payment')}
                    className="flex-1 btn-outline"
                    disabled={submitting}
                  >
                    Ubah Pembayaran
                  </button>
                  <button
                    onClick={processDeposit}
                    disabled={submitting}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Konfirmasi Setoran
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {currentStep === 'processing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Memproses Setoran
              </h3>
              <p className="text-neutral-600 mb-4">
                Mohon tunggu, transaksi sedang diproses oleh sistem pembayaran
              </p>
              <div className="bg-warning-50 p-3 rounded-lg inline-block">
                <p className="text-sm text-warning-700">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Jangan menutup halaman ini
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {currentStep === 'success' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Setoran Berhasil!
              </h3>
              <p className="text-neutral-600 mb-6">
                Setoran Anda sebesar {formatCurrency(depositData.amount)} telah berhasil diproses
              </p>

              <div className="bg-neutral-50 p-4 rounded-lg mb-6 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="h-4 w-4 text-neutral-600" />
                  <span className="font-medium text-neutral-900">Detail Transaksi</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">ID Transaksi</span>
                    <span className="font-mono text-neutral-900">{transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Waktu</span>
                    <span className="text-neutral-900">
                      {new Date().toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Status</span>
                    <span className="text-success-600 font-medium">Berhasil</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link href="/savings/history" className="flex-1 btn-outline">
                  Lihat Riwayat
                </Link>
                <Link href="/savings/dashboard" className="flex-1 btn-primary">
                  Kembali ke Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}