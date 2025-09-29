'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useAudit } from '@/components/providers/audit-provider'
import { useSupabase } from '@/components/providers/supabase-provider'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { AccessDenied } from '@/components/ui/access-denied'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// Types
interface SavingsAccount {
  id: string
  account_number: string
  member_id: string
  member_full_name: string
  member_number: string
  savings_type_id: string
  savings_type_name: string
  savings_type_code: string
  is_mandatory: boolean
  is_withdrawable: boolean
  balance: number
  status: 'active' | 'frozen' | 'closed'
  opened_at: string
  closed_at?: string
  created_at: string
  updated_at: string
}

interface PendingTransaction {
  id: string
  reference_number: string
  member_id: string
  member_full_name: string
  member_number: string
  savings_account_id: string
  account_number: string
  savings_type_name: string
  transaction_type: string
  transaction_category: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest' | 'bonus'
  amount: number
  description: string
  payment_method: string
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  created_at: string
}

interface SavingsFilters {
  search: string
  savingsType: string
  status: string
  dateFrom: string
  dateTo: string
  balanceMin: string
  balanceMax: string
}

interface ManualAdjustment {
  account_id: string
  amount: number
  type: 'debit' | 'credit'
  description: string
  reference: string
}

export default function SavingsPage() {
  const { hasPermission } = useAuth()
  const { logEvent } = useAudit()
  const { supabase } = useSupabase()

  // State
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([])
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<SavingsAccount[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [activeTab, setActiveTab] = useState<'accounts' | 'pending' | 'adjustments' | 'bulk'>('accounts')

  // Manual adjustment state
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [adjustmentForm, setAdjustmentForm] = useState<ManualAdjustment>({
    account_id: '',
    amount: 0,
    type: 'credit',
    description: '',
    reference: ''
  })

  // Bulk processing state
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkProcessingType, setBulkProcessingType] = useState<'mandatory' | 'interest'>('mandatory')
  const [bulkAmount, setBulkAmount] = useState<number>(25000) // Default mandatory savings
  const [bulkProcessingProgress, setBulkProcessingProgress] = useState(0)

  // Filters
  const [filters, setFilters] = useState<SavingsFilters>({
    search: '',
    savingsType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    balanceMin: '',
    balanceMax: '',
  })

  // Check permissions
  const canViewSavings = hasPermission('savings.read')
  const canUpdateSavings = hasPermission('savings.update')
  const canProcessTransactions = hasPermission('transactions.process')
  const canManualAdjustment = hasPermission('savings.adjust')
  const canBulkProcess = hasPermission('savings.bulk_process')

  // Calculate metrics
  const savingsMetrics = useMemo(() => {
    const totalBalance = savingsAccounts.reduce((sum, account) => sum + account.balance, 0)
    const activeAccounts = savingsAccounts.filter(acc => acc.status === 'active').length
    const mandatoryBalance = savingsAccounts
      .filter(acc => acc.is_mandatory && acc.status === 'active')
      .reduce((sum, account) => sum + account.balance, 0)
    const voluntaryBalance = savingsAccounts
      .filter(acc => !acc.is_mandatory && acc.status === 'active')
      .reduce((sum, account) => sum + account.balance, 0)

    return {
      totalBalance,
      activeAccounts,
      mandatoryBalance,
      voluntaryBalance,
      pendingCount: pendingTransactions.length,
      pendingAmount: pendingTransactions
        .filter(tx => tx.payment_status === 'pending')
        .reduce((sum, tx) => sum + tx.amount, 0)
    }
  }, [savingsAccounts, pendingTransactions])

  // Fetch savings accounts
  const fetchSavingsAccounts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('savings_accounts')
        .select(`
          *,
          members!inner(id, full_name, member_number),
          savings_types!inner(id, name, code, is_mandatory, is_withdrawable)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedAccounts = data.map((account: any) => ({
        id: account.id,
        account_number: account.account_number,
        member_id: account.member_id,
        member_full_name: account.members.full_name,
        member_number: account.members.member_number,
        savings_type_id: account.savings_type_id,
        savings_type_name: account.savings_types.name,
        savings_type_code: account.savings_types.code,
        is_mandatory: account.savings_types.is_mandatory,
        is_withdrawable: account.savings_types.is_withdrawable,
        balance: account.balance,
        status: account.status,
        opened_at: account.opened_at,
        closed_at: account.closed_at,
        created_at: account.created_at,
        updated_at: account.updated_at,
      }))

      setSavingsAccounts(processedAccounts)

      await logEvent({
        event_type: 'admin.view',
        target_type: 'savings_accounts',
        target_id: 'all',
        action_details: {
          total_accounts: processedAccounts.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'low',
      })

    } catch (error) {
      console.error('Error fetching savings accounts:', error)
      setError('Gagal memuat data rekening simpanan')
      toast.error('Gagal memuat data rekening simpanan')
    } finally {
      setLoading(false)
    }
  }, [supabase, logEvent])

  // Fetch pending transactions
  const fetchPendingTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          members!inner(id, full_name, member_number),
          savings_accounts!inner(id, account_number, savings_types!inner(name)),
          transaction_types!inner(name, category)
        `)
        .in('payment_status', ['pending', 'processing'])
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedTransactions = data.map((tx: any) => ({
        id: tx.id,
        reference_number: tx.reference_number,
        member_id: tx.member_id,
        member_full_name: tx.members.full_name,
        member_number: tx.members.member_number,
        savings_account_id: tx.savings_account_id,
        account_number: tx.savings_accounts?.account_number || '',
        savings_type_name: tx.savings_accounts?.savings_types?.name || '',
        transaction_type: tx.transaction_types.name,
        transaction_category: tx.transaction_types.category,
        amount: tx.amount,
        description: tx.description,
        payment_method: tx.payment_method,
        payment_status: tx.payment_status,
        created_at: tx.created_at,
      }))

      setPendingTransactions(processedTransactions)

    } catch (error) {
      console.error('Error fetching pending transactions:', error)
      toast.error('Gagal memuat transaksi tertunda')
    }
  }, [supabase])

  // Filter accounts
  useEffect(() => {
    let filtered = [...savingsAccounts]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(account =>
        account.member_full_name.toLowerCase().includes(searchLower) ||
        account.member_number.toLowerCase().includes(searchLower) ||
        account.account_number.toLowerCase().includes(searchLower) ||
        account.savings_type_name.toLowerCase().includes(searchLower)
      )
    }

    if (filters.savingsType) {
      filtered = filtered.filter(account => account.savings_type_id === filters.savingsType)
    }

    if (filters.status) {
      filtered = filtered.filter(account => account.status === filters.status)
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(account =>
        new Date(account.opened_at) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(account =>
        new Date(account.opened_at) <= new Date(filters.dateTo)
      )
    }

    if (filters.balanceMin) {
      filtered = filtered.filter(account => account.balance >= parseFloat(filters.balanceMin))
    }

    if (filters.balanceMax) {
      filtered = filtered.filter(account => account.balance <= parseFloat(filters.balanceMax))
    }

    setFilteredAccounts(filtered)
    setCurrentPage(1)
  }, [savingsAccounts, filters])

  // Pagination
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAccounts, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage)

  // Handle transaction approval/rejection
  const handleTransactionAction = async (transactionIds: string[], action: 'approve' | 'reject') => {
    if (!canProcessTransactions) return

    try {
      const status = action === 'approve' ? 'completed' : 'cancelled'

      const { error } = await supabase
        .from('transactions')
        .update({
          payment_status: status,
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .in('id', transactionIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.transaction_process',
        target_type: 'transactions',
        target_id: transactionIds.join(','),
        action_details: {
          action,
          count: transactionIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil ${action === 'approve' ? 'menyetujui' : 'menolak'} ${transactionIds.length} transaksi`)
      fetchPendingTransactions()
      fetchSavingsAccounts()
      setSelectedTransactions([])
    } catch (error) {
      console.error(`Error ${action}ing transactions:`, error)
      toast.error(`Gagal ${action === 'approve' ? 'menyetujui' : 'menolak'} transaksi`)
    }
  }

  // Handle manual adjustment
  const handleManualAdjustment = async () => {
    if (!canManualAdjustment || !adjustmentForm.account_id) return

    try {
      const account = savingsAccounts.find(acc => acc.id === adjustmentForm.account_id)
      if (!account) throw new Error('Rekening tidak ditemukan')

      const newBalance = adjustmentForm.type === 'credit'
        ? account.balance + adjustmentForm.amount
        : account.balance - adjustmentForm.amount

      if (newBalance < 0) {
        toast.error('Saldo tidak boleh negatif')
        return
      }

      // Create adjustment transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          member_id: account.member_id,
          savings_account_id: account.id,
          transaction_type_id: adjustmentForm.type === 'credit' ? 'adjustment-credit' : 'adjustment-debit',
          reference_number: adjustmentForm.reference || `ADJ-${Date.now()}`,
          amount: adjustmentForm.amount,
          balance_before: account.balance,
          balance_after: newBalance,
          description: adjustmentForm.description,
          payment_status: 'completed',
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id
        })

      if (txError) throw txError

      // Update account balance
      const { error: balanceError } = await supabase
        .from('savings_accounts')
        .update({ balance: newBalance })
        .eq('id', account.id)

      if (balanceError) throw balanceError

      await logEvent({
        event_type: 'admin.manual_adjustment',
        target_type: 'savings_account',
        target_id: account.id,
        action_details: {
          type: adjustmentForm.type,
          amount: adjustmentForm.amount,
          balance_before: account.balance,
          balance_after: newBalance,
          reference: adjustmentForm.reference,
          timestamp: new Date().toISOString(),
        },
        severity: 'high',
      })

      toast.success('Penyesuaian manual berhasil')
      setShowAdjustmentModal(false)
      setAdjustmentForm({
        account_id: '',
        amount: 0,
        type: 'credit',
        description: '',
        reference: ''
      })
      fetchSavingsAccounts()
    } catch (error) {
      console.error('Error processing manual adjustment:', error)
      toast.error('Gagal melakukan penyesuaian manual')
    }
  }

  // Handle bulk processing for mandatory savings
  const handleBulkMandatorySavings = async () => {
    if (!canBulkProcess) return

    try {
      setBulkProcessingProgress(0)

      const activeMembers = await supabase
        .from('members')
        .select('id, member_number, full_name')
        .eq('membership_status', 'active')

      if (activeMembers.error) throw activeMembers.error

      const mandatorySavingsType = await supabase
        .from('savings_types')
        .select('id')
        .eq('code', 'WAJIB')
        .single()

      if (mandatorySavingsType.error) throw mandatorySavingsType.error

      const totalMembers = activeMembers.data.length
      let processedCount = 0

      for (const member of activeMembers.data) {
        try {
          // Get or create mandatory savings account
          let { data: account } = await supabase
            .from('savings_accounts')
            .select('id, balance')
            .eq('member_id', member.id)
            .eq('savings_type_id', mandatorySavingsType.data.id)
            .single()

          if (!account) {
            // Create new mandatory savings account
            const { data: newAccount, error: createError } = await supabase
              .from('savings_accounts')
              .insert({
                member_id: member.id,
                savings_type_id: mandatorySavingsType.data.id,
                account_number: `SA-${new Date().getFullYear()}-${member.member_number}`,
                balance: 0
              })
              .select('id, balance')
              .single()

            if (createError) throw createError
            account = newAccount
          }

          // Create deposit transaction
          const newBalance = account.balance + bulkAmount

          await supabase
            .from('transactions')
            .insert({
              member_id: member.id,
              savings_account_id: account.id,
              transaction_type_id: 'mandatory-deposit',
              reference_number: `BULK-${format(new Date(), 'yyyyMM')}-${member.member_number}`,
              amount: bulkAmount,
              balance_before: account.balance,
              balance_after: newBalance,
              description: `Simpanan wajib bulan ${format(new Date(), 'MMMM yyyy', { locale: id })}`,
              payment_status: 'completed',
              processed_at: new Date().toISOString(),
              processed_by: (await supabase.auth.getUser()).data.user?.id
            })

          // Update account balance
          await supabase
            .from('savings_accounts')
            .update({ balance: newBalance })
            .eq('id', account.id)

          processedCount++
          setBulkProcessingProgress((processedCount / totalMembers) * 100)

        } catch (memberError) {
          console.error(`Error processing member ${member.member_number}:`, memberError)
        }
      }

      await logEvent({
        event_type: 'admin.bulk_process',
        target_type: 'mandatory_savings',
        target_id: 'all',
        action_details: {
          type: 'mandatory_savings',
          amount: bulkAmount,
          processed_count: processedCount,
          total_count: totalMembers,
          timestamp: new Date().toISOString(),
        },
        severity: 'high',
      })

      toast.success(`Berhasil memproses simpanan wajib untuk ${processedCount} anggota`)
      setShowBulkModal(false)
      setBulkProcessingProgress(0)
      fetchSavingsAccounts()
    } catch (error) {
      console.error('Error processing bulk mandatory savings:', error)
      toast.error('Gagal memproses simpanan wajib massal')
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (canViewSavings) {
      fetchSavingsAccounts()
      fetchPendingTransactions()
    }
  }, [canViewSavings, fetchSavingsAccounts, fetchPendingTransactions])

  // Access control
  if (!canViewSavings) {
    return (
      <AccessDenied
        title="Akses Ditolak"
        message="Anda tidak memiliki hak akses untuk melihat data simpanan."
        showContactInfo={true}
      />
    )
  }

  if (loading) {
    return <LoadingScreen message="Memuat data simpanan..." showProgress />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Gagal Memuat Data
          </h3>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={fetchSavingsAccounts}
            className="admin-btn admin-btn-primary"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Administrasi Simpanan</h1>
          <p className="text-neutral-600">
            Kelola rekening simpanan, transaksi tertunda, dan penyesuaian manual
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {canManualAdjustment && (
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="admin-btn admin-btn-secondary"
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              Penyesuaian Manual
            </button>
          )}
          {canBulkProcess && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="admin-btn admin-btn-primary"
            >
              <CalendarDaysIcon className="h-5 w-5 mr-2" />
              Proses Massal
            </button>
          )}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Saldo</p>
              <p className="text-xl font-semibold text-neutral-900">
                {savingsMetrics.totalBalance.toLocaleString('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Rekening Aktif</p>
              <p className="text-xl font-semibold text-neutral-900">
                {savingsMetrics.activeAccounts.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Simpanan Wajib</p>
              <p className="text-xl font-semibold text-neutral-900">
                {savingsMetrics.mandatoryBalance.toLocaleString('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Simpanan Sukarela</p>
              <p className="text-xl font-semibold text-neutral-900">
                {savingsMetrics.voluntaryBalance.toLocaleString('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="metric-card metric-card-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Transaksi Tertunda</p>
              <p className="text-xl font-semibold text-neutral-900">
                {savingsMetrics.pendingCount.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="metric-card metric-card-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Nilai Tertunda</p>
              <p className="text-xl font-semibold text-neutral-900">
                {savingsMetrics.pendingAmount.toLocaleString('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowUpIcon className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-card">
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'accounts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Rekening Simpanan ({filteredAccounts.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Transaksi Tertunda ({pendingTransactions.length})
            </button>
          </nav>
        </div>

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="p-6 space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Cari rekening (anggota, nomor rekening, jenis simpanan)..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="admin-form-input pl-10"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="admin-btn admin-btn-secondary"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filter
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Jenis Simpanan</label>
                    <select
                      value={filters.savingsType}
                      onChange={(e) => setFilters(prev => ({ ...prev, savingsType: e.target.value }))}
                      className="admin-form-input"
                    >
                      <option value="">Semua Jenis</option>
                      <option value="mandatory">Simpanan Wajib</option>
                      <option value="voluntary">Simpanan Sukarela</option>
                      <option value="time_deposit">Simpanan Berjangka</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="admin-form-input"
                    >
                      <option value="">Semua Status</option>
                      <option value="active">Aktif</option>
                      <option value="frozen">Dibekukan</option>
                      <option value="closed">Ditutup</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Saldo Minimum</label>
                    <input
                      type="number"
                      value={filters.balanceMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, balanceMin: e.target.value }))}
                      className="admin-form-input"
                      placeholder="0"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Saldo Maksimum</label>
                    <input
                      type="number"
                      value={filters.balanceMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, balanceMax: e.target.value }))}
                      className="admin-form-input"
                      placeholder="Tidak terbatas"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Accounts Table */}
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th>Anggota</th>
                    <th>Nomor Rekening</th>
                    <th>Jenis Simpanan</th>
                    <th>Saldo</th>
                    <th>Status</th>
                    <th>Dibuka</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAccounts.map((account) => (
                    <tr key={account.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.id)}
                          onChange={() => {
                            setSelectedAccounts(prev =>
                              prev.includes(account.id)
                                ? prev.filter(id => id !== account.id)
                                : [...prev, account.id]
                            )
                          }}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {account.member_full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">{account.member_full_name}</div>
                            <div className="text-sm text-neutral-500">{account.member_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{account.account_number}</td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <span className={`status-indicator ${account.is_mandatory ? 'status-warning' : 'status-info'}`}>
                            {account.savings_type_name}
                          </span>
                          {account.is_mandatory && (
                            <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" title="Simpanan Wajib" />
                          )}
                        </div>
                      </td>
                      <td className="font-medium">
                        {account.balance.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td>
                        <span className={`status-indicator ${
                          account.status === 'active' ? 'status-success' :
                          account.status === 'frozen' ? 'status-warning' : 'status-error'
                        }`}>
                          {account.status === 'active' && 'Aktif'}
                          {account.status === 'frozen' && 'Dibekukan'}
                          {account.status === 'closed' && 'Ditutup'}
                        </span>
                      </td>
                      <td className="text-sm">
                        {format(new Date(account.opened_at), 'dd MMM yyyy', { locale: id })}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setAdjustmentForm(prev => ({ ...prev, account_id: account.id }))
                              setShowAdjustmentModal(true)
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-600"
                            title="Penyesuaian"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 text-neutral-400 hover:text-neutral-600"
                            title="Lihat Detail"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 text-neutral-400 hover:text-neutral-600"
                            title="Aksi Lainnya"
                          >
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-neutral-700">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAccounts.length)} dari {filteredAccounts.length} rekening
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="admin-btn admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-sm text-neutral-700">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="admin-btn admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Transactions Tab */}
        {activeTab === 'pending' && (
          <div className="p-6 space-y-6">
            {/* Bulk Actions for Transactions */}
            {selectedTransactions.length > 0 && (
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                <span className="text-sm font-medium text-blue-900">
                  {selectedTransactions.length} transaksi dipilih
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTransactionAction(selectedTransactions, 'approve')}
                    className="admin-btn admin-btn-success"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Setujui
                  </button>
                  <button
                    onClick={() => handleTransactionAction(selectedTransactions, 'reject')}
                    className="admin-btn admin-btn-danger"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Tolak
                  </button>
                </div>
              </div>
            )}

            {/* Pending Transactions Table */}
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th>Referensi</th>
                    <th>Anggota</th>
                    <th>Jenis Transaksi</th>
                    <th>Jumlah</th>
                    <th>Metode Pembayaran</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(transaction.id)}
                          onChange={() => {
                            setSelectedTransactions(prev =>
                              prev.includes(transaction.id)
                                ? prev.filter(id => id !== transaction.id)
                                : [...prev, transaction.id]
                            )
                          }}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="font-mono text-sm">{transaction.reference_number}</td>
                      <td>
                        <div>
                          <div className="font-medium text-neutral-900">{transaction.member_full_name}</div>
                          <div className="text-sm text-neutral-500">{transaction.member_number}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-medium">{transaction.transaction_type}</div>
                          <div className="text-sm text-neutral-500">{transaction.savings_type_name}</div>
                        </div>
                      </td>
                      <td className="font-medium">
                        <div className={`flex items-center ${
                          transaction.transaction_category === 'deposit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.transaction_category === 'deposit' ? (
                            <ArrowUpIcon className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4 mr-1" />
                          )}
                          {transaction.amount.toLocaleString('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          })}
                        </div>
                      </td>
                      <td>
                        <span className="status-indicator status-info">
                          {transaction.payment_method}
                        </span>
                      </td>
                      <td>
                        <span className={`status-indicator ${
                          transaction.payment_status === 'pending' ? 'status-warning' : 'status-info'
                        }`}>
                          {transaction.payment_status === 'pending' && 'Tertunda'}
                          {transaction.payment_status === 'processing' && 'Diproses'}
                        </span>
                      </td>
                      <td className="text-sm">
                        {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTransactionAction([transaction.id], 'approve')}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Setujui"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTransactionAction([transaction.id], 'reject')}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Tolak"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 text-neutral-400 hover:text-neutral-600"
                            title="Lihat Detail"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pendingTransactions.length === 0 && (
              <div className="text-center py-12">
                <ClockIcon className="mx-auto h-12 w-12 text-neutral-400" />
                <h3 className="mt-2 text-sm font-medium text-neutral-900">Tidak ada transaksi tertunda</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Semua transaksi telah diproses.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Penyesuaian Manual Saldo
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleManualAdjustment(); }} className="space-y-4">
              <div className="admin-form-group">
                <label className="admin-form-label">Rekening</label>
                <select
                  value={adjustmentForm.account_id}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, account_id: e.target.value }))}
                  className="admin-form-input"
                  required
                >
                  <option value="">Pilih Rekening</option>
                  {savingsAccounts.filter(acc => acc.status === 'active').map(account => (
                    <option key={account.id} value={account.id}>
                      {account.member_full_name} - {account.savings_type_name} ({account.account_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Jenis Penyesuaian</label>
                <select
                  value={adjustmentForm.type}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, type: e.target.value as 'debit' | 'credit' }))}
                  className="admin-form-input"
                >
                  <option value="credit">Kredit (Tambah Saldo)</option>
                  <option value="debit">Debit (Kurangi Saldo)</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Jumlah</label>
                <input
                  type="number"
                  value={adjustmentForm.amount}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="admin-form-input"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Referensi</label>
                <input
                  type="text"
                  value={adjustmentForm.reference}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reference: e.target.value }))}
                  className="admin-form-input"
                  placeholder="Nomor referensi (opsional)"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Keterangan</label>
                <textarea
                  value={adjustmentForm.description}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, description: e.target.value }))}
                  className="admin-form-input"
                  rows={3}
                  placeholder="Alasan penyesuaian"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="admin-btn admin-btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                >
                  Proses Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Processing Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Proses Simpanan Massal
            </h3>
            <div className="space-y-4">
              <div className="admin-form-group">
                <label className="admin-form-label">Jenis Proses</label>
                <select
                  value={bulkProcessingType}
                  onChange={(e) => setBulkProcessingType(e.target.value as 'mandatory' | 'interest')}
                  className="admin-form-input"
                >
                  <option value="mandatory">Simpanan Wajib Bulanan</option>
                  <option value="interest">Perhitungan Bunga</option>
                </select>
              </div>

              {bulkProcessingType === 'mandatory' && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Jumlah Simpanan Wajib</label>
                  <input
                    type="number"
                    value={bulkAmount}
                    onChange={(e) => setBulkAmount(parseFloat(e.target.value) || 0)}
                    className="admin-form-input"
                    min="0"
                    step="1000"
                  />
                  <p className="text-sm text-neutral-500 mt-1">
                    Jumlah akan ditambahkan ke rekening simpanan wajib semua anggota aktif
                  </p>
                </div>
              )}

              {bulkProcessingProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{bulkProcessingProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${bulkProcessingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false)
                    setBulkProcessingProgress(0)
                  }}
                  className="admin-btn admin-btn-secondary"
                  disabled={bulkProcessingProgress > 0 && bulkProcessingProgress < 100}
                >
                  Batal
                </button>
                <button
                  onClick={handleBulkMandatorySavings}
                  className="admin-btn admin-btn-primary"
                  disabled={bulkProcessingProgress > 0 && bulkProcessingProgress < 100}
                >
                  {bulkProcessingProgress > 0 ? 'Memproses...' : 'Mulai Proses'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}