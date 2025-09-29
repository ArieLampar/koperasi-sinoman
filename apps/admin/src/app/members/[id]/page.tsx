'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useAudit } from '@/components/providers/audit-provider'
import { useSupabase } from '@/components/providers/supabase-provider'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { AccessDenied } from '@/components/ui/access-denied'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  UserIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
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
  notes?: string
  created_at: string
  updated_at: string
}

interface KycDocument {
  id: string
  member_id: string
  document_type: 'ktp' | 'npwp' | 'selfie' | 'signature' | 'address_proof'
  document_url: string
  document_name: string
  upload_date: string
  status: 'pending' | 'approved' | 'rejected'
  verified_by?: string
  verified_at?: string
  rejection_reason?: string
}

interface SavingsAccount {
  id: string
  member_id: string
  account_number: string
  account_type: 'pokok' | 'wajib' | 'sukarela' | 'berjangka'
  balance: number
  created_at: string
  last_transaction: string
}

interface SavingsTransaction {
  id: string
  account_id: string
  transaction_type: 'deposit' | 'withdrawal' | 'interest'
  amount: number
  balance_after: number
  description: string
  created_at: string
  created_by: string
}

interface Loan {
  id: string
  member_id: string
  loan_number: string
  loan_type: string
  principal_amount: number
  outstanding_amount: number
  interest_rate: number
  term_months: number
  monthly_payment: number
  status: 'pending' | 'active' | 'completed' | 'defaulted'
  disbursement_date?: string
  created_at: string
}

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = useAuth()
  const { logEvent } = useAudit()
  const { supabase } = useSupabase()

  // State
  const [member, setMember] = useState<Member | null>(null)
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([])
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([])
  const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'savings' | 'loans' | 'activity'>('overview')
  const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null)
  const [kycRejectReason, setKycRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const memberId = params.id as string

  // Check permissions
  const canViewMembers = hasPermission('members.read')
  const canUpdateMembers = hasPermission('members.update')
  const canDeleteMembers = hasPermission('members.delete')

  // Fetch member data
  const fetchMemberData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch member basic info
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single()

      if (memberError) throw memberError

      setMember(memberData)

      // Fetch KYC documents
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('member_id', memberId)
        .order('upload_date', { ascending: false })

      if (kycError) console.error('Error fetching KYC documents:', kycError)
      else setKycDocuments(kycData || [])

      // Fetch savings accounts
      const { data: savingsData, error: savingsError } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

      if (savingsError) console.error('Error fetching savings accounts:', savingsError)
      else setSavingsAccounts(savingsData || [])

      // Fetch recent savings transactions
      if (savingsData && savingsData.length > 0) {
        const accountIds = savingsData.map(account => account.id)
        const { data: transactionData, error: transactionError } = await supabase
          .from('savings_transactions')
          .select('*')
          .in('account_id', accountIds)
          .order('created_at', { ascending: false })
          .limit(20)

        if (transactionError) console.error('Error fetching transactions:', transactionError)
        else setSavingsTransactions(transactionData || [])
      }

      // Fetch loans
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

      if (loansError) console.error('Error fetching loans:', loansError)
      else setLoans(loansData || [])

      // Log member detail access
      await logEvent({
        event_type: 'admin.view',
        target_type: 'member_detail',
        target_id: memberId,
        action_details: {
          member_id: memberData.member_id,
          member_name: memberData.full_name,
          timestamp: new Date().toISOString(),
        },
        severity: 'low',
      })

    } catch (error) {
      console.error('Error fetching member data:', error)
      setError('Gagal memuat data anggota')
      toast.error('Gagal memuat data anggota')
    } finally {
      setLoading(false)
    }
  }, [memberId, supabase, logEvent])

  // Handle KYC approval
  const handleApproveKyc = useCallback(async () => {
    if (!canUpdateMembers || !member) return

    try {
      setActionLoading(true)

      const { error } = await supabase
        .from('members')
        .update({
          kyc_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)

      if (error) throw error

      // Update KYC documents status
      await supabase
        .from('kyc_documents')
        .update({
          status: 'approved',
          verified_at: new Date().toISOString()
        })
        .eq('member_id', memberId)

      await logEvent({
        event_type: 'admin.kyc_approve',
        target_type: 'member',
        target_id: memberId,
        action_details: {
          member_id: member.member_id,
          member_name: member.full_name,
          previous_status: member.kyc_status,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success('KYC berhasil diverifikasi')
      fetchMemberData()
    } catch (error) {
      console.error('Error approving KYC:', error)
      toast.error('Gagal memverifikasi KYC')
    } finally {
      setActionLoading(false)
    }
  }, [canUpdateMembers, member, memberId, supabase, logEvent, fetchMemberData])

  // Handle KYC rejection
  const handleRejectKyc = useCallback(async () => {
    if (!canUpdateMembers || !member || !kycRejectReason.trim()) return

    try {
      setActionLoading(true)

      const { error } = await supabase
        .from('members')
        .update({
          kyc_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)

      if (error) throw error

      // Update KYC documents status with rejection reason
      await supabase
        .from('kyc_documents')
        .update({
          status: 'rejected',
          verified_at: new Date().toISOString(),
          rejection_reason: kycRejectReason
        })
        .eq('member_id', memberId)

      await logEvent({
        event_type: 'admin.kyc_reject',
        target_type: 'member',
        target_id: memberId,
        action_details: {
          member_id: member.member_id,
          member_name: member.full_name,
          previous_status: member.kyc_status,
          rejection_reason: kycRejectReason,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      })

      toast.success('KYC berhasil ditolak')
      setShowRejectModal(false)
      setKycRejectReason('')
      fetchMemberData()
    } catch (error) {
      console.error('Error rejecting KYC:', error)
      toast.error('Gagal menolak KYC')
    } finally {
      setActionLoading(false)
    }
  }, [canUpdateMembers, member, memberId, kycRejectReason, supabase, logEvent, fetchMemberData])

  // Handle member status update
  const handleUpdateStatus = useCallback(async (newStatus: 'active' | 'inactive' | 'suspended') => {
    if (!canUpdateMembers || !member) return

    const confirmed = confirm(
      `Apakah Anda yakin ingin mengubah status anggota menjadi ${newStatus}?`
    )

    if (!confirmed) return

    try {
      setActionLoading(true)

      const { error } = await supabase
        .from('members')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)

      if (error) throw error

      await logEvent({
        event_type: 'admin.status_update',
        target_type: 'member',
        target_id: memberId,
        action_details: {
          member_id: member.member_id,
          member_name: member.full_name,
          previous_status: member.status,
          new_status: newStatus,
          timestamp: new Date().toISOString(),
        },
        severity: newStatus === 'suspended' ? 'high' : 'medium',
      })

      toast.success(`Status anggota berhasil diubah menjadi ${newStatus}`)
      fetchMemberData()
    } catch (error) {
      console.error('Error updating member status:', error)
      toast.error('Gagal mengubah status anggota')
    } finally {
      setActionLoading(false)
    }
  }, [canUpdateMembers, member, memberId, supabase, logEvent, fetchMemberData])

  // Get status styling functions
  const getKycStatusStyle = (status: string) => {
    switch (status) {
      case 'verified': return 'status-success'
      case 'pending': return 'status-warning'
      case 'rejected': return 'status-error'
      case 'expired': return 'status-error'
      default: return 'status-info'
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'status-success'
      case 'inactive': return 'status-warning'
      case 'suspended': return 'status-error'
      default: return 'status-info'
    }
  }

  const getMembershipTypeStyle = (type: string) => {
    switch (type) {
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'corporate': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'regular': return 'bg-neutral-100 text-neutral-800 border-neutral-200'
      default: return 'status-info'
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'ktp': return 'KTP'
      case 'npwp': return 'NPWP'
      case 'selfie': return 'Foto Selfie'
      case 'signature': return 'Tanda Tangan'
      case 'address_proof': return 'Bukti Alamat'
      default: return type
    }
  }

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'pokok': return 'Simpanan Pokok'
      case 'wajib': return 'Simpanan Wajib'
      case 'sukarela': return 'Simpanan Sukarela'
      case 'berjangka': return 'Simpanan Berjangka'
      default: return type
    }
  }

  // Calculate totals
  const totalSavings = savingsAccounts.reduce((sum, account) => sum + account.balance, 0)
  const totalLoans = loans.filter(loan => loan.status === 'active').reduce((sum, loan) => sum + loan.outstanding_amount, 0)

  // Initial data fetch
  useEffect(() => {
    if (canViewMembers && memberId) {
      fetchMemberData()
    }
  }, [canViewMembers, memberId, fetchMemberData])

  // Access control
  if (!canViewMembers) {
    return (
      <AccessDenied
        title="Akses Ditolak"
        message="Anda tidak memiliki hak akses untuk melihat detail anggota."
        showContactInfo={true}
      />
    )
  }

  if (loading) {
    return <LoadingScreen message="Memuat detail anggota..." showProgress />
  }

  if (error || !member) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            {error || 'Anggota tidak ditemukan'}
          </h3>
          <p className="text-neutral-600 mb-4">
            {error || 'Data anggota yang Anda cari tidak ditemukan.'}
          </p>
          <div className="space-x-3">
            <button
              onClick={() => router.back()}
              className="admin-btn admin-btn-secondary"
            >
              Kembali
            </button>
            {error && (
              <button
                onClick={fetchMemberData}
                className="admin-btn admin-btn-primary"
              >
                Coba Lagi
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Detail Anggota</h1>
            <p className="text-neutral-600">
              Informasi lengkap dan aktivitas anggota
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {canUpdateMembers && (
            <button className="admin-btn admin-btn-secondary">
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit
            </button>
          )}
          {canDeleteMembers && (
            <button className="admin-btn admin-btn-danger">
              <TrashIcon className="h-5 w-5 mr-2" />
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* Member Profile Card */}
      <div className="admin-card">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {member.full_name.charAt(0).toUpperCase()}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-3">
              <h2 className="text-xl font-semibold text-neutral-900">{member.full_name}</h2>
              <span className={`status-indicator ${getKycStatusStyle(member.kyc_status)}`}>
                {member.kyc_status === 'verified' && 'KYC Terverifikasi'}
                {member.kyc_status === 'pending' && 'KYC Pending'}
                {member.kyc_status === 'rejected' && 'KYC Ditolak'}
                {member.kyc_status === 'expired' && 'KYC Kadaluarsa'}
              </span>
              <span className={`status-indicator ${getStatusStyle(member.status)}`}>
                {member.status === 'active' && 'Aktif'}
                {member.status === 'inactive' && 'Tidak Aktif'}
                {member.status === 'suspended' && 'Ditangguhkan'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">ID Anggota:</span>
                <span className="font-medium">{member.member_id}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`status-indicator ${getMembershipTypeStyle(member.membership_type)}`}>
                  {member.membership_type === 'regular' && 'Regular'}
                  {member.membership_type === 'premium' && 'Premium'}
                  {member.membership_type === 'corporate' && 'Korporat'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">Email:</span>
                <span className="font-medium">{member.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">Telepon:</span>
                <span className="font-medium">{member.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">Bergabung:</span>
                <span className="font-medium">
                  {format(new Date(member.registration_date), 'dd MMMM yyyy', { locale: id })}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">Aktivitas terakhir:</span>
                <span className="font-medium">
                  {format(new Date(member.last_activity), 'dd MMM yyyy', { locale: id })}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="w-64 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Total Simpanan</p>
                  <p className="text-lg font-semibold text-green-900">
                    {totalSavings.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <BanknotesIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Pinjaman</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {totalLoans.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <CreditCardIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {canUpdateMembers && member.kyc_status === 'pending' && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Aksi KYC</h3>
                <p className="text-sm text-neutral-600">Verifikasi atau tolak dokumen KYC anggota</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="admin-btn admin-btn-secondary"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Tolak KYC
                </button>
                <button
                  onClick={handleApproveKyc}
                  disabled={actionLoading}
                  className="admin-btn admin-btn-primary"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Memproses...' : 'Verifikasi KYC'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="admin-card">
        <div className="border-b border-neutral-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Ringkasan', icon: UserIcon },
              { id: 'kyc', label: 'Dokumen KYC', icon: ShieldCheckIcon },
              { id: 'savings', label: 'Simpanan', icon: BanknotesIcon },
              { id: 'loans', label: 'Pinjaman', icon: CreditCardIcon },
              { id: 'activity', label: 'Aktivitas', icon: ClipboardDocumentListIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Informasi Pribadi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-700">Nama Lengkap</label>
                      <p className="mt-1 text-neutral-900">{member.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700">Email</label>
                      <p className="mt-1 text-neutral-900">{member.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700">Telepon</label>
                      <p className="mt-1 text-neutral-900">{member.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700">Tanggal Lahir</label>
                      <p className="mt-1 text-neutral-900">
                        {format(new Date(member.date_of_birth), 'dd MMMM yyyy', { locale: id })}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-700">Alamat</label>
                      <p className="mt-1 text-neutral-900">{member.address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700">Pekerjaan</label>
                      <p className="mt-1 text-neutral-900">{member.occupation}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700">Status KYC</label>
                      <div className="mt-1">
                        <span className={`status-indicator ${getKycStatusStyle(member.kyc_status)}`}>
                          {member.kyc_status === 'verified' && 'Terverifikasi'}
                          {member.kyc_status === 'pending' && 'Pending'}
                          {member.kyc_status === 'rejected' && 'Ditolak'}
                          {member.kyc_status === 'expired' && 'Kadaluarsa'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700">Status Anggota</label>
                      <div className="mt-1 flex items-center space-x-3">
                        <span className={`status-indicator ${getStatusStyle(member.status)}`}>
                          {member.status === 'active' && 'Aktif'}
                          {member.status === 'inactive' && 'Tidak Aktif'}
                          {member.status === 'suspended' && 'Ditangguhkan'}
                        </span>
                        {canUpdateMembers && (
                          <div className="flex space-x-2">
                            {member.status !== 'active' && (
                              <button
                                onClick={() => handleUpdateStatus('active')}
                                className="text-sm text-green-600 hover:text-green-700"
                              >
                                Aktifkan
                              </button>
                            )}
                            {member.status !== 'suspended' && (
                              <button
                                onClick={() => handleUpdateStatus('suspended')}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Tangguhkan
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {member.notes && (
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-4">Catatan</h3>
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <p className="text-neutral-700">{member.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KYC Documents Tab */}
          {activeTab === 'kyc' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-neutral-900">Dokumen KYC</h3>
                <span className={`status-indicator ${getKycStatusStyle(member.kyc_status)}`}>
                  {member.kyc_status === 'verified' && 'KYC Terverifikasi'}
                  {member.kyc_status === 'pending' && 'KYC Pending'}
                  {member.kyc_status === 'rejected' && 'KYC Ditolak'}
                  {member.kyc_status === 'expired' && 'KYC Kadaluarsa'}
                </span>
              </div>

              {kycDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {kycDocuments.map((doc) => (
                    <div key={doc.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-neutral-900">
                          {getDocumentTypeLabel(doc.document_type)}
                        </h4>
                        <span className={`status-indicator ${getKycStatusStyle(doc.status)}`}>
                          {doc.status === 'approved' && 'Disetujui'}
                          {doc.status === 'pending' && 'Pending'}
                          {doc.status === 'rejected' && 'Ditolak'}
                        </span>
                      </div>

                      {/* Document Preview */}
                      <div className="mb-3">
                        <div className="aspect-video bg-neutral-100 rounded-lg flex items-center justify-center">
                          <DocumentTextIcon className="h-12 w-12 text-neutral-400" />
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-neutral-600">Nama file:</span>
                          <p className="font-medium">{doc.document_name}</p>
                        </div>
                        <div>
                          <span className="text-neutral-600">Diupload:</span>
                          <p className="font-medium">
                            {format(new Date(doc.upload_date), 'dd MMM yyyy', { locale: id })}
                          </p>
                        </div>
                        {doc.verified_at && (
                          <div>
                            <span className="text-neutral-600">Diverifikasi:</span>
                            <p className="font-medium">
                              {format(new Date(doc.verified_at), 'dd MMM yyyy', { locale: id })}
                            </p>
                          </div>
                        )}
                        {doc.rejection_reason && (
                          <div>
                            <span className="text-neutral-600">Alasan ditolak:</span>
                            <p className="text-red-600 font-medium">{doc.rejection_reason}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => setSelectedDocument(doc)}
                          className="flex-1 admin-btn admin-btn-secondary text-xs"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Lihat
                        </button>
                        <button className="admin-btn admin-btn-secondary text-xs">
                          <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                          Unduh
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                  <h3 className="text-sm font-medium text-neutral-900 mb-2">Belum ada dokumen KYC</h3>
                  <p className="text-sm text-neutral-500">
                    Anggota belum mengunggah dokumen KYC.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Savings Tab */}
          {activeTab === 'savings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-neutral-900">Rekening Simpanan</h3>
                <div className="text-right">
                  <p className="text-sm text-neutral-600">Total Simpanan</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {totalSavings.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>

              {savingsAccounts.length > 0 ? (
                <div className="space-y-4">
                  {savingsAccounts.map((account) => (
                    <div key={account.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-neutral-900">
                            {getAccountTypeLabel(account.account_type)}
                          </h4>
                          <p className="text-sm text-neutral-600">No. Rekening: {account.account_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-neutral-900">
                            {account.balance.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                          </p>
                          <p className="text-sm text-neutral-600">
                            Dibuka: {format(new Date(account.created_at), 'dd MMM yyyy', { locale: id })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BanknotesIcon className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                  <h3 className="text-sm font-medium text-neutral-900 mb-2">Belum ada rekening simpanan</h3>
                  <p className="text-sm text-neutral-500">
                    Anggota belum memiliki rekening simpanan.
                  </p>
                </div>
              )}

              {/* Recent Transactions */}
              {savingsTransactions.length > 0 && (
                <div>
                  <h4 className="font-medium text-neutral-900 mb-4">Transaksi Terbaru</h4>
                  <div className="space-y-3">
                    {savingsTransactions.slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-neutral-100">
                        <div>
                          <p className="font-medium text-neutral-900">{transaction.description}</p>
                          <p className="text-sm text-neutral-600">
                            {format(new Date(transaction.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            transaction.transaction_type === 'deposit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.transaction_type === 'deposit' ? '+' : '-'}
                            {transaction.amount.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                          </p>
                          <p className="text-sm text-neutral-600">
                            Saldo: {transaction.balance_after.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loans Tab */}
          {activeTab === 'loans' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-neutral-900">Pinjaman</h3>
                <div className="text-right">
                  <p className="text-sm text-neutral-600">Total Pinjaman Aktif</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {totalLoans.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>

              {loans.length > 0 ? (
                <div className="space-y-4">
                  {loans.map((loan) => (
                    <div key={loan.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-neutral-900">{loan.loan_type}</h4>
                          <p className="text-sm text-neutral-600">No. Pinjaman: {loan.loan_number}</p>
                        </div>
                        <span className={`status-indicator ${
                          loan.status === 'active' ? 'status-success' :
                          loan.status === 'pending' ? 'status-warning' :
                          loan.status === 'completed' ? 'status-info' : 'status-error'
                        }`}>
                          {loan.status === 'active' && 'Aktif'}
                          {loan.status === 'pending' && 'Pending'}
                          {loan.status === 'completed' && 'Selesai'}
                          {loan.status === 'defaulted' && 'Bermasalah'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-neutral-600">Pokok Pinjaman</span>
                          <p className="font-medium text-neutral-900">
                            {loan.principal_amount.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-neutral-600">Sisa Pinjaman</span>
                          <p className="font-medium text-neutral-900">
                            {loan.outstanding_amount.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-neutral-600">Bunga</span>
                          <p className="font-medium text-neutral-900">{loan.interest_rate}% / tahun</p>
                        </div>
                        <div>
                          <span className="text-neutral-600">Tenor</span>
                          <p className="font-medium text-neutral-900">{loan.term_months} bulan</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-neutral-600">Cicilan per bulan</span>
                            <p className="font-medium text-neutral-900">
                              {loan.monthly_payment.toLocaleString('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                              })}
                            </p>
                          </div>
                          {loan.disbursement_date && (
                            <div className="text-right">
                              <span className="text-sm text-neutral-600">Tanggal Pencairan</span>
                              <p className="font-medium text-neutral-900">
                                {format(new Date(loan.disbursement_date), 'dd MMM yyyy', { locale: id })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCardIcon className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                  <h3 className="text-sm font-medium text-neutral-900 mb-2">Belum ada pinjaman</h3>
                  <p className="text-sm text-neutral-500">
                    Anggota belum memiliki pinjaman.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-neutral-900">Riwayat Aktivitas</h3>

              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                <h3 className="text-sm font-medium text-neutral-900 mb-2">Riwayat aktivitas akan segera hadir</h3>
                <p className="text-sm text-neutral-500">
                  Fitur ini sedang dalam pengembangan.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KYC Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={() => setShowRejectModal(false)} />

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900">Tolak Verifikasi KYC</h3>
              </div>

              <p className="text-sm text-neutral-600 mb-4">
                Berikan alasan penolakan KYC untuk anggota <strong>{member.full_name}</strong>:
              </p>

              <textarea
                value={kycRejectReason}
                onChange={(e) => setKycRejectReason(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setKycRejectReason('')
                  }}
                  className="admin-btn admin-btn-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={handleRejectKyc}
                  disabled={!kycRejectReason.trim() || actionLoading}
                  className="admin-btn admin-btn-danger"
                >
                  {actionLoading ? 'Memproses...' : 'Tolak KYC'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}