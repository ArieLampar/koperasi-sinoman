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
  TagIcon,
  PhotoIcon,
  CubeIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Image from 'next/image'

// Types
interface Product {
  id: string
  name: string
  slug: string
  description: string
  category: string
  price: number
  member_price?: number
  stock: number
  sku: string
  images: string[]
  status: 'draft' | 'active' | 'inactive' | 'pending_approval' | 'rejected'
  approval_status: 'pending' | 'approved' | 'rejected'
  featured: boolean
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  seller: {
    id: string
    name: string
    email: string
    status: string
  }
  reviews_count: number
  average_rating: number
  total_sold: number
  created_at: string
  updated_at: string
  approved_at?: string
  rejected_reason?: string
}

interface ProductFilters {
  search: string
  category: string
  status: string
  approvalStatus: string
  seller: string
  featured: string
  priceMin: string
  priceMax: string
  stockMin: string
  dateFrom: string
  dateTo: string
}

interface BulkAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  action: (productIds: string[]) => void
  requiresConfirmation: boolean
  permission: string
}

export default function ProductsPage() {
  const { hasPermission } = useAuth()
  const { logEvent } = useAudit()
  const { supabase } = useSupabase()

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [categories, setCategories] = useState<string[]>([])
  const [sellers, setSellers] = useState<Array<{id: string, name: string}>>([])

  // Filters
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    status: '',
    approvalStatus: '',
    seller: '',
    featured: '',
    priceMin: '',
    priceMax: '',
    stockMin: '',
    dateFrom: '',
    dateTo: '',
  })

  // Check permissions
  const canViewProducts = hasPermission('marketplace.products.read')
  const canCreateProducts = hasPermission('marketplace.products.create')
  const canUpdateProducts = hasPermission('marketplace.products.update')
  const canDeleteProducts = hasPermission('marketplace.products.delete')
  const canApproveProducts = hasPermission('marketplace.products.approve')

  // Bulk actions configuration
  const bulkActions: BulkAction[] = useMemo(() => [
    {
      id: 'approve',
      label: 'Setujui',
      icon: CheckCircleIcon,
      action: handleBulkApprove,
      requiresConfirmation: true,
      permission: 'marketplace.products.approve',
    },
    {
      id: 'reject',
      label: 'Tolak',
      icon: XCircleIcon,
      action: handleBulkReject,
      requiresConfirmation: true,
      permission: 'marketplace.products.approve',
    },
    {
      id: 'activate',
      label: 'Aktifkan',
      icon: CheckCircleIcon,
      action: handleBulkActivate,
      requiresConfirmation: true,
      permission: 'marketplace.products.update',
    },
    {
      id: 'deactivate',
      label: 'Nonaktifkan',
      icon: XCircleIcon,
      action: handleBulkDeactivate,
      requiresConfirmation: true,
      permission: 'marketplace.products.update',
    },
    {
      id: 'feature',
      label: 'Jadikan Unggulan',
      icon: StarIcon,
      action: handleBulkFeature,
      requiresConfirmation: false,
      permission: 'marketplace.products.update',
    },
    {
      id: 'unfeature',
      label: 'Hapus dari Unggulan',
      icon: StarIcon,
      action: handleBulkUnfeature,
      requiresConfirmation: false,
      permission: 'marketplace.products.update',
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
      permission: 'marketplace.products.delete',
    },
  ], [])

  // Fetch products data
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          marketplace_sellers!seller_id(
            id,
            business_name,
            email,
            status
          ),
          marketplace_product_reviews(
            rating
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process data to calculate ratings and sales
      const processedProducts = data.map((product: any) => {
        const reviews = product.marketplace_product_reviews || []
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
          : 0

        return {
          ...product,
          seller: {
            id: product.marketplace_sellers?.id || '',
            name: product.marketplace_sellers?.business_name || 'Unknown',
            email: product.marketplace_sellers?.email || '',
            status: product.marketplace_sellers?.status || 'unknown'
          },
          reviews_count: reviews.length,
          average_rating: avgRating,
          total_sold: product.sold_count || 0
        }
      })

      setProducts(processedProducts)

      // Extract unique categories and sellers
      const uniqueCategories = [...new Set(processedProducts.map((p: Product) => p.category).filter(Boolean))]
      const uniqueSellers = [...new Set(processedProducts.map((p: Product) => ({
        id: p.seller.id,
        name: p.seller.name
      })))]

      setCategories(uniqueCategories)
      setSellers(uniqueSellers)

      // Log product access
      await logEvent({
        event_type: 'admin.view',
        target_type: 'marketplace_products',
        target_id: 'all',
        action_details: {
          total_products: processedProducts.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'low',
      })

    } catch (error) {
      console.error('Error fetching products:', error)
      setError('Gagal memuat data produk')
      toast.error('Gagal memuat data produk')
    } finally {
      setLoading(false)
    }
  }, [supabase, logEvent])

  // Filter products
  useEffect(() => {
    let filtered = [...products]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.seller.name.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category)
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(product => product.status === filters.status)
    }

    // Approval status filter
    if (filters.approvalStatus) {
      filtered = filtered.filter(product => product.approval_status === filters.approvalStatus)
    }

    // Seller filter
    if (filters.seller) {
      filtered = filtered.filter(product => product.seller.id === filters.seller)
    }

    // Featured filter
    if (filters.featured) {
      const isFeatured = filters.featured === 'true'
      filtered = filtered.filter(product => product.featured === isFeatured)
    }

    // Price range filter
    if (filters.priceMin) {
      filtered = filtered.filter(product => product.price >= parseFloat(filters.priceMin))
    }
    if (filters.priceMax) {
      filtered = filtered.filter(product => product.price <= parseFloat(filters.priceMax))
    }

    // Stock filter
    if (filters.stockMin) {
      filtered = filtered.filter(product => product.stock >= parseInt(filters.stockMin))
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(product =>
        new Date(product.created_at) >= new Date(filters.dateFrom)
      )
    }
    if (filters.dateTo) {
      filtered = filtered.filter(product =>
        new Date(product.created_at) <= new Date(filters.dateTo)
      )
    }

    setFilteredProducts(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [products, filters])

  // Pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  // Bulk action handlers
  async function handleBulkApprove(productIds: string[]) {
    if (!canApproveProducts) return

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({
          approval_status: 'approved',
          status: 'active',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', productIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'marketplace_products',
        target_id: productIds.join(','),
        action_details: {
          action: 'approve',
          count: productIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil menyetujui ${productIds.length} produk`)
      fetchProducts()
      setSelectedProducts([])
    } catch (error) {
      console.error('Error approving products:', error)
      toast.error('Gagal menyetujui produk')
    }
  }

  async function handleBulkReject(productIds: string[]) {
    if (!canApproveProducts) return

    const reason = prompt('Masukkan alasan penolakan:')
    if (!reason) return

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({
          approval_status: 'rejected',
          status: 'inactive',
          rejected_reason: reason,
          updated_at: new Date().toISOString()
        })
        .in('id', productIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'marketplace_products',
        target_id: productIds.join(','),
        action_details: {
          action: 'reject',
          reason,
          count: productIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil menolak ${productIds.length} produk`)
      fetchProducts()
      setSelectedProducts([])
    } catch (error) {
      console.error('Error rejecting products:', error)
      toast.error('Gagal menolak produk')
    }
  }

  async function handleBulkActivate(productIds: string[]) {
    if (!canUpdateProducts) return

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .in('id', productIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'marketplace_products',
        target_id: productIds.join(','),
        action_details: {
          action: 'activate',
          count: productIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil mengaktifkan ${productIds.length} produk`)
      fetchProducts()
      setSelectedProducts([])
    } catch (error) {
      console.error('Error activating products:', error)
      toast.error('Gagal mengaktifkan produk')
    }
  }

  async function handleBulkDeactivate(productIds: string[]) {
    if (!canUpdateProducts) return

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .in('id', productIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'marketplace_products',
        target_id: productIds.join(','),
        action_details: {
          action: 'deactivate',
          count: productIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil menonaktifkan ${productIds.length} produk`)
      fetchProducts()
      setSelectedProducts([])
    } catch (error) {
      console.error('Error deactivating products:', error)
      toast.error('Gagal menonaktifkan produk')
    }
  }

  async function handleBulkFeature(productIds: string[]) {
    if (!canUpdateProducts) return

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ featured: true, updated_at: new Date().toISOString() })
        .in('id', productIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'marketplace_products',
        target_id: productIds.join(','),
        action_details: {
          action: 'feature',
          count: productIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'low',
      })

      toast.success(`Berhasil menjadikan ${productIds.length} produk unggulan`)
      fetchProducts()
      setSelectedProducts([])
    } catch (error) {
      console.error('Error featuring products:', error)
      toast.error('Gagal menjadikan produk unggulan')
    }
  }

  async function handleBulkUnfeature(productIds: string[]) {
    if (!canUpdateProducts) return

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ featured: false, updated_at: new Date().toISOString() })
        .in('id', productIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'marketplace_products',
        target_id: productIds.join(','),
        action_details: {
          action: 'unfeature',
          count: productIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'low',
      })

      toast.success(`Berhasil menghapus ${productIds.length} produk dari unggulan`)
      fetchProducts()
      setSelectedProducts([])
    } catch (error) {
      console.error('Error unfeaturing products:', error)
      toast.error('Gagal menghapus produk dari unggulan')
    }
  }

  async function handleBulkExport(productIds: string[]) {
    try {
      const productsToExport = products.filter(product => productIds.includes(product.id))

      // Create CSV content
      const headers = [
        'ID', 'Nama Produk', 'SKU', 'Kategori', 'Harga', 'Harga Member', 'Stok',
        'Status', 'Status Persetujuan', 'Unggulan', 'Penjual', 'Rating', 'Terjual', 'Dibuat'
      ]

      const csvContent = [
        headers.join(','),
        ...productsToExport.map(product => [
          product.id,
          `"${product.name}"`,
          product.sku,
          product.category,
          product.price.toString(),
          (product.member_price || '').toString(),
          product.stock.toString(),
          product.status,
          product.approval_status,
          product.featured ? 'Ya' : 'Tidak',
          `"${product.seller.name}"`,
          product.average_rating.toFixed(1),
          product.total_sold.toString(),
          format(new Date(product.created_at), 'dd/MM/yyyy')
        ].join(','))
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `produk_marketplace_${format(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()

      await logEvent({
        event_type: 'admin.export',
        target_type: 'marketplace_products',
        target_id: productIds.join(','),
        action_details: {
          format: 'csv',
          count: productIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil mengekspor data ${productIds.length} produk`)
      setSelectedProducts([])
    } catch (error) {
      console.error('Error exporting products:', error)
      toast.error('Gagal mengekspor data')
    }
  }

  async function handleBulkDelete(productIds: string[]) {
    if (!canDeleteProducts) return

    const confirmed = confirm(
      `Apakah Anda yakin ingin menghapus ${productIds.length} produk? ` +
      'Tindakan ini tidak dapat dibatalkan.'
    )

    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .in('id', productIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_delete',
        target_type: 'marketplace_products',
        target_id: productIds.join(','),
        action_details: {
          count: productIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'high',
      })

      toast.success(`Berhasil menghapus ${productIds.length} produk`)
      fetchProducts()
      setSelectedProducts([])
    } catch (error) {
      console.error('Error deleting products:', error)
      toast.error('Gagal menghapus produk')
    }
  }

  // Handle product selection
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(paginatedProducts.map(product => product.id))
    }
  }

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-success'
      case 'inactive':
        return 'status-error'
      case 'draft':
        return 'status-warning'
      case 'pending_approval':
        return 'status-info'
      case 'rejected':
        return 'status-error'
      default:
        return 'status-info'
    }
  }

  const getApprovalStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
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
    if (canViewProducts) {
      fetchProducts()
    }
  }, [canViewProducts, fetchProducts])

  // Access control
  if (!canViewProducts) {
    return (
      <AccessDenied
        title="Akses Ditolak"
        message="Anda tidak memiliki hak akses untuk melihat data produk marketplace."
        showContactInfo={true}
      />
    )
  }

  if (loading) {
    return <LoadingScreen message="Memuat data produk..." showProgress />
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
            onClick={fetchProducts}
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
          <h1 className="text-2xl font-bold text-neutral-900">Manajemen Produk</h1>
          <p className="text-neutral-600">
            Kelola semua produk marketplace, persetujuan, dan inventori
          </p>
        </div>
        {canCreateProducts && (
          <button className="admin-btn admin-btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Tambah Produk
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Produk</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {products.length.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CubeIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="metric-card metric-card-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Pending Approval</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {products.filter(p => p.approval_status === 'pending').length.toLocaleString('id-ID')}
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
              <p className="text-sm font-medium text-neutral-600">Produk Aktif</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {products.filter(p => p.status === 'active').length.toLocaleString('id-ID')}
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
              <p className="text-sm font-medium text-neutral-600">Stok Rendah</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {products.filter(p => p.stock < 10).length.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
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
                placeholder="Cari produk (nama, deskripsi, SKU, penjual)..."
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
                <label className="admin-form-label">Kategori</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="admin-form-input"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
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
                  <option value="inactive">Tidak Aktif</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Status Persetujuan</label>
                <select
                  value={filters.approvalStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, approvalStatus: e.target.value }))}
                  className="admin-form-input"
                >
                  <option value="">Semua</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Penjual</label>
                <select
                  value={filters.seller}
                  onChange={(e) => setFilters(prev => ({ ...prev, seller: e.target.value }))}
                  className="admin-form-input"
                >
                  <option value="">Semua Penjual</option>
                  {sellers.map(seller => (
                    <option key={seller.id} value={seller.id}>{seller.name}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Harga Minimum</label>
                <input
                  type="number"
                  value={filters.priceMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                  className="admin-form-input"
                  placeholder="0"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Harga Maksimum</label>
                <input
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                  className="admin-form-input"
                  placeholder="Tidak terbatas"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Stok Minimum</label>
                <input
                  type="number"
                  value={filters.stockMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, stockMin: e.target.value }))}
                  className="admin-form-input"
                  placeholder="0"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Unggulan</label>
                <select
                  value={filters.featured}
                  onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.value }))}
                  className="admin-form-input"
                >
                  <option value="">Semua</option>
                  <option value="true">Ya</option>
                  <option value="false">Tidak</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({
                  search: '',
                  category: '',
                  status: '',
                  approvalStatus: '',
                  seller: '',
                  featured: '',
                  priceMin: '',
                  priceMax: '',
                  stockMin: '',
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
      {selectedProducts.length > 0 && (
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-neutral-900">
                {selectedProducts.length} produk dipilih
              </span>
              <button
                onClick={() => setSelectedProducts([])}
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
                          `Apakah Anda yakin ingin ${action.label.toLowerCase()} ${selectedProducts.length} produk yang dipilih?`
                        )
                        if (confirmed) {
                          action.action(selectedProducts)
                        }
                      } else {
                        action.action(selectedProducts)
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

      {/* Products Table */}
      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Persetujuan</th>
                <th>Penjual</th>
                <th>Rating</th>
                <th>Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <PhotoIcon className="h-6 w-6 text-neutral-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{product.name}</div>
                        <div className="text-sm text-neutral-500">SKU: {product.sku}</div>
                        {product.featured && (
                          <div className="flex items-center mt-1">
                            <StarIcon className="h-3 w-3 text-yellow-500 mr-1" />
                            <span className="text-xs text-yellow-600">Unggulan</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-800 text-xs rounded-full">
                      {product.category}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div className="font-medium text-neutral-900">
                        {product.price.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        })}
                      </div>
                      {product.member_price && (
                        <div className="text-sm text-primary-600">
                          Member: {product.member_price.toLocaleString('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={`text-sm font-medium ${
                      product.stock < 10 ? 'text-red-600' :
                      product.stock < 50 ? 'text-yellow-600' : 'text-neutral-900'
                    }`}>
                      {product.stock.toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td>
                    <span className={`status-indicator ${getStatusStyle(product.status)}`}>
                      {product.status === 'active' && 'Aktif'}
                      {product.status === 'inactive' && 'Tidak Aktif'}
                      {product.status === 'draft' && 'Draft'}
                      {product.status === 'pending_approval' && 'Pending'}
                      {product.status === 'rejected' && 'Ditolak'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-indicator ${getApprovalStatusStyle(product.approval_status)}`}>
                      {product.approval_status === 'approved' && 'Disetujui'}
                      {product.approval_status === 'pending' && 'Pending'}
                      {product.approval_status === 'rejected' && 'Ditolak'}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">{product.seller.name}</div>
                      <div className="text-xs text-neutral-500">{product.seller.email}</div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{product.average_rating.toFixed(1)}</span>
                      <span className="text-xs text-neutral-500 ml-1">({product.reviews_count})</span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {product.total_sold} terjual
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-neutral-900">
                      {format(new Date(product.created_at), 'dd MMM yyyy', { locale: id })}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // TODO: Navigate to product detail
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-600"
                        title="Lihat Detail"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {canUpdateProducts && (
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
                          // TODO: Show product actions menu
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
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <CubeIcon className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-neutral-900">Tidak ada produk</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {products.length === 0
                ? 'Belum ada produk yang terdaftar.'
                : 'Tidak ada produk yang sesuai dengan filter.'
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-neutral-700">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} dari {filteredProducts.length} produk
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