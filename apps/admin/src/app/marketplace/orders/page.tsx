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
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  EllipsisVerticalIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ReceiptPercentIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { id } from 'date-fns/locale'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

// Types
interface Order {
  id: string
  order_number: string
  customer: {
    id: string
    name: string
    email: string
    phone: string
  }
  seller: {
    id: string
    business_name: string
    email: string
  }
  items: Array<{
    id: string
    product_name: string
    product_sku: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  shipping_cost: number
  tax_amount: number
  total_amount: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method: string
  shipping_address: {
    street: string
    city: string
    postal_code: string
    province: string
  }
  tracking_number?: string
  notes?: string
  dispute_status?: 'none' | 'pending' | 'resolved' | 'escalated'
  created_at: string
  updated_at: string
  confirmed_at?: string
  shipped_at?: string
  delivered_at?: string
}

interface OrderFilters {
  search: string
  status: string
  paymentStatus: string
  paymentMethod: string
  seller: string
  disputeStatus: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
}

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  disputedOrders: number
  averageOrderValue: number
  monthlyGrowth: Array<{
    month: string
    orders: number
    revenue: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
}

const PRESET_RANGES = [
  { label: 'Hari Ini', value: 'today' },
  { label: 'Minggu Ini', value: 'this_week' },
  { label: 'Bulan Ini', value: 'this_month' },
  { label: 'Bulan Lalu', value: 'last_month' },
  { label: '3 Bulan Terakhir', value: 'last_3_months' },
  { label: 'Kustom', value: 'custom' },
]

export default function OrdersPage() {
  const { hasPermission } = useAuth()
  const { logEvent } = useAudit()
  const { supabase } = useSupabase()

  // State
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'disputes'>('orders')
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
  const [selectedRange, setSelectedRange] = useState('this_month')
  const [customDateRange, setCustomDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  })

  // Filters
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    seller: '',
    disputeStatus: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
  })

  // Check permissions
  const canViewOrders = hasPermission('marketplace.orders.read')
  const canUpdateOrders = hasPermission('marketplace.orders.update')
  const canExportOrders = hasPermission('reports.export')

  // Fetch orders data
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          cooperative_members!customer_id(
            id,
            full_name,
            email,
            phone
          ),
          marketplace_sellers!seller_id(
            id,
            business_name,
            email
          ),
          marketplace_order_items(
            id,
            quantity,
            price,
            total,
            marketplace_products(
              name,
              sku
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process data
      const processedOrders = data.map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer: {
          id: order.cooperative_members?.id || '',
          name: order.cooperative_members?.full_name || 'Unknown',
          email: order.cooperative_members?.email || '',
          phone: order.cooperative_members?.phone || ''
        },
        seller: {
          id: order.marketplace_sellers?.id || '',
          business_name: order.marketplace_sellers?.business_name || 'Unknown',
          email: order.marketplace_sellers?.email || ''
        },
        items: order.marketplace_order_items?.map((item: any) => ({
          id: item.id,
          product_name: item.marketplace_products?.name || 'Unknown Product',
          product_sku: item.marketplace_products?.sku || '',
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })) || [],
        subtotal: order.subtotal || 0,
        shipping_cost: order.shipping_cost || 0,
        tax_amount: order.tax_amount || 0,
        total_amount: order.total_amount || 0,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method || '',
        shipping_address: order.shipping_address || {},
        tracking_number: order.tracking_number,
        notes: order.notes,
        dispute_status: order.dispute_status || 'none',
        created_at: order.created_at,
        updated_at: order.updated_at,
        confirmed_at: order.confirmed_at,
        shipped_at: order.shipped_at,
        delivered_at: order.delivered_at
      }))

      setOrders(processedOrders)

      // Log access
      await logEvent({
        event_type: 'admin.view',
        target_type: 'marketplace_orders',
        target_id: 'all',
        action_details: {
          total_orders: processedOrders.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'low',
      })

    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Gagal memuat data pesanan')
      toast.error('Gagal memuat data pesanan')
    } finally {
      setLoading(false)
    }
  }, [supabase, logEvent])

  // Calculate order statistics
  const calculateOrderStats = useCallback((): OrderStats => {
    const now = new Date()
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0)
    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const completedOrders = orders.filter(o => o.status === 'delivered').length
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length
    const disputedOrders = orders.filter(o => o.dispute_status !== 'none').length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Monthly growth (last 6 months)
    const monthlyGrowth = Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i)
      const monthStart = format(startOfMonth(month), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd')

      const monthOrders = orders.filter(order =>
        order.created_at >= monthStart && order.created_at <= monthEnd
      )

      return {
        month: format(month, 'MMM yyyy', { locale: id }),
        orders: monthOrders.length,
        revenue: monthOrders.reduce((sum, order) => sum + order.total_amount, 0)
      }
    })

    // Status distribution
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / totalOrders) * 100
    }))

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      disputedOrders,
      averageOrderValue,
      monthlyGrowth,
      statusDistribution
    }
  }, [orders])

  // Filter orders
  useEffect(() => {
    let filtered = [...orders]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchLower) ||
        order.customer.name.toLowerCase().includes(searchLower) ||
        order.customer.email.toLowerCase().includes(searchLower) ||
        order.seller.business_name.toLowerCase().includes(searchLower)
      )
    }

    // Status filters
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status)
    }

    if (filters.paymentStatus) {
      filtered = filtered.filter(order => order.payment_status === filters.paymentStatus)
    }

    if (filters.paymentMethod) {
      filtered = filtered.filter(order => order.payment_method === filters.paymentMethod)
    }

    if (filters.disputeStatus) {
      filtered = filtered.filter(order => order.dispute_status === filters.disputeStatus)
    }

    // Amount range filter
    if (filters.amountMin) {
      filtered = filtered.filter(order => order.total_amount >= parseFloat(filters.amountMin))
    }
    if (filters.amountMax) {
      filtered = filtered.filter(order => order.total_amount <= parseFloat(filters.amountMax))
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(order => order.created_at >= filters.dateFrom)
    }
    if (filters.dateTo) {
      filtered = filtered.filter(order => order.created_at <= filters.dateTo)
    }

    setFilteredOrders(filtered)
    setCurrentPage(1)
  }, [orders, filters])

  // Update stats when orders change
  useEffect(() => {
    if (orders.length > 0) {
      setOrderStats(calculateOrderStats())
    }
  }, [orders, calculateOrderStats])

  // Pagination
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredOrders, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!canUpdateOrders) return

    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'confirmed' && { confirmed_at: new Date().toISOString() }),
          ...(newStatus === 'shipped' && { shipped_at: new Date().toISOString() }),
          ...(newStatus === 'delivered' && { delivered_at: new Date().toISOString() })
        })
        .eq('id', orderId)

      if (error) throw error

      await logEvent({
        event_type: 'admin.update',
        target_type: 'marketplace_orders',
        target_id: orderId,
        action_details: {
          action: 'status_update',
          new_status: newStatus,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success('Status pesanan berhasil diperbarui')
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Gagal memperbarui status pesanan')
    }
  }

  // Export orders
  const exportOrders = async () => {
    if (!canExportOrders) return

    try {
      const headers = [
        'Nomor Pesanan', 'Pelanggan', 'Penjual', 'Status', 'Status Pembayaran',
        'Metode Pembayaran', 'Total', 'Tanggal Pesanan', 'Tanggal Update'
      ]

      const csvContent = [
        headers.join(','),
        ...filteredOrders.map(order => [
          order.order_number,
          `"${order.customer.name}"`,
          `"${order.seller.business_name}"`,
          order.status,
          order.payment_status,
          order.payment_method,
          order.total_amount.toString(),
          format(new Date(order.created_at), 'dd/MM/yyyy'),
          format(new Date(order.updated_at), 'dd/MM/yyyy')
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `pesanan_marketplace_${format(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()

      await logEvent({
        event_type: 'admin.export',
        target_type: 'marketplace_orders',
        target_id: 'export',
        action_details: {
          format: 'csv',
          count: filteredOrders.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil mengekspor ${filteredOrders.length} data pesanan`)
    } catch (error) {
      console.error('Error exporting orders:', error)
      toast.error('Gagal mengekspor data')
    }
  }

  // Handle order selection
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const handleSelectAll = () => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(paginatedOrders.map(order => order.id))
    }
  }

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'status-success'
      case 'shipped':
        return 'status-info'
      case 'processing':
        return 'status-warning'
      case 'confirmed':
        return 'status-info'
      case 'pending':
        return 'status-warning'
      case 'cancelled':
      case 'refunded':
        return 'status-error'
      default:
        return 'status-info'
    }
  }

  const getPaymentStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'status-success'
      case 'pending':
        return 'status-warning'
      case 'failed':
      case 'refunded':
        return 'status-error'
      default:
        return 'status-info'
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (canViewOrders) {
      fetchOrders()
    }
  }, [canViewOrders, fetchOrders])

  // Access control
  if (!canViewOrders) {
    return (
      <AccessDenied
        title="Akses Ditolak"
        message="Anda tidak memiliki hak akses untuk melihat data pesanan marketplace."
        showContactInfo={true}
      />
    )
  }

  if (loading) {
    return <LoadingScreen message="Memuat data pesanan..." showProgress />
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
            onClick={fetchOrders}
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
          <h1 className="text-2xl font-bold text-neutral-900">Manajemen Pesanan</h1>
          <p className="text-neutral-600">
            Kelola pesanan marketplace, status fulfillment, dan laporan penjualan
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOrders}
            className="admin-btn admin-btn-secondary"
            disabled={loading}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
          {canExportOrders && (
            <button
              onClick={exportOrders}
              className="admin-btn admin-btn-primary"
              disabled={filteredOrders.length === 0}
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Ekspor Data
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-card">
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'orders', label: 'Daftar Pesanan', icon: ReceiptPercentIcon },
              { id: 'analytics', label: 'Analitik', icon: ChartBarIcon },
              { id: 'disputes', label: 'Sengketa', icon: ExclamationTriangleIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Pesanan</p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {orders.length.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ReceiptPercentIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="metric-card metric-card-warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Pending</p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {orderStats?.pendingOrders.toLocaleString('id-ID') || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="metric-card metric-card-success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Selesai</p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {orderStats?.completedOrders.toLocaleString('id-ID') || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Revenue</p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {orderStats ? (orderStats.totalRevenue / 1000000).toFixed(1) : 0}M
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="admin-card">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Cari pesanan (nomor, pelanggan, penjual)..."
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
                {Object.values(filters).filter(v => v && v !== filters.search).length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded-full">
                    {Object.values(filters).filter(v => v && v !== filters.search).length}
                  </span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Status Pesanan</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="admin-form-input"
                    >
                      <option value="">Semua Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Dikonfirmasi</option>
                      <option value="processing">Diproses</option>
                      <option value="shipped">Dikirim</option>
                      <option value="delivered">Selesai</option>
                      <option value="cancelled">Dibatalkan</option>
                      <option value="refunded">Dikembalikan</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Status Pembayaran</label>
                    <select
                      value={filters.paymentStatus}
                      onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                      className="admin-form-input"
                    >
                      <option value="">Semua</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Dibayar</option>
                      <option value="failed">Gagal</option>
                      <option value="refunded">Dikembalikan</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Metode Pembayaran</label>
                    <select
                      value={filters.paymentMethod}
                      onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="admin-form-input"
                    >
                      <option value="">Semua Metode</option>
                      <option value="bank_transfer">Transfer Bank</option>
                      <option value="credit_card">Kartu Kredit</option>
                      <option value="e_wallet">E-Wallet</option>
                      <option value="cash_on_delivery">COD</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Status Sengketa</label>
                    <select
                      value={filters.disputeStatus}
                      onChange={(e) => setFilters(prev => ({ ...prev, disputeStatus: e.target.value }))}
                      className="admin-form-input"
                    >
                      <option value="">Semua</option>
                      <option value="none">Tidak Ada</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Selesai</option>
                      <option value="escalated">Dieskalasi</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setFilters({
                      search: '',
                      status: '',
                      paymentStatus: '',
                      paymentMethod: '',
                      seller: '',
                      disputeStatus: '',
                      dateFrom: '',
                      dateTo: '',
                      amountMin: '',
                      amountMax: '',
                    })}
                    className="admin-btn admin-btn-secondary"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Orders Table */}
          <div className="admin-card">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th>Pesanan</th>
                    <th>Pelanggan</th>
                    <th>Penjual</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Pembayaran</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td>
                        <div>
                          <div className="font-medium text-neutral-900">{order.order_number}</div>
                          <div className="text-sm text-neutral-500">
                            {order.items.length} item(s)
                          </div>
                          {order.dispute_status !== 'none' && (
                            <div className="text-xs text-red-600 mt-1">
                              ⚠️ Sengketa: {order.dispute_status}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-medium text-neutral-900">{order.customer.name}</div>
                          <div className="text-sm text-neutral-500">{order.customer.email}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-medium text-neutral-900">{order.seller.business_name}</div>
                          <div className="text-sm text-neutral-500">{order.seller.email}</div>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-neutral-900">
                          {order.total_amount.toLocaleString('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          })}
                        </div>
                      </td>
                      <td>
                        <span className={`status-indicator ${getStatusStyle(order.status)}`}>
                          {order.status === 'pending' && 'Pending'}
                          {order.status === 'confirmed' && 'Dikonfirmasi'}
                          {order.status === 'processing' && 'Diproses'}
                          {order.status === 'shipped' && 'Dikirim'}
                          {order.status === 'delivered' && 'Selesai'}
                          {order.status === 'cancelled' && 'Dibatalkan'}
                          {order.status === 'refunded' && 'Dikembalikan'}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span className={`status-indicator ${getPaymentStatusStyle(order.payment_status)}`}>
                            {order.payment_status === 'pending' && 'Pending'}
                            {order.payment_status === 'paid' && 'Dibayar'}
                            {order.payment_status === 'failed' && 'Gagal'}
                            {order.payment_status === 'refunded' && 'Dikembalikan'}
                          </span>
                          <div className="text-xs text-neutral-500 mt-1">
                            {order.payment_method}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-neutral-900">
                          {format(new Date(order.created_at), 'dd MMM yyyy', { locale: id })}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {format(new Date(order.created_at), 'HH:mm')}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // TODO: Navigate to order detail
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-600"
                            title="Lihat Detail"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {canUpdateOrders && (
                            <button
                              onClick={() => {
                                // TODO: Open status update modal
                              }}
                              className="p-1 text-neutral-400 hover:text-neutral-600"
                              title="Update Status"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              // TODO: Show order actions menu
                            }}
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

            {/* Empty state */}
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <ReceiptPercentIcon className="mx-auto h-12 w-12 text-neutral-400" />
                <h3 className="mt-2 text-sm font-medium text-neutral-900">Tidak ada pesanan</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {orders.length === 0
                    ? 'Belum ada pesanan yang masuk.'
                    : 'Tidak ada pesanan yang sesuai dengan filter.'
                  }
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-neutral-700">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} dari {filteredOrders.length} pesanan
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
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && orderStats && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="metric-card">
              <h4 className="text-sm font-medium text-neutral-600 mb-2">Rata-rata Nilai Pesanan</h4>
              <p className="text-3xl font-bold text-neutral-900">
                {orderStats.averageOrderValue.toLocaleString('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="metric-card metric-card-success">
              <h4 className="text-sm font-medium text-neutral-600 mb-2">Tingkat Penyelesaian</h4>
              <p className="text-3xl font-bold text-green-600">
                {orderStats.totalOrders > 0 ?
                  ((orderStats.completedOrders / orderStats.totalOrders) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="metric-card metric-card-error">
              <h4 className="text-sm font-medium text-neutral-600 mb-2">Tingkat Pembatalan</h4>
              <p className="text-3xl font-bold text-red-600">
                {orderStats.totalOrders > 0 ?
                  ((orderStats.cancelledOrders / orderStats.totalOrders) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="metric-card metric-card-warning">
              <h4 className="text-sm font-medium text-neutral-600 mb-2">Sengketa Aktif</h4>
              <p className="text-3xl font-bold text-yellow-600">
                {orderStats.disputedOrders}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Orders Chart */}
            <div className="admin-card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Tren Pesanan Bulanan
              </h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: orderStats.monthlyGrowth.map(d => d.month),
                    datasets: [
                      {
                        label: 'Jumlah Pesanan',
                        data: orderStats.monthlyGrowth.map(d => d.orders),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                      },
                      y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(229, 231, 235, 1)' },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Monthly Revenue Chart */}
            <div className="admin-card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Tren Revenue Bulanan
              </h3>
              <div className="h-64">
                <Bar
                  data={{
                    labels: orderStats.monthlyGrowth.map(d => d.month),
                    datasets: [
                      {
                        label: 'Revenue (Juta)',
                        data: orderStats.monthlyGrowth.map(d => d.revenue / 1000000),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                      },
                      y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(229, 231, 235, 1)' },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disputes Tab */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <div className="admin-card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Manajemen Sengketa
            </h3>
            <div className="text-center py-12 text-neutral-600">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-3 text-neutral-400" />
              <p>Fitur manajemen sengketa akan diimplementasikan</p>
              <p className="text-sm">Untuk mengelola dispute dan resolusi pesanan</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}