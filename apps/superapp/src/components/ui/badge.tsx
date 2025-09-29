'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-600 hover:bg-primary-200',
        secondary: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
        destructive: 'bg-error-100 text-error-600 hover:bg-error-200',
        success: 'bg-success-100 text-success-600 hover:bg-success-200',
        warning: 'bg-warning-100 text-warning-600 hover:bg-warning-200',
        info: 'bg-info-100 text-info-600 hover:bg-info-200',
        outline: 'border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }