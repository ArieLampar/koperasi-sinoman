import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-10 w-10',
      },
      variant: {
        default: 'text-primary',
        secondary: 'text-muted-foreground',
        white: 'text-white',
        current: 'text-current',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Show loading text alongside spinner
   */
  label?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2',
          className
        )}
        role="status"
        aria-label={label || 'Loading'}
        {...props}
      >
        <div
          className={cn(spinnerVariants({ size, variant }))}
          aria-hidden="true"
        />
        {label && (
          <span className="text-sm text-muted-foreground">
            {label}
          </span>
        )}
        <span className="sr-only">
          {label || 'Loading...'}
        </span>
      </div>
    )
  }
)

Spinner.displayName = 'Spinner'

export { Spinner, spinnerVariants }
export default Spinner