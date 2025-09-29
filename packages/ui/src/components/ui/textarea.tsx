import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      size: {
        sm: 'min-h-[60px] px-2 py-1 text-sm',
        default: 'min-h-[80px] px-3 py-2',
        lg: 'min-h-[120px] px-4 py-3 text-base',
      },
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      resize: 'vertical',
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  /**
   * Show error state styling
   */
  error?: boolean
  /**
   * Show success state styling
   */
  success?: boolean
  /**
   * Show character count
   */
  showCount?: boolean
  /**
   * Maximum character limit
   */
  maxLength?: number
  /**
   * Auto-resize to content height
   */
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    variant,
    size,
    resize,
    error,
    success,
    showCount = false,
    maxLength,
    autoResize = false,
    value,
    onChange,
    ...props
  }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const inputVariant = error ? 'error' : success ? 'success' : variant

    // Auto-resize functionality
    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [value, autoResize])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
      onChange?.(e)
    }

    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className="space-y-2">
        <textarea
          className={cn(
            textareaVariants({
              variant: inputVariant,
              size,
              resize: autoResize ? 'none' : resize
            }),
            className
          )}
          ref={(element) => {
            if (typeof ref === 'function') {
              ref(element)
            } else if (ref) {
              ref.current = element
            }
            if (textareaRef) {
              textareaRef.current = element
            }
          }}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          {...props}
        />

        {(showCount || maxLength) && (
          <div className="flex justify-between text-xs text-muted-foreground">
            {showCount && (
              <span>
                {currentLength}
                {maxLength && ` / ${maxLength}`}
              </span>
            )}
            {maxLength && currentLength > maxLength * 0.8 && (
              <span className={cn(
                currentLength >= maxLength ? 'text-destructive' : 'text-yellow-600'
              )}>
                {maxLength - currentLength} characters remaining
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea, textareaVariants }