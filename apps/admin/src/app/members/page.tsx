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
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// Types
interface Member {
  id: string
  member_id: string
  full_name: string
  email: string
  phone: string
  address: string
  date_of_birth: string
  occupation: string
  kyc_status: 'pending' | 'verified' | 'rejected' | 'expired'
  membership_type: 'regular' | 'premium' | 'corporate'
  status: 'active' | 'inactive' | 'suspended'
  registration_date: string
  last_activity: string
  total_savings: number
  total_loans: number
  kyc_documents: string[]
  notes?: string
  created_at: string
  updated_at: string
}

interface MemberFilters {
  search: string
  kycStatus: string
  membershipType: string
  status: string
  dateFrom: string
  dateTo: string
}

interface BulkAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  action: (memberIds: string[]) => void
  requiresConfirmation: boolean
  permission: string
}

export default function MembersPage() {
  const { hasPermission } = useAuth()
  const { logEvent } = useAudit()
  const { supabase } = useSupabase()

  // State
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Filters
  const [filters, setFilters] = useState<MemberFilters>({
    search: '',
    kycStatus: '',
    membershipType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  })

  // Check permissions
  const canViewMembers = hasPermission('members.read')
  const canCreateMembers = hasPermission('members.create')
  const canUpdateMembers = hasPermission('members.update')
  const canDeleteMembers = hasPermission('members.delete')

  // Bulk actions configuration
  const bulkActions: BulkAction[] = useMemo(() => [
    {
      id: 'verify_kyc',
      label: 'Verifikasi KYC',
      icon: CheckCircleIcon,
      action: handleBulkVerifyKyc,
      requiresConfirmation: true,
      permission: 'members.update',
    },
    {
      id: 'reject_kyc',
      label: 'Tolak KYC',
      icon: XCircleIcon,
      action: handleBulkRejectKyc,
      requiresConfirmation: true,
      permission: 'members.update',
    },
    {
      id: 'activate',
      label: 'Aktifkan',
      icon: CheckCircleIcon,
      action: handleBulkActivate,
      requiresConfirmation: true,
      permission: 'members.update',
    },
    {
      id: 'suspend',
      label: 'Tangguhkan',
      icon: ExclamationTriangleIcon,
      action: handleBulkSuspend,
      requiresConfirmation: true,
      permission: 'members.update',
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
      permission: 'members.delete',
    },
  ], [])

  // Fetch members data
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          savings_accounts(balance),
          loans(amount, status)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process data to calculate totals
      const processedMembers = data.map((member: any) => ({
        ...member,
        total_savings: member.savings_accounts?.reduce((sum: number, account: any) => sum + (account.balance || 0), 0) || 0,
        total_loans: member.loans?.reduce((sum: number, loan: any) => sum + (loan.status === 'active' ? loan.amount || 0 : 0), 0) || 0,
      }))

      setMembers(processedMembers)

      // Log member access
      await logEvent({
        event_type: 'admin.view',
        target_type: 'members_list',
        target_id: 'all',
        action_details: {
          total_members: processedMembers.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'low',
      })

    } catch (error) {
      console.error('Error fetching members:', error)
      setError('Gagal memuat data anggota')
      toast.error('Gagal memuat data anggota')
    } finally {
      setLoading(false)
    }
  }, [supabase, logEvent])

  // Filter members
  useEffect(() => {
    let filtered = [...members]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        member.phone.includes(filters.search) ||
        member.member_id.toLowerCase().includes(searchLower)
      )
    }

    // KYC status filter
    if (filters.kycStatus) {
      filtered = filtered.filter(member => member.kyc_status === filters.kycStatus)
    }

    // Membership type filter
    if (filters.membershipType) {
      filtered = filtered.filter(member => member.membership_type === filters.membershipType)
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(member => member.status === filters.status)
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(member =>
        new Date(member.registration_date) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(member =>
        new Date(member.registration_date) <= new Date(filters.dateTo)
      )
    }

    setFilteredMembers(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [members, filters])

  // Pagination
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredMembers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredMembers, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)

  // Bulk action handlers
  async function handleBulkVerifyKyc(memberIds: string[]) {
    if (!canUpdateMembers) return

    try {
      const { error } = await supabase
        .from('members')
        .update({ kyc_status: 'verified', updated_at: new Date().toISOString() })
        .in('id', memberIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'members',
        target_id: memberIds.join(','),
        action_details: {
          action: 'verify_kyc',
          count: memberIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil memverifikasi KYC ${memberIds.length} anggota`)
      fetchMembers()
      setSelectedMembers([])
    } catch (error) {
      console.error('Error verifying KYC:', error)
      toast.error('Gagal memverifikasi KYC')
    }
  }

  async function handleBulkRejectKyc(memberIds: string[]) {
    if (!canUpdateMembers) return

    try {
      const { error } = await supabase
        .from('members')
        .update({ kyc_status: 'rejected', updated_at: new Date().toISOString() })
        .in('id', memberIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'members',
        target_id: memberIds.join(','),
        action_details: {
          action: 'reject_kyc',
          count: memberIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil menolak KYC ${memberIds.length} anggota`)
      fetchMembers()
      setSelectedMembers([])
    } catch (error) {
      console.error('Error rejecting KYC:', error)
      toast.error('Gagal menolak KYC')
    }
  }

  async function handleBulkActivate(memberIds: string[]) {
    if (!canUpdateMembers) return

    try {
      const { error } = await supabase
        .from('members')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .in('id', memberIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'members',
        target_id: memberIds.join(','),
        action_details: {
          action: 'activate',
          count: memberIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil mengaktifkan ${memberIds.length} anggota`)
      fetchMembers()
      setSelectedMembers([])
    } catch (error) {
      console.error('Error activating members:', error)
      toast.error('Gagal mengaktifkan anggota')
    }
  }

  async function handleBulkSuspend(memberIds: string[]) {
    if (!canUpdateMembers) return

    try {
      const { error } = await supabase
        .from('members')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .in('id', memberIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_update',
        target_type: 'members',
        target_id: memberIds.join(','),
        action_details: {
          action: 'suspend',
          count: memberIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'high',
      })

      toast.success(`Berhasil menangguhkan ${memberIds.length} anggota`)
      fetchMembers()
      setSelectedMembers([])
    } catch (error) {
      console.error('Error suspending members:', error)
      toast.error('Gagal menangguhkan anggota')
    }
  }

  async function handleBulkExport(memberIds: string[]) {
    try {
      const membersToExport = members.filter(member => memberIds.includes(member.id))

      // Create CSV content
      const headers = [
        'ID Anggota', 'Nama Lengkap', 'Email', 'Telepon', 'Alamat',
        'Tanggal Lahir', 'Pekerjaan', 'Status KYC', 'Jenis Keanggotaan',
        'Status', 'Tanggal Daftar', 'Total Simpanan', 'Total Pinjaman'
      ]

      const csvContent = [
        headers.join(','),
        ...membersToExport.map(member => [
          member.member_id,
          member.full_name,
          member.email,
          member.phone,
          `"${member.address}"`,
          member.date_of_birth,
          member.occupation,
          member.kyc_status,
          member.membership_type,
          member.status,
          format(new Date(member.registration_date), 'dd/MM/yyyy'),
          member.total_savings.toString(),
          member.total_loans.toString()
        ].join(','))
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `anggota_${format(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()

      await logEvent({
        event_type: 'admin.export',
        target_type: 'members',
        target_id: memberIds.join(','),
        action_details: {
          format: 'csv',
          count: memberIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success(`Berhasil mengekspor data ${memberIds.length} anggota`)
      setSelectedMembers([])
    } catch (error) {
      console.error('Error exporting members:', error)
      toast.error('Gagal mengekspor data')
    }
  }

  async function handleBulkDelete(memberIds: string[]) {
    if (!canDeleteMembers) return

    const confirmed = confirm(
      `Apakah Anda yakin ingin menghapus ${memberIds.length} anggota? ` +
      'Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.'
    )

    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .in('id', memberIds)

      if (error) throw error

      await logEvent({
        event_type: 'admin.bulk_delete',
        target_type: 'members',
        target_id: memberIds.join(','),
        action_details: {
          count: memberIds.length,
          timestamp: new Date().toISOString(),
        },
        severity: 'high',
      })

      toast.success(`Berhasil menghapus ${memberIds.length} anggota`)
      fetchMembers()
      setSelectedMembers([])
    } catch (error) {
      console.error('Error deleting members:', error)
      toast.error('Gagal menghapus anggota')
    }
  }

  // Handle member selection
  const handleSelectMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSelectAll = () => {
    if (selectedMembers.length === paginatedMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(paginatedMembers.map(member => member.id))
    }
  }

  // Get status styling
  const getKycStatusStyle = (status: string) => {
    switch (status) {
      case 'verified':
        return 'status-success'
      case 'pending':
        return 'status-warning'
      case 'rejected':
        return 'status-error'
      case 'expired':
        return 'status-error'
      default:
        return 'status-info'
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-success'
      case 'inactive':
        return 'status-warning'
      case 'suspended':
        return 'status-error'
      default:
        return 'status-info'
    }
  }

  const getMembershipTypeStyle = (type: string) => {
    switch (type) {
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'corporate':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'regular':
        return 'bg-neutral-100 text-neutral-800 border-neutral-200'
      default:
        return 'status-info'
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (canViewMembers) {
      fetchMembers()
    }
  }, [canViewMembers, fetchMembers])

  // Access control
  if (!canViewMembers) {
    return (
      <AccessDenied
        title="Akses Ditolak"
        message="Anda tidak memiliki hak akses untuk melihat data anggota."
        showContactInfo={true}
      />
    )
  }

  if (loading) {
    return <LoadingScreen message="Memuat data anggota..." showProgress />
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
            onClick={fetchMembers}
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
          <h1 className="text-2xl font-bold text-neutral-900">Manajemen Anggota</h1>
          <p className="text-neutral-600">
            Kelola data anggota, verifikasi KYC, dan status keanggotaan
          </p>
        </div>
        {canCreateMembers && (
          <button className="admin-btn admin-btn-primary">
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Tambah Anggota
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Anggota</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {members.length.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="metric-card metric-card-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Pending KYC</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {members.filter(m => m.kyc_status === 'pending').length.toLocaleString('id-ID')}
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
              <p className="text-sm font-medium text-neutral-600">KYC Terverifikasi</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {members.filter(m => m.kyc_status === 'verified').length.toLocaleString('id-ID')}
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
              <p className="text-sm font-medium text-neutral-600">Anggota Aktif</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {members.filter(m => m.status === 'active').length.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
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
                placeholder="Cari anggota (nama, email, telepon, ID)..."
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="admin-form-group">
                <label className="admin-form-label">Status KYC</label>
                <select
                  value={filters.kycStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, kycStatus: e.target.value }))}
                  className="admin-form-input"
                >
                  <option value="">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Terverifikasi</option>
                  <option value="rejected">Ditolak</option>
                  <option value="expired">Kadaluarsa</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Jenis Keanggotaan</label>
                <select
                  value={filters.membershipType}
                  onChange={(e) => setFilters(prev => ({ ...prev, membershipType: e.target.value }))}
                  className="admin-form-input"
                >
                  <option value="">Semua Jenis</option>
                  <option value="regular">Regular</option>
                  <option value="premium">Premium</option>
                  <option value="corporate">Korporat</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Status Anggota</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="admin-form-input"
                >
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                  <option value="suspended">Ditangguhkan</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Tanggal Dari</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Tanggal Sampai</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="admin-form-input"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({
                  search: '',
                  kycStatus: '',
                  membershipType: '',
                  status: '',
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
      {selectedMembers.length > 0 && (
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-neutral-900">
                {selectedMembers.length} anggota dipilih
              </span>
              <button
                onClick={() => setSelectedMembers([])}
                className="text-sm text-neutral-500 hover:text-neutral-700"
              >
                Batal pilih
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {bulkActions
                .filter(action => hasPermission(action.permission))
                .map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (action.requiresConfirmation) {
                        const confirmed = confirm(
                          `Apakah Anda yakin ingin ${action.label.toLowerCase()} ${selectedMembers.length} anggota yang dipilih?`
                        )
                        if (confirmed) {
                          action.action(selectedMembers)
                        }
                      } else {
                        action.action(selectedMembers)
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

      {/* Members Table */}
      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedMembers.length === paginatedMembers.length && paginatedMembers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th>Anggota</th>
                <th>Kontak</th>
                <th>Status KYC</th>
                <th>Jenis</th>
                <th>Status</th>
                <th>Finansial</th>
                <th>Terdaftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => handleSelectMember(member.id)}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700">
                          {member.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{member.full_name}</div>
                        <div className="text-sm text-neutral-500">{member.member_id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="text-sm text-neutral-900">{member.email}</div>
                      <div className="text-sm text-neutral-500">{member.phone}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-indicator ${getKycStatusStyle(member.kyc_status)}`}>
                      {member.kyc_status === 'verified' && 'Terverifikasi'}
                      {member.kyc_status === 'pending' && 'Pending'}
                      {member.kyc_status === 'rejected' && 'Ditolak'}
                      {member.kyc_status === 'expired' && 'Kadaluarsa'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-indicator ${getMembershipTypeStyle(member.membership_type)}`}>
                      {member.membership_type === 'regular' && 'Regular'}
                      {member.membership_type === 'premium' && 'Premium'}
                      {member.membership_type === 'corporate' && 'Korporat'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-indicator ${getStatusStyle(member.status)}`}>
                      {member.status === 'active' && 'Aktif'}
                      {member.status === 'inactive' && 'Tidak Aktif'}
                      {member.status === 'suspended' && 'Ditangguhkan'}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div className="text-neutral-900">
                        Simpanan: {member.total_savings.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        })}
                      </div>
                      <div className="text-neutral-500">
                        Pinjaman: {member.total_loans.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        })}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-neutral-900">
                      {format(new Date(member.registration_date), 'dd MMM yyyy', { locale: id })}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // TODO: Navigate to member detail
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-600"
                        title="Lihat Detail"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {canUpdateMembers && (
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
                          // TODO: Show member actions menu
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
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-neutral-900">Tidak ada anggota</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {members.length === 0
                ? 'Belum ada anggota yang terdaftar.'
                : 'Tidak ada anggota yang sesuai dengan filter.'
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-neutral-700">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredMembers.length)} dari {filteredMembers.length} anggota
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