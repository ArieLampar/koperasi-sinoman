'use client'

import Link from 'next/link'
import {
  ShieldExclamationIcon,
  HomeIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

interface AccessDeniedProps {
  title?: string
  message?: string
  showHomeButton?: boolean
  showBackButton?: boolean
}

export function AccessDenied({
  title = 'Akses Ditolak',
  message = 'Anda tidak memiliki izin untuk mengakses halaman admin ini. Silakan hubungi administrator untuk mendapatkan akses.',
  showHomeButton = true,
  showBackButton = true,
}: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-8">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldExclamationIcon className="h-10 w-10 text-red-600" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-neutral-900 mb-4">{title}</h1>
        <p className="text-neutral-600 text-lg mb-8 leading-relaxed">
          {message}
        </p>

        {/* Error details */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <ShieldExclamationIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Akses Tidak Diizinkan
              </h3>
              <p className="text-sm text-red-700">
                Halaman ini memerlukan privilese administrator. Pastikan Anda telah:
              </p>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                <li>Login dengan akun yang memiliki role admin</li>
                <li>Memiliki permission yang sesuai untuk halaman ini</li>
                <li>Akun Anda telah diaktivasi oleh super admin</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Kembali
            </button>
          )}

          {showHomeButton && (
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <HomeIcon className="h-4 w-4 mr-2" />
              Login Ulang
            </Link>
          )}
        </div>

        {/* Contact info */}
        <div className="mt-8 pt-8 border-t border-neutral-200">
          <p className="text-sm text-neutral-500">
            Butuh bantuan?{' '}
            <a
              href="mailto:admin@koperasi-sinoman.com"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Hubungi Administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AccessDenied