'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/components/providers/supabase-provider'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Mail,
  Phone
} from 'lucide-react'

interface MemberStatus {
  id: string
  member_id: string
  full_name: string
  email: string
  phone: string | null
  status: 'pending' | 'active' | 'inactive' | 'suspended'
  join_date: string
}

export default function AccountStatusPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { supabase } = useSupabase()
  const [memberData, setMemberData] = useState<MemberStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchMemberData = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, member_id, full_name, email, phone, status, join_date')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching member data:', error)
        return
      }

      setMemberData(data)

      // If account is now active, redirect to dashboard
      if (data.status === 'active') {
        router.push('/')
      }
    } catch (error) {
      console.error('Exception fetching member data:', error)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchMemberData().finally(() => setLoading(false))
  }, [user, router])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMemberData()
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat status akun...</p>
        </div>
      </div>
    )
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-error-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Data Anggota Tidak Ditemukan
          </h1>
          <p className="text-neutral-600 mb-6">
            Profil anggota belum dibuat. Silakan lengkapi profil Anda terlebih dahulu.
          </p>
          <button
            onClick={() => router.push('/auth/complete-profile')}
            className="btn-primary w-full"
          >
            Lengkapi Profil
          </button>
        </div>
      </div>
    )
  }

  const getStatusInfo = () => {
    switch (memberData.status) {
      case 'pending':
        return {
          icon: Clock,
          iconColor: 'text-warning-600',
          bgColor: 'bg-warning-100',
          title: 'Menunggu Verifikasi',
          description: 'Akun Anda sedang dalam proses verifikasi oleh admin koperasi. Mohon tunggu konfirmasi lebih lanjut.',
          canRefresh: true,
        }
      case 'active':
        return {
          icon: CheckCircle,
          iconColor: 'text-success-600',
          bgColor: 'bg-success-100',
          title: 'Akun Aktif',
          description: 'Selamat! Akun Anda telah diverifikasi dan aktif. Anda dapat menggunakan semua layanan koperasi.',
          canRefresh: false,
        }
      case 'inactive':
        return {
          icon: XCircle,
          iconColor: 'text-error-600',
          bgColor: 'bg-error-100',
          title: 'Akun Tidak Aktif',
          description: 'Akun Anda saat ini tidak aktif. Silakan hubungi admin koperasi untuk informasi lebih lanjut.',
          canRefresh: true,
        }
      case 'suspended':
        return {
          icon: AlertTriangle,
          iconColor: 'text-error-600',
          bgColor: 'bg-error-100',
          title: 'Akun Disuspend',
          description: 'Akun Anda telah disuspend. Untuk informasi lebih lanjut, silakan hubungi admin koperasi.',
          canRefresh: true,
        }
      default:
        return {
          icon: Clock,
          iconColor: 'text-neutral-600',
          bgColor: 'bg-neutral-100',
          title: 'Status Tidak Dikenal',
          description: 'Status akun tidak dapat ditentukan. Silakan hubungi admin koperasi.',
          canRefresh: true,
        }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 ${statusInfo.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <StatusIcon className={`h-8 w-8 ${statusInfo.iconColor}`} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            {statusInfo.title}
          </h1>
          <p className="text-neutral-600">
            {statusInfo.description}
          </p>
        </div>

        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Informasi Akun
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">ID Anggota</span>
              <span className="font-mono font-semibold text-neutral-900">
                {memberData.member_id}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Nama Lengkap</span>
              <span className="font-semibold text-neutral-900">
                {memberData.full_name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Email</span>
              <span className="text-neutral-900">
                {memberData.email}
              </span>
            </div>

            {memberData.phone && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Telepon</span>
                <span className="text-neutral-900">
                  {memberData.phone}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Tanggal Daftar</span>
              <span className="text-neutral-900">
                {new Date(memberData.join_date).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {statusInfo.canRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-primary w-full flex items-center justify-center disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Memperbarui...' : 'Periksa Status'}
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <a
              href="mailto:admin@koperasisinoman.com"
              className="btn-secondary flex items-center justify-center"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Admin
            </a>

            <a
              href="tel:+6281234567890"
              className="btn-secondary flex items-center justify-center"
            >
              <Phone className="h-4 w-4 mr-2" />
              Telepon
            </a>
          </div>

          <button
            onClick={handleSignOut}
            className="btn-ghost w-full flex items-center justify-center text-neutral-600 hover:text-neutral-900"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </button>
        </div>

        {memberData.status === 'pending' && (
          <div className="mt-6 p-4 bg-info-50 border border-info-200 rounded-lg">
            <p className="text-sm text-info-700">
              <strong>Tips:</strong> Proses verifikasi biasanya memakan waktu 1-2 hari kerja.
              Anda akan menerima notifikasi email setelah akun diverifikasi.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}