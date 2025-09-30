'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Grid } from '../ui/grid'
import { Skeleton } from '../ui/skeleton'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { AspectRatio } from '../ui/aspect-ratio'
import { Image } from '../ui/image'
import { StarIcon, ShoppingCartIcon, HeartIcon } from 'lucide-react'

// =============================================================================
// PRODUCT GRID VARIANTS
// =============================================================================

const productGridVariants = cva(
  'w-full',
  {
    variants: {
      variant: {
        default: 'grid gap-4',
        compact: 'grid gap-2',
        spacious: 'grid gap-6',
        list: 'flex flex-col gap-4'
      },
      columns: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
      }
    },
    defaultVariants: {
      variant: 'default',
      columns: 4
    }
  }
)

const productCardVariants = cva(
  'group relative overflow-hidden rounded-lg border border-border bg-background transition-all duration-200 hover:shadow-md hover:border-primary/20',
  {
    variants: {
      variant: {
        default: 'h-full',
        compact: 'h-full',
        spacious: 'h-full',
        list: 'flex flex-row h-32'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

// =============================================================================
// PRODUCT TYPES
// =============================================================================

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  memberPrice?: number
  originalPrice?: number
  discount?: number
  images: string[]
  category: {
    id: string
    name: string
    slug: string
  }
  seller: {
    id: string
    name: string
    businessName: string
    rating: number
    location: string
  }
  rating: number
  reviewCount: number
  stock: number
  isWishlisted?: boolean
  isFeatured?: boolean
  isNew?: boolean
  isOnSale?: boolean
  tags?: string[]
  badges?: Array<{
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }>
}

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

export interface ProductGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof productGridVariants> {
  products: Product[]
  loading?: boolean
  loadingCount?: number
  emptyState?: React.ReactNode
  onProductClick?: (product: Product) => void
  onAddToCart?: (product: Product) => void
  onToggleWishlist?: (product: Product) => void
  showQuickActions?: boolean
  showSellerInfo?: boolean
  showRating?: boolean
  showStock?: boolean
  currencySymbol?: string
  memberDiscountLabel?: string
}

export interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact' | 'spacious' | 'list'
  onClick?: (product: Product) => void
  onAddToCart?: (product: Product) => void
  onToggleWishlist?: (product: Product) => void
  showQuickActions?: boolean
  showSellerInfo?: boolean
  showRating?: boolean
  showStock?: boolean
  currencySymbol?: string
  memberDiscountLabel?: string
  className?: string
}

// =============================================================================
// PRODUCT CARD COMPONENT
// =============================================================================

const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(
  ({
    product,
    variant = 'default',
    onClick,
    onAddToCart,
    onToggleWishlist,
    showQuickActions = true,
    showSellerInfo = true,
    showRating = true,
    showStock = false,
    currencySymbol = 'Rp',
    memberDiscountLabel = 'Harga Member',
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

    const isListVariant = variant === 'list'

    return (
      <Card
        ref={ref}
        className={cn(productCardVariants({ variant }), className)}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        {...props}
      >
        <CardContent className={cn(
          'p-0 h-full',
          isListVariant ? 'flex flex-row' : 'flex flex-col'
        )}>
          {/* Product Image */}
          <div className={cn(
            'relative overflow-hidden bg-muted',
            isListVariant ? 'w-32 h-full flex-shrink-0' : 'w-full'
          )}>
            <AspectRatio ratio={isListVariant ? 1 : 4/3}>
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes={isListVariant ? "128px" : "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"}
              />
            </AspectRatio>

            {/* Badges */}
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

            {/* Wishlist Button */}
            {showQuickActions && onToggleWishlist && (
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  'absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background',
                  product.isWishlisted && 'text-red-500 hover:text-red-600'
                )}
                onClick={handleToggleWishlist}
              >
                <HeartIcon
                  className={cn(
                    'h-4 w-4',
                    product.isWishlisted && 'fill-current'
                  )}
                />
              </Button>
            )}

            {/* Stock Indicator */}
            {showStock && product.stock <= 5 && product.stock > 0 && (
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
            isListVariant ? 'flex-1 p-3' : 'p-4'
          )}>
            {/* Category & Seller */}
            {showSellerInfo && (
              <div className={cn(
                'flex items-center justify-between text-xs text-muted-foreground mb-1',
                isListVariant && 'mb-1'
              )}>
                <span className="truncate">{product.category.name}</span>
                <span className="truncate ml-2">{product.seller.businessName}</span>
              </div>
            )}

            {/* Product Name */}
            <h3 className={cn(
              'font-medium text-foreground leading-tight mb-2',
              isListVariant ? 'text-sm line-clamp-2' : 'text-sm line-clamp-2'
            )}>
              {product.name}
            </h3>

            {/* Rating */}
            {showRating && product.rating > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <StarIcon className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">
                  {product.rating.toFixed(1)} ({product.reviewCount})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'font-bold text-foreground',
                  isListVariant ? 'text-sm' : 'text-base'
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
                <div className="text-xs text-green-600">
                  {memberDiscountLabel}: {formatPrice(product.memberPrice)}
                </div>
              )}
            </div>

            {/* Add to Cart Button */}
            {showQuickActions && onAddToCart && !isListVariant && (
              <Button
                size="sm"
                className="w-full mt-auto"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                {product.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
              </Button>
            )}

            {/* List Variant Quick Actions */}
            {showQuickActions && isListVariant && (
              <div className="flex gap-2 mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  <ShoppingCartIcon className="h-3 w-3" />
                </Button>
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
// PRODUCT GRID LOADING SKELETON
// =============================================================================

const ProductGridSkeleton = ({
  count = 8,
  variant = 'default',
  columns = 4
}: {
  count?: number
  variant?: 'default' | 'compact' | 'spacious' | 'list'
  columns?: 1 | 2 | 3 | 4 | 5 | 6
}) => {
  const isListVariant = variant === 'list'

  return (
    <div className={cn(productGridVariants({ variant, columns }))}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className={cn(productCardVariants({ variant }))}>
          <CardContent className={cn(
            'p-0 h-full',
            isListVariant ? 'flex flex-row' : 'flex flex-col'
          )}>
            {/* Image Skeleton */}
            <div className={cn(
              'relative',
              isListVariant ? 'w-32 h-full flex-shrink-0' : 'w-full'
            )}>
              <AspectRatio ratio={isListVariant ? 1 : 4/3}>
                <Skeleton className="w-full h-full" />
              </AspectRatio>
            </div>

            {/* Content Skeleton */}
            <div className={cn(
              'flex flex-col',
              isListVariant ? 'flex-1 p-3' : 'p-4'
            )}>
              <Skeleton className="h-3 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-3" />
              {!isListVariant && <Skeleton className="h-8 w-full mt-auto" />}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

const ProductGridEmpty = ({
  title = 'Tidak ada produk ditemukan',
  description = 'Coba ubah filter atau kata kunci pencarian Anda.',
  action
}: {
  title?: string
  description?: string
  action?: React.ReactNode
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <ShoppingCartIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      {action}
    </div>
  )
}

// =============================================================================
// MAIN PRODUCT GRID COMPONENT
// =============================================================================

const ProductGrid = forwardRef<HTMLDivElement, ProductGridProps>(
  ({
    products,
    loading = false,
    loadingCount = 8,
    emptyState,
    onProductClick,
    onAddToCart,
    onToggleWishlist,
    showQuickActions = true,
    showSellerInfo = true,
    showRating = true,
    showStock = false,
    currencySymbol = 'Rp',
    memberDiscountLabel = 'Harga Member',
    variant = 'default',
    columns = 4,
    className,
    ...props
  }, ref) => {
    if (loading) {
      return (
        <ProductGridSkeleton
          count={loadingCount}
          variant={variant}
          columns={columns}
        />
      )
    }

    if (products.length === 0) {
      return emptyState || <ProductGridEmpty />
    }

    return (
      <div
        ref={ref}
        className={cn(productGridVariants({ variant, columns }), className)}
        {...props}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variant={variant}
            onClick={onProductClick}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            showQuickActions={showQuickActions}
            showSellerInfo={showSellerInfo}
            showRating={showRating}
            showStock={showStock}
            currencySymbol={currencySymbol}
            memberDiscountLabel={memberDiscountLabel}
          />
        ))}
      </div>
    )
  }
)

ProductGrid.displayName = 'ProductGrid'

// =============================================================================
// EXPORTS
// =============================================================================

export {
  ProductGrid,
  ProductCard,
  ProductGridSkeleton,
  ProductGridEmpty,
  productGridVariants,
  productCardVariants,
  type Product
}