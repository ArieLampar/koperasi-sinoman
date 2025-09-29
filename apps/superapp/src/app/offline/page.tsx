import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline - Koperasi Sinoman SuperApp',
  description: 'Anda sedang offline. Beberapa fitur mungkin tidak tersedia.',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25A9.75 9.75 0 102.25 12 9.75 9.75 0 0012 2.25z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Anda Sedang Offline
          </h1>

          <p className="text-gray-600 mb-6">
            Koneksi internet tidak tersedia. Beberapa fitur mungkin tidak dapat digunakan saat ini.
          </p>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Yang Masih Dapat Dilakukan:
          </h2>

          <div className="space-y-3 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">
                Melihat data simpanan yang tersimpan
              </span>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">
                Menyiapkan pengajuan pinjaman
              </span>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">
                Melihat riwayat transaksi tersimpan
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="btn-primary w-full"
        >
          Coba Lagi
        </button>

        <p className="text-xs text-gray-500 mt-4">
          Data akan disinkronkan otomatis setelah koneksi pulih
        </p>
      </div>
    </div>
  )
}