const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages for proper ESM handling
  transpilePackages: [
    '@koperasi-sinoman/ui',
    '@koperasi-sinoman/database',
    '@koperasi-sinoman/auth',
    '@koperasi-sinoman/utils',
    '@koperasi-sinoman/types',
    '@koperasi-sinoman/config'
  ],

  // Experimental features for better performance
  experimental: {
    // Enable Server Components optimizations
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Compiler optimizations
  compiler: {
    // Remove console.* in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://*.supabase.co",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "media-src 'self' https://*.supabase.co"
            ].join('; '),
          },
        ],
      },
    ]
  },

  // API routes and rewrites
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*'
      },
      // Health check endpoint
      {
        source: '/health',
        destination: '/api/health'
      }
    ]
  },

  // Redirects for SEO and UX
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      },
    ]
  },

  // Environment variables configuration
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // Output configuration for deployment
  output: 'standalone',

  // Bundle analyzer (only in development)
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer in development
    if (dev && !isServer && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      )
    }

    // Optimize imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').join(__dirname, 'src'),
    }

    return config
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
    },
  }),
}

module.exports = withPWA(nextConfig)