import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const checkboxVariants = cva(
  'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-destructive data-[state=checked]:bg-destructive',
        success: 'border-green-500 data-[state=checked]:bg-green-500',
      },
      size: {
        sm: 'h-3 w-3',
        default: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  /**
   * Show error state styling
   */
  error?: boolean
  /**
   * Show success state styling
   */
  success?: boolean
  /**
   * Label text for the checkbox
   */
  label?: string
  /**
   * Description text below the label
   */
  description?: string
  /**
   * Position of the label relative to the checkbox
   */
  labelPosition?: 'left' | 'right'
  /**
   * Show indeterminate state
   */
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({
  className,
  variant,
  size,
  error,
  success,
  label,
  description,
  labelPosition = 'right',
  indeterminate = false,
  checked,
  ...props
}, ref) => {
  const checkboxVariant = error ? 'error' : success ? 'success' : variant
  const isChecked = indeterminate ? 'indeterminate' : checked

  const checkboxElement = (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(checkboxVariants({ variant: checkboxVariant, size }), className)}
      checked={isChecked}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn('flex items-center justify-center text-current')}
      >
        {indeterminate ? (
          <Minus className="h-3 w-3" />
        ) : (
          <Check className="h-3 w-3" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )

  if (!label) {
    return checkboxElement
  }

  return (
    <div className="flex items-start space-x-2">
      {labelPosition === 'left' && (
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor={props.id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      {checkboxElement}

      {labelPosition === 'right' && (
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor={props.id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox, checkboxVariants }