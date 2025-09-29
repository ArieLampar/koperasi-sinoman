'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle,
  ArrowRight, ArrowLeft, Upload, X, FileText, Camera,
  MapPin, Calendar, Phone, Briefcase, DollarSign,
  Gift, CreditCard, Shield, Info
} from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

interface FormData {
  // Step 1: Basic Information
  full_name: string
  email: string
  password: string
  confirm_password: string
  phone: string
  referral_code?: string

  // Step 2: Personal Details
  date_of_birth: string
  gender: string
  id_number: string
  id_type: string
  address: string
  city: string
  postal_code: string
  occupation: string
  monthly_income: string

  // Step 3: KYC Documents
  id_document?: File
  selfie_document?: File
  income_document?: File

  // Step 4: Savings Setup
  initial_deposit: string
  savings_type: string
  auto_debit: boolean
  auto_debit_amount: string

  // Terms
  agree_terms: boolean
  agree_privacy: boolean
  agree_marketing: boolean
}

const STEPS = [
  { id: 1, title: 'Informasi Dasar', description: 'Email dan password' },
  { id: 2, title: 'Data Pribadi', description: 'Identitas dan alamat' },
  { id: 3, title: 'Dokumen KYC', description: 'Upload dokumen identitas' },
  { id: 4, title: 'Setup Simpanan', description: 'Pengaturan simpanan awal' },
]

const SAVINGS_TYPES = [
  { id: 'wajib', name: 'Simpanan Wajib', min: 50000, description: 'Simpanan rutin bulanan' },
  { id: 'sukarela', name: 'Simpanan Sukarela', min: 100000, description: 'Simpanan dengan bunga kompetitif' },
  { id: 'berjangka', name: 'Simpanan Berjangka', min: 1000000, description: 'Deposito dengan tenor tertentu' },
]

export default function RegisterPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    referral_code: '',
    date_of_birth: '',
    gender: '',
    id_number: '',
    id_type: 'ktp',
    address: '',
    city: '',
    postal_code: '',
    occupation: '',
    monthly_income: '',
    initial_deposit: '50000',
    savings_type: 'wajib',
    auto_debit: false,
    auto_debit_amount: '50000',
    agree_terms: false,
    agree_privacy: false,
    agree_marketing: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { file: File; preview: string }>>({})

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        // Basic Information
        if (!formData.full_name.trim()) {
          newErrors.full_name = 'Nama lengkap wajib diisi'
        } else if (formData.full_name.trim().length < 2) {
          newErrors.full_name = 'Nama lengkap minimal 2 karakter'
        }

        if (!formData.email) {
          newErrors.email = 'Email wajib diisi'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Format email tidak valid'
        }

        if (!formData.phone) {
          newErrors.phone = 'Nomor telepon wajib diisi'
        } else if (!/^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(formData.phone.replace(/\s|-/g, ''))) {
          newErrors.phone = 'Format nomor telepon tidak valid'
        }

        if (!formData.password) {
          newErrors.password = 'Password wajib diisi'
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password minimal 8 karakter'
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          newErrors.password = 'Password harus mengandung huruf kecil, huruf besar, dan angka'
        }

        if (!formData.confirm_password) {
          newErrors.confirm_password = 'Konfirmasi password wajib diisi'
        } else if (formData.password !== formData.confirm_password) {
          newErrors.confirm_password = 'Password tidak sama'
        }
        break

      case 2:
        // Personal Details
        if (!formData.date_of_birth) {
          newErrors.date_of_birth = 'Tanggal lahir wajib diisi'
        } else {
          const birthDate = new Date(formData.date_of_birth)
          const age = new Date().getFullYear() - birthDate.getFullYear()
          if (age < 17) {
            newErrors.date_of_birth = 'Usia minimal 17 tahun'
          } else if (age > 80) {
            newErrors.date_of_birth = 'Usia maksimal 80 tahun'
          }
        }

        if (!formData.gender) {
          newErrors.gender = 'Jenis kelamin wajib dipilih'
        }

        if (!formData.id_number) {
          newErrors.id_number = 'Nomor identitas wajib diisi'
        } else if (formData.id_type === 'ktp' && !/^[0-9]{16}$/.test(formData.id_number)) {
          newErrors.id_number = 'NIK harus 16 digit angka'
        }

        if (!formData.address.trim()) {
          newErrors.address = 'Alamat wajib diisi'
        } else if (formData.address.trim().length < 10) {
          newErrors.address = 'Alamat terlalu singkat'
        }

        if (!formData.city.trim()) {
          newErrors.city = 'Kota wajib diisi'
        }

        if (!formData.postal_code) {
          newErrors.postal_code = 'Kode pos wajib diisi'
        } else if (!/^[0-9]{5}$/.test(formData.postal_code)) {
          newErrors.postal_code = 'Kode pos harus 5 digit angka'
        }

        if (!formData.occupation.trim()) {
          newErrors.occupation = 'Pekerjaan wajib diisi'
        }

        if (!formData.monthly_income) {
          newErrors.monthly_income = 'Penghasilan bulanan wajib dipilih'
        }
        break

      case 3:
        // KYC Documents
        if (!uploadedFiles.id_document) {
          newErrors.id_document = 'Foto KTP/identitas wajib diupload'
        }

        if (!uploadedFiles.selfie_document) {
          newErrors.selfie_document = 'Foto selfie dengan KTP wajib diupload'
        }
        break

      case 4:
        // Savings Setup
        const minDeposit = SAVINGS_TYPES.find(t => t.id === formData.savings_type)?.min || 50000
        const depositAmount = parseInt(formData.initial_deposit.replace(/[^0-9]/g, ''))

        if (!formData.initial_deposit || depositAmount < minDeposit) {
          newErrors.initial_deposit = `Setoran awal minimal Rp ${minDeposit.toLocaleString('id-ID')}`
        }

        if (formData.auto_debit) {
          const autoDebitAmount = parseInt(formData.auto_debit_amount.replace(/[^0-9]/g, ''))
          if (!formData.auto_debit_amount || autoDebitAmount < 50000) {
            newErrors.auto_debit_amount = 'Jumlah auto debit minimal Rp 50.000'
          }
        }

        if (!formData.agree_terms) {
          newErrors.agree_terms = 'Anda harus menyetujui syarat dan ketentuan'
        }

        if (!formData.agree_privacy) {
          newErrors.agree_privacy = 'Anda harus menyetujui kebijakan privasi'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileUpload = useCallback(async (file: File, type: string) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    // Create preview for images
    let preview = ''
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file)
    }

    setUploadedFiles(prev => ({
      ...prev,
      [type]: { file, preview }
    }))

    // Clear any existing errors for this field
    if (errors[type]) {
      setErrors(prev => ({ ...prev, [type]: '' }))
    }
  }, [errors])

  const removeFile = (type: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev }
      if (newFiles[type]?.preview) {
        URL.revokeObjectURL(newFiles[type].preview)
      }
      delete newFiles[type]
      return newFiles
    })
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // Upload documents first
      const documentUrls: Record<string, string> = {}

      for (const [type, fileData] of Object.entries(uploadedFiles)) {
        if (fileData?.file) {
          setUploading(type)
          const fileExt = fileData.file.name.split('.').pop()
          const fileName = `${Date.now()}-${type}.${fileExt}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('kyc-documents')
            .upload(`temp/${fileName}`, fileData.file)

          if (uploadError) {
            throw new Error(`Gagal upload ${type}: ${uploadError.message}`)
          }

          documentUrls[type] = uploadData.path
        }
      }

      setUploading(null)

      // Create user account
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name.trim(),
            phone: formData.phone.replace(/\s|-/g, ''),
            registration_data: {
              personal: {
                date_of_birth: formData.date_of_birth,
                gender: formData.gender,
                id_number: formData.id_number,
                id_type: formData.id_type,
                address: formData.address.trim(),
                city: formData.city.trim(),
                postal_code: formData.postal_code,
                occupation: formData.occupation.trim(),
                monthly_income: formData.monthly_income,
              },
              kyc_documents: documentUrls,
              savings: {
                type: formData.savings_type,
                initial_deposit: parseInt(formData.initial_deposit.replace(/[^0-9]/g, '')),
                auto_debit: formData.auto_debit,
                auto_debit_amount: formData.auto_debit ? parseInt(formData.auto_debit_amount.replace(/[^0-9]/g, '')) : null,
              },
              referral_code: formData.referral_code || null,
              marketing_consent: formData.agree_marketing,
            },
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrors({ general: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.' })
          setCurrentStep(1)
        } else if (error.message.includes('Password should be at least')) {
          setErrors({ general: 'Password terlalu lemah. Gunakan kombinasi huruf dan angka.' })
          setCurrentStep(1)
        } else {
          setErrors({ general: error.message })
        }
        return
      }

      if (data.user) {
        toast.success('Pendaftaran berhasil! Silakan cek email untuk verifikasi.')
        router.push('/auth/verify?email=' + encodeURIComponent(formData.email))
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      setErrors({ general: error.message || 'Terjadi kesalahan. Silakan coba lagi.' })
    } finally {
      setLoading(false)
      setUploading(null)
    }
  }

  const handleChange = (field: keyof FormData, value: string | boolean | File) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatCurrency = (value: string) => {
    const number = value.replace(/[^0-9]/g, '')
    return new Intl.NumberFormat('id-ID').format(parseInt(number) || 0)
  }

  const handleCurrencyChange = (field: keyof FormData, value: string) => {
    const formatted = formatCurrency(value)
    handleChange(field, formatted)
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Informasi Dasar
        </h2>
        <p className="text-neutral-600">
          Mari mulai dengan informasi dasar Anda
        </p>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="form-label">Nama Lengkap *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              autoComplete="name"
              className={`form-input pl-10 ${errors.full_name ? 'form-input-error' : ''}`}
              placeholder="Nama sesuai KTP"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              disabled={loading}
            />
          </div>
          {errors.full_name && <p className="form-error">{errors.full_name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="form-label">Email *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="email"
              autoComplete="email"
              className={`form-input pl-10 ${errors.email ? 'form-input-error' : ''}`}
              placeholder="contoh@email.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={loading}
            />
          </div>
          {errors.email && <p className="form-error">{errors.email}</p>}
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
              autoComplete="tel"
              className={`form-input pl-10 ${errors.phone ? 'form-input-error' : ''}`}
              placeholder="081234567890"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={loading}
            />
          </div>
          {errors.phone && <p className="form-error">{errors.phone}</p>}
          <p className="form-help">Format: 08xxxxxxxxxx</p>
        </div>

        {/* Password */}
        <div>
          <label className="form-label">Password *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`form-input pl-10 pr-10 ${errors.password ? 'form-input-error' : ''}`}
              placeholder="Minimal 8 karakter"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
              ) : (
                <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
              )}
            </button>
          </div>
          {errors.password && <p className="form-error">{errors.password}</p>}
          <p className="form-help">Kombinasi huruf besar, kecil, dan angka</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="form-label">Konfirmasi Password *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`form-input pl-10 pr-10 ${errors.confirm_password ? 'form-input-error' : ''}`}
              placeholder="Ulangi password"
              value={formData.confirm_password}
              onChange={(e) => handleChange('confirm_password', e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
              ) : (
                <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
              )}
            </button>
          </div>
          {errors.confirm_password && <p className="form-error">{errors.confirm_password}</p>}
        </div>

        {/* Referral Code */}
        <div>
          <label className="form-label">Kode Referral (Opsional)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Gift className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Masukkan kode referral"
              value={formData.referral_code}
              onChange={(e) => handleChange('referral_code', e.target.value.toUpperCase())}
              disabled={loading}
            />
          </div>
          <p className="form-help">Dapatkan bonus dengan kode referral dari anggota lain</p>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Data Pribadi
        </h2>
        <p className="text-neutral-600">
          Lengkapi informasi identitas dan alamat Anda
        </p>
      </div>

      <div className="space-y-4">
        {/* Date of Birth */}
        <div>
          <label className="form-label">Tanggal Lahir *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="date"
              className={`form-input pl-10 ${errors.date_of_birth ? 'form-input-error' : ''}`}
              value={formData.date_of_birth}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
              disabled={loading}
              max={new Date(Date.now() - 17 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            />
          </div>
          {errors.date_of_birth && <p className="form-error">{errors.date_of_birth}</p>}
        </div>

        {/* Gender */}
        <div>
          <label className="form-label">Jenis Kelamin *</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center p-3 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === 'male'}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm font-medium">Laki-laki</span>
            </label>
            <label className="flex items-center p-3 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === 'female'}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm font-medium">Perempuan</span>
            </label>
          </div>
          {errors.gender && <p className="form-error">{errors.gender}</p>}
        </div>

        {/* ID Type */}
        <div>
          <label className="form-label">Jenis Identitas *</label>
          <select
            className="form-input"
            value={formData.id_type}
            onChange={(e) => handleChange('id_type', e.target.value)}
          >
            <option value="ktp">KTP</option>
            <option value="passport">Paspor</option>
            <option value="sim">SIM</option>
          </select>
        </div>

        {/* ID Number */}
        <div>
          <label className="form-label">Nomor Identitas *</label>
          <input
            type="text"
            className={`form-input ${errors.id_number ? 'form-input-error' : ''}`}
            placeholder={formData.id_type === 'ktp' ? '16 digit NIK' : 'Nomor identitas'}
            value={formData.id_number}
            onChange={(e) => handleChange('id_number', e.target.value)}
            disabled={loading}
          />
          {errors.id_number && <p className="form-error">{errors.id_number}</p>}
        </div>

        {/* Address */}
        <div>
          <label className="form-label">Alamat Lengkap *</label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <MapPin className="h-5 w-5 text-neutral-400" />
            </div>
            <textarea
              className={`form-input pl-10 min-h-[80px] resize-none ${errors.address ? 'form-input-error' : ''}`}
              placeholder="Jalan, nomor, RT/RW, kelurahan"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
          {errors.address && <p className="form-error">{errors.address}</p>}
        </div>

        {/* City & Postal Code */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Kota *</label>
            <input
              type="text"
              className={`form-input ${errors.city ? 'form-input-error' : ''}`}
              placeholder="Nama kota"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              disabled={loading}
            />
            {errors.city && <p className="form-error">{errors.city}</p>}
          </div>
          <div>
            <label className="form-label">Kode Pos *</label>
            <input
              type="text"
              className={`form-input ${errors.postal_code ? 'form-input-error' : ''}`}
              placeholder="12345"
              value={formData.postal_code}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              disabled={loading}
              maxLength={5}
            />
            {errors.postal_code && <p className="form-error">{errors.postal_code}</p>}
          </div>
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
              placeholder="Contoh: Guru, Wiraswasta, Karyawan"
              value={formData.occupation}
              onChange={(e) => handleChange('occupation', e.target.value)}
              disabled={loading}
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
              value={formData.monthly_income}
              onChange={(e) => handleChange('monthly_income', e.target.value)}
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
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Dokumen KYC
        </h2>
        <p className="text-neutral-600">
          Upload dokumen identitas untuk verifikasi
        </p>
      </div>

      <div className="space-y-6">
        {/* ID Document */}
        <div>
          <label className="form-label">Foto KTP/Identitas *</label>
          <div className="relative">
            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              errors.id_document ? 'border-error-300 bg-error-50' : 'border-neutral-300 hover:border-primary-400'
            }`}>
              {uploadedFiles.id_document ? (
                <div className="space-y-3">
                  {uploadedFiles.id_document.preview && (
                    <img
                      src={uploadedFiles.id_document.preview}
                      alt="Preview KTP"
                      className="mx-auto max-h-32 rounded-lg"
                    />
                  )}
                  <p className="text-sm font-medium text-success-600">
                    ✓ {uploadedFiles.id_document.file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFile('id_document')}
                    className="text-error-600 hover:text-error-700 text-sm font-medium"
                  >
                    Hapus dan upload ulang
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileText className="mx-auto h-12 w-12 text-neutral-400" />
                  <div>
                    <label className="cursor-pointer">
                      <span className="text-primary-600 font-medium hover:text-primary-700">
                        Upload foto KTP
                      </span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'id_document')}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-neutral-500">
                    JPG, PNG, atau PDF (max 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>
          {errors.id_document && <p className="form-error">{errors.id_document}</p>}
        </div>

        {/* Selfie Document */}
        <div>
          <label className="form-label">Foto Selfie dengan KTP *</label>
          <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            errors.selfie_document ? 'border-error-300 bg-error-50' : 'border-neutral-300 hover:border-primary-400'
          }`}>
            {uploadedFiles.selfie_document ? (
              <div className="space-y-3">
                {uploadedFiles.selfie_document.preview && (
                  <img
                    src={uploadedFiles.selfie_document.preview}
                    alt="Preview Selfie"
                    className="mx-auto max-h-32 rounded-lg"
                  />
                )}
                <p className="text-sm font-medium text-success-600">
                  ✓ {uploadedFiles.selfie_document.file.name}
                </p>
                <button
                  type="button"
                  onClick={() => removeFile('selfie_document')}
                  className="text-error-600 hover:text-error-700 text-sm font-medium"
                >
                  Hapus dan upload ulang
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Camera className="mx-auto h-12 w-12 text-neutral-400" />
                <div>
                  <label className="cursor-pointer">
                    <span className="text-primary-600 font-medium hover:text-primary-700">
                      Upload foto selfie
                    </span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      capture="user"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'selfie_document')}
                    />
                  </label>
                </div>
                <p className="text-xs text-neutral-500">
                  Foto diri dengan memegang KTP (JPG/PNG, max 5MB)
                </p>
              </div>
            )}
          </div>
          {errors.selfie_document && <p className="form-error">{errors.selfie_document}</p>}
        </div>

        {/* Income Document (Optional) */}
        <div>
          <label className="form-label">Dokumen Penghasilan (Opsional)</label>
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            {uploadedFiles.income_document ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-success-600">
                  ✓ {uploadedFiles.income_document.file.name}
                </p>
                <button
                  type="button"
                  onClick={() => removeFile('income_document')}
                  className="text-error-600 hover:text-error-700 text-sm font-medium"
                >
                  Hapus dan upload ulang
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto h-12 w-12 text-neutral-400" />
                <div>
                  <label className="cursor-pointer">
                    <span className="text-primary-600 font-medium hover:text-primary-700">
                      Upload slip gaji/dokumen penghasilan
                    </span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'income_document')}
                    />
                  </label>
                </div>
                <p className="text-xs text-neutral-500">
                  Slip gaji, SPT, atau bukti penghasilan lainnya
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Tips */}
        <div className="p-4 bg-info-50 border border-info-200 rounded-lg">
          <h4 className="font-medium text-info-900 mb-2">Tips Upload Dokumen:</h4>
          <ul className="text-sm text-info-700 space-y-1">
            <li>• Pastikan foto jelas dan tidak buram</li>
            <li>• Semua text pada dokumen dapat terbaca</li>
            <li>• Hindari pantulan cahaya atau bayangan</li>
            <li>• Format yang didukung: JPG, PNG, PDF</li>
            <li>• Ukuran file maksimal 5MB</li>
          </ul>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Setup Simpanan
        </h2>
        <p className="text-neutral-600">
          Pilih jenis simpanan dan setoran awal
        </p>
      </div>

      <div className="space-y-6">
        {/* Savings Type */}
        <div>
          <label className="form-label">Jenis Simpanan *</label>
          <div className="space-y-3">
            {SAVINGS_TYPES.map((type) => (
              <label
                key={type.id}
                className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.savings_type === type.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-300 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="savings_type"
                    value={type.id}
                    checked={formData.savings_type === type.id}
                    onChange={(e) => handleChange('savings_type', e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-neutral-900">{type.name}</h4>
                      <span className="text-sm font-medium text-primary-600">
                        Min. Rp {type.min.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600">{type.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Initial Deposit */}
        <div>
          <label className="form-label">Setoran Awal *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-neutral-500 font-medium">Rp</span>
            </div>
            <input
              type="text"
              className={`form-input pl-12 ${errors.initial_deposit ? 'form-input-error' : ''}`}
              placeholder="0"
              value={formData.initial_deposit}
              onChange={(e) => handleCurrencyChange('initial_deposit', e.target.value)}
              disabled={loading}
            />
          </div>
          {errors.initial_deposit && <p className="form-error">{errors.initial_deposit}</p>}
          <p className="form-help">
            Minimum setoran: Rp {SAVINGS_TYPES.find(t => t.id === formData.savings_type)?.min.toLocaleString('id-ID')}
          </p>
        </div>

        {/* Auto Debit */}
        <div>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              checked={formData.auto_debit}
              onChange={(e) => handleChange('auto_debit', e.target.checked)}
            />
            <div>
              <span className="text-sm font-medium text-neutral-900">
                Aktifkan Auto Debit Bulanan
              </span>
              <p className="text-sm text-neutral-600">
                Simpanan akan otomatis dipotong dari rekening setiap bulan
              </p>
            </div>
          </label>

          {formData.auto_debit && (
            <div className="mt-4 ml-7">
              <label className="form-label">Jumlah Auto Debit Bulanan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500 font-medium">Rp</span>
                </div>
                <input
                  type="text"
                  className={`form-input pl-12 ${errors.auto_debit_amount ? 'form-input-error' : ''}`}
                  placeholder="50,000"
                  value={formData.auto_debit_amount}
                  onChange={(e) => handleCurrencyChange('auto_debit_amount', e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.auto_debit_amount && <p className="form-error">{errors.auto_debit_amount}</p>}
              <p className="form-help">Minimum Rp 50.000 per bulan</p>
            </div>
          )}
        </div>

        {/* Terms and Agreements */}
        <div className="space-y-4 pt-4 border-t border-neutral-200">
          <h3 className="font-medium text-neutral-900">Persetujuan</h3>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              checked={formData.agree_terms}
              onChange={(e) => handleChange('agree_terms', e.target.checked)}
            />
            <span className="text-sm text-neutral-700">
              Saya menyetujui{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                Syarat dan Ketentuan
              </Link>{' '}
              Koperasi Sinoman *
            </span>
          </label>
          {errors.agree_terms && <p className="form-error ml-7">{errors.agree_terms}</p>}

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              checked={formData.agree_privacy}
              onChange={(e) => handleChange('agree_privacy', e.target.checked)}
            />
            <span className="text-sm text-neutral-700">
              Saya menyetujui{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                Kebijakan Privasi
              </Link>{' '}
              dan penggunaan data pribadi *
            </span>
          </label>
          {errors.agree_privacy && <p className="form-error ml-7">{errors.agree_privacy}</p>}

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              checked={formData.agree_marketing}
              onChange={(e) => handleChange('agree_marketing', e.target.checked)}
            />
            <span className="text-sm text-neutral-700">
              Saya bersedia menerima informasi produk dan promosi dari Koperasi Sinoman
            </span>
          </label>
        </div>

        {/* Summary */}
        <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
          <h4 className="font-medium text-success-900 mb-2">Ringkasan Pendaftaran:</h4>
          <div className="space-y-1 text-sm text-success-700">
            <p>• Jenis Simpanan: {SAVINGS_TYPES.find(t => t.id === formData.savings_type)?.name}</p>
            <p>• Setoran Awal: Rp {parseInt(formData.initial_deposit.replace(/[^0-9]/g, '') || '0').toLocaleString('id-ID')}</p>
            {formData.auto_debit && (
              <p>• Auto Debit: Rp {parseInt(formData.auto_debit_amount.replace(/[^0-9]/g, '') || '0').toLocaleString('id-ID')}/bulan</p>
            )}
            {formData.referral_code && (
              <p>• Kode Referral: {formData.referral_code}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">KS</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Bergabung dengan Koperasi Sinoman
          </h1>
          <p className="text-neutral-600">
            Proses pendaftaran yang mudah dan aman
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep > step.id
                    ? 'bg-success-600 text-white'
                    : currentStep === step.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-full h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-success-600' : 'bg-neutral-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <div key={step.id} className="text-center flex-1">
                <p className={`text-xs font-medium ${
                  currentStep >= step.id ? 'text-primary-600' : 'text-neutral-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-neutral-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="card">
          {/* General Error */}
          {errors.general && (
            <div className="mb-6 flex items-center p-3 bg-error-50 border border-error-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-error-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-error-700">{errors.general}</p>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-6 flex items-center p-3 bg-info-50 border border-info-200 rounded-lg">
              <div className="w-5 h-5 border-2 border-info-600 border-t-transparent rounded-full animate-loading mr-2"></div>
              <p className="text-sm text-info-700">Mengupload {uploading}...</p>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 mt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
              className="btn-outline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Sebelumnya
            </button>

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="btn-primary flex items-center"
              >
                Selanjutnya
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || uploading !== null}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-loading mr-2"></div>
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
              </button>
            )}
          </div>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-neutral-600">
            Sudah punya akun?{' '}
            <Link
              href="/auth/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Masuk di sini
            </Link>
          </p>
        </div>

        {/* Security Info */}
        <div className="mt-8 p-4 bg-info-50 border border-info-200 rounded-lg">
          <div className="flex items-center mb-2">
            <Shield className="h-5 w-5 text-info-600 mr-2" />
            <h3 className="text-sm font-semibold text-info-900">
              Data Anda Aman
            </h3>
          </div>
          <div className="space-y-1 text-sm text-info-700">
            <p>• Semua data dienkripsi dengan standar keamanan tinggi</p>
            <p>• Dokumen KYC akan diverifikasi oleh tim ahli</p>
            <p>• Proses persetujuan maksimal 3 hari kerja</p>
            <p>• Customer service siap membantu 24/7</p>
          </div>
        </div>
      </div>
    </div>
  )
}