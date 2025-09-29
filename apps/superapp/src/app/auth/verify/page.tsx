'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, RefreshCw, ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const email = searchParams.get('email') || ''

  useEffect(() => {
    // Start countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email tidak ditemukan. Silakan daftar ulang.')
      return
    }

    if (countdown > 0) {
      toast.error(`Tunggu ${countdown} detik sebelum mengirim ulang`)
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes('Email rate limit exceeded')) {
          toast.error('Terlalu banyak permintaan. Coba lagi dalam beberapa menit.')
          setCountdown(300) // 5 minutes
        } else {
          toast.error(error.message)
        }
        return
      }

      toast.success('Email verifikasi telah dikirim ulang!')
      setCountdown(60) // 1 minute
    } catch (error: any) {
      console.error('Resend email error:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeEmail = () => {
    router.push('/auth/register')
  }

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-8 w-8 text-warning-600" />
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 mb-3">
          Verifikasi Email Anda
        </h1>

        <p className="text-neutral-600 mb-6">
          Kami telah mengirim email verifikasi ke{' '}
          {email && (
            <span className="font-semibold text-neutral-900 block mt-1">
              {email}
            </span>
          )}
          Silakan cek inbox email Anda dan klik link verifikasi.
        </p>

        <div className="space-y-3 mb-8">
          <button
            onClick={handleResendEmail}
            disabled={loading || countdown > 0}
            className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-loading mr-2"></div>
            ) : countdown > 0 ? (
              <Clock className="h-5 w-5 mr-2" />
            ) : (
              <RefreshCw className="h-5 w-5 mr-2" />
            )}
            {loading
              ? 'Mengirim...'
              : countdown > 0
              ? `Kirim Ulang (${countdown}s)`
              : 'Kirim Ulang Email'
            }
          </button>

          <button
            onClick={handleChangeEmail}
            className="btn-outline w-full"
          >
            Ganti Email
          </button>

          <Link href="/auth/login" className="btn-ghost w-full block">
            <ArrowLeft className="h-4 w-4 mr-2 inline" />
            Kembali ke Login
          </Link>
        </div>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="p-4 bg-info-50 border border-info-200 rounded-lg text-left">
            <h3 className="text-sm font-semibold text-info-900 mb-2">
              Langkah Verifikasi:
            </h3>
            <ol className="space-y-1 text-sm text-info-700 list-decimal list-inside">
              <li>Buka aplikasi email Anda</li>
              <li>Cari email dari Koperasi Sinoman</li>
              <li>Klik link "Verifikasi Email"</li>
              <li>Anda akan diarahkan ke halaman login</li>
            </ol>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg text-left">
            <h3 className="text-sm font-semibold text-warning-900 mb-2">
              Tidak Menerima Email?
            </h3>
            <ul className="space-y-1 text-sm text-warning-700">
              <li>• Periksa folder spam/junk email</li>
              <li>• Pastikan email yang dimasukkan benar</li>
              <li>• Tunggu hingga 5 menit</li>
              <li>• Periksa koneksi internet Anda</li>
              <li>• Coba kirim ulang email verifikasi</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="p-4 bg-neutral-50 rounded-lg text-left">
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">
              Masih Bermasalah?
            </h3>
            <div className="space-y-1 text-sm text-neutral-600">
              <p>Hubungi tim support kami:</p>
              <p>• Email: admin@koperasisinoman.com</p>
              <p>• Telepon: (021) 1234-5678</p>
              <p>• WhatsApp: +62 812-3456-7890</p>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-8 p-3 bg-success-50 border border-success-200 rounded-lg">
          <div className="flex items-center justify-center text-success-700 mb-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Keamanan Terjamin</span>
          </div>
          <p className="text-xs text-success-600">
            Link verifikasi hanya berlaku 24 jam dan hanya dapat digunakan sekali.
          </p>
        </div>
      </div>
    </div>
  )
}