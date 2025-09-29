'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import { User } from 'lucide-react'

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        '2xl': 'h-20 w-20'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
)

interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)

    React.useEffect(() => {
      setImageError(false)
    }, [src])

    const renderFallback = () => {
      if (fallback) {
        return (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-600 font-medium">
            {fallback}
          </div>
        )
      }

      return (
        <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
          <User className="h-1/2 w-1/2" />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            className="aspect-square h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          renderFallback()
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'

export { Avatar, avatarVariants }