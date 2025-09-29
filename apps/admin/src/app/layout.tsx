import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { AdminLayout } from '@/components/layout/admin-layout'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Koperasi Sinoman Admin',
    default: 'Koperasi Sinoman - Admin Dashboard',
  },
  description: 'Administrative interface for Koperasi Sinoman management system',
  keywords: [
    'admin',
    'dashboard',
    'koperasi',
    'sinoman',
    'management',
    'cooperative',
    'financial',
    'administration'
  ],
  authors: [{ name: 'Koperasi Sinoman', url: 'https://koperasi-sinoman.com' }],
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zoom for admin interface consistency
  },
  other: {
    'theme-color': '#1f2937',
    'msapplication-TileColor': '#1f2937',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Sinoman Admin',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="h-full">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Security meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />

        {/* Admin-specific meta tags */}
        <meta name="application-name" content="Koperasi Sinoman Admin" />
        <meta name="format-detection" content="telephone=no" />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.variable} font-inter h-full bg-neutral-50 antialiased overflow-hidden`}
        suppressHydrationWarning
      >
        <Providers>
          <AdminLayout>
            {children}
          </AdminLayout>
        </Providers>

        {/* Admin-specific scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent right-click context menu in production
              if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
                document.addEventListener('contextmenu', function(e) {
                  e.preventDefault();
                });

                // Disable F12, Ctrl+Shift+I, Ctrl+U
                document.addEventListener('keydown', function(e) {
                  if (e.key === 'F12' ||
                      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                      (e.ctrlKey && e.key === 'u')) {
                    e.preventDefault();
                  }
                });

                // Admin session timeout warning
                let sessionTimeout;
                let warningShown = false;

                function resetSessionTimeout() {
                  clearTimeout(sessionTimeout);
                  warningShown = false;
                  sessionTimeout = setTimeout(() => {
                    if (!warningShown) {
                      warningShown = true;
                      if (confirm('Sesi admin akan berakhir dalam 5 menit. Klik OK untuk melanjutkan.')) {
                        resetSessionTimeout();
                      } else {
                        window.location.href = '/auth/signin';
                      }
                    }
                  }, 25 * 60 * 1000); // 25 minutes warning for 30 min session
                }

                // Track user activity
                ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
                  document.addEventListener(event, resetSessionTimeout, { passive: true });
                });

                resetSessionTimeout();
              }
            `,
          }}
        />
      </body>
    </html>
  )
}