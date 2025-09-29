'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, Mail, Phone, MapPin, Calendar, Briefcase, DollarSign,
  IdCard, Save, ArrowLeft, Upload, X, CheckCircle, AlertCircle,
  Eye, EyeOff, Lock, Camera, Edit, Trash2, Shield, Crown,
  Star, Award, TrendingUp, FileText, Clock, XCircle,
  Gift, CreditCard, Percent, Zap, Users, Target
} from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

interface ProfileFormData {
  full_name: string
  phone: string
  date_of_birth: string
  gender: string
  address: string
  city: string
  postal_code: string
  occupation: string
  monthly_income: string
  marketing_consent: boolean
}

interface PasswordFormData {
  current_password: string
  new_password: string
  confirm_password: string
}

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
  next_level_requirement?: number
  benefits_unlocked: string[]
}

const MEMBERSHIP_TIERS = {
  Bronze: {
    name: 'Bronze',
    icon: Star,
    color: 'from-orange-500 to-orange-700',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    minSavings: 0,
    benefits: [
      'Simpanan dasar dengan bunga kompetitif',
      'Akses ke layanan pinjaman mikro',
      'Customer support standar',
      'Mobile banking dasar'
    ]
  },
  Silver: {
    name: 'Silver',
    icon: Award,
    color: 'from-gray-400 to-gray-600',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    minSavings: 10000000,
    benefits: [
      'Semua benefit Bronze',
      'Bunga simpanan lebih tinggi (0.5% bonus)',
      'Limit pinjaman lebih besar',
      'Priority customer support',
      'Akses ke produk investasi dasar'
    ]
  },
  Gold: {
    name: 'Gold',
    icon: Crown,
    color: 'from-yellow-500 to-yellow-700',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    minSavings: 50000000,
    benefits: [
      'Semua benefit Silver',
      'Bunga simpanan premium (1% bonus)',
      'Bebas biaya administrasi',
      'Dedicated relationship manager',
      'Akses ke produk investasi premium',
      'Cashback untuk transaksi'
    ]
  },
  Platinum: {
    name: 'Platinum',
    icon: Crown,
    color: 'from-purple-500 to-purple-700',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    minSavings: 100000000,
    benefits: [
      'Semua benefit Gold',
      'Bunga simpanan eksklusif (1.5% bonus)',
      'Akses VIP ke semua layanan',
      'Konsultasi keuangan gratis',
      'Event eksklusif anggota Platinum',
      'Program referral dengan reward tinggi'
    ]
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null)
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const [profileData, setProfileData] = useState<ProfileFormData>({
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    postal_code: '',
    occupation: '',
    monthly_income: '',
    marketing_consent: false,
  })

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [originalData, setOriginalData] = useState<ProfileFormData | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchMemberStats()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Profil anggota tidak ditemukan')
          router.push('/auth/complete-profile')
          return
        }
        throw error
      }

      setMemberProfile(data)

      const formattedData: ProfileFormData = {
        full_name: data.full_name || '',
        phone: data.phone || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        address: data.address || '',
        city: data.city || '',
        postal_code: data.postal_code || '',
        occupation: data.occupation || '',
        monthly_income: data.monthly_income || '',
        marketing_consent: data.marketing_consent || false,
      }

      setProfileData(formattedData)
      setOriginalData(formattedData)
      setAvatarUrl(data.avatar_url)
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      toast.error('Gagal memuat profil')
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberStats = async () => {
    try {
      if (!memberProfile?.id) return

      // Fetch savings accounts
      const { data: savingsData } = await supabase
        .from('savings_accounts')
        .select('balance, status')
        .eq('member_id', memberProfile.id)

      // Fetch loans
      const { data: loansData } = await supabase
        .from('loans')
        .select('principal_amount, outstanding_balance')
        .eq('member_id', memberProfile.id)

      // Calculate stats
      const totalSavings = savingsData?.reduce((sum, account) => sum + (account.balance || 0), 0) || 0
      const totalLoans = loansData?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0
      const activeSavingsAccounts = savingsData?.filter(account => account.status === 'active')?.length || 0

      // Calculate membership level
      let membershipLevel = 'Bronze'
      let nextLevelRequirement = MEMBERSHIP_TIERS.Silver.minSavings

      if (totalSavings >= MEMBERSHIP_TIERS.Platinum.minSavings) {
        membershipLevel = 'Platinum'
        nextLevelRequirement = undefined
      } else if (totalSavings >= MEMBERSHIP_TIERS.Gold.minSavings) {
        membershipLevel = 'Gold'
        nextLevelRequirement = MEMBERSHIP_TIERS.Platinum.minSavings
      } else if (totalSavings >= MEMBERSHIP_TIERS.Silver.minSavings) {
        membershipLevel = 'Silver'
        nextLevelRequirement = MEMBERSHIP_TIERS.Gold.minSavings
      }

      const membershipPoints = Math.floor(totalSavings / 1000) // 1 point per 1000 rupiah

      // Determine unlocked benefits
      const currentTier = MEMBERSHIP_TIERS[membershipLevel as keyof typeof MEMBERSHIP_TIERS]
      const benefitsUnlocked = currentTier.benefits

      setMemberStats({
        total_savings: totalSavings,
        total_loans: totalLoans,
        active_savings_accounts: activeSavingsAccounts,
        membership_points: membershipPoints,
        membership_level: membershipLevel,
        next_level_requirement: nextLevelRequirement,
        benefits_unlocked: benefitsUnlocked
      })
    } catch (error: any) {
      console.error('Error fetching member stats:', error)
    }
  }

  // Re-fetch stats when member profile is loaded
  useEffect(() => {
    if (memberProfile) {
      fetchMemberStats()
    }
  }, [memberProfile])

  const validateProfile = () => {
    const newErrors: Record<string, string> = {}

    if (!profileData.full_name.trim()) {
      newErrors.full_name = 'Nama lengkap wajib diisi'
    } else if (profileData.full_name.trim().length < 2) {
      newErrors.full_name = 'Nama lengkap minimal 2 karakter'
    }

    if (!profileData.phone) {
      newErrors.phone = 'Nomor telepon wajib diisi'
    } else if (!/^(\\+62|62|0)8[1-9][0-9]{6,11}$/.test(profileData.phone.replace(/\\s|-/g, ''))) {
      newErrors.phone = 'Format nomor telepon tidak valid'
    }

    if (!profileData.address.trim()) {
      newErrors.address = 'Alamat wajib diisi'
    } else if (profileData.address.trim().length < 10) {
      newErrors.address = 'Alamat terlalu singkat'
    }

    if (!profileData.city.trim()) {
      newErrors.city = 'Kota wajib diisi'
    }

    if (!profileData.postal_code) {
      newErrors.postal_code = 'Kode pos wajib diisi'
    } else if (!/^[0-9]{5}$/.test(profileData.postal_code)) {
      newErrors.postal_code = 'Kode pos harus 5 digit angka'
    }

    if (!profileData.occupation.trim()) {
      newErrors.occupation = 'Pekerjaan wajib diisi'
    }

    if (!profileData.monthly_income) {
      newErrors.monthly_income = 'Penghasilan bulanan wajib dipilih'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePassword = () => {
    const newErrors: Record<string, string> = {}

    if (!passwordData.current_password) {
      newErrors.current_password = 'Password saat ini wajib diisi'
    }

    if (!passwordData.new_password) {
      newErrors.new_password = 'Password baru wajib diisi'
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = 'Password minimal 8 karakter'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/.test(passwordData.new_password)) {
      newErrors.new_password = 'Password harus mengandung huruf kecil, huruf besar, dan angka'
    }

    if (!passwordData.confirm_password) {
      newErrors.confirm_password = 'Konfirmasi password wajib diisi'
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Password tidak sama'
    }

    if (passwordData.current_password === passwordData.new_password) {
      newErrors.new_password = 'Password baru harus berbeda dengan password saat ini'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileSave = async () => {
    if (!validateProfile()) {
      return
    }

    setSaving(true)
    setErrors({})

    try {
      const { error } = await supabase
        .from('members')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id)

      if (error) throw error

      // Update auth metadata if name changed
      if (profileData.full_name !== originalData?.full_name) {
        await supabase.auth.updateUser({
          data: { full_name: profileData.full_name }
        })
      }

      setOriginalData(profileData)
      toast.success('Profil berhasil diperbarui!')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error('Gagal memperbarui profil')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!validatePassword()) {
      return
    }

    setSaving(true)
    setErrors({})

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email!,
        password: passwordData.current_password,
      })

      if (signInError) {
        setErrors({ current_password: 'Password saat ini salah' })
        setSaving(false)
        return
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })

      if (error) throw error

      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
      toast.success('Password berhasil diperbarui!')
    } catch (error: any) {
      console.error('Error updating password:', error)
      toast.error('Gagal memperbarui password')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!file) return

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG atau PNG.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB')
      return
    }

    setUploading(true)

    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user?.id}/${oldPath}`])
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${Date.now()}.${fileExt}`
      const filePath = `${user?.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path)

      // Update member profile
      const { error: updateError } = await supabase
        .from('members')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', user?.id)

      if (updateError) throw updateError

      setAvatarUrl(urlData.publicUrl)
      toast.success('Foto profil berhasil diperbarui!')
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error('Gagal mengupload foto profil')
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    if (!avatarUrl) return

    try {
      const path = avatarUrl.split('/').pop()
      if (path) {
        await supabase.storage
          .from('avatars')
          .remove([`${user?.id}/${path}`])
      }

      await supabase
        .from('members')
        .update({ avatar_url: null })
        .eq('user_id', user?.id)

      setAvatarUrl(null)
      toast.success('Foto profil berhasil dihapus!')
    } catch (error: any) {
      console.error('Error removing avatar:', error)
      toast.error('Gagal menghapus foto profil')
    }
  }

  const handleChange = (field: keyof ProfileFormData, value: string | boolean) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePasswordDataChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const hasChanges = originalData && JSON.stringify(profileData) !== JSON.stringify(originalData)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat profil...</p>
        </div>
      </div>
    )
  }

  if (!memberProfile) {
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
            Data profil anggota tidak ditemukan. Silakan lengkapi pendaftaran.
          </p>
          <div className="space-y-3">
            <Link href="/auth/complete-profile" className="btn-primary w-full block text-center">
              Lengkapi Profil
            </Link>
            <Link href="/membership" className="btn-ghost w-full block text-center">
              Kembali
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/membership"
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Pengaturan Profil</h1>
            <p className="text-neutral-600">Kelola informasi pribadi dan keamanan akun</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-neutral-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Ringkasan Profil
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Edit className="h-4 w-4 inline mr-2" />
                Edit Profil
              </button>
              <button
                onClick={() => setActiveTab('membership')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'membership'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Crown className="h-4 w-4 inline mr-2" />
                Keanggotaan
              </button>
              <button
                onClick={() => setActiveTab('kyc')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'kyc'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Shield className="h-4 w-4 inline mr-2" />
                Status KYC
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Lock className="h-4 w-4 inline mr-2" />
                Keamanan
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Member Summary Card */}
            <div className="card">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                    {memberProfile?.avatar_url ? (
                      <img
                        src={memberProfile.avatar_url}
                        alt={memberProfile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-primary-600" />
                    )}
                  </div>
                </div>

                {/* Member Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-neutral-900">{memberProfile?.full_name}</h2>
                      <p className="text-neutral-600">Nomor Anggota: {memberProfile?.member_number || 'Belum ditetapkan'}</p>
                      <p className="text-neutral-600">{memberProfile?.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        memberProfile?.status === 'active' ? 'text-success-600 bg-success-100' :
                        memberProfile?.status === 'pending_verification' ? 'text-warning-600 bg-warning-100' :
                        'text-error-600 bg-error-100'
                      }`}>
                        {memberProfile?.status === 'active' ? 'Aktif' :
                         memberProfile?.status === 'pending_verification' ? 'Pending Verifikasi' :
                         'Non-Aktif'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        memberProfile?.kyc_status === 'verified' ? 'text-success-600 bg-success-100' :
                        memberProfile?.kyc_status === 'pending' ? 'text-warning-600 bg-warning-100' :
                        'text-error-600 bg-error-100'
                      }`}>
                        KYC {memberProfile?.kyc_status === 'verified' ? 'Terverifikasi' :
                             memberProfile?.kyc_status === 'pending' ? 'Pending' :
                             'Belum Verifikasi'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  {memberStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-neutral-50 rounded-lg">
                        <p className="text-sm text-neutral-600">Total Simpanan</p>
                        <p className="text-lg font-bold text-neutral-900">
                          Rp {memberStats.total_savings.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-neutral-50 rounded-lg">
                        <p className="text-sm text-neutral-600">Rekening Aktif</p>
                        <p className="text-lg font-bold text-neutral-900">
                          {memberStats.active_savings_accounts}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-neutral-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          {(() => {
                            const tier = MEMBERSHIP_TIERS[memberStats.membership_level as keyof typeof MEMBERSHIP_TIERS]
                            const Icon = tier?.icon || Star
                            return <Icon className={`h-5 w-5 ${tier?.textColor || 'text-orange-600'}`} />
                          })()}
                          <span className="ml-1 text-sm text-neutral-600">Tier</span>
                        </div>
                        <p className="text-lg font-bold text-neutral-900">
                          {memberStats.membership_level}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-neutral-50 rounded-lg">
                        <p className="text-sm text-neutral-600">Poin</p>
                        <p className="text-lg font-bold text-neutral-900">
                          {memberStats.membership_points.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="card">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Informasi Kontak</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-600">Email</p>
                      <p className="font-medium text-neutral-900">{memberProfile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-600">Nomor Telepon</p>
                      <p className="font-medium text-neutral-900">{memberProfile?.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-600">Alamat</p>
                      <p className="font-medium text-neutral-900">
                        {memberProfile?.address}, {memberProfile?.city} {memberProfile?.postal_code}
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
                        {memberProfile?.date_of_birth ? new Date(memberProfile.date_of_birth).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-600">Jenis Kelamin</p>
                      <p className="font-medium text-neutral-900">
                        {memberProfile?.gender === 'male' ? 'Laki-laki' :
                         memberProfile?.gender === 'female' ? 'Perempuan' : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <IdCard className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-600">{memberProfile?.id_type?.toUpperCase() || 'ID'}</p>
                      <p className="font-medium text-neutral-900">{memberProfile?.id_number || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-600">Pekerjaan</p>
                      <p className="font-medium text-neutral-900">{memberProfile?.occupation || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('profile')}
                className="card hover:shadow-lg transition-shadow cursor-pointer text-left p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Edit className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">Edit Profil</h4>
                    <p className="text-sm text-neutral-600">Update informasi pribadi</p>
                  </div>
                </div>
              </button>

              <Link href="/membership/kyc" className="card hover:shadow-lg transition-shadow cursor-pointer text-left p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-warning-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">Kelola KYC</h4>
                    <p className="text-sm text-neutral-600">Upload dokumen verifikasi</p>
                  </div>
                </div>
              </Link>

              <Link href="/membership/card" className="card hover:shadow-lg transition-shadow cursor-pointer text-left p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">Kartu Digital</h4>
                    <p className="text-sm text-neutral-600">Lihat kartu anggota</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Edit Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Foto Profil</h3>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-primary-600" />
                    )}
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-loading"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex gap-3">
                    <label className="btn-outline cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Foto
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                        disabled={uploading}
                      />
                    </label>
                    {avatarUrl && (
                      <button
                        onClick={removeAvatar}
                        className="btn-ghost text-error-600 hover:text-error-700"
                        disabled={uploading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 mt-2">
                    JPG atau PNG, maksimal 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Informasi Pribadi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="form-label">Nama Lengkap *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      className={`form-input pl-10 ${errors.full_name ? 'form-input-error' : ''}`}
                      value={profileData.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  {errors.full_name && <p className="form-error">{errors.full_name}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="form-label">Nomor Telepon *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="tel"
                      className={`form-input pl-10 ${errors.phone ? 'form-input-error' : ''}`}
                      value={profileData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  {errors.phone && <p className="form-error">{errors.phone}</p>}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="form-label">Tanggal Lahir</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="date"
                      className="form-input pl-10"
                      value={profileData.date_of_birth}
                      onChange={(e) => handleChange('date_of_birth', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <p className="form-help">Tanggal lahir tidak dapat diubah setelah verifikasi KYC</p>
                </div>

                {/* Gender */}
                <div>
                  <label className="form-label">Jenis Kelamin</label>
                  <select
                    className="form-input"
                    value={profileData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    disabled={saving}
                  >
                    <option value="">Pilih jenis kelamin</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>

                {/* Occupation */}
                <div>
                  <label className="form-label">Pekerjaan *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      className={`form-input pl-10 ${errors.occupation ? 'form-input-error' : ''}`}
                      value={profileData.occupation}
                      onChange={(e) => handleChange('occupation', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  {errors.occupation && <p className="form-error">{errors.occupation}</p>}
                </div>

                {/* Monthly Income */}
                <div>
                  <label className="form-label">Penghasilan Bulanan *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-neutral-400" />
                    </div>
                    <select
                      className={`form-input pl-10 ${errors.monthly_income ? 'form-input-error' : ''}`}
                      value={profileData.monthly_income}
                      onChange={(e) => handleChange('monthly_income', e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Pilih range penghasilan</option>
                      <option value="< 2000000">< Rp 2.000.000</option>
                      <option value="2000000-5000000">Rp 2.000.000 - Rp 5.000.000</option>
                      <option value="5000000-10000000">Rp 5.000.000 - Rp 10.000.000</option>
                      <option value="10000000-20000000">Rp 10.000.000 - Rp 20.000.000</option>
                      <option value="> 20000000">> Rp 20.000.000</option>
                    </select>
                  </div>
                  {errors.monthly_income && <p className="form-error">{errors.monthly_income}</p>}
                </div>
              </div>

              {/* Address */}
              <div className="mt-6">
                <label className="form-label">Alamat Lengkap *</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <MapPin className="h-5 w-5 text-neutral-400" />
                  </div>
                  <textarea
                    className={`form-input pl-10 min-h-[80px] resize-none ${errors.address ? 'form-input-error' : ''}`}
                    value={profileData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    disabled={saving}
                    rows={3}
                  />
                </div>
                {errors.address && <p className="form-error">{errors.address}</p>}
              </div>

              {/* City & Postal Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="form-label">Kota *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.city ? 'form-input-error' : ''}`}
                    value={profileData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    disabled={saving}
                  />
                  {errors.city && <p className="form-error">{errors.city}</p>}
                </div>
                <div>
                  <label className="form-label">Kode Pos *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.postal_code ? 'form-input-error' : ''}`}
                    value={profileData.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                    disabled={saving}
                    maxLength={5}
                  />
                  {errors.postal_code && <p className="form-error">{errors.postal_code}</p>}
                </div>
              </div>

              {/* Marketing Consent */}
              <div className="mt-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    checked={profileData.marketing_consent}
                    onChange={(e) => handleChange('marketing_consent', e.target.checked)}
                    disabled={saving}
                  />
                  <span className="text-sm text-neutral-700">
                    Saya bersedia menerima informasi produk dan promosi dari Koperasi Sinoman
                  </span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <Link href="/membership" className="btn-ghost">
                Batal
              </Link>
              <button
                onClick={handleProfileSave}
                disabled={saving || !hasChanges}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-loading mr-2"></div>
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        )}

        {/* Membership Tab */}
        {activeTab === 'membership' && (
          <div className="space-y-6">
            {/* Current Membership Tier */}
            {memberStats && (
              <div className="card">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">Status Keanggotaan</h3>
                  <p className="text-neutral-600">Tier saat ini dan benefit yang Anda nikmati</p>
                </div>

                {(() => {
                  const currentTier = MEMBERSHIP_TIERS[memberStats.membership_level as keyof typeof MEMBERSHIP_TIERS]
                  const Icon = currentTier?.icon || Star
                  return (
                    <div className={`relative p-8 rounded-2xl bg-gradient-to-br ${currentTier?.color || 'from-orange-500 to-orange-700'} text-white mb-6`}>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <Icon className="h-8 w-8" />
                          <div>
                            <h4 className="text-2xl font-bold">{currentTier?.name || 'Bronze'}</h4>
                            <p className="opacity-90">Anggota {currentTier?.name || 'Bronze'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-75">Total Simpanan</p>
                          <p className="text-xl font-bold">Rp {memberStats.total_savings.toLocaleString('id-ID')}</p>
                        </div>
                      </div>

                      {/* Progress to Next Tier */}
                      {memberStats.next_level_requirement && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress ke tier berikutnya</span>
                            <span>{Math.min(100, (memberStats.total_savings / memberStats.next_level_requirement) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                            <div
                              className="bg-white h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (memberStats.total_savings / memberStats.next_level_requirement) * 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-sm opacity-75 mt-2">
                            Butuh Rp {(memberStats.next_level_requirement - memberStats.total_savings).toLocaleString('id-ID')} lagi
                          </p>
                        </div>
                      )}

                      {/* Background decoration */}
                      <div className="absolute top-4 right-4 w-20 h-20 border-2 border-white border-opacity-20 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-white border-opacity-20 rounded-full"></div>
                    </div>
                  )
                })()}

                {/* Current Benefits */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-neutral-900 mb-4">Benefit Anda Saat Ini</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {memberStats.benefits_unlocked.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-success-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-success-800">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Membership Points */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <p className="text-sm text-primary-600 mb-1">Poin Keanggotaan</p>
                    <p className="text-2xl font-bold text-primary-900">{memberStats.membership_points.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-center p-4 bg-warning-50 rounded-lg">
                    <Target className="h-8 w-8 text-warning-600 mx-auto mb-2" />
                    <p className="text-sm text-warning-600 mb-1">Rekening Aktif</p>
                    <p className="text-2xl font-bold text-warning-900">{memberStats.active_savings_accounts}</p>
                  </div>
                  <div className="text-center p-4 bg-info-50 rounded-lg">
                    <Users className="h-8 w-8 text-info-600 mx-auto mb-2" />
                    <p className="text-sm text-info-600 mb-1">Referral</p>
                    <p className="text-2xl font-bold text-info-900">0</p>
                  </div>
                </div>
              </div>
            )}

            {/* All Membership Tiers */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">Semua Tier Keanggotaan</h3>
              <div className="space-y-6">
                {Object.entries(MEMBERSHIP_TIERS).map(([key, tier]) => {
                  const Icon = tier.icon
                  const isCurrentTier = memberStats?.membership_level === key
                  const isUnlocked = memberStats ? memberStats.total_savings >= tier.minSavings : false

                  return (
                    <div key={key} className={`p-6 rounded-xl border-2 transition-all ${
                      isCurrentTier ? 'border-primary-500 bg-primary-50' :
                      isUnlocked ? 'border-success-300 bg-success-50' :
                      'border-neutral-200 bg-neutral-50'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tier.bgColor}`}>
                            <Icon className={`h-6 w-6 ${tier.textColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xl font-bold text-neutral-900">{tier.name}</h4>
                              {isCurrentTier && (
                                <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full">Tier Anda</span>
                              )}
                              {isUnlocked && !isCurrentTier && (
                                <CheckCircle className="h-5 w-5 text-success-600" />
                              )}
                            </div>
                            <p className="text-neutral-600">Minimal simpanan: Rp {tier.minSavings.toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {tier.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                              isUnlocked ? 'bg-success-600' : 'bg-neutral-400'
                            }`}>
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                            <p className={`text-sm ${
                              isUnlocked ? 'text-neutral-700' : 'text-neutral-500'
                            }`}>{benefit}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* KYC Status Tab */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            {/* KYC Status Overview */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Status Verifikasi KYC</h3>
                    <p className="text-neutral-600">Verifikasi identitas untuk keamanan akun</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    memberProfile?.kyc_status === 'verified' ? 'text-success-600 bg-success-100' :
                    memberProfile?.kyc_status === 'pending' ? 'text-warning-600 bg-warning-100' :
                    'text-error-600 bg-error-100'
                  }`}>
                    {memberProfile?.kyc_status === 'verified' ? <CheckCircle className="h-4 w-4" /> :
                     memberProfile?.kyc_status === 'pending' ? <Clock className="h-4 w-4" /> :
                     <XCircle className="h-4 w-4" />}
                    {memberProfile?.kyc_status === 'verified' ? 'Terverifikasi' :
                     memberProfile?.kyc_status === 'pending' ? 'Menunggu Review' :
                     'Belum Verifikasi'}
                  </div>
                </div>
              </div>

              {/* KYC Status Details */}
              {memberProfile?.kyc_status === 'verified' && (
                <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-success-900">Verifikasi Berhasil</p>
                      <p className="text-sm text-success-700 mt-1">
                        Identitas Anda telah terverifikasi. Semua layanan koperasi dapat diakses penuh.
                      </p>
                      {memberProfile.verified_at && (
                        <p className="text-xs text-success-600 mt-2">
                          Diverifikasi: {new Date(memberProfile.verified_at).toLocaleDateString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {memberProfile?.kyc_status === 'pending' && (
                <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-warning-900">Sedang Diproses</p>
                      <p className="text-sm text-warning-700 mt-1">
                        Dokumen KYC Anda sedang direview oleh tim verifikasi. Proses ini biasanya memakan waktu 1-3 hari kerja.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {memberProfile?.kyc_status === 'rejected' && (
                <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-error-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-error-900">Dokumen Ditolak</p>
                      <p className="text-sm text-error-700 mt-1">
                        {memberProfile.verification_notes || 'Dokumen perlu diperbaiki. Silakan upload ulang dokumen yang sesuai.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(!memberProfile?.kyc_status || memberProfile.kyc_status === 'not_submitted') && (
                <div className="p-4 bg-info-50 border border-info-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-info-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-info-900">Belum Submit Dokumen</p>
                      <p className="text-sm text-info-700 mt-1">
                        Untuk mengakses semua layanan koperasi, silakan lengkapi verifikasi KYC dengan mengupload dokumen identitas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Document Status */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Status Dokumen</h3>
              <div className="space-y-4">
                {/* ID Document */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <IdCard className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="font-medium text-neutral-900">Foto KTP/Identitas</p>
                      <p className="text-sm text-neutral-600">Dokumen identitas resmi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {memberProfile?.kyc_documents?.id_document ? (
                      <span className="px-2 py-1 bg-success-100 text-success-600 text-sm rounded-full">
                        ✓ Uploaded
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-error-100 text-error-600 text-sm rounded-full">
                        Belum Upload
                      </span>
                    )}
                  </div>
                </div>

                {/* Selfie Document */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Camera className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="font-medium text-neutral-900">Foto Selfie dengan KTP</p>
                      <p className="text-sm text-neutral-600">Selfie sambil memegang KTP</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {memberProfile?.kyc_documents?.selfie_document ? (
                      <span className="px-2 py-1 bg-success-100 text-success-600 text-sm rounded-full">
                        ✓ Uploaded
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-error-100 text-error-600 text-sm rounded-full">
                        Belum Upload
                      </span>
                    )}
                  </div>
                </div>

                {/* Income Document */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="font-medium text-neutral-900">Dokumen Penghasilan</p>
                      <p className="text-sm text-neutral-600">Slip gaji atau bukti penghasilan (opsional)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {memberProfile?.kyc_documents?.income_document ? (
                      <span className="px-2 py-1 bg-success-100 text-success-600 text-sm rounded-full">
                        ✓ Uploaded
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-sm rounded-full">
                        Tidak Wajib
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 text-center">
                <Link
                  href="/membership/kyc"
                  className="btn-primary inline-flex items-center"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {memberProfile?.kyc_status === 'rejected' ? 'Upload Ulang Dokumen' :
                   memberProfile?.kyc_status === 'verified' ? 'Lihat Dokumen KYC' :
                   'Lengkapi Verifikasi KYC'}
                </Link>
              </div>
            </div>

            {/* KYC Benefits */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Manfaat Verifikasi KYC</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-neutral-900">Akses Penuh Layanan</p>
                    <p className="text-sm text-neutral-600">Semua fitur simpan pinjam dapat diakses</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-neutral-900">Limit Transaksi Tinggi</p>
                    <p className="text-sm text-neutral-600">Limit pinjaman dan simpanan maksimal</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-neutral-900">Keamanan Terjamin</p>
                    <p className="text-sm text-neutral-600">Perlindungan identitas dan data pribadi</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-neutral-900">Produk Premium</p>
                    <p className="text-sm text-neutral-600">Akses ke produk investasi dan asuransi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Ubah Password</h3>
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="form-label">Password Saat Ini *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      className={`form-input pl-10 pr-10 ${errors.current_password ? 'form-input-error' : ''}`}
                      value={passwordData.current_password}
                      onChange={(e) => handlePasswordDataChange('current_password', e.target.value)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      )}
                    </button>
                  </div>
                  {errors.current_password && <p className="form-error">{errors.current_password}</p>}
                </div>

                {/* New Password */}
                <div>
                  <label className="form-label">Password Baru *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      className={`form-input pl-10 pr-10 ${errors.new_password ? 'form-input-error' : ''}`}
                      value={passwordData.new_password}
                      onChange={(e) => handlePasswordDataChange('new_password', e.target.value)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      )}
                    </button>
                  </div>
                  {errors.new_password && <p className="form-error">{errors.new_password}</p>}
                  <p className="form-help">Minimal 8 karakter dengan kombinasi huruf besar, kecil, dan angka</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="form-label">Konfirmasi Password Baru *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      className={`form-input pl-10 pr-10 ${errors.confirm_password ? 'form-input-error' : ''}`}
                      value={passwordData.confirm_password}
                      onChange={(e) => handlePasswordDataChange('confirm_password', e.target.value)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      )}
                    </button>
                  </div>
                  {errors.confirm_password && <p className="form-error">{errors.confirm_password}</p>}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePasswordChange}
                    disabled={saving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                    className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-loading mr-2"></div>
                    ) : (
                      <Lock className="h-5 w-5 mr-2" />
                    )}
                    {saving ? 'Memperbarui...' : 'Ubah Password'}
                  </button>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Informasi Akun</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Email</p>
                    <p className="text-sm text-neutral-600">{user?.email}</p>
                  </div>
                  <span className="px-3 py-1 bg-success-100 text-success-600 rounded-full text-sm font-medium">
                    Terverifikasi
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Two-Factor Authentication</p>
                    <p className="text-sm text-neutral-600">Tambahan keamanan untuk akun Anda</p>
                  </div>
                  <button className="btn-outline">
                    Aktifkan 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}