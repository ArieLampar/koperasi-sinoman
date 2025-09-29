'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, CreditCard, Shield, Edit, QrCode, Download, Upload,
  CheckCircle, AlertCircle, Clock, FileText, Camera, Phone,
  Mail, MapPin, Calendar, Briefcase, DollarSign, IdCard,
  Eye, Star, Award, TrendingUp
} from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

interface MemberProfile {
  id: number
  user_id: string
  full_name: string
  email: string
  phone: string
  member_number: string
  date_of_birth: string
  gender: string
  id_number: string
  id_type: string
  address: string
  city: string
  postal_code: string
  occupation: string
  monthly_income: string
  status: string
  kyc_status: string
  kyc_documents: any
  avatar_url?: string
  joined_date: string
  last_login: string
  referral_code?: string
  marketing_consent: boolean
  created_at: string
  updated_at: string
}

interface MemberStats {
  total_savings: number
  total_loans: number
  active_savings_accounts: number
  membership_points: number
  membership_level: string
}

export default function MembershipPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchMemberProfile()
      fetchMemberStats()
    }
  }, [user])

  const fetchMemberProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No member profile found
          setError('Profil anggota tidak ditemukan. Silakan lengkapi pendaftaran.')
          return
        }
        throw error
      }

      setProfile(data)
    } catch (error: any) {
      console.error('Error fetching member profile:', error)
      setError('Gagal memuat profil anggota.')
    }
  }

  const fetchMemberStats = async () => {
    try {
      // Fetch savings accounts
      const { data: savingsData } = await supabase
        .from('savings_accounts')
        .select('balance, status')
        .eq('member_id', profile?.id)

      // Fetch loans
      const { data: loansData } = await supabase
        .from('loans')
        .select('principal_amount, outstanding_balance')
        .eq('member_id', profile?.id)

      // Calculate stats
      const totalSavings = savingsData?.reduce((sum, account) => sum + (account.balance || 0), 0) || 0
      const totalLoans = loansData?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0
      const activeSavingsAccounts = savingsData?.filter(account => account.status === 'active')?.length || 0

      // Calculate membership level based on total savings
      let membershipLevel = 'Bronze'
      let membershipPoints = totalSavings / 1000 // 1 point per 1000 rupiah

      if (totalSavings >= 100000000) { // 100M
        membershipLevel = 'Platinum'
      } else if (totalSavings >= 50000000) { // 50M
        membershipLevel = 'Gold'
      } else if (totalSavings >= 10000000) { // 10M
        membershipLevel = 'Silver'
      }

      setStats({
        total_savings: totalSavings,
        total_loans: totalLoans,
        active_savings_accounts: activeSavingsAccounts,
        membership_points: Math.floor(membershipPoints),
        membership_level: membershipLevel
      })
    } catch (error: any) {
      console.error('Error fetching member stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success-600 bg-success-100'
      case 'pending_verification': return 'text-warning-600 bg-warning-100'
      case 'pending_payment': return 'text-info-600 bg-info-100'
      case 'suspended': return 'text-error-600 bg-error-100'
      case 'rejected': return 'text-error-600 bg-error-100'
      default: return 'text-neutral-600 bg-neutral-100'
    }
  }

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-success-600 bg-success-100'
      case 'pending': return 'text-warning-600 bg-warning-100'
      case 'rejected': return 'text-error-600 bg-error-100'
      case 'expired': return 'text-error-600 bg-error-100'
      default: return 'text-neutral-600 bg-neutral-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif'
      case 'pending_verification': return 'Menunggu Verifikasi'
      case 'pending_payment': return 'Menunggu Pembayaran'
      case 'suspended': return 'Ditangguhkan'
      case 'rejected': return 'Ditolak'
      default: return 'Tidak Diketahui'
    }
  }

  const getKycStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Terverifikasi'
      case 'pending': return 'Menunggu Review'
      case 'rejected': return 'Ditolak'
      case 'expired': return 'Kedaluwarsa'
      default: return 'Belum Verifikasi'
    }
  }

  const getMembershipIcon = (level: string) => {
    switch (level) {
      case 'Platinum': return <Award className="h-5 w-5 text-purple-600" />
      case 'Gold': return <Award className="h-5 w-5 text-yellow-600" />
      case 'Silver': return <Award className="h-5 w-5 text-gray-600" />
      default: return <Star className="h-5 w-5 text-orange-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat profil anggota...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-error-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">
            Profil Tidak Ditemukan
          </h1>
          <p className="text-neutral-600 mb-6">
            {error || 'Terjadi kesalahan saat memuat profil anggota.'}
          </p>
          <div className="space-y-3">
            <Link href="/auth/complete-profile" className="btn-primary w-full block text-center">
              Lengkapi Profil
            </Link>
            <Link href="/" className="btn-ghost w-full block text-center">
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Profil Keanggotaan
          </h1>
          <p className="text-neutral-600">
            Kelola informasi anggota dan status keanggotaan Anda
          </p>
        </div>

        {/* Member Overview Card */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary-600" />
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* Member Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">{profile.full_name}</h2>
                  <p className="text-neutral-600">Nomor Anggota: {profile.member_number || 'Belum ditetapkan'}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(profile.status)}`}>
                    {getStatusText(profile.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getKycStatusColor(profile.kyc_status)}`}>
                    KYC {getKycStatusText(profile.kyc_status)}
                  </span>
                </div>
              </div>

              {/* Member Stats */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-600">Total Simpanan</p>
                    <p className="text-lg font-bold text-neutral-900">
                      Rp {stats.total_savings.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-600">Rekening Aktif</p>
                    <p className="text-lg font-bold text-neutral-900">
                      {stats.active_savings_accounts}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      {getMembershipIcon(stats.membership_level)}
                      <span className="ml-1 text-sm text-neutral-600">Status</span>
                    </div>
                    <p className="text-lg font-bold text-neutral-900">
                      {stats.membership_level}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-600">Poin</p>
                    <p className="text-lg font-bold text-neutral-900">
                      {stats.membership_points.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Link href="/membership/profile" className="btn-outline flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profil
              </Link>
              <Link href="/membership/card" className="btn-primary flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Kartu Digital
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Digital Membership Card */}
          <Link href="/membership/card" className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">Kartu Digital</h3>
                <p className="text-sm text-neutral-600">Tampilkan kartu anggota digital</p>
              </div>
              <QrCode className="h-5 w-5 text-neutral-400" />
            </div>
          </Link>

          {/* KYC Management */}
          <Link href="/membership/kyc" className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-warning-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">Verifikasi KYC</h3>
                <p className="text-sm text-neutral-600">Kelola dokumen verifikasi</p>
              </div>
              <FileText className="h-5 w-5 text-neutral-400" />
            </div>
          </Link>

          {/* Profile Settings */}
          <Link href="/membership/profile" className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-success-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">Pengaturan Profil</h3>
                <p className="text-sm text-neutral-600">Update informasi pribadi</p>
              </div>
              <Edit className="h-5 w-5 text-neutral-400" />
            </div>
          </Link>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Informasi Kontak</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">Email</p>
                  <p className="font-medium text-neutral-900">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">Nomor Telepon</p>
                  <p className="font-medium text-neutral-900">{profile.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-sm text-neutral-600">Alamat</p>
                  <p className="font-medium text-neutral-900">
                    {profile.address}, {profile.city} {profile.postal_code}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Informasi Pribadi</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">Tanggal Lahir</p>
                  <p className="font-medium text-neutral-900">
                    {new Date(profile.date_of_birth).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IdCard className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">{profile.id_type.toUpperCase()}</p>
                  <p className="font-medium text-neutral-900">{profile.id_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">Pekerjaan</p>
                  <p className="font-medium text-neutral-900">{profile.occupation}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">Penghasilan Bulanan</p>
                  <p className="font-medium text-neutral-900">{profile.monthly_income}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Timeline */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Timeline Keanggotaan</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-success-50 rounded-lg">
              <div className="w-8 h-8 bg-success-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-success-900">Pendaftaran Berhasil</p>
                <p className="text-sm text-success-700">
                  {new Date(profile.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {profile.kyc_status === 'verified' && (
              <div className="flex items-center gap-4 p-3 bg-info-50 rounded-lg">
                <div className="w-8 h-8 bg-info-600 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-info-900">KYC Terverifikasi</p>
                  <p className="text-sm text-info-700">Dokumen identitas telah diverifikasi</p>
                </div>
              </div>
            )}

            {profile.status === 'active' && (
              <div className="flex items-center gap-4 p-3 bg-primary-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-primary-900">Anggota Aktif</p>
                  <p className="text-sm text-primary-700">Semua layanan koperasi dapat diakses</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}