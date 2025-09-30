'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import {
  CrownIcon,
  PercentIcon,
  TagIcon,
  TrendingDownIcon,
  SparklesIcon,
  FlameIcon,
  StarIcon
} from 'lucide-react'

// =============================================================================
// PRICE BADGE VARIANTS
// =============================================================================

const priceBadgeVariants = cva(
  'inline-flex items-center gap-1 font-medium transition-all duration-200',
  {
    variants: {
      variant: {
        member: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md hover:shadow-lg',
        discount: 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md hover:shadow-lg',
        savings: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg',
        flash: 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md hover:shadow-lg animate-pulse',
        premium: 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-md hover:shadow-lg',
        new: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md hover:shadow-lg',
        hot: 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md hover:shadow-lg',
        outline: 'border-2 border-primary text-primary bg-background hover:bg-primary/5',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        muted: 'bg-muted text-muted-foreground'
      },
      size: {
        xs: 'px-1.5 py-0.5 text-xs h-5',
        sm: 'px-2 py-1 text-xs h-6',
        md: 'px-2.5 py-1 text-sm h-7',
        lg: 'px-3 py-1.5 text-sm h-8',
        xl: 'px-4 py-2 text-base h-10'
      },
      shape: {
        rounded: 'rounded-md',
        full: 'rounded-full',
        pill: 'rounded-full px-3',
        square: 'rounded-none',
        tag: 'rounded-l-md rounded-r-none relative before:absolute before:right-0 before:top-0 before:h-full before:w-0 before:border-l-8 before:border-t-4 before:border-b-4 before:border-l-current before:border-t-transparent before:border-b-transparent'
      },
      position: {
        inline: '',
        floating: 'absolute z-10',
        corner: 'absolute top-2 right-2 z-10',
        topLeft: 'absolute top-2 left-2 z-10',
        bottomRight: 'absolute bottom-2 right-2 z-10',
        bottomLeft: 'absolute bottom-2 left-2 z-10'
      }
    },
    defaultVariants: {
      variant: 'discount',
      size: 'sm',
      shape: 'rounded',
      position: 'inline'
    }
  }
)

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

export interface PriceBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof priceBadgeVariants> {
  // Price Configuration
  originalPrice?: number
  currentPrice?: number
  memberPrice?: number
  discountPercentage?: number
  savingsAmount?: number

  // Display Options
  showIcon?: boolean
  showPercentage?: boolean
  showAmount?: boolean
  showMemberBadge?: boolean

  // Labels
  label?: string
  memberLabel?: string
  discountLabel?: string
  savingsLabel?: string

  // Formatting
  currency?: string
  locale?: string
  prefix?: string
  suffix?: string

  // Interaction
  showTooltip?: boolean
  tooltipContent?: string
  animated?: boolean
  pulsing?: boolean

  // Special States
  isFlashSale?: boolean
  isLimitedTime?: boolean
  isMemberOnly?: boolean
  isNew?: boolean
  isHot?: boolean
  isPremium?: boolean

  // Custom Icon
  icon?: React.ReactNode
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const formatPrice = (
  price: number,
  currency: string = 'IDR',
  locale: string = 'id-ID'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

const calculateSavings = (originalPrice: number, currentPrice: number) => {
  const amount = originalPrice - currentPrice
  const percentage = Math.round((amount / originalPrice) * 100)
  return { amount, percentage }
}

const getDefaultIcon = (variant: string) => {
  const iconMap = {
    member: CrownIcon,
    discount: PercentIcon,
    savings: TrendingDownIcon,
    flash: FlameIcon,
    premium: SparklesIcon,
    new: StarIcon,
    hot: FlameIcon,
    outline: TagIcon,
    secondary: TagIcon,
    muted: TagIcon
  }
  return iconMap[variant as keyof typeof iconMap] || TagIcon
}

// =============================================================================
// PRICE BADGE COMPONENT
// =============================================================================

const PriceBadge = forwardRef<HTMLDivElement, PriceBadgeProps>(
  ({
    originalPrice,
    currentPrice,
    memberPrice,
    discountPercentage,
    savingsAmount,
    showIcon = true,
    showPercentage = true,
    showAmount = false,
    showMemberBadge = true,
    label,
    memberLabel = 'Member',
    discountLabel = 'Diskon',
    savingsLabel = 'Hemat',
    currency = 'IDR',
    locale = 'id-ID',
    prefix,
    suffix,
    showTooltip = false,
    tooltipContent,
    animated = false,
    pulsing = false,
    isFlashSale = false,
    isLimitedTime = false,
    isMemberOnly = false,
    isNew = false,
    isHot = false,
    isPremium = false,
    icon,
    variant = 'discount',
    size = 'sm',
    shape = 'rounded',
    position = 'inline',
    className,
    ...props
  }, ref) => {
    // Calculate savings if prices are provided
    const calculatedSavings = originalPrice && currentPrice
      ? calculateSavings(originalPrice, currentPrice)
      : null

    const memberSavings = memberPrice && currentPrice
      ? calculateSavings(currentPrice, memberPrice)
      : null

    // Determine the actual values to display
    const actualDiscountPercentage = discountPercentage || calculatedSavings?.percentage || memberSavings?.percentage
    const actualSavingsAmount = savingsAmount || calculatedSavings?.amount || memberSavings?.amount

    // Auto-detect variant based on context
    let autoVariant = variant
    if (isFlashSale) autoVariant = 'flash'
    else if (isMemberOnly || memberPrice) autoVariant = 'member'
    else if (isNew) autoVariant = 'new'
    else if (isHot) autoVariant = 'hot'
    else if (isPremium) autoVariant = 'premium'

    // Get the appropriate icon
    const IconComponent = icon ? null : getDefaultIcon(autoVariant)

    // Build the badge content
    const getBadgeContent = () => {
      if (label) {
        return label
      }

      if (autoVariant === 'member' && memberPrice) {
        const content = []
        if (showIcon && (icon || IconComponent)) {
          content.push(
            <span key="icon" className="flex-shrink-0">
              {icon || (IconComponent && <IconComponent className="h-3 w-3" />)}
            </span>
          )
        }
        content.push(
          <span key="text">{memberLabel}</span>
        )
        if (memberSavings && showPercentage) {
          content.push(
            <span key="percentage">-{memberSavings.percentage}%</span>
          )
        }
        return content
      }

      const content = []

      if (showIcon && (icon || IconComponent)) {
        content.push(
          <span key="icon" className="flex-shrink-0">
            {icon || (IconComponent && <IconComponent className="h-3 w-3" />)}
          </span>
        )
      }

      if (prefix) content.push(<span key="prefix">{prefix}</span>)

      if (actualDiscountPercentage && showPercentage) {
        content.push(
          <span key="percentage">-{actualDiscountPercentage}%</span>
        )
      }

      if (actualSavingsAmount && showAmount) {
        content.push(
          <span key="amount">{savingsLabel} {formatPrice(actualSavingsAmount, currency, locale)}</span>
        )
      }

      if (!actualDiscountPercentage && !actualSavingsAmount) {
        content.push(
          <span key="default">{discountLabel}</span>
        )
      }

      if (suffix) content.push(<span key="suffix">{suffix}</span>)

      return content
    }

    // Apply animations
    const badgeClassName = cn(
      priceBadgeVariants({ variant: autoVariant, size, shape, position }),
      animated && 'animate-bounce',
      pulsing && 'animate-pulse',
      className
    )

    const badgeContent = (
      <div
        ref={ref}
        className={badgeClassName}
        {...props}
      >
        {getBadgeContent()}
      </div>
    )

    // Wrap with tooltip if needed
    if (showTooltip && tooltipContent) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {badgeContent}
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipContent}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return badgeContent
  }
)

PriceBadge.displayName = 'PriceBadge'

// =============================================================================
// MEMBER PRICE BADGE COMPONENT
// =============================================================================

export interface MemberPriceBadgeProps
  extends Omit<PriceBadgeProps, 'variant'> {
  memberPrice: number
  publicPrice: number
  memberLabel?: string
  showSavings?: boolean
}

const MemberPriceBadge = forwardRef<HTMLDivElement, MemberPriceBadgeProps>(
  ({
    memberPrice,
    publicPrice,
    memberLabel = 'Harga Member',
    showSavings = true,
    showTooltip = true,
    ...props
  }, ref) => {
    const savings = calculateSavings(publicPrice, memberPrice)
    const tooltipContent = showTooltip
      ? `Hemat ${formatPrice(savings.amount)} (${savings.percentage}%) untuk member`
      : undefined

    return (
      <PriceBadge
        ref={ref}
        variant="member"
        currentPrice={publicPrice}
        memberPrice={memberPrice}
        label={showSavings ? `${memberLabel} -${savings.percentage}%` : memberLabel}
        showTooltip={showTooltip}
        tooltipContent={tooltipContent}
        isMemberOnly
        {...props}
      />
    )
  }
)

MemberPriceBadge.displayName = 'MemberPriceBadge'

// =============================================================================
// DISCOUNT BADGE COMPONENT
// =============================================================================

export interface DiscountBadgeProps
  extends Omit<PriceBadgeProps, 'variant'> {
  originalPrice: number
  discountedPrice: number
  type?: 'percentage' | 'amount'
}

const DiscountBadge = forwardRef<HTMLDivElement, DiscountBadgeProps>(
  ({
    originalPrice,
    discountedPrice,
    type = 'percentage',
    showTooltip = true,
    ...props
  }, ref) => {
    const savings = calculateSavings(originalPrice, discountedPrice)
    const tooltipContent = showTooltip
      ? `Hemat ${formatPrice(savings.amount)} dari harga normal`
      : undefined

    return (
      <PriceBadge
        ref={ref}
        variant="discount"
        originalPrice={originalPrice}
        currentPrice={discountedPrice}
        label={type === 'percentage' ? `-${savings.percentage}%` : `Hemat ${formatPrice(savings.amount)}`}
        showTooltip={showTooltip}
        tooltipContent={tooltipContent}
        {...props}
      />
    )
  }
)

DiscountBadge.displayName = 'DiscountBadge'

// =============================================================================
// FLASH SALE BADGE COMPONENT
// =============================================================================

export interface FlashSaleBadgeProps
  extends Omit<PriceBadgeProps, 'variant'> {
  originalPrice: number
  salePrice: number
  timeLeft?: string
  animated?: boolean
}

const FlashSaleBadge = forwardRef<HTMLDivElement, FlashSaleBadgeProps>(
  ({
    originalPrice,
    salePrice,
    timeLeft,
    animated = true,
    showTooltip = true,
    ...props
  }, ref) => {
    const savings = calculateSavings(originalPrice, salePrice)
    const label = timeLeft ? `Flash Sale -${savings.percentage}%` : `Flash Sale -${savings.percentage}%`
    const tooltipContent = showTooltip
      ? `Flash Sale! Hemat ${formatPrice(savings.amount)}${timeLeft ? ` • ${timeLeft}` : ''}`
      : undefined

    return (
      <PriceBadge
        ref={ref}
        variant="flash"
        originalPrice={originalPrice}
        currentPrice={salePrice}
        label={label}
        animated={animated}
        pulsing={animated}
        isFlashSale
        showTooltip={showTooltip}
        tooltipContent={tooltipContent}
        {...props}
      />
    )
  }
)

FlashSaleBadge.displayName = 'FlashSaleBadge'

// =============================================================================
// SAVINGS CALCULATOR COMPONENT
// =============================================================================

export interface SavingsCalculatorProps {
  originalPrice: number
  currentPrice?: number
  memberPrice?: number
  showMemberBadge?: boolean
  showDiscountBadge?: boolean
  badgeSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SavingsCalculator = ({
  originalPrice,
  currentPrice,
  memberPrice,
  showMemberBadge = true,
  showDiscountBadge = true,
  badgeSize = 'sm',
  className
}: SavingsCalculatorProps) => {
  const badges = []

  // Regular discount badge
  if (showDiscountBadge && currentPrice && currentPrice < originalPrice) {
    badges.push(
      <DiscountBadge
        key="discount"
        originalPrice={originalPrice}
        discountedPrice={currentPrice}
        size={badgeSize}
      />
    )
  }

  // Member price badge
  if (showMemberBadge && memberPrice) {
    const basePrice = currentPrice || originalPrice
    if (memberPrice < basePrice) {
      badges.push(
        <MemberPriceBadge
          key="member"
          publicPrice={basePrice}
          memberPrice={memberPrice}
          size={badgeSize}
        />
      )
    }
  }

  if (badges.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {badges}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  PriceBadge,
  MemberPriceBadge,
  DiscountBadge,
  FlashSaleBadge,
  SavingsCalculator,
  priceBadgeVariants,
  formatPrice,
  calculateSavings,
  type PriceBadgeProps,
  type MemberPriceBadgeProps,
  type DiscountBadgeProps,
  type FlashSaleBadgeProps,
  type SavingsCalculatorProps
}