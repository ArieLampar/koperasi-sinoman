'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Search, Filter, Download, Calendar, Eye, Receipt,
  ArrowUpCircle, ArrowDownCircle, TrendingUp, DollarSign,
  FileText, X, ChevronDown, ChevronRight, Printer, Share2,
  Clock, CheckCircle, AlertCircle, RefreshCw, Target, PiggyBank,
  Shield, Building, CreditCard, Smartphone, QrCode, Banknote,
  ExternalLink, Copy, Mail, MessageSquare, Sliders, MoreVertical
} from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

interface Transaction {
  id: number
  member_id: number
  account_id: number
  type: 'deposit' | 'withdrawal' | 'interest' | 'fee' | 'transfer'
  amount: number
  description: string
  balance_after: number
  created_at: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  reference_id?: string
  notes?: string
  fee?: number
  payment_method?: string
  account?: {
    id: number
    account_number: string
    account_type: 'pokok' | 'wajib' | 'sukarela' | 'berjangka'
    balance: number
  }
}

interface TransactionFilters {
  accountType: string
  transactionType: string
  status: string
  dateFrom: string
  dateTo: string
  search: string
}

interface DateRange {
  label: string
  value: string
  from: Date
  to: Date
}

const SAVINGS_TYPES = {
  pokok: {
    name: 'Simpanan Pokok',
    icon: Shield,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  wajib: {
    name: 'Simpanan Wajib',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  sukarela: {
    name: 'Simpanan Sukarela',
    icon: PiggyBank,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  berjangka: {
    name: 'Simpanan Berjangka',
    icon: Clock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  }
}

const TRANSACTION_TYPES = {
  deposit: {
    name: 'Setoran',
    icon: ArrowUpCircle,
    color: 'text-success-600',
    bgColor: 'bg-success-100'
  },
  withdrawal: {
    name: 'Penarikan',
    icon: ArrowDownCircle,
    color: 'text-error-600',
    bgColor: 'bg-error-100'
  },
  interest: {
    name: 'Bunga',
    icon: TrendingUp,
    color: 'text-info-600',
    bgColor: 'bg-info-100'
  },
  fee: {
    name: 'Biaya',
    icon: DollarSign,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100'
  },
  transfer: {
    name: 'Transfer',
    icon: ExternalLink,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  }
}

const PAYMENT_METHODS = {
  bank_transfer: { name: 'Transfer Bank', icon: Building },
  virtual_account: { name: 'Virtual Account', icon: CreditCard },
  e_wallet: { name: 'E-Wallet', icon: Smartphone },
  qris: { name: 'QRIS', icon: QrCode },
  cash: { name: 'Tunai', icon: Banknote }
}

const STATUS_TYPES = {
  pending: { name: 'Menunggu', color: 'text-warning-600', bgColor: 'bg-warning-100' },
  completed: { name: 'Berhasil', color: 'text-success-600', bgColor: 'bg-success-100' },
  failed: { name: 'Gagal', color: 'text-error-600', bgColor: 'bg-error-100' },
  cancelled: { name: 'Dibatalkan', color: 'text-neutral-600', bgColor: 'bg-neutral-100' }
}

export default function TransactionHistoryPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [filters, setFilters] = useState<TransactionFilters>({
    accountType: '',
    transactionType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  })

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0
  })

  // Date range presets
  const dateRanges: DateRange[] = [
    {
      label: 'Hari ini',
      value: 'today',
      from: new Date(),
      to: new Date()
    },
    {
      label: '7 hari terakhir',
      value: '7days',
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date()
    },
    {
      label: '30 hari terakhir',
      value: '30days',
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    },
    {
      label: '3 bulan terakhir',
      value: '3months',
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: new Date()
    },
    {
      label: '6 bulan terakhir',
      value: '6months',
      from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      to: new Date()
    },
    {
      label: '1 tahun terakhir',
      value: '1year',
      from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      to: new Date()
    }
  ]

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [transactions, filters])

  const fetchTransactions = async () => {
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

      // Fetch transactions with account details
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          account:savings_accounts (
            id,
            account_number,
            account_type,
            balance
          )
        `)
        .eq('member_id', memberData.id)
        .order('created_at', { ascending: false })
        .limit(1000) // Reasonable limit for client-side filtering

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
        toast.error('Gagal memuat riwayat transaksi')
      } else {
        setTransactions(transactionsData || [])
        setPagination(prev => ({ ...prev, totalItems: transactionsData?.length || 0 }))
      }

    } catch (error: any) {
      console.error('Error fetching transactions:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...transactions]

    // Filter by account type
    if (filters.accountType) {
      filtered = filtered.filter(t => t.account?.account_type === filters.accountType)
    }

    // Filter by transaction type
    if (filters.transactionType) {
      filtered = filtered.filter(t => t.type === filters.transactionType)
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status)
    }

    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(t => new Date(t.created_at) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo + 'T23:59:59')
      filtered = filtered.filter(t => new Date(t.created_at) <= toDate)
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm) ||
        t.reference_id?.toLowerCase().includes(searchTerm) ||
        t.account?.account_number.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredTransactions(filtered)
    setPagination(prev => ({ ...prev, totalItems: filtered.length, currentPage: 1 }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportTransactions = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(true)

      const dataToExport = filteredTransactions.map(t => ({
        'Tanggal': formatDate(t.created_at),
        'Waktu': formatTime(t.created_at),
        'Jenis Transaksi': TRANSACTION_TYPES[t.type as keyof typeof TRANSACTION_TYPES]?.name || t.type,
        'Deskripsi': t.description,
        'Rekening': `${SAVINGS_TYPES[t.account?.account_type as keyof typeof SAVINGS_TYPES]?.name} - ${t.account?.account_number}`,
        'Jumlah': formatCurrency(t.amount),
        'Saldo Setelah': formatCurrency(t.balance_after),
        'Status': STATUS_TYPES[t.status as keyof typeof STATUS_TYPES]?.name || t.status,
        'ID Referensi': t.reference_id || '-',
        'Catatan': t.notes || '-'
      }))

      if (format === 'csv') {
        // Generate CSV
        const headers = Object.keys(dataToExport[0] || {})
        const csvContent = [
          headers.join(','),
          ...dataToExport.map(row =>
            headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
          )
        ].join('\n')

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `riwayat-transaksi-${new Date().toISOString().split('T')[0]}.csv`
        link.click()

        toast.success('File CSV berhasil diunduh')
      } else {
        // For PDF export, you would typically use a library like jsPDF
        // For now, we'll show a message
        toast.info('Fitur export PDF akan segera hadir')
      }

    } catch (error) {
      console.error('Export error:', error)
      toast.error('Gagal mengekspor data')
    } finally {
      setExporting(false)
    }
  }

  const setDateRange = (range: DateRange) => {
    setFilters(prev => ({
      ...prev,
      dateFrom: range.from.toISOString().split('T')[0],
      dateTo: range.to.toISOString().split('T')[0]
    }))
  }

  const clearFilters = () => {
    setFilters({
      accountType: '',
      transactionType: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Disalin ke clipboard')
  }

  const shareReceipt = (transaction: Transaction) => {
    if (navigator.share) {
      navigator.share({
        title: 'Bukti Transaksi',
        text: `Transaksi ${transaction.type} sebesar ${formatCurrency(transaction.amount)} pada ${formatDate(transaction.created_at)}`,
        url: window.location.href
      })
    } else {
      copyToClipboard(`Transaksi ${transaction.type} sebesar ${formatCurrency(transaction.amount)} pada ${formatDate(transaction.created_at)}`)
    }
  }

  const printReceipt = () => {
    window.print()
  }

  const getPaginatedTransactions = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    return filteredTransactions.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat riwayat transaksi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-neutral-900">Riwayat Transaksi</h1>
            <p className="text-neutral-600">
              {filteredTransactions.length} dari {transactions.length} transaksi
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-outline flex items-center ${showFilters ? 'bg-primary-50 border-primary-300' : ''}`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>

            <div className="relative group">
              <button className="btn-outline flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-2 min-w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => exportTransactions('csv')}
                  disabled={exporting}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 disabled:opacity-50"
                >
                  Export ke CSV
                </button>
                <button
                  onClick={() => exportTransactions('pdf')}
                  disabled={exporting}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 disabled:opacity-50"
                >
                  Export ke PDF
                </button>
              </div>
            </div>

            <button
              onClick={fetchTransactions}
              disabled={loading}
              className="btn-outline flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900">Filter Transaksi</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Cari Transaksi
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="ID transaksi, deskripsi, atau nomor rekening"
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Jenis Simpanan
                </label>
                <select
                  value={filters.accountType}
                  onChange={(e) => setFilters(prev => ({ ...prev, accountType: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Semua Jenis</option>
                  {Object.entries(SAVINGS_TYPES).map(([key, type]) => (
                    <option key={key} value={key}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Jenis Transaksi
                </label>
                <select
                  value={filters.transactionType}
                  onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Semua Transaksi</option>
                  {Object.entries(TRANSACTION_TYPES).map(([key, type]) => (
                    <option key={key} value={key}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Semua Status</option>
                  {Object.entries(STATUS_TYPES).map(([key, type]) => (
                    <option key={key} value={key}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Range Presets */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Rentang Waktu Cepat
              </label>
              <div className="flex flex-wrap gap-2">
                {dateRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setDateRange(range)}
                    className="px-3 py-1 text-sm border border-neutral-300 rounded-full hover:border-primary-500 hover:text-primary-600 transition-colors"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="btn-outline text-sm"
              >
                Reset Filter
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="btn-primary text-sm"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="card">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Tidak Ada Transaksi
              </h3>
              <p className="text-neutral-600 mb-6">
                {transactions.length === 0
                  ? 'Belum ada transaksi yang tercatat'
                  : 'Tidak ada transaksi yang sesuai dengan filter'
                }
              </p>
              {transactions.length === 0 && (
                <Link href="/savings/deposit" className="btn-primary">
                  Mulai Transaksi
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-4 px-4 font-medium text-neutral-600">Tanggal</th>
                      <th className="text-left py-4 px-4 font-medium text-neutral-600">Transaksi</th>
                      <th className="text-left py-4 px-4 font-medium text-neutral-600">Rekening</th>
                      <th className="text-right py-4 px-4 font-medium text-neutral-600">Jumlah</th>
                      <th className="text-right py-4 px-4 font-medium text-neutral-600">Saldo</th>
                      <th className="text-center py-4 px-4 font-medium text-neutral-600">Status</th>
                      <th className="text-center py-4 px-4 font-medium text-neutral-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedTransactions().map((transaction) => {
                      const typeInfo = TRANSACTION_TYPES[transaction.type as keyof typeof TRANSACTION_TYPES]
                      const savingsInfo = SAVINGS_TYPES[transaction.account?.account_type as keyof typeof SAVINGS_TYPES]
                      const statusInfo = STATUS_TYPES[transaction.status as keyof typeof STATUS_TYPES]
                      const TypeIcon = typeInfo?.icon || FileText

                      return (
                        <tr key={transaction.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm font-medium text-neutral-900">
                                {formatDate(transaction.created_at)}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {formatTime(transaction.created_at)}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeInfo?.bgColor}`}>
                                <TypeIcon className={`h-4 w-4 ${typeInfo?.color}`} />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900">{transaction.description}</p>
                                <p className="text-xs text-neutral-500">{typeInfo?.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{savingsInfo?.name}</p>
                              <p className="text-xs text-neutral-500">{transaction.account?.account_number}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <p className={`font-semibold ${typeInfo?.color}`}>
                              {transaction.type === 'withdrawal' ? '-' : '+'}
                              {formatCurrency(transaction.amount)}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <p className="text-sm text-neutral-900">
                              {formatCurrency(transaction.balance_after)}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo?.color} ${statusInfo?.bgColor}`}>
                              {statusInfo?.name}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedTransaction(transaction)
                                setShowReceipt(true)
                              }}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {getPaginatedTransactions().map((transaction) => {
                  const typeInfo = TRANSACTION_TYPES[transaction.type as keyof typeof TRANSACTION_TYPES]
                  const savingsInfo = SAVINGS_TYPES[transaction.account?.account_type as keyof typeof SAVINGS_TYPES]
                  const statusInfo = STATUS_TYPES[transaction.status as keyof typeof STATUS_TYPES]
                  const TypeIcon = typeInfo?.icon || FileText

                  return (
                    <div key={transaction.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo?.bgColor}`}>
                            <TypeIcon className={`h-5 w-5 ${typeInfo?.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{transaction.description}</p>
                            <p className="text-sm text-neutral-600">{typeInfo?.name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction)
                            setShowReceipt(true)
                          }}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-500">Tanggal</p>
                          <p className="font-medium">{formatDate(transaction.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Rekening</p>
                          <p className="font-medium">{savingsInfo?.name}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Jumlah</p>
                          <p className={`font-semibold ${typeInfo?.color}`}>
                            {transaction.type === 'withdrawal' ? '-' : '+'}
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Status</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo?.color} ${statusInfo?.bgColor}`}>
                            {statusInfo?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-neutral-200">
                  <p className="text-sm text-neutral-600">
                    Menampilkan {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} dari {pagination.totalItems} transaksi
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                      disabled={pagination.currentPage === 1}
                      className="px-3 py-2 text-sm border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                    >
                      Sebelumnya
                    </button>

                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1
                      const isActive = pageNum === pagination.currentPage

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                          className={`px-3 py-2 text-sm border rounded-lg ${
                            isActive
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                      disabled={pagination.currentPage === totalPages}
                      className="px-3 py-2 text-sm border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Transaction Receipt Modal */}
        {showReceipt && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
              {/* Receipt Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-neutral-900">Bukti Transaksi</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => shareReceipt(selectedTransaction)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={printReceipt}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <Printer className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowReceipt(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Receipt Content */}
              <div className="p-6 space-y-6">
                {/* Transaction Status */}
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    selectedTransaction.status === 'completed' ? 'bg-success-100' :
                    selectedTransaction.status === 'pending' ? 'bg-warning-100' :
                    selectedTransaction.status === 'failed' ? 'bg-error-100' :
                    'bg-neutral-100'
                  }`}>
                    {selectedTransaction.status === 'completed' && <CheckCircle className="h-8 w-8 text-success-600" />}
                    {selectedTransaction.status === 'pending' && <Clock className="h-8 w-8 text-warning-600" />}
                    {selectedTransaction.status === 'failed' && <AlertCircle className="h-8 w-8 text-error-600" />}
                    {selectedTransaction.status === 'cancelled' && <X className="h-8 w-8 text-neutral-600" />}
                  </div>
                  <h4 className="text-xl font-bold text-neutral-900">
                    {TRANSACTION_TYPES[selectedTransaction.type as keyof typeof TRANSACTION_TYPES]?.name}
                  </h4>
                  <p className="text-2xl font-bold text-primary-600 mt-2">
                    {selectedTransaction.type === 'withdrawal' ? '-' : '+'}
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>

                {/* Transaction Details */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">ID Transaksi</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{selectedTransaction.reference_id || selectedTransaction.id}</span>
                      <button
                        onClick={() => copyToClipboard(selectedTransaction.reference_id || selectedTransaction.id.toString())}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-neutral-600">Tanggal & Waktu</span>
                    <div className="text-right">
                      <p>{formatDate(selectedTransaction.created_at)}</p>
                      <p className="text-sm text-neutral-500">{formatTime(selectedTransaction.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-neutral-600">Rekening</span>
                    <div className="text-right">
                      <p>{SAVINGS_TYPES[selectedTransaction.account?.account_type as keyof typeof SAVINGS_TYPES]?.name}</p>
                      <p className="text-sm text-neutral-500">{selectedTransaction.account?.account_number}</p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-neutral-600">Deskripsi</span>
                    <span className="text-right max-w-48">{selectedTransaction.description}</span>
                  </div>

                  {selectedTransaction.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Metode Pembayaran</span>
                      <span>{PAYMENT_METHODS[selectedTransaction.payment_method as keyof typeof PAYMENT_METHODS]?.name || selectedTransaction.payment_method}</span>
                    </div>
                  )}

                  {selectedTransaction.fee && selectedTransaction.fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Biaya Admin</span>
                      <span>{formatCurrency(selectedTransaction.fee)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-neutral-600">Saldo Setelah</span>
                    <span className="font-semibold">{formatCurrency(selectedTransaction.balance_after)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-neutral-600">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_TYPES[selectedTransaction.status as keyof typeof STATUS_TYPES]?.color
                    } ${STATUS_TYPES[selectedTransaction.status as keyof typeof STATUS_TYPES]?.bgColor}`}>
                      {STATUS_TYPES[selectedTransaction.status as keyof typeof STATUS_TYPES]?.name}
                    </span>
                  </div>

                  {selectedTransaction.notes && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Catatan</span>
                      <span className="text-right max-w-48">{selectedTransaction.notes}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-neutral-500 pt-4 border-t">
                  <p>Koperasi Sinoman</p>
                  <p>Transaksi ini telah terverifikasi sistem</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}