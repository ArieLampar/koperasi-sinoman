/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/dist/**/*.{js,mjs}',
    // Include all workspace packages for proper purging
    '../../packages/*/src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Koperasi Sinoman Brand Colors
        brand: {
          primary: '#1B5E20',    // Deep green - stability, growth
          secondary: '#2E7D32',  // Medium green
          accent: '#4CAF50',     // Bright green - prosperity
          light: '#A5D6A7',      // Light green
          lighter: '#E8F5E8',    // Very light green
          dark: '#0D4E12',       // Very dark green
        },
        // Primary color palette (Green theme)
        primary: {
          50: '#E8F5E8',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',   // Main brand color
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
          950: '#0D4E12'
        },
        // Secondary color palette (Blue for trust)
        secondary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3',
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
          950: '#0A3D91'
        },
        // Accent colors for different features
        accent: {
          gold: '#FFB300',      // Savings/investments
          red: '#F44336',       // Alerts/urgent
          orange: '#FF9800',    // Warnings
          purple: '#9C27B0',    // Premium features
          teal: '#009688'       // Success states
        },
        // Semantic colors
        success: {
          50: '#E8F5E8',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C'
        },
        warning: {
          50: '#FFF8E1',
          500: '#FFB300',
          600: '#FFA000',
          700: '#FF8F00'
        },
        error: {
          50: '#FFEBEE',
          500: '#F44336',
          600: '#E53935',
          700: '#D32F2F'
        },
        info: {
          50: '#E3F2FD',
          500: '#2196F3',
          600: '#1E88E5',
          700: '#1976D2'
        },
        // Neutral colors
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
          950: '#141414'
        },
        // Background colors
        background: {
          primary: '#FFFFFF',
          secondary: '#F8F9FA',
          tertiary: '#F5F5F5',
          dark: '#1A1A1A'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace']
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }]
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px'
      },
      boxShadow: {
        'soft': '0 2px 8px 0 rgba(99, 99, 99, 0.2)',
        'medium': '0 4px 16px 0 rgba(99, 99, 99, 0.2)',
        'hard': '0 8px 32px 0 rgba(99, 99, 99, 0.3)',
        'member-card': '0 4px 12px rgba(27, 94, 32, 0.15)',
        'savings-card': '0 2px 8px rgba(76, 175, 80, 0.2)',
        'loan-card': '0 2px 8px rgba(33, 150, 243, 0.2)'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s ease-in-out',
        'loading': 'loading 1.5s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(-5%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
        },
        loading: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    // Custom plugin for Koperasi Sinoman components
    function({ addComponents, theme }) {
      addComponents({
        // Member Card Components
        '.member-card': {
          '@apply bg-white rounded-2xl shadow-member-card border border-primary-100 p-6 transition-all duration-200 hover:shadow-medium': {},
        },
        '.member-card-header': {
          '@apply flex items-center justify-between mb-4': {},
        },
        '.member-card-avatar': {
          '@apply w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold': {},
        },
        '.member-card-info': {
          '@apply flex-1 ml-4': {},
        },
        '.member-card-name': {
          '@apply text-lg font-semibold text-neutral-900': {},
        },
        '.member-card-id': {
          '@apply text-sm text-neutral-600': {},
        },
        '.member-card-balance': {
          '@apply text-2xl font-bold text-primary-600': {},
        },

        // Savings Display Components
        '.savings-card': {
          '@apply bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-savings-card p-6 border border-primary-200': {},
        },
        '.savings-header': {
          '@apply flex items-center justify-between mb-3': {},
        },
        '.savings-type': {
          '@apply text-sm font-medium text-primary-700 uppercase tracking-wide': {},
        },
        '.savings-amount': {
          '@apply text-3xl font-bold text-primary-800': {},
        },
        '.savings-label': {
          '@apply text-sm text-primary-600 mt-1': {},
        },
        '.savings-growth': {
          '@apply flex items-center text-sm text-accent-teal font-medium mt-2': {},
        },

        // Loan Display Components
        '.loan-card': {
          '@apply bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl shadow-loan-card p-6 border border-secondary-200': {},
        },
        '.loan-header': {
          '@apply flex items-center justify-between mb-4': {},
        },
        '.loan-type': {
          '@apply text-sm font-medium text-secondary-700 uppercase tracking-wide': {},
        },
        '.loan-amount': {
          '@apply text-2xl font-bold text-secondary-800': {},
        },
        '.loan-progress': {
          '@apply w-full bg-secondary-200 rounded-full h-2 mt-3': {},
        },
        '.loan-progress-bar': {
          '@apply bg-secondary-600 h-2 rounded-full transition-all duration-300': {},
        },
        '.loan-remaining': {
          '@apply text-sm text-secondary-600 mt-2': {},
        },

        // Form Elements
        '.form-input': {
          '@apply w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors': {},
        },
        '.form-input-error': {
          '@apply border-error-500 focus:ring-error-500 focus:border-error-500': {},
        },
        '.form-label': {
          '@apply block text-sm font-medium text-neutral-700 mb-2': {},
        },
        '.form-error': {
          '@apply text-error-600 text-sm mt-1': {},
        },
        '.form-help': {
          '@apply text-neutral-500 text-sm mt-1': {},
        },

        // Button Components
        '.btn-primary': {
          '@apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2': {},
        },
        '.btn-secondary': {
          '@apply bg-secondary-600 hover:bg-secondary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2': {},
        },
        '.btn-outline': {
          '@apply border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200': {},
        },
        '.btn-ghost': {
          '@apply text-primary-600 hover:bg-primary-50 font-medium py-3 px-6 rounded-lg transition-colors duration-200': {},
        },
        '.btn-success': {
          '@apply bg-success-600 hover:bg-success-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200': {},
        },
        '.btn-warning': {
          '@apply bg-warning-600 hover:bg-warning-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200': {},
        },
        '.btn-error': {
          '@apply bg-error-600 hover:bg-error-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200': {},
        },

        // Card Components
        '.card': {
          '@apply bg-white rounded-xl shadow-soft border border-neutral-200 p-6': {},
        },
        '.card-header': {
          '@apply border-b border-neutral-200 pb-4 mb-6': {},
        },
        '.card-title': {
          '@apply text-xl font-semibold text-neutral-900': {},
        },
        '.card-subtitle': {
          '@apply text-neutral-600 mt-1': {},
        },

        // Status Indicators
        '.status-active': {
          '@apply bg-success-100 text-success-700 px-3 py-1 rounded-full text-sm font-medium': {},
        },
        '.status-pending': {
          '@apply bg-warning-100 text-warning-700 px-3 py-1 rounded-full text-sm font-medium': {},
        },
        '.status-inactive': {
          '@apply bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-sm font-medium': {},
        },
        '.status-error': {
          '@apply bg-error-100 text-error-700 px-3 py-1 rounded-full text-sm font-medium': {},
        },

        // Currency Display
        '.currency': {
          '@apply font-mono font-semibold': {},
        },
        '.currency-large': {
          '@apply text-3xl font-mono font-bold': {},
        },
        '.currency-medium': {
          '@apply text-xl font-mono font-semibold': {},
        },
        '.currency-small': {
          '@apply text-sm font-mono font-medium': {},
        }
      })
    }
  ]
}