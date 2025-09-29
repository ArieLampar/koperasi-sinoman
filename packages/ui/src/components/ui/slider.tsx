import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const sliderVariants = cva(
  'relative flex w-full touch-none select-none items-center',
  {
    variants: {
      size: {
        sm: 'h-4',
        default: 'h-5',
        lg: 'h-6',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

const sliderTrackVariants = cva(
  'relative h-2 w-full grow overflow-hidden rounded-full bg-secondary',
  {
    variants: {
      size: {
        sm: 'h-1',
        default: 'h-2',
        lg: 'h-3',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

const sliderRangeVariants = cva(
  'absolute h-full bg-primary',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const sliderThumbVariants = cva(
  'block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
      variant: {
        default: 'border-primary',
        success: 'border-green-500',
        warning: 'border-yellow-500',
        danger: 'border-red-500',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
    VariantProps<typeof sliderVariants> {
  /**
   * Color variant of the slider
   */
  variant?: 'default' | 'success' | 'warning' | 'danger'
  /**
   * Show value labels
   */
  showValue?: boolean
  /**
   * Show tick marks
   */
  showTicks?: boolean
  /**
   * Number of tick marks to show
   */
  tickCount?: number
  /**
   * Format function for displaying values
   */
  formatValue?: (value: number) => string
  /**
   * Show min/max labels
   */
  showLabels?: boolean
  /**
   * Custom labels for min/max
   */
  labels?: {
    min?: string
    max?: string
  }
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({
  className,
  size = 'default',
  variant = 'default',
  showValue = false,
  showTicks = false,
  tickCount = 5,
  formatValue = (value) => value.toString(),
  showLabels = false,
  labels,
  min = 0,
  max = 100,
  step = 1,
  value,
  ...props
}, ref) => {
  const currentValue = value?.[0] ?? min

  const renderTicks = () => {
    if (!showTicks) return null

    const ticks = []
    const stepSize = (max - min) / (tickCount - 1)

    for (let i = 0; i < tickCount; i++) {
      const tickValue = min + i * stepSize
      const position = ((tickValue - min) / (max - min)) * 100

      ticks.push(
        <div
          key={i}
          className="absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground"
          style={{ left: `${position}%` }}
        />
      )
    }

    return <div className="absolute inset-0">{ticks}</div>
  }

  return (
    <div className="space-y-2">
      {showValue && (
        <div className="flex justify-center">
          <span className="text-sm font-medium">
            {formatValue(currentValue)}
          </span>
        </div>
      )}

      <div className="relative">
        <SliderPrimitive.Root
          ref={ref}
          className={cn(sliderVariants({ size }), className)}
          min={min}
          max={max}
          step={step}
          value={value}
          {...props}
        >
          <SliderPrimitive.Track
            className={cn(sliderTrackVariants({ size }))}
          >
            <SliderPrimitive.Range
              className={cn(sliderRangeVariants({ variant }))}
            />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className={cn(sliderThumbVariants({ size, variant }))}
          />
          {renderTicks()}
        </SliderPrimitive.Root>
      </div>

      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{labels?.min ?? formatValue(min)}</span>
          <span>{labels?.max ?? formatValue(max)}</span>
        </div>
      )}
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider, sliderVariants, sliderTrackVariants, sliderRangeVariants, sliderThumbVariants }