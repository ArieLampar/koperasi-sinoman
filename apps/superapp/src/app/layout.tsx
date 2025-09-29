import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

// Providers
import SupabaseProvider from '@/components/providers/supabase-provider'
import AuthProvider from '@/components/providers/auth-provider'
import QueryProvider from '@/components/providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

// Layout Components
import Navigation from '@/components/layout/navigation'

// Styles
import './globals.css'

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// PWA and SEO Metadata
export const metadata: Metadata = {
  title: {
    default: 'Koperasi Sinoman - SuperApp',
    template: '%s | Koperasi Sinoman'
  },
  description: 'Platform digital terpadu untuk anggota Koperasi Sinoman. Kelola simpanan, pinjaman, dan transaksi keuangan dengan mudah dan aman.',
  keywords: [
    'koperasi',
    'simpan pinjam',
    'digital banking',
    'fintech',
    'koperasi sinoman',
    'simpanan',
    'pinjaman',
    'keuangan digital',
    'mobile banking'
  ],
  authors: [{ name: 'Koperasi Sinoman' }],
  creator: 'Koperasi Sinoman',
  publisher: 'Koperasi Sinoman',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    title: 'Koperasi Sinoman - SuperApp',
    description: 'Platform digital terpadu untuk anggota Koperasi Sinoman',
    siteName: 'Koperasi Sinoman SuperApp',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Koperasi Sinoman SuperApp',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Koperasi Sinoman - SuperApp',
    description: 'Platform digital terpadu untuk anggota Koperasi Sinoman',
    images: ['/images/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KopSinoman',
    startupImage: [
      '/images/apple-launch-640x1136.png',
      {
        url: '/images/apple-launch-750x1334.png',
        media: '(device-width: 375px) and (device-height: 667px)',
      },
      {
        url: '/images/apple-launch-1242x2208.png',
        media: '(device-width: 414px) and (device-height: 736px)',
      },
    ],
  },
  applicationName: 'Koperasi Sinoman SuperApp',
  referrer: 'origin-when-cross-origin',
  category: 'finance',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4CAF50' },
    { media: '(prefers-color-scheme: dark)', color: '#1B5E20' },
  ],
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`h-full ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/_next/static/media/inter-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KopSinoman" />
        <meta name="msapplication-TileColor" content="#4CAF50" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Favicon and icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* Splash screens */}
        <link
          rel="apple-touch-startup-image"
          href="/images/apple-launch-640x1136.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
        />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* Performance hints */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={`${inter.className} h-full bg-background-secondary antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            <AuthProvider>
              <QueryProvider>
                <div className="flex flex-col h-full">
                  {/* Navigation */}
                  <Navigation />

                  {/* Main Content */}
                  <main className="flex-1 overflow-y-auto">
                    <div className="min-h-full pb-16 md:pb-0">
                      {children}
                    </div>
                  </main>

                  {/* Toast Notifications */}
                  <Toaster
                    position="top-center"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#fff',
                        color: '#333',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '14px',
                        maxWidth: '400px',
                      },
                      success: {
                        style: {
                          border: '1px solid #4CAF50',
                          background: '#E8F5E8',
                          color: '#1B5E20',
                        },
                        iconTheme: {
                          primary: '#4CAF50',
                          secondary: '#E8F5E8',
                        },
                      },
                      error: {
                        style: {
                          border: '1px solid #F44336',
                          background: '#FFEBEE',
                          color: '#D32F2F',
                        },
                        iconTheme: {
                          primary: '#F44336',
                          secondary: '#FFEBEE',
                        },
                      },
                      loading: {
                        style: {
                          border: '1px solid #2196F3',
                          background: '#E3F2FD',
                          color: '#1976D2',
                        },
                      },
                    }}
                  />
                </div>
              </QueryProvider>
            </AuthProvider>
          </SupabaseProvider>
        </ThemeProvider>

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}