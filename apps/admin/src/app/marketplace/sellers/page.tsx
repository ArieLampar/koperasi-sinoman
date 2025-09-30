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
  UserPlusIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  StarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// Types
interface Seller {
  id: string
  business_name: string
  business_type: string
  owner_name: string
  email: string
  phone: string
  address: string
  business_description: string
  business_registration_number?: string
  tax_id?: string
  bank_account_name: string
  bank_account_number: string
  bank_name: string
  status: 'pending' | 'active' | 'inactive' | 'suspended' | 'rejected'
  verification_status: 'pending' | 'verified' | 'rejected'
  commission_rate: number
  member_id?: string
  documents: string[]
  notes?: string
  total_products: number
  total_sales: number
  total_revenue: number
  average_rating: number
  reviews_count: number
  created_at: string
  updated_at: string
  verified_at?: string
  rejected_reason?: string
  last_active?: string
}

interface SellerFilters {
  search: string
  status: string
  verificationStatus: string
  businessType: string
  commissionMin: string
  commissionMax: string
  revenueMin: string
  dateFrom: string
  dateTo: string
}

interface BulkAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  action: (sellerIds: string[]) => void
  requiresConfirmation: boolean
  permission: string
}

export default function SellersPage() {
  const { hasPermission } = useAuth()
  const { logEvent } = useAudit()
  const { supabase } = useSupabase()

  // State
  const [sellers, setSellers] = useState<Seller[]>([])
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([])
  const [selectedSellers, setSelectedSellers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [businessTypes, setBusinessTypes] = useState<string[]>([])

  // Filters
  const [filters, setFilters] = useState<SellerFilters>({
    search: '',
    status: '',
    verificationStatus: '',
    businessType: '',
    commissionMin: '',
    commissionMax: '',
    revenueMin: '',
    dateFrom: '',
    dateTo: '',
  })

  // Check permissions
  const canViewSellers = hasPermission('marketplace.sellers.read')
  const canCreateSellers = hasPermission('marketplace.sellers.create')
  const canUpdateSellers = hasPermission('marketplace.sellers.update')
  const canDeleteSellers = hasPermission('marketplace.sellers.delete')
  const canVerifySellers = hasPermission('marketplace.sellers.verify')

  // Bulk actions configuration
  const bulkActions: BulkAction[] = useMemo(() => [
    {
      id: 'verify',
      label: 'Verifikasi',
      icon: CheckCircleIcon,
      action: handleBulkVerify,
      requiresConfirmation: true,
      permission: 'marketplace.sellers.verify',
    },
    {
      id: 'reject',
      label: 'Tolak Verifikasi',
      icon: XCircleIcon,
      action: handleBulkReject,
      requiresConfirmation: true,
      permission: 'marketplace.sellers.verify',
    },
    {
      id: 'activate',
      label: 'Aktifkan',
      icon: CheckCircleIcon,
      action: handleBulkActivate,
      requiresConfirmation: true,
      permission: 'marketplace.sellers.update',
    },
    {
      id: 'suspend',
      label: 'Tangguhkan',
      icon: ExclamationTriangleIcon,
      action: handleBulkSuspend,
      requiresConfirmation: true,
      permission: 'marketplace.sellers.update',
    },
    {
      id: 'update_commission',
      label: 'Update Komisi',
      icon: CurrencyDollarIcon,
      action: handleBulkUpdateCommission,
      requiresConfirmation: false,
      permission: 'marketplace.sellers.update',
    },
    {
      id: 'export',
      label: 'Ekspor Data',
      icon: DocumentArrowDownIcon,
      action: handleBulkExport,
      requiresConfirmation: false,
      permission: 'reports.export',
    },
    {
      id: 'delete',
      label: 'Hapus',
      icon: TrashIcon,
      action: handleBulkDelete,
      requiresConfirmation: true,
      permission: 'marketplace.sellers.delete',
    },
  ], [])

  // Fetch sellers data
  const fetchSellers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('marketplace_sellers')
        .select(`
          *,
          cooperative_members(
            full_name,
            email
          ),
          marketplace_products(id),
          marketplace_orders(
            total_amount,
            status,
            created_at
          ),
          marketplace_seller_reviews(rating)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process data to calculate metrics
      const processedSellers = data.map((seller: any) => {
        const products = seller.marketplace_products || []
        const orders = seller.marketplace_orders || []
        const reviews = seller.marketplace_seller_reviews || []

        const completedOrders = orders.filter((order: any) => order.status === 'completed')
        const totalRevenue = completedOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
          : 0

        return {
          ...seller,
          total_products: products.length,
          total_sales: completedOrders.length,
          total_revenue: totalRevenue,
          average_rating: avgRating,
          reviews_count: reviews.length,
          owner_name: seller.cooperative_members?.full_name || seller.owner_name || 'Unknown'
        }
      })

      setSellers(processedSellers)

      // Extract unique business types
      const uniqueBusinessTypes = [...new Set(processedSellers.map((s: Seller) => s.business_type).filter(Boolean))]
      setBusinessTypes(uniqueBusinessTypes)

      // Log seller access
      await logEvent({
        event_type: 'admin.view',
        target_type: 'marketplace_sellers',
        target_id: 'all',
        action_details: {
          total_sellers: processedSellers.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'low',
      })

    } catch (error) {
      console.error('Error fetching sellers:', error)
      setError('Gagal memuat data penjual')
      toast.error('Gagal memuat data penjual')
    } finally {
      setLoading(false)
    }
  }, [supabase, logEvent])

  // Filter sellers
  useEffect(() => {
    let filtered = [...sellers]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(seller =>
        seller.business_name.toLowerCase().includes(searchLower) ||
        seller.owner_name.toLowerCase().includes(searchLower) ||
        seller.email.toLowerCase().includes(searchLower) ||
        seller.phone.includes(filters.search)
      )
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(seller => seller.status === filters.status)
    }

    // Verification status filter
    if (filters.verificationStatus) {
      filtered = filtered.filter(seller => seller.verification_status === filters.verificationStatus)
    }

    // Business type filter
    if (filters.businessType) {
      filtered = filtered.filter(seller => seller.business_type === filters.businessType)
    }

    // Commission range filter
    if (filters.commissionMin) {
      filtered = filtered.filter(seller => seller.commission_rate >= parseFloat(filters.commissionMin))
    }
    if (filters.commissionMax) {
      filtered = filtered.filter(seller => seller.commission_rate <= parseFloat(filters.commissionMax))
    }

    // Revenue filter
    if (filters.revenueMin) {
      filtered = filtered.filter(seller => seller.total_revenue >= parseFloat(filters.revenueMin))
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(seller =>
        new Date(seller.created_at) >= new Date(filters.dateFrom)
      )
    }
    if (filters.dateTo) {
      filtered = filtered.filter(seller =>
        new Date(seller.created_at) <= new Date(filters.dateTo)
      )
    }

    setFilteredSellers(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [sellers, filters])

  // Pagination
  const paginatedSellers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredSellers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredSellers, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage)

  // Bulk action handlers
  async function handleBulkVerify(sellerIds: string[]) {
    if (!canVerifySellers) return

    try {
      const { error } = await supabase
        .from('marketplace_sellers')
        .update({
          verification_status: 'verified',
          status: 'active',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', sellerIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'marketplace_sellers',
        target_id: sellerIds.join(','),
        action_details: {
          action: 'verify',
          count: sellerIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil memverifikasi ${sellerIds.length} penjual`)
      fetchSellers()
      setSelectedSellers([])
    } catch (error) {
      console.error('Error verifying sellers:', error)
      toast.error('Gagal memverifikasi penjual')
    }
  }

  async function handleBulkReject(sellerIds: string[]) {
    if (!canVerifySellers) return

    const reason = prompt('Masukkan alasan penolakan:')
    if (!reason) return

    try {
      const { error } = await supabase
        .from('marketplace_sellers')
        .update({
          verification_status: 'rejected',
          status: 'rejected',
          rejected_reason: reason,
          updated_at: new Date().toISOString()
        })
        .in('id', sellerIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'marketplace_sellers',
        target_id: sellerIds.join(','),
        action_details: {
          action: 'reject',
          reason,
          count: sellerIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil menolak ${sellerIds.length} penjual`)
      fetchSellers()
      setSelectedSellers([])
    } catch (error) {
      console.error('Error rejecting sellers:', error)
      toast.error('Gagal menolak penjual')
    }
  }

  async function handleBulkActivate(sellerIds: string[]) {
    if (!canUpdateSellers) return

    try {
      const { error } = await supabase
        .from('marketplace_sellers')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .in('id', sellerIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'marketplace_sellers',
        target_id: sellerIds.join(','),
        action_details: {
          action: 'activate',
          count: sellerIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil mengaktifkan ${sellerIds.length} penjual`)
      fetchSellers()
      setSelectedSellers([])
    } catch (error) {
      console.error('Error activating sellers:', error)
      toast.error('Gagal mengaktifkan penjual')
    }
  }

  async function handleBulkSuspend(sellerIds: string[]) {
    if (!canUpdateSellers) return

    const reason = prompt('Masukkan alasan penangguhan:')
    if (!reason) return

    try {
      const { error } = await supabase
        .from('marketplace_sellers')
        .update({
          status: 'suspended',
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .in('id', sellerIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'marketplace_sellers',
        target_id: sellerIds.join(','),
        action_details: {
          action: 'suspend',
          reason,
          count: sellerIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'high',
      })

      toast.success(`Berhasil menangguhkan ${sellerIds.length} penjual`)
      fetchSellers()
      setSelectedSellers([])
    } catch (error) {
      console.error('Error suspending sellers:', error)
      toast.error('Gagal menangguhkan penjual')
    }
  }

  async function handleBulkUpdateCommission(sellerIds: string[]) {
    if (!canUpdateSellers) return

    const commissionRate = prompt('Masukkan rate komisi baru (dalam persen):')
    if (!commissionRate || isNaN(parseFloat(commissionRate))) {
      toast.error('Rate komisi tidak valid')
      return
    }

    const rate = parseFloat(commissionRate)
    if (rate < 0 || rate > 100) {
      toast.error('Rate komisi harus antara 0-100%')
      return
    }

    try {
      const { error } = await supabase
        .from('marketplace_sellers')
        .update({
          commission_rate: rate,
          updated_at: new Date().toISOString()
        })
        .in('id', sellerIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'marketplace_sellers',
        target_id: sellerIds.join(','),
        action_details: {
          action: 'update_commission',
          new_rate: rate,
          count: sellerIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil mengupdate komisi ${sellerIds.length} penjual ke ${rate}%`)
      fetchSellers()
      setSelectedSellers([])
    } catch (error) {
      console.error('Error updating commission:', error)
      toast.error('Gagal mengupdate komisi')
    }
  }

  async function handleBulkExport(sellerIds: string[]) {
    try {
      const sellersToExport = sellers.filter(seller => sellerIds.includes(seller.id))

      // Create CSV content
      const headers = [
        'ID', 'Nama Bisnis', 'Tipe Bisnis', 'Nama Pemilik', 'Email', 'Telepon',
        'Status', 'Status Verifikasi', 'Komisi (%)', 'Total Produk', 'Total Penjualan',
        'Total Revenue', 'Rating', 'Bergabung'
      ]

      const csvContent = [
        headers.join(','),
        ...sellersToExport.map(seller => [
          seller.id,
          `"${seller.business_name}"`,
          seller.business_type,
          `"${seller.owner_name}"`,
          seller.email,
          seller.phone,
          seller.status,
          seller.verification_status,
          seller.commission_rate.toString(),
          seller.total_products.toString(),
          seller.total_sales.toString(),
          seller.total_revenue.toString(),
          seller.average_rating.toFixed(1),
          format(new Date(seller.created_at), 'dd/MM/yyyy')
        ].join(','))
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `penjual_marketplace_${format(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()

      await logEvent({
        event_type: 'admin.export',
        target_type: 'marketplace_sellers',
        target_id: sellerIds.join(','),
        action_details: {
          format: 'csv',
          count: sellerIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil mengekspor data ${sellerIds.length} penjual`)
      setSelectedSellers([])
    } catch (error) {
      console.error('Error exporting sellers:', error)
      toast.error('Gagal mengekspor data')
    }
  }

  async function handleBulkDelete(sellerIds: string[]) {
    if (!canDeleteSellers) return

    const confirmed = confirm(
      `Apakah Anda yakin ingin menghapus ${sellerIds.length} penjual? ` +
      'Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.'
    )

    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('marketplace_sellers')
        .delete()
        .in('id', sellerIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_delete',
        target_type: 'marketplace_sellers',
        target_id: sellerIds.join(','),
        action_details: {
          count: sellerIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'high',
      })

      toast.success(`Berhasil menghapus ${sellerIds.length} penjual`)
      fetchSellers()
      setSelectedSellers([])
    } catch (error) {
      console.error('Error deleting sellers:', error)
      toast.error('Gagal menghapus penjual')
    }
  }

  // Handle seller selection
  const handleSelectSeller = (sellerId: string) => {
    setSelectedSellers(prev =>
      prev.includes(sellerId)
        ? prev.filter(id => id !== sellerId)
        : [...prev, sellerId]
    )
  }

  const handleSelectAll = () => {
    if (selectedSellers.length === paginatedSellers.length) {
      setSelectedSellers([])
    } else {
      setSelectedSellers(paginatedSellers.map(seller => seller.id))
    }
  }

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-success'
      case 'inactive':
        return 'status-warning'
      case 'suspended':
        return 'status-error'
      case 'rejected':
        return 'status-error'
      case 'pending':
        return 'status-info'
      default:
        return 'status-info'
    }
  }

  const getVerificationStatusStyle = (status: string) => {
    switch (status) {
      case 'verified':
        return 'status-success'
      case 'pending':
        return 'status-warning'
      case 'rejected':
        return 'status-error'
      default:
        return 'status-info'
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (canViewSellers) {
      fetchSellers()
    }
  }, [canViewSellers, fetchSellers])

  // Access control
  if (!canViewSellers) {
    return (
      <AccessDenied
        title="Akses Ditolak"
        message="Anda tidak memiliki hak akses untuk melihat data penjual marketplace."
        showContactInfo={true}
      />
    )
  }

  if (loading) {
    return <LoadingScreen message="Memuat data penjual..." showProgress />
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
            onClick={fetchSellers}
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
          <h1 className="text-2xl font-bold text-neutral-900">Manajemen Penjual</h1>
          <p className="text-neutral-600">
            Kelola penjual marketplace, verifikasi, dan performa penjualan
          </p>
        </div>
        {canCreateSellers && (
          <button className="admin-btn admin-btn-primary">
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Tambah Penjual
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Penjual</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {sellers.length.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="metric-card metric-card-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Pending Verifikasi</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {sellers.filter(s => s.verification_status === 'pending').length.toLocaleString('id-ID')}
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
              <p className="text-sm font-medium text-neutral-600">Penjual Aktif</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {sellers.filter(s => s.status === 'active').length.toLocaleString('id-ID')}
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
                {sellers.reduce((sum, s) => sum + s.total_revenue, 0).toLocaleString('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="admin-card">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari penjual (nama bisnis, pemilik, email, telepon)..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="admin-form-input pl-10"
              />
            </div>
          </div>

          {/* Filter Toggle */}
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

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="admin-form-group">
                <label className="admin-form-label">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="admin-form-input"
                >
                  <option value="">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                  <option value="suspended">Ditangguhkan</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Status Verifikasi</label>
                <select
                  value={filters.verificationStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, verificationStatus: e.target.value }))}
                  className="admin-form-input"
                >
                  <option value="">Semua</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Terverifikasi</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Tipe Bisnis</label>
                <select
                  value={filters.businessType}
                  onChange={(e) => setFilters(prev => ({ ...prev, businessType: e.target.value }))}
                  className="admin-form-input"
                >
                  <option value="">Semua Tipe</option>
                  {businessTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Revenue Minimum</label>
                <input
                  type="number"
                  value={filters.revenueMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, revenueMin: e.target.value }))}
                  className="admin-form-input"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({
                  search: '',
                  status: '',
                  verificationStatus: '',
                  businessType: '',
                  commissionMin: '',
                  commissionMax: '',
                  revenueMin: '',
                  dateFrom: '',
                  dateTo: '',
                })}
                className="admin-btn admin-btn-secondary"
              >
                Reset Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedSellers.length > 0 && (
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-neutral-900">
                {selectedSellers.length} penjual dipilih
              </span>
              <button
                onClick={() => setSelectedSellers([])}
                className="text-sm text-neutral-500 hover:text-neutral-700"
              >
                Batal pilih
              </button>
            </div>
            <div className="flex items-center space-x-2 flex-wrap">
              {bulkActions
                .filter(action => hasPermission(action.permission))
                .map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (action.requiresConfirmation) {
                        const confirmed = confirm(
                          `Apakah Anda yakin ingin ${action.label.toLowerCase()} ${selectedSellers.length} penjual yang dipilih?`
                        )
                        if (confirmed) {
                          action.action(selectedSellers)
                        }
                      } else {
                        action.action(selectedSellers)
                      }
                    }}
                    className="admin-btn admin-btn-secondary"
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Sellers Table */}
      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedSellers.length === paginatedSellers.length && paginatedSellers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th>Penjual</th>
                <th>Kontak</th>
                <th>Status</th>
                <th>Verifikasi</th>
                <th>Komisi</th>
                <th>Performa</th>
                <th>Bergabung</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSellers.map((seller) => (
                <tr key={seller.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedSellers.includes(seller.id)}
                      onChange={() => handleSelectSeller(seller.id)}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <BuildingStorefrontIcon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{seller.business_name}</div>
                        <div className="text-sm text-neutral-500">{seller.business_type}</div>
                        <div className="text-sm text-neutral-500">Owner: {seller.owner_name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="text-sm text-neutral-900">{seller.email}</div>
                      <div className="text-sm text-neutral-500">{seller.phone}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-indicator ${getStatusStyle(seller.status)}`}>
                      {seller.status === 'active' && 'Aktif'}
                      {seller.status === 'inactive' && 'Tidak Aktif'}
                      {seller.status === 'pending' && 'Pending'}
                      {seller.status === 'suspended' && 'Ditangguhkan'}
                      {seller.status === 'rejected' && 'Ditolak'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-indicator ${getVerificationStatusStyle(seller.verification_status)}`}>
                      {seller.verification_status === 'verified' && 'Terverifikasi'}
                      {seller.verification_status === 'pending' && 'Pending'}
                      {seller.verification_status === 'rejected' && 'Ditolak'}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm font-medium text-neutral-900">
                      {seller.commission_rate}%
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div className="text-neutral-900">
                        {seller.total_products} produk
                      </div>
                      <div className="text-neutral-500">
                        {seller.total_sales} penjualan
                      </div>
                      <div className="text-success-600 font-medium">
                        {seller.total_revenue.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        })}
                      </div>
                      {seller.reviews_count > 0 && (
                        <div className="flex items-center mt-1">
                          <StarIcon className="h-3 w-3 text-yellow-400 mr-1" />
                          <span className="text-xs">
                            {seller.average_rating.toFixed(1)} ({seller.reviews_count})
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-neutral-900">
                      {format(new Date(seller.created_at), 'dd MMM yyyy', { locale: id })}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // TODO: Navigate to seller detail
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-600"
                        title="Lihat Detail"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {canUpdateSellers && (
                        <button
                          onClick={() => {
                            // TODO: Open edit modal
                          }}
                          className="p-1 text-neutral-400 hover:text-neutral-600"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          // TODO: Show seller actions menu
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
        {filteredSellers.length === 0 && (
          <div className="text-center py-12">
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-neutral-900">Tidak ada penjual</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {sellers.length === 0
                ? 'Belum ada penjual yang terdaftar.'
                : 'Tidak ada penjual yang sesuai dengan filter.'
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-neutral-700">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredSellers.length)} dari {filteredSellers.length} penjual
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
    </div>
  )
}