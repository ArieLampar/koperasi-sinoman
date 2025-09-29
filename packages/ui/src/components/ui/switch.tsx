import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
  {
    variants: {
      variant: {
        default: '',
        error: 'data-[state=checked]:bg-destructive',
        success: 'data-[state=checked]:bg-green-500',
      },
      size: {
        sm: 'h-4 w-7',
        default: 'h-6 w-11',
        lg: 'h-7 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const switchThumbVariants = cva(
  'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
  {
    variants: {
      size: {
        sm: 'h-3 w-3 data-[state=checked]:translate-x-3',
        default: 'h-5 w-5 data-[state=checked]:translate-x-5',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-5',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {
  /**
   * Show error state styling
   */
  error?: boolean
  /**
   * Show success state styling
   */
  success?: boolean
  /**
   * Label text for the switch
   */
  label?: string
  /**
   * Description text below the label
   */
  description?: string
  /**
   * Position of the label relative to the switch
   */
  labelPosition?: 'left' | 'right'
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({
  className,
  variant,
  size = 'default',
  error,
  success,
  label,
  description,
  labelPosition = 'right',
  ...props
}, ref) => {
  const switchVariant = error ? 'error' : success ? 'success' : variant

  const switchElement = (
    <SwitchPrimitive.Root
      className={cn(switchVariants({ variant: switchVariant, size }), className)}
      {...props}
      ref={ref}
    >
      <SwitchPrimitive.Thumb
        className={cn(switchThumbVariants({ size }))}
      />
    </SwitchPrimitive.Root>
  )

  if (!label) {
    return switchElement
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

      {switchElement}

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
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch, switchVariants, switchThumbVariants }