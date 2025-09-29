import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { EyeIcon, EyeOffIcon, SearchIcon, XIcon } from 'lucide-react'

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      size: {
        sm: 'h-9 px-2 py-1 text-sm',
        default: 'h-10 px-3 py-2',
        lg: 'h-11 px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  /**
   * Show error state styling
   */
  error?: boolean
  /**
   * Show success state styling
   */
  success?: boolean
  /**
   * Left icon element
   */
  leftIcon?: React.ReactNode
  /**
   * Right icon element
   */
  rightIcon?: React.ReactNode
  /**
   * Show clear button when input has value
   */
  clearable?: boolean
  /**
   * Callback when clear button is clicked
   */
  onClear?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    size,
    type = 'text',
    error,
    success,
    leftIcon,
    rightIcon,
    clearable = false,
    onClear,
    value,
    ...props
  }, ref) => {
    const inputVariant = error ? 'error' : success ? 'success' : variant

    const hasLeftIcon = !!leftIcon
    const hasRightIcon = !!rightIcon || clearable
    const showClearButton = clearable && value && !props.disabled

    return (
      <div className="relative">
        {hasLeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}

        <input
          type={type}
          className={cn(
            inputVariants({ variant: inputVariant, size }),
            hasLeftIcon && 'pl-10',
            hasRightIcon && 'pr-10',
            className
          )}
          ref={ref}
          value={value}
          {...props}
        />

        {hasRightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {showClearButton && (
              <button
                type="button"
                onClick={onClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
            {rightIcon && !showClearButton && rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  /**
   * Placeholder text for search input
   */
  placeholder?: string
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ placeholder = 'Search...', ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        leftIcon={<SearchIcon className="h-4 w-4" />}
        clearable
        {...props}
      />
    )
  }
)
SearchInput.displayName = 'SearchInput'

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  /**
   * Show password visibility toggle
   */
  showToggle?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
    }

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          showToggle ? (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          ) : undefined
        }
        {...props}
      />
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export { Input, SearchInput, PasswordInput, inputVariants }