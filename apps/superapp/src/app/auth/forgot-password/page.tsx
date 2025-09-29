'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError('Email wajib diisi')
      return
    }

    if (!validateEmail(email)) {
      setError('Format email tidak valid')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        if (error.message.includes('For security purposes')) {
          setError('Untuk keamanan, kami telah mengirim email reset password jika alamat email terdaftar.')
          setSent(true)
        } else {
          setError(error.message)
        }
        return
      }

      setSent(true)
      toast.success('Email reset password telah dikirim!')
    } catch (error: any) {
      console.error('Reset password error:', error)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    await handleSubmit(new Event('submit') as any)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 mb-3">
            Email Terkirim
          </h1>

          <p className="text-neutral-600 mb-6">
            Kami telah mengirim link reset password ke{' '}
            <span className="font-semibold text-neutral-900">{email}</span>.
            Silakan cek inbox email Anda.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={loading}
              className="btn-outline w-full"
            >
              {loading ? 'Mengirim...' : 'Kirim Ulang Email'}
            </button>

            <Link href="/auth/login" className="btn-ghost w-full block text-center">
              <ArrowLeft className="h-4 w-4 mr-2 inline" />
              Kembali ke Login
            </Link>
          </div>

          <div className="mt-8 p-4 bg-info-50 border border-info-200 rounded-lg text-left">
            <h3 className="text-sm font-semibold text-info-900 mb-2">
              Tidak menerima email?
            </h3>
            <ul className="space-y-1 text-sm text-info-700">
              <li>• Periksa folder spam/junk</li>
              <li>• Pastikan email yang dimasukkan benar</li>
              <li>• Tunggu hingga 5 menit</li>
              <li>• Hubungi admin jika masih bermasalah</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-warning-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Lupa Password?
          </h1>
          <p className="text-neutral-600">
            Masukkan email Anda untuk menerima link reset password
          </p>
        </div>

        {/* Reset Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-center p-3 bg-error-50 border border-error-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-error-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="email"
                  className={`form-input pl-10 ${error && !sent ? 'form-input-error' : ''}`}
                  placeholder="Masukkan email terdaftar"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  disabled={loading}
                  required
                />
              </div>
              <p className="form-help">
                Masukkan email yang digunakan saat mendaftar
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-loading mr-2"></div>
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Mengirim...' : 'Kirim Reset Password'}
            </button>
          </form>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Login
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-neutral-50 rounded-lg">
          <h3 className="text-sm font-semibold text-neutral-900 mb-2">
            Butuh bantuan lain?
          </h3>
          <div className="space-y-1 text-sm text-neutral-600">
            <p>• Email: admin@koperasisinoman.com</p>
            <p>• Telepon: (021) 1234-5678</p>
            <p>• WhatsApp: +62 812-3456-7890</p>
          </div>
        </div>
      </div>
    </div>
  )
}