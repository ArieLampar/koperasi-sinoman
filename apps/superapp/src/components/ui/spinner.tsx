'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        default: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-3',
        xl: 'h-12 w-12 border-4'
      },
      variant: {
        default: 'text-primary-600',
        secondary: 'text-neutral-400',
        white: 'text-white',
        success: 'text-success-600',
        warning: 'text-warning-600',
        error: 'text-error-600'
      }
    },
    defaultVariants: {
      size: 'default',
      variant: 'default'
    }
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, variant }), className)}
        role="status"
        aria-label={label || 'Loading'}
        {...props}
      >
        <span className="sr-only">{label || 'Loading...'}</span>
      </div>
    )
  }
)
Spinner.displayName = 'Spinner'

// Loading component with text
interface LoadingProps {
  size?: VariantProps<typeof spinnerVariants>['size']
  variant?: VariantProps<typeof spinnerVariants>['variant']
  text?: string
  className?: string
}

const Loading: React.FC<LoadingProps> = ({
  size = 'default',
  variant = 'default',
  text = 'Loading...',
  className
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <Spinner size={size} variant={variant} />
      {text && (
        <p className="text-sm text-neutral-600">{text}</p>
      )}
    </div>
  )
}

// Full page loading overlay
interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
  variant?: VariantProps<typeof spinnerVariants>['variant']
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text = 'Loading...',
  variant = 'default'
}) => {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
      <Loading size="lg" variant={variant} text={text} />
    </div>
  )
}

export { Spinner, Loading, LoadingOverlay, spinnerVariants }