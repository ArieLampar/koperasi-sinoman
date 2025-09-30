'use client'

import { forwardRef, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Input } from '../ui/input'
import {
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  XIcon,
  HeartIcon,
  ZapIcon,
  PackageIcon
} from 'lucide-react'

// =============================================================================
// CART BUTTON VARIANTS
// =============================================================================

const cartButtonVariants = cva(
  'relative transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        icon: 'h-10 w-10 p-0',
        floating: 'rounded-full shadow-lg hover:shadow-xl fixed bottom-6 right-6 z-50 h-14 w-14 p-0'
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10 p-0'
      },
      state: {
        default: '',
        loading: 'animate-pulse',
        success: 'bg-green-600 hover:bg-green-700',
        error: 'bg-red-600 hover:bg-red-700',
        disabled: 'opacity-50 cursor-not-allowed'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default'
    }
  }
)

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

export interface CartButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof cartButtonVariants> {
  productId?: string
  quantity?: number
  maxQuantity?: number
  minQuantity?: number
  isInCart?: boolean
  isLoading?: boolean
  isOutOfStock?: boolean
  showQuantitySelector?: boolean
  showTooltip?: boolean
  tooltipContent?: string
  onAddToCart?: (productId?: string, quantity?: number) => void | Promise<void>
  onRemoveFromCart?: (productId?: string) => void | Promise<void>
  onQuantityChange?: (productId?: string, quantity: number) => void | Promise<void>
  addToCartLabel?: string
  removeFromCartLabel?: string
  outOfStockLabel?: string
  addingLabel?: string
  addedLabel?: string
  cartIcon?: React.ReactNode
  successIcon?: React.ReactNode
  loadingIcon?: React.ReactNode
  showSuccessState?: boolean
  successDuration?: number
  animateOnAdd?: boolean
  quickBuyMode?: boolean
  onQuickBuy?: (productId?: string, quantity?: number) => void | Promise<void>
  quickBuyLabel?: string
}

// =============================================================================
// QUANTITY SELECTOR COMPONENT
// =============================================================================

interface QuantitySelectorProps {
  quantity: number
  minQuantity: number
  maxQuantity: number
  onQuantityChange: (quantity: number) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const QuantitySelector = ({
  quantity,
  minQuantity,
  maxQuantity,
  onQuantityChange,
  size = 'md',
  disabled = false
}: QuantitySelectorProps) => {
  const handleDecrement = () => {
    if (quantity > minQuantity) {
      onQuantityChange(quantity - 1)
    }
  }

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      onQuantityChange(quantity + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    if (value >= minQuantity && value <= maxQuantity) {
      onQuantityChange(value)
    }
  }

  const buttonSize = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'
  const inputSize = size === 'sm' ? 'h-6 w-12 text-xs' : size === 'lg' ? 'h-10 w-16 text-base' : 'h-8 w-14 text-sm'

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        className={cn(buttonSize, 'p-0')}
        onClick={handleDecrement}
        disabled={disabled || quantity <= minQuantity}
        aria-label="Kurangi jumlah"
      >
        <MinusIcon className="h-3 w-3" />
      </Button>

      <Input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={minQuantity}
        max={maxQuantity}
        disabled={disabled}
        className={cn(inputSize, 'text-center border-x-0 rounded-none')}
        aria-label="Jumlah produk"
      />

      <Button
        type="button"
        variant="outline"
        className={cn(buttonSize, 'p-0')}
        onClick={handleIncrement}
        disabled={disabled || quantity >= maxQuantity}
        aria-label="Tambah jumlah"
      >
        <PlusIcon className="h-3 w-3" />
      </Button>
    </div>
  )
}

// =============================================================================
// CART BUTTON COMPONENT
// =============================================================================

const CartButton = forwardRef<HTMLButtonElement, CartButtonProps>(
  ({
    productId,
    quantity = 1,
    maxQuantity = 99,
    minQuantity = 1,
    isInCart = false,
    isLoading = false,
    isOutOfStock = false,
    showQuantitySelector = false,
    showTooltip = false,
    tooltipContent,
    onAddToCart,
    onRemoveFromCart,
    onQuantityChange,
    addToCartLabel = 'Tambah ke Keranjang',
    removeFromCartLabel = 'Hapus dari Keranjang',
    outOfStockLabel = 'Stok Habis',
    addingLabel = 'Menambahkan...',
    addedLabel = 'Ditambahkan!',
    cartIcon,
    successIcon,
    loadingIcon,
    showSuccessState = true,
    successDuration = 2000,
    animateOnAdd = true,
    quickBuyMode = false,
    onQuickBuy,
    quickBuyLabel = 'Beli Sekarang',
    variant = 'default',
    size = 'md',
    state = 'default',
    className,
    children,
    disabled,
    ...props
  }, ref) => {
    const [internalQuantity, setInternalQuantity] = useState(quantity)
    const [showSuccess, setShowSuccess] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)

    const handleAddToCart = async () => {
      if (isOutOfStock || disabled || isLoading) return

      setIsAnimating(animateOnAdd)

      try {
        await onAddToCart?.(productId, showQuantitySelector ? internalQuantity : 1)

        if (showSuccessState) {
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), successDuration)
        }
      } catch (error) {
        console.error('Error adding to cart:', error)
      } finally {
        setIsAnimating(false)
      }
    }

    const handleRemoveFromCart = async () => {
      if (disabled || isLoading) return

      try {
        await onRemoveFromCart?.(productId)
      } catch (error) {
        console.error('Error removing from cart:', error)
      }
    }

    const handleQuantityChange = async (newQuantity: number) => {
      setInternalQuantity(newQuantity)

      try {
        await onQuantityChange?.(productId, newQuantity)
      } catch (error) {
        console.error('Error updating quantity:', error)
      }
    }

    const handleQuickBuy = async () => {
      if (isOutOfStock || disabled || isLoading) return

      try {
        await onQuickBuy?.(productId, showQuantitySelector ? internalQuantity : 1)
      } catch (error) {
        console.error('Error with quick buy:', error)
      }
    }

    const currentState = isLoading ? 'loading' :
                        showSuccess ? 'success' :
                        isOutOfStock ? 'disabled' :
                        state

    const getButtonContent = () => {
      if (isLoading) {
        return (
          <>
            {loadingIcon || <ShoppingCartIcon className="h-4 w-4 mr-2 animate-spin" />}
            {addingLabel}
          </>
        )
      }

      if (showSuccess) {
        return (
          <>
            {successIcon || <CheckIcon className="h-4 w-4 mr-2" />}
            {addedLabel}
          </>
        )
      }

      if (isOutOfStock) {
        return (
          <>
            <PackageIcon className="h-4 w-4 mr-2" />
            {outOfStockLabel}
          </>
        )
      }

      if (isInCart && onRemoveFromCart) {
        return (
          <>
            <XIcon className="h-4 w-4 mr-2" />
            {removeFromCartLabel}
          </>
        )
      }

      if (quickBuyMode) {
        return (
          <>
            <ZapIcon className="h-4 w-4 mr-2" />
            {quickBuyLabel}
          </>
        )
      }

      return (
        <>
          {cartIcon || <ShoppingCartIcon className="h-4 w-4 mr-2" />}
          {children || addToCartLabel}
        </>
      )
    }

    const handleClick = () => {
      if (quickBuyMode) {
        handleQuickBuy()
      } else if (isInCart && onRemoveFromCart) {
        handleRemoveFromCart()
      } else {
        handleAddToCart()
      }
    }

    // Icon-only button for floating or icon variants
    if (variant === 'icon' || variant === 'floating') {
      const iconButton = (
        <Button
          ref={ref}
          variant={variant === 'floating' ? 'default' : 'ghost'}
          className={cn(
            cartButtonVariants({ variant, size, state: currentState }),
            isAnimating && 'animate-bounce',
            className
          )}
          onClick={handleClick}
          disabled={disabled || isOutOfStock || isLoading}
          aria-label={isInCart ? removeFromCartLabel : addToCartLabel}
          {...props}
        >
          {isLoading ? (
            loadingIcon || <ShoppingCartIcon className="h-5 w-5 animate-spin" />
          ) : showSuccess ? (
            successIcon || <CheckIcon className="h-5 w-5" />
          ) : isOutOfStock ? (
            <PackageIcon className="h-5 w-5" />
          ) : (
            cartIcon || <ShoppingCartIcon className="h-5 w-5" />
          )}

          {/* Cart badge for floating button */}
          {variant === 'floating' && isInCart && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {internalQuantity}
            </Badge>
          )}
        </Button>
      )

      return showTooltip ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{iconButton}</TooltipTrigger>
            <TooltipContent>
              <p>{tooltipContent || (isInCart ? removeFromCartLabel : addToCartLabel)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : iconButton
    }

    // Button with quantity selector
    if (showQuantitySelector && !isInCart) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              className={cn(
                cartButtonVariants({ variant, size, state: currentState }),
                isAnimating && 'animate-pulse',
                className
              )}
              disabled={disabled || isOutOfStock || isLoading}
              {...props}
            >
              {getButtonContent()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="center">
            <div className="space-y-4">
              <div className="text-sm font-medium">Pilih Jumlah</div>
              <QuantitySelector
                quantity={internalQuantity}
                minQuantity={minQuantity}
                maxQuantity={maxQuantity}
                onQuantityChange={handleQuantityChange}
                size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInternalQuantity(1)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddToCart}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Loading...' : 'Tambah'}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )
    }

    // Standard button
    const button = (
      <Button
        ref={ref}
        className={cn(
          cartButtonVariants({ variant, size, state: currentState }),
          isAnimating && 'animate-pulse',
          className
        )}
        onClick={handleClick}
        disabled={disabled || isOutOfStock || isLoading}
        {...props}
      >
        {getButtonContent()}
      </Button>
    )

    return showTooltip ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent || (isInCart ? removeFromCartLabel : addToCartLabel)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : button
  }
)

CartButton.displayName = 'CartButton'

// =============================================================================
// WISHLIST BUTTON COMPONENT
// =============================================================================

export interface WishlistButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  productId?: string
  isInWishlist?: boolean
  isLoading?: boolean
  onToggleWishlist?: (productId?: string) => void | Promise<void>
  addToWishlistLabel?: string
  removeFromWishlistLabel?: string
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
}

const WishlistButton = forwardRef<HTMLButtonElement, WishlistButtonProps>(
  ({
    productId,
    isInWishlist = false,
    isLoading = false,
    onToggleWishlist,
    addToWishlistLabel = 'Tambah ke Wishlist',
    removeFromWishlistLabel = 'Hapus dari Wishlist',
    showTooltip = true,
    size = 'md',
    variant = 'ghost',
    className,
    ...props
  }, ref) => {
    const handleToggle = async () => {
      if (isLoading) return

      try {
        await onToggleWishlist?.(productId)
      } catch (error) {
        console.error('Error toggling wishlist:', error)
      }
    }

    const buttonSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
    const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'

    const button = (
      <Button
        ref={ref}
        variant={variant}
        className={cn(
          buttonSize,
          'p-0',
          isInWishlist && 'text-red-500 hover:text-red-600',
          className
        )}
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={isInWishlist ? removeFromWishlistLabel : addToWishlistLabel}
        {...props}
      >
        <HeartIcon
          className={cn(
            iconSize,
            isInWishlist && 'fill-current'
          )}
        />
      </Button>
    )

    return showTooltip ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{isInWishlist ? removeFromWishlistLabel : addToWishlistLabel}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : button
  }
)

WishlistButton.displayName = 'WishlistButton'

// =============================================================================
// EXPORTS
// =============================================================================

export {
  CartButton,
  WishlistButton,
  QuantitySelector,
  cartButtonVariants,
  type CartButtonProps,
  type WishlistButtonProps
}