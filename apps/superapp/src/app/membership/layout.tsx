import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Keanggotaan | Koperasi Sinoman',
    default: 'Keanggotaan | Koperasi Sinoman',
  },
  description: 'Kelola profil anggota, kartu digital, dan verifikasi KYC Koperasi Sinoman',
  robots: {
    index: true,
    follow: true,
  },
}

export default function MembershipLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="membership-layout">
      {children}
    </div>
  )
}