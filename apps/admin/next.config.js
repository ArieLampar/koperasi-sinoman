/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // Experimental features for admin performance
  experimental: {
    // Server Components optimizations for large datasets
    serverComponentsExternalPackages: [
      'bcryptjs',
      '@supabase/supabase-js',
      'puppeteer',
      'sharp',
      'canvas',
      'jsdom',
      'jspdf',
      'xlsx',
      'papaparse'
    ],
    // Optimize package imports for admin libraries
    optimizePackageImports: [
      '@koperasi-sinoman/ui',
      '@koperasi-sinoman/utils',
      '@koperasi-sinoman/types',
      'lucide-react',
      '@heroicons/react',
      'date-fns',
      'lodash',
      'chart.js',
      'recharts'
    ],
    // Enable Server Actions for admin operations
    serverActions: true,
    // Enable partial prerendering for dashboards
    ppr: true,
    // Enable optimized CSS loading
    optimizeCss: true,
  },

  // Transpile packages from the monorepo workspace
  transpilePackages: [
    '@koperasi-sinoman/ui',
    '@koperasi-sinoman/database',
    '@koperasi-sinoman/auth',
    '@koperasi-sinoman/utils',
    '@koperasi-sinoman/types',
    '@koperasi-sinoman/config'
  ],

  // Security headers for admin application
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' blob: data: https://*.supabase.co https://gravatar.com https://api.qrserver.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "media-src 'self' https://*.supabase.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
              "block-all-mixed-content"
            ].join('; ')
          },
          // Additional admin security headers
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          },
          // Cache control for admin pages
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        ]
      }
    ]
  },

  // Environment variables for admin
  env: {
    NEXT_PUBLIC_APP_NAME: 'Koperasi Sinoman Admin',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_APP_ENVIRONMENT: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_ADMIN_PORT: '3001',
  },

  // Image optimization for admin interface
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 300, // 5 minutes cache for admin content
    dangerouslyAllowSVG: false, // Security: disable SVG for admin
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: [
      'localhost',
      'supabase.co',
      '*.supabase.co',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'gravatar.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/v1/create-qr-code/**',
      },
      {
        protocol: 'https',
        hostname: 'gravatar.com',
        port: '',
        pathname: '/avatar/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      }
    ]
  },

  // Webpack configuration for optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle splitting
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          chunks: 'all',
          enforce: true,
        },
        charts: {
          test: /[\\/]node_modules[\\/](recharts|chart\.js|d3|@nivo|victory|plotly\.js)[\\/]/,
          name: 'charts',
          priority: 20,
          chunks: 'all',
        },
        tables: {
          test: /[\\/]node_modules[\\/](@tanstack\/react-table|react-data-grid|react-window|ag-grid)[\\/]/,
          name: 'tables',
          priority: 20,
          chunks: 'all',
        },
        reports: {
          test: /[\\/]node_modules[\\/](jspdf|xlsx|papaparse|html2canvas|puppeteer)[\\/]/,
          name: 'reports',
          priority: 15,
          chunks: 'all',
        },
        utils: {
          test: /[\\/]node_modules[\\/](lodash|ramda|date-fns|moment)[\\/]/,
          name: 'utils',
          priority: 10,
          chunks: 'all',
        }
      }
    }

    // Analyzer for production builds
    if (!dev && !isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.BUILD_ID': JSON.stringify(buildId),
        })
      )
    }

    return config
  },

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Output configuration
  output: 'standalone',

  // Admin-specific rewrites
  async rewrites() {
    return [
      // API versioning
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*'
      },
      // Admin health check
      {
        source: '/admin/health',
        destination: '/api/health'
      },
      // Admin system status
      {
        source: '/admin/status',
        destination: '/api/system/status'
      },
      // Report generation endpoints
      {
        source: '/admin/reports/:path*',
        destination: '/api/reports/:path*'
      },
      // Data export endpoints
      {
        source: '/admin/export/:path*',
        destination: '/api/export/:path*'
      }
    ]
  },

  // Security-focused redirects
  async redirects() {
    return [
      // Redirect root to dashboard for authenticated users
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
      // Block common attack paths
      {
        source: '/wp-admin/:path*',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/admin.php',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/.env',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/config/:path*',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/backup/:path*',
        destination: '/404',
        permanent: false,
      },
    ]
  },

  // PoweredByHeader removal for security
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // SWC minify for better performance
  swcMinify: true,

  // Compression
  compress: true,

  // Disable ETags for admin security
  generateEtags: false,

  // Trailing slash handling
  trailingSlash: false,

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Disable source maps in production for security
    productionBrowserSourceMaps: false,
    // Enable SWC minification for better performance
    swcMinify: true,
  }),

  // TypeScript configuration
  typescript: {
    // Type checking is handled by CI/CD
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // ESLint checking is handled by CI/CD
    ignoreDuringBuilds: false,
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Development indicators
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
}

module.exports = withBundleAnalyzer(nextConfig)