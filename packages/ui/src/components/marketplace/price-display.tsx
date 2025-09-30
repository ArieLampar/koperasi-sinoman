'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { InfoIcon, CrownIcon, PercentIcon } from 'lucide-react'

// =============================================================================
// PRICE DISPLAY VARIANTS
// =============================================================================

const priceDisplayVariants = cva(
  'flex flex-col gap-1',
  {
    variants: {
      variant: {
        default: '',
        compact: 'gap-0.5',
        large: 'gap-2',
        inline: 'flex-row items-center gap-2'
      },
      alignment: {
        left: 'items-start',
        center: 'items-center',
        right: 'items-end'
      }
    },
    defaultVariants: {
      variant: 'default',
      alignment: 'left'
    }
  }
)

const priceVariants = cva(
  'font-bold text-foreground',
  {
    variants: {
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl'
      },
      color: {
        default: 'text-foreground',
        primary: 'text-primary',
        destructive: 'text-destructive',
        success: 'text-green-600',
        muted: 'text-muted-foreground'
      }
    },
    defaultVariants: {
      size: 'md',
      color: 'default'
    }
  }
)

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

export interface PriceDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof priceDisplayVariants> {
  price: number
  originalPrice?: number
  memberPrice?: number
  currency?: string
  locale?: string
  showCurrency?: boolean
  showOriginalPrice?: boolean
  showMemberPrice?: boolean
  showDiscount?: boolean
  discountType?: 'percentage' | 'amount'
  memberDiscountLabel?: string
  discountLabel?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  priceColor?: 'default' | 'primary' | 'destructive' | 'success' | 'muted'
  originalPriceColor?: 'default' | 'primary' | 'destructive' | 'success' | 'muted'
  memberPriceColor?: 'default' | 'primary' | 'destructive' | 'success' | 'muted'
  showTooltip?: boolean
  tooltipContent?: string
  isMemberOnly?: boolean
  isOnSale?: boolean
  highlightSaving?: boolean
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const formatPrice = (
  price: number,
  currency: string = 'IDR',
  locale: string = 'id-ID',
  showCurrency: boolean = true
): string => {
  if (showCurrency) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  } else {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }
}

const calculateDiscount = (originalPrice: number, currentPrice: number): {
  percentage: number
  amount: number
} => {
  const amount = originalPrice - currentPrice
  const percentage = (amount / originalPrice) * 100
  return { percentage: Math.round(percentage), amount }
}

// =============================================================================
// PRICE DISPLAY COMPONENT
// =============================================================================

const PriceDisplay = forwardRef<HTMLDivElement, PriceDisplayProps>(
  ({
    price,
    originalPrice,
    memberPrice,
    currency = 'IDR',
    locale = 'id-ID',
    showCurrency = true,
    showOriginalPrice = true,
    showMemberPrice = true,
    showDiscount = true,
    discountType = 'percentage',
    memberDiscountLabel = 'Harga Member',
    discountLabel = 'Hemat',
    size = 'md',
    priceColor = 'default',
    originalPriceColor = 'muted',
    memberPriceColor = 'success',
    showTooltip = false,
    tooltipContent,
    isMemberOnly = false,
    isOnSale = false,
    highlightSaving = false,
    variant = 'default',
    alignment = 'left',
    className,
    ...props
  }, ref) => {
    const mainPrice = price
    const hasOriginalPrice = originalPrice && originalPrice > price
    const hasMemberPrice = memberPrice && memberPrice < price
    const hasDiscount = hasOriginalPrice || hasMemberPrice

    const discount = hasOriginalPrice
      ? calculateDiscount(originalPrice, price)
      : hasMemberPrice
      ? calculateDiscount(price, memberPrice)
      : null

    const isInlineVariant = variant === 'inline'

    const PriceContent = () => (
      <>
        {/* Main Price */}
        <div className={cn(
          'flex items-center gap-2',
          isInlineVariant ? 'flex-row' : 'flex-row'
        )}>
          <span className={cn(
            priceVariants({ size, color: priceColor }),
            isOnSale && 'text-destructive'
          )}>
            {formatPrice(mainPrice, currency, locale, showCurrency)}
          </span>

          {/* Member Only Badge */}
          {isMemberOnly && (
            <Badge variant="secondary" className="text-xs">
              <CrownIcon className="h-3 w-3 mr-1" />
              Member
            </Badge>
          )}

          {/* Sale Badge */}
          {isOnSale && (
            <Badge variant="destructive" className="text-xs">
              Sale
            </Badge>
          )}
        </div>

        {/* Original Price (Strikethrough) */}
        {showOriginalPrice && hasOriginalPrice && (
          <div className={cn(
            'flex items-center gap-2',
            isInlineVariant ? 'flex-row' : 'flex-row'
          )}>
            <span className={cn(
              'line-through text-sm',
              priceVariants({ size: size === '2xl' ? 'lg' : size === 'xl' ? 'md' : 'sm', color: originalPriceColor })
            )}>
              {formatPrice(originalPrice, currency, locale, showCurrency)}
            </span>

            {/* Discount Badge */}
            {showDiscount && discount && (
              <Badge variant="destructive" className="text-xs">
                <PercentIcon className="h-3 w-3 mr-1" />
                -{discount.percentage}%
              </Badge>
            )}
          </div>
        )}

        {/* Member Price */}
        {showMemberPrice && hasMemberPrice && (
          <div className={cn(
            'flex items-center gap-2',
            isInlineVariant ? 'flex-row' : 'flex-row'
          )}>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">{memberDiscountLabel}:</span>
              <span className={cn(
                priceVariants({
                  size: size === '2xl' ? 'lg' : size === 'xl' ? 'md' : size === 'lg' ? 'sm' : 'xs',
                  color: memberPriceColor
                })
              )}>
                {formatPrice(memberPrice, currency, locale, showCurrency)}
              </span>
            </div>

            {/* Member Discount Badge */}
            {showDiscount && discount && (
              <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                {discountType === 'percentage'
                  ? `-${discount.percentage}%`
                  : `${discountLabel} ${formatPrice(discount.amount, currency, locale, showCurrency)}`
                }
              </Badge>
            )}
          </div>
        )}

        {/* Savings Highlight */}
        {highlightSaving && discount && (
          <div className="text-xs text-green-600 font-medium">
            {discountType === 'percentage'
              ? `Hemat ${discount.percentage}%`
              : `Hemat ${formatPrice(discount.amount, currency, locale, showCurrency)}`
            }
          </div>
        )}
      </>
    )

    const content = (
      <div
        ref={ref}
        className={cn(priceDisplayVariants({ variant, alignment }), className)}
        {...props}
      >
        <PriceContent />
      </div>
    )

    if (showTooltip && tooltipContent) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                {content}
                <InfoIcon className="h-3 w-3 text-muted-foreground inline ml-1" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipContent}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return content
  }
)

PriceDisplay.displayName = 'PriceDisplay'

// =============================================================================
// PRICE RANGE COMPONENT
// =============================================================================

export interface PriceRangeProps {
  minPrice: number
  maxPrice: number
  currency?: string
  locale?: string
  showCurrency?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  separator?: string
  className?: string
}

const PriceRange = forwardRef<HTMLSpanElement, PriceRangeProps>(
  ({
    minPrice,
    maxPrice,
    currency = 'IDR',
    locale = 'id-ID',
    showCurrency = true,
    size = 'md',
    separator = ' - ',
    className,
    ...props
  }, ref) => {
    if (minPrice === maxPrice) {
      return (
        <span
          ref={ref}
          className={cn(priceVariants({ size }), className)}
          {...props}
        >
          {formatPrice(minPrice, currency, locale, showCurrency)}
        </span>
      )
    }

    return (
      <span
        ref={ref}
        className={cn(priceVariants({ size }), className)}
        {...props}
      >
        {formatPrice(minPrice, currency, locale, showCurrency)}
        {separator}
        {formatPrice(maxPrice, currency, locale, showCurrency)}
      </span>
    )
  }
)

PriceRange.displayName = 'PriceRange'

// =============================================================================
// DISCOUNT BADGE COMPONENT
// =============================================================================

export interface DiscountBadgeProps {
  originalPrice: number
  currentPrice: number
  type?: 'percentage' | 'amount'
  currency?: string
  locale?: string
  showCurrency?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const DiscountBadge = forwardRef<HTMLDivElement, DiscountBadgeProps>(
  ({
    originalPrice,
    currentPrice,
    type = 'percentage',
    currency = 'IDR',
    locale = 'id-ID',
    showCurrency = true,
    variant = 'destructive',
    size = 'md',
    className,
    ...props
  }, ref) => {
    const discount = calculateDiscount(originalPrice, currentPrice)

    if (discount.percentage <= 0) return null

    return (
      <Badge
        ref={ref}
        variant={variant}
        className={cn(
          'text-xs',
          size === 'sm' && 'text-xs px-1.5 py-0.5',
          size === 'lg' && 'text-sm px-2.5 py-1',
          className
        )}
        {...props}
      >
        {type === 'percentage' ? (
          <>
            <PercentIcon className="h-3 w-3 mr-1" />
            -{discount.percentage}%
          </>
        ) : (
          `Hemat ${formatPrice(discount.amount, currency, locale, showCurrency)}`
        )}
      </Badge>
    )
  }
)

DiscountBadge.displayName = 'DiscountBadge'

// =============================================================================
// EXPORTS
// =============================================================================

export {
  PriceDisplay,
  PriceRange,
  DiscountBadge,
  priceDisplayVariants,
  priceVariants,
  formatPrice,
  calculateDiscount,
  type PriceDisplayProps,
  type PriceRangeProps,
  type DiscountBadgeProps
}