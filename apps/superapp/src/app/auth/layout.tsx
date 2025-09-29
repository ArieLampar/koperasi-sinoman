import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Koperasi Sinoman',
    default: 'Autentikasi | Koperasi Sinoman',
  },
  description: 'Masuk atau daftar akun Koperasi Sinoman untuk mengakses layanan keuangan digital',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-layout">
      {children}
    </div>
  )
}