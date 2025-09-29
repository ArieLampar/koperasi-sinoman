'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle, Chrome } from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const redirectTo = searchParams.get('redirectTo') || '/'
  const errorMessage = searchParams.get('error')
  const message = searchParams.get('message')

  // Check for URL errors or messages
  useEffect(() => {
    if (errorMessage) {
      setErrors({ general: decodeURIComponent(errorMessage) })
    }
    if (message) {
      if (message === 'password-updated') {
        toast.success('Password berhasil diperbarui! Silakan login dengan password baru.')
      } else if (message === 'logout') {
        toast.success('Anda telah berhasil logout')
      }
    }
  }, [errorMessage, message])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Enhanced email validation
    if (!formData.email) {
      newErrors.email = 'Email wajib diisi'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    } else if (formData.email.length > 255) {
      newErrors.email = 'Email terlalu panjang'
    }

    // Enhanced password validation
    if (!formData.password) {
      newErrors.password = 'Password wajib diisi'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter'
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password terlalu panjang'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSocialLogin = async (provider: 'google') => {
    setSocialLoading(provider)
    setErrors({})

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error(`${provider} login error:`, error)
        setErrors({ general: `Gagal login dengan ${provider}. Silakan coba lagi.` })
      }
      // Note: For OAuth, the user will be redirected, so we don't handle success here
    } catch (error: any) {
      console.error(`${provider} login error:`, error)
      setErrors({ general: `Terjadi kesalahan saat login dengan ${provider}.` })
    } finally {
      setSocialLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        console.error('Login error:', error)
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: 'Email atau password salah. Periksa kembali data login Anda.' })
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({
            general: 'Email belum diverifikasi. Silakan cek inbox email Anda.',
            action: 'verify'
          })
        } else if (error.message.includes('Too many requests')) {
          setErrors({ general: 'Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.' })
        } else if (error.message.includes('Account is disabled')) {
          setErrors({ general: 'Akun Anda telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.' })
        } else {
          setErrors({ general: 'Terjadi kesalahan saat login. Silakan coba lagi.' })
        }
        return
      }

      if (data.user) {
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('rememberMe')
        }

        toast.success('Login berhasil!')
        router.push(redirectTo)
        router.refresh() // Refresh to update auth state
      }
    } catch (error: any) {
      console.error('Login error:', error)
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

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">KS</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Selamat Datang Kembali
          </h1>
          <p className="text-neutral-600">
            Masuk ke akun Koperasi Sinoman Anda
          </p>
        </div>

        {/* Success Message */}
        {message && message !== 'password-updated' && message !== 'logout' && (
          <div className="mb-6 flex items-center p-3 bg-success-50 border border-success-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-success-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-success-700">{decodeURIComponent(message)}</p>
          </div>
        )}

        {/* Social Login Options */}
        <div className="card mb-4">
          <div className="space-y-3">
            <p className="text-sm text-neutral-600 text-center font-medium">
              Login cepat dengan
            </p>

            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={socialLoading === 'google' || loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {socialLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-loading mr-3"></div>
              ) : (
                <Chrome className="h-5 w-5 mr-3 text-red-500" />
              )}
              <span className="font-medium">
                {socialLoading === 'google' ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}
              </span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">atau</span>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error */}
            {errors.general && (
              <div className="flex flex-col p-3 bg-error-50 border border-error-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-error-600 mr-2 flex-shrink-0" />
                  <p className="text-sm text-error-700">{errors.general}</p>
                </div>
                {errors.action === 'verify' && (
                  <div className="mt-2 ml-7">
                    <Link
                      href={`/auth/verify?email=${encodeURIComponent(formData.email)}`}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Kirim ulang email verifikasi →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="form-label">
                Email <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  className={`form-input pl-10 ${errors.email ? 'form-input-error' : formData.email && !errors.email ? 'border-success-300' : ''}`}
                  placeholder="contoh@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={loading || socialLoading !== null}
                  required
                />
                {formData.email && !errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500" />
                  </div>
                )}
              </div>
              {errors.email && <p className="form-error">{errors.email}</p>}
              {!errors.email && formData.email && (
                <p className="form-help text-success-600">✓ Format email valid</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="form-label">
                Password <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`form-input pl-10 pr-10 ${errors.password ? 'form-input-error' : formData.password && !errors.password ? 'border-success-300' : ''}`}
                  placeholder="Masukkan password Anda"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={loading || socialLoading !== null}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-neutral-50 rounded-r-lg transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                  )}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password}</p>}
              {!errors.password && formData.password && formData.password.length >= 6 && (
                <p className="form-help text-success-600">✓ Password memenuhi kriteria minimal</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="ml-2 text-sm text-neutral-600">Ingat saya</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Lupa password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || socialLoading !== null || !formData.email || !formData.password}
              className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-loading mr-2"></div>
              ) : (
                <ArrowRight className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Masuk...' : 'Masuk ke Akun'}
            </button>

            {/* Form Help */}
            <div className="text-center">
              <p className="text-xs text-neutral-500">
                Dengan masuk, Anda menyetujui{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-700">
                  Syarat & Ketentuan
                </Link>{' '}
                dan{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                  Kebijakan Privasi
                </Link>{' '}
                Koperasi Sinoman
              </p>
            </div>
          </form>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-neutral-600">
            Belum punya akun?{' '}
            <Link
              href="/auth/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>

        {/* Security & Help Section */}
        <div className="mt-8 space-y-4">
          {/* Security Info */}
          <div className="p-4 bg-info-50 border border-info-200 rounded-lg">
            <h3 className="text-sm font-semibold text-info-900 mb-2">
              🔒 Keamanan Akun
            </h3>
            <ul className="space-y-1 text-sm text-info-700">
              <li>• Jangan bagikan password dengan siapa pun</li>
              <li>• Selalu logout setelah selesai menggunakan</li>
              <li>• Gunakan perangkat pribadi untuk mengakses akun</li>
              <li>• Laporkan aktivitas mencurigakan segera</li>
            </ul>
          </div>

          {/* Help Section */}
          <div className="p-4 bg-neutral-50 rounded-lg">
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">
              Butuh bantuan?
            </h3>
            <div className="space-y-1 text-sm text-neutral-600">
              <p>• Email: admin@koperasisinoman.com</p>
              <p>• Telepon: (021) 1234-5678</p>
              <p>• WhatsApp: +62 812-3456-7890</p>
              <p>• Jam operasional: Senin-Jumat 08:00-17:00 WIB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}