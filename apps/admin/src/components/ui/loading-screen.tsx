'use client'

import { useEffect, useState } from 'react'

interface LoadingScreenProps {
  message?: string
  showProgress?: boolean
}

export function LoadingScreen({
  message = 'Memuat...',
  showProgress = false
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!showProgress) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 200)

    return () => clearInterval(interval)
  }, [showProgress])

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">KS</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">
            Koperasi Sinoman
          </h1>
          <p className="text-neutral-600 text-sm">Admin Dashboard</p>
        </div>

        {/* Loading spinner */}
        <div className="mb-6">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>

        {/* Message */}
        <p className="text-neutral-600 text-sm mb-4">{message}</p>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-48 mx-auto">
            <div className="bg-neutral-200 rounded-full h-1.5">
              <div
                className="bg-primary-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              {Math.round(progress)}% selesai
            </p>
          </div>
        )}

        {/* Loading dots animation */}
        <div className="flex items-center justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen