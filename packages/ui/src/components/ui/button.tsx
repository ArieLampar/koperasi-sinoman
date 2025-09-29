import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Spinner } from './spinner'

// Button variant definitions using class-variance-authority
const buttonVariants = cva(
  // Base styles - applied to all buttons
  [
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
    'relative overflow-hidden',
  ],
  {
    variants: {
      variant: {
        // Primary button - main call-to-action
        primary: [
          'bg-primary text-primary-foreground shadow-sm',
          'hover:bg-primary/90 hover:shadow-md',
          'focus-visible:ring-primary/50',
          'dark:bg-primary dark:text-primary-foreground',
          'dark:hover:bg-primary/90',
        ],
        // Secondary button - alternative actions
        secondary: [
          'bg-secondary text-secondary-foreground border border-input shadow-sm',
          'hover:bg-secondary/80 hover:border-input/80',
          'focus-visible:ring-secondary/50',
          'dark:bg-secondary dark:text-secondary-foreground',
          'dark:hover:bg-secondary/80',
        ],
        // Danger/destructive button - destructive actions
        danger: [
          'bg-destructive text-destructive-foreground shadow-sm',
          'hover:bg-destructive/90 hover:shadow-md',
          'focus-visible:ring-destructive/50',
          'dark:bg-destructive dark:text-destructive-foreground',
          'dark:hover:bg-destructive/90',
        ],
        // Success button - positive actions
        success: [
          'bg-success-500 text-white shadow-sm',
          'hover:bg-success-600 hover:shadow-md',
          'focus-visible:ring-success-500/50',
          'dark:bg-success-600 dark:hover:bg-success-700',
        ],
        // Warning button - cautionary actions
        warning: [
          'bg-warning-500 text-white shadow-sm',
          'hover:bg-warning-600 hover:shadow-md',
          'focus-visible:ring-warning-500/50',
          'dark:bg-warning-600 dark:hover:bg-warning-700',
        ],
        // Outline button - subtle emphasis
        outline: [
          'border border-input bg-background text-foreground shadow-sm',
          'hover:bg-accent hover:text-accent-foreground hover:border-accent',
          'focus-visible:ring-accent/50',
          'dark:border-input dark:bg-background',
          'dark:hover:bg-accent dark:hover:text-accent-foreground',
        ],
        // Ghost button - minimal emphasis
        ghost: [
          'text-foreground',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:ring-accent/50',
          'dark:text-foreground',
          'dark:hover:bg-accent dark:hover:text-accent-foreground',
        ],
        // Link button - styled as a link
        link: [
          'text-primary underline-offset-4',
          'hover:underline hover:text-primary/80',
          'focus-visible:ring-primary/50',
          'dark:text-primary dark:hover:text-primary/80',
        ],
        // Gradient button - premium/special actions
        gradient: [
          'bg-gradient-to-r from-primary to-primary-600 text-primary-foreground shadow-lg',
          'hover:from-primary/90 hover:to-primary-600/90 hover:shadow-xl',
          'focus-visible:ring-primary/50',
          'dark:from-primary dark:to-primary-600',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      loading: {
        true: 'cursor-wait',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false,
      loading: false,
    },
  }
)

// Loading spinner component for buttons
const ButtonSpinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { size?: 'sm' | 'default' | 'lg' | 'xl' }
>(({ className, size = 'default', ...props }, ref) => {
  const spinnerSize = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  }

  return (
    <div
      ref={ref}
      className={cn('absolute inset-0 flex items-center justify-center', className)}
      {...props}
    >
      <Spinner className={cn(spinnerSize[size], 'text-current')} />
    </div>
  )
})

ButtonSpinner.displayName = 'ButtonSpinner'

// Icon wrapper component for consistent icon styling
const ButtonIcon = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    position?: 'left' | 'right'
    size?: 'sm' | 'default' | 'lg' | 'xl'
  }
>(({ className, position = 'left', size = 'default', children, ...props }, ref) => {
  const iconSize = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  }

  const spacing = {
    left: {
      sm: 'mr-1.5',
      default: 'mr-2',
      lg: 'mr-2.5',
      xl: 'mr-3',
    },
    right: {
      sm: 'ml-1.5',
      default: 'ml-2',
      lg: 'ml-2.5',
      xl: 'ml-3',
    },
  }

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center shrink-0',
        iconSize[size],
        spacing[position][size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
})

ButtonIcon.displayName = 'ButtonIcon'

// Main Button component interface
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as a different element using Radix Slot
   * @example <Button asChild><a href="/link">Link Button</a></Button>
   */
  asChild?: boolean

  /**
   * Show loading state with spinner
   */
  loading?: boolean

  /**
   * Icon to display on the left side of the button
   */
  leftIcon?: React.ReactNode

  /**
   * Icon to display on the right side of the button
   */
  rightIcon?: React.ReactNode

  /**
   * Full width button
   */
  fullWidth?: boolean

  /**
   * Loading text to display when loading is true
   */
  loadingText?: string

  /**
   * Additional accessible label for screen readers
   */
  ariaLabel?: string

  /**
   * Tooltip text for the button
   */
  tooltip?: string
}

// Main Button component
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      disabled,
      asChild = false,
      leftIcon,
      rightIcon,
      loadingText,
      ariaLabel,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = disabled || loading

    // Determine button content based on loading state
    const buttonContent = React.useMemo(() => {
      if (loading && loadingText) {
        return loadingText
      }
      return children
    }, [loading, loadingText, children])

    // Size mapping for icons and spinner
    const iconSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : 'default'

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth, loading }),
          className
        )}
        ref={ref}
        disabled={isDisabled}
        type={type}
        aria-label={ariaLabel}
        aria-disabled={isDisabled}
        aria-busy={loading}
        data-loading={loading}
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {/* Loading spinner overlay */}
        {loading && (
          <ButtonSpinner
            size={iconSize}
            aria-hidden="true"
          />
        )}

        {/* Button content container */}
        <span
          className={cn(
            'flex items-center justify-center',
            loading && 'opacity-0'
          )}
        >
          {/* Left icon */}
          {leftIcon && !loading && (
            <ButtonIcon
              position="left"
              size={iconSize}
              aria-hidden="true"
            >
              {leftIcon}
            </ButtonIcon>
          )}

          {/* Button text/content */}
          {buttonContent && (
            <span className="truncate">
              {buttonContent}
            </span>
          )}

          {/* Right icon */}
          {rightIcon && !loading && (
            <ButtonIcon
              position="right"
              size={iconSize}
              aria-hidden="true"
            >
              {rightIcon}
            </ButtonIcon>
          )}
        </span>

        {/* Screen reader loading announcement */}
        {loading && (
          <span className="sr-only">
            Loading...
          </span>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

// Export variants for external use
export { buttonVariants, ButtonIcon, ButtonSpinner }
export default Button