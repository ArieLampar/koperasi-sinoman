'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValidSession, setIsValidSession] = useState(false)

  useEffect(() => {
    // Check if we have valid session from email link
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          setErrors({ general: 'Link reset password tidak valid atau sudah kedaluwarsa.' })
          return
        }

        setIsValidSession(true)
      } catch (error) {
        console.error('Session check error:', error)
        setErrors({ general: 'Terjadi kesalahan saat memverifikasi link reset password.' })
      }
    }

    checkSession()
  }, [supabase])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.password) {
      newErrors.password = 'Password baru wajib diisi'
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      })

      if (error) {
        if (error.message.includes('New password should be different')) {
          setErrors({ password: 'Password baru harus berbeda dengan password lama' })
        } else {
          setErrors({ general: error.message })
        }
        return
      }

      toast.success('Password berhasil diperbarui!')
      router.push('/auth/login?message=password-updated')
    } catch (error: any) {
      console.error('Update password error:', error)
      setErrors({ general: 'Terjadi kesalahan. Silakan coba lagi.' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Show error if session is not valid
  if (!isValidSession && Object.keys(errors).length > 0) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-error-600" />
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 mb-3">
            Link Tidak Valid
          </h1>

          <p className="text-neutral-600 mb-6">
            {errors.general || 'Link reset password tidak valid atau sudah kedaluwarsa.'}
          </p>

          <div className="space-y-3">
            <Link href="/auth/forgot-password" className="btn-primary w-full block text-center">
              Minta Link Baru
            </Link>

            <Link href="/auth/login" className="btn-ghost w-full block text-center">
              Kembali ke Login
            </Link>
          </div>

          <div className="mt-8 p-4 bg-info-50 border border-info-200 rounded-lg text-left">
            <h3 className="text-sm font-semibold text-info-900 mb-2">
              Kemungkinan Penyebab:
            </h3>
            <ul className="space-y-1 text-sm text-info-700">
              <li>• Link sudah kedaluwarsa (berlaku 1 jam)</li>
              <li>• Link sudah pernah digunakan</li>
              <li>• Link tidak lengkap atau rusak</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Show loading while checking session
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memverifikasi link reset password...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Buat Password Baru
          </h1>
          <p className="text-neutral-600">
            Masukkan password baru untuk akun Anda
          </p>
        </div>

        {/* Reset Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error */}
            {errors.general && (
              <div className="flex items-center p-3 bg-error-50 border border-error-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-error-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-error-700">{errors.general}</p>
              </div>
            )}

            {/* New Password Field */}
            <div>
              <label className="form-label">Password Baru *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
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

            {/* Confirm Password Field */}
            <div>
              <label className="form-label">Konfirmasi Password Baru *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-input pl-10 pr-10 ${errors.confirm_password ? 'form-input-error' : ''}`}
                  placeholder="Ulangi password baru"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-loading mr-2"></div>
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Memperbarui...' : 'Perbarui Password'}
            </button>
          </form>
        </div>

        {/* Security Info */}
        <div className="mt-8 p-4 bg-success-50 border border-success-200 rounded-lg">
          <h3 className="text-sm font-semibold text-success-900 mb-2">
            Tips Keamanan Password:
          </h3>
          <ul className="space-y-1 text-sm text-success-700">
            <li>• Gunakan kombinasi huruf besar dan kecil</li>
            <li>• Sertakan angka dan simbol khusus</li>
            <li>• Hindari informasi pribadi yang mudah ditebak</li>
            <li>• Jangan gunakan password yang sama untuk akun lain</li>
          </ul>
        </div>
      </div>
    </div>
  )
}