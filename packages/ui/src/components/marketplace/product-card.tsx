'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { AspectRatio } from '../ui/aspect-ratio'
import { Image } from '../ui/image'
import { StarIcon, ShoppingCartIcon, HeartIcon, EyeIcon } from 'lucide-react'
import type { Product } from './product-grid'

// =============================================================================
// PRODUCT CARD VARIANTS
// =============================================================================

const productCardVariants = cva(
  'group relative overflow-hidden rounded-lg border border-border bg-background transition-all duration-200 hover:shadow-md hover:border-primary/20',
  {
    variants: {
      variant: {
        default: 'h-full',
        compact: 'h-full',
        spacious: 'h-full p-1',
        horizontal: 'flex flex-row h-32',
        featured: 'h-full p-2 border-2 border-primary/20',
        minimal: 'h-full border-none shadow-none hover:shadow-sm'
      },
      size: {
        sm: 'max-w-xs',
        md: 'max-w-sm',
        lg: 'max-w-md',
        xl: 'max-w-lg',
        full: 'w-full'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'full'
    }
  }
)

// =============================================================================
// COMPONENT INTERFACE
// =============================================================================

export interface ProductCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof productCardVariants> {
  product: Product
  onClick?: (product: Product) => void
  onAddToCart?: (product: Product) => void
  onToggleWishlist?: (product: Product) => void
  onQuickView?: (product: Product) => void
  showQuickActions?: boolean
  showSellerInfo?: boolean
  showRating?: boolean
  showStock?: boolean
  showCategory?: boolean
  showBadges?: boolean
  currencySymbol?: string
  memberDiscountLabel?: string
  imageAspectRatio?: number
  priority?: boolean
}

// =============================================================================
// PRODUCT CARD COMPONENT
// =============================================================================

const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(
  ({
    product,
    variant = 'default',
    size = 'full',
    onClick,
    onAddToCart,
    onToggleWishlist,
    onQuickView,
    showQuickActions = true,
    showSellerInfo = true,
    showRating = true,
    showStock = false,
    showCategory = true,
    showBadges = true,
    currencySymbol = 'Rp',
    memberDiscountLabel = 'Harga Member',
    imageAspectRatio = 4/3,
    priority = false,
    className,
    ...props
  }, ref) => {
    const handleCardClick = () => {
      onClick?.(product)
    }

    const handleAddToCart = (e: React.MouseEvent) => {
      e.stopPropagation()
      onAddToCart?.(product)
    }

    const handleToggleWishlist = (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleWishlist?.(product)
    }

    const handleQuickView = (e: React.MouseEvent) => {
      e.stopPropagation()
      onQuickView?.(product)
    }

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(price)
    }

    const discountPercentage = product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : product.discount

    const isHorizontal = variant === 'horizontal'
    const isOutOfStock = product.stock === 0
    const isLowStock = product.stock <= 5 && product.stock > 0

    return (
      <Card
        ref={ref}
        className={cn(productCardVariants({ variant, size }), className)}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`Produk ${product.name}`}
        {...props}
      >
        <CardContent className={cn(
          'p-0 h-full',
          isHorizontal ? 'flex flex-row' : 'flex flex-col'
        )}>
          {/* Product Image */}
          <div className={cn(
            'relative overflow-hidden bg-muted',
            isHorizontal ? 'w-32 h-full flex-shrink-0' : 'w-full',
            variant === 'spacious' && 'rounded-lg',
            variant === 'featured' && 'rounded-lg'
          )}>
            <AspectRatio ratio={isHorizontal ? 1 : imageAspectRatio}>
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority={priority}
                className={cn(
                  'object-cover transition-transform duration-300 group-hover:scale-105',
                  variant === 'spacious' && 'rounded-lg',
                  variant === 'featured' && 'rounded-lg',
                  isOutOfStock && 'grayscale opacity-50'
                )}
                sizes={isHorizontal ? "128px" : "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"}
              />
            </AspectRatio>

            {/* Overlay for out of stock */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground bg-background px-2 py-1 rounded">
                  Stok Habis
                </span>
              </div>
            )}

            {/* Badges */}
            {showBadges && (
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {product.isNew && (
                  <Badge variant="destructive" className="text-xs">
                    Baru
                  </Badge>
                )}
                {product.isFeatured && (
                  <Badge variant="secondary" className="text-xs">
                    Unggulan
                  </Badge>
                )}
                {discountPercentage && discountPercentage > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    -{discountPercentage}%
                  </Badge>
                )}
                {product.badges?.map((badge, index) => (
                  <Badge key={index} variant={badge.variant} className="text-xs">
                    {badge.text}
                  </Badge>
                ))}
              </div>
            )}

            {/* Quick Actions Overlay */}
            {showQuickActions && (
              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onToggleWishlist && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background',
                      product.isWishlisted && 'text-red-500 hover:text-red-600'
                    )}
                    onClick={handleToggleWishlist}
                    aria-label={product.isWishlisted ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
                  >
                    <HeartIcon
                      className={cn(
                        'h-4 w-4',
                        product.isWishlisted && 'fill-current'
                      )}
                    />
                  </Button>
                )}
                {onQuickView && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={handleQuickView}
                    aria-label="Lihat cepat"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Stock Indicator */}
            {showStock && isLowStock && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
                  Stok: {product.stock}
                </Badge>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className={cn(
            'flex flex-col',
            isHorizontal ? 'flex-1 p-3' : 'p-4',
            variant === 'compact' && 'p-3',
            variant === 'spacious' && 'p-6',
            variant === 'minimal' && 'p-3'
          )}>
            {/* Category & Seller */}
            {(showCategory || showSellerInfo) && (
              <div className={cn(
                'flex items-center justify-between text-xs text-muted-foreground mb-1',
                isHorizontal && 'mb-1'
              )}>
                {showCategory && <span className="truncate">{product.category.name}</span>}
                {showSellerInfo && (
                  <span className="truncate ml-2">{product.seller.businessName}</span>
                )}
              </div>
            )}

            {/* Product Name */}
            <h3 className={cn(
              'font-medium text-foreground leading-tight mb-2',
              isHorizontal ? 'text-sm line-clamp-2' : 'text-sm line-clamp-2',
              variant === 'spacious' && 'text-base',
              variant === 'featured' && 'text-base font-semibold'
            )}>
              {product.name}
            </h3>

            {/* Description for spacious variant */}
            {variant === 'spacious' && product.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {product.description}
              </p>
            )}

            {/* Rating */}
            {showRating && product.rating > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <StarIcon className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">
                  {product.rating.toFixed(1)}
                  {product.reviewCount > 0 && ` (${product.reviewCount})`}
                </span>
              </div>
            )}

            {/* Seller Rating for spacious variant */}
            {variant === 'spacious' && showSellerInfo && product.seller.rating > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs text-muted-foreground">Penjual:</span>
                <StarIcon className="h-3 w-3 fill-blue-400 text-blue-400" />
                <span className="text-xs text-muted-foreground">
                  {product.seller.rating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  • {product.seller.location}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  'font-bold text-foreground',
                  isHorizontal ? 'text-sm' : 'text-base',
                  variant === 'featured' && 'text-lg'
                )}>
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {product.memberPrice && product.memberPrice < product.price && (
                <div className="text-xs text-green-600 font-medium">
                  {memberDiscountLabel}: {formatPrice(product.memberPrice)}
                </div>
              )}
            </div>

            {/* Tags for featured variant */}
            {variant === 'featured' && product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {product.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Add to Cart Button */}
            {showQuickActions && onAddToCart && !isHorizontal && (
              <Button
                size={variant === 'compact' ? 'sm' : 'default'}
                className="w-full mt-auto"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                aria-label={isOutOfStock ? 'Produk tidak tersedia' : `Tambah ${product.name} ke keranjang`}
              >
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                {isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}
              </Button>
            )}

            {/* Horizontal Variant Quick Actions */}
            {showQuickActions && isHorizontal && (
              <div className="flex gap-2 mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  aria-label={isOutOfStock ? 'Produk tidak tersedia' : `Tambah ${product.name} ke keranjang`}
                >
                  <ShoppingCartIcon className="h-3 w-3" />
                </Button>
                {onQuickView && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleQuickView}
                    aria-label="Lihat detail produk"
                  >
                    <EyeIcon className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)

ProductCard.displayName = 'ProductCard'

// =============================================================================
// EXPORTS
// =============================================================================

export {
  ProductCard,
  productCardVariants,
  type ProductCardProps
}