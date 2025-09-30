import type { Metadata } from 'next'

// Providers and components
import { CartProviderWrapper } from '@/components/providers/cart-provider-wrapper'

// Marketplace-specific metadata
export const metadata: Metadata = {
  title: {
    default: 'Toko - Marketplace Koperasi Sinoman',
    template: '%s | Toko Koperasi Sinoman'
  },
  description: 'Marketplace eksklusif untuk anggota Koperasi Sinoman. Sehat Bareng, Kaya Bareng, Bareng Sinoman. Belanja produk berkualitas dengan harga khusus anggota.',
  keywords: [
    'marketplace',
    'toko online',
    'koperasi sinoman',
    'produk kesehatan',
    'makanan',
    'minuman',
    'anggota koperasi',
    'flash sale',
    'promo khusus'
  ],
  openGraph: {
    title: 'Toko - Marketplace Koperasi Sinoman',
    description: 'Sehat Bareng, Kaya Bareng, Bareng Sinoman. Marketplace eksklusif untuk anggota Koperasi Sinoman.',
    images: [
      {
        url: '/images/marketplace-og.png',
        width: 1200,
        height: 630,
        alt: 'Marketplace Koperasi Sinoman',
      }
    ],
  },
  twitter: {
    title: 'Toko - Marketplace Koperasi Sinoman',
    description: 'Sehat Bareng, Kaya Bareng, Bareng Sinoman. Marketplace eksklusif untuk anggota.',
    images: ['/images/marketplace-twitter.png'],
  },
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProviderWrapper>
      <div className="min-h-screen bg-background-secondary">
        {/* Marketplace-specific wrapper */}
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </CartProviderWrapper>
  )
}