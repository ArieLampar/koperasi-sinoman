import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Simpanan | Koperasi Sinoman',
    default: 'Simpanan | Koperasi Sinoman',
  },
  description: 'Kelola simpanan dan rekening tabungan Koperasi Sinoman dengan mudah dan aman',
  robots: {
    index: true,
    follow: true,
  },
}

export default function SavingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="savings-layout">
      {children}
    </div>
  )
}