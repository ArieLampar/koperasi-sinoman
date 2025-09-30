'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Heart, ShoppingCart, Plus, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/currency'

interface ProductCardProps {
  product: {
    id: string
    slug: string
    name: string
    description?: string
    image: string
    price: number
    member_price?: number
    rating: number
    review_count: number
    category: string
    is_flash_sale?: boolean
    flash_sale_price?: number
    flash_sale_end?: string
    stock: number
    store?: {
      name: string
      location: string
      verified?: boolean
    }
    is_favorite?: boolean
  }
  isMember?: boolean
  onAddToCart?: (productId: string) => void
  onToggleFavorite?: (productId: string) => void
  isAddingToCart?: boolean
  showStore?: boolean
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

export function ProductCard({
  product,
  isMember = false,
  onAddToCart,
  onToggleFavorite,
  isAddingToCart = false,
  showStore = true,
  variant = 'default',
  className
}: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Calculate effective price
  const effectivePrice = product.is_flash_sale && product.flash_sale_price
    ? product.flash_sale_price
    : isMember && product.member_price
    ? product.member_price
    : product.price

  // Calculate original price for comparison
  const originalPrice = product.is_flash_sale && product.flash_sale_price
    ? product.price
    : isMember && product.member_price
    ? product.price
    : null

  // Calculate discount percentage
  const discountPercentage = originalPrice
    ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onAddToCart && product.stock > 0) {
      onAddToCart(product.id)
    }
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite(product.id)
    }
  }

  const isCompact = variant === 'compact'
  const isDetailed = variant === 'detailed'

  return (
    <Card className={cn(
      'group relative overflow-hidden transition-all duration-200 hover:shadow-md',
      'border-neutral-200 hover:border-neutral-300',
      isCompact && 'h-full',
      className
    )}>
      <Link href={`/toko/produk/${product.slug}`} className="block">
        {/* Product Image Container */}
        <div className={cn(
          'relative overflow-hidden bg-neutral-50',
          isCompact ? 'aspect-square' : 'aspect-[4/3]'
        )}>
          {/* Image */}
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={cn(
              'object-cover transition-transform duration-300 group-hover:scale-105',
              imageLoading && 'bg-neutral-100'
            )}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true)
              setImageLoading(false)
            }}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Loading State */}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          )}

          {/* Error State */}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
              <div className="text-center text-neutral-400">
                <div className="text-xs">Gambar tidak tersedia</div>
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 space-y-1">
            {product.is_flash_sale && (
              <Badge className="bg-accent-orange text-white text-xs font-medium px-2 py-1">
                Flash Sale
              </Badge>
            )}
            {isMember && product.member_price && !product.is_flash_sale && (
              <Badge className="bg-primary-600 text-white text-xs font-medium px-2 py-1">
                Harga Anggota
              </Badge>
            )}
            {discountPercentage > 0 && (
              <Badge className="bg-accent-red text-white text-xs font-medium px-2 py-1">
                -{discountPercentage}%
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={handleToggleFavorite}
              className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full
                       hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <Heart className={cn(
                'h-4 w-4 transition-colors',
                product.is_favorite
                  ? 'fill-accent-red text-accent-red'
                  : 'text-neutral-600 hover:text-accent-red'
              )} />
            </button>
          )}

          {/* Stock Status */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="bg-white text-neutral-900">
                Stok Habis
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <CardContent className={cn('p-3', isCompact && 'p-2')}>
          {/* Product Name */}
          <h3 className={cn(
            'font-medium text-neutral-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors',
            isCompact ? 'text-sm' : 'text-base'
          )}>
            {product.name}
          </h3>

          {/* Description (detailed variant only) */}
          {isDetailed && product.description && (
            <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
              {product.description}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center mb-2">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
            <span className={cn(
              'text-neutral-600 mr-1',
              isCompact ? 'text-xs' : 'text-sm'
            )}>
              {product.rating}
            </span>
            <span className={cn(
              'text-neutral-400',
              isCompact ? 'text-xs' : 'text-sm'
            )}>
              ({product.review_count})
            </span>
          </div>

          {/* Store Info */}
          {showStore && product.store && !isCompact && (
            <div className="text-xs text-neutral-500 mb-2 flex items-center">
              <span className="truncate">{product.store.name}</span>
              {product.store.verified && (
                <div className="w-1 h-1 bg-primary-600 rounded-full mx-1" />
              )}
              <span className="truncate">{product.store.location}</span>
            </div>
          )}

          {/* Price */}
          <div className="mb-3">
            <div className="flex items-center space-x-2">
              <span className={cn(
                'font-bold text-primary-600',
                isCompact ? 'text-sm' : 'text-base'
              )}>
                {formatCurrency(effectivePrice)}
              </span>
              {originalPrice && (
                <span className={cn(
                  'text-neutral-500 line-through',
                  isCompact ? 'text-xs' : 'text-sm'
                )}>
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>

            {/* Member Price Info */}
            {!isMember && product.member_price && !product.is_flash_sale && (
              <p className="text-xs text-secondary-600 mt-1">
                Anggota: {formatCurrency(product.member_price)}
              </p>
            )}
          </div>
        </CardContent>
      </Link>

      {/* Add to Cart Button */}
      {onAddToCart && (
        <div className={cn('px-3 pb-3', isCompact && 'px-2 pb-2')}>
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAddingToCart}
            className={cn(
              'w-full transition-all duration-200',
              isCompact ? 'text-xs py-1.5' : 'text-sm py-2'
            )}
            size={isCompact ? 'sm' : 'default'}
          >
            {isAddingToCart ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {product.stock === 0
              ? 'Stok Habis'
              : isAddingToCart
              ? 'Menambah...'
              : 'Tambah'
            }
          </Button>
        </div>
      )}
    </Card>
  )
}

// Product Card Skeleton for loading states
export function ProductCardSkeleton({ variant = 'default', className }: {
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}) {
  const isCompact = variant === 'compact'

  return (
    <Card className={cn('animate-pulse', className)}>
      {/* Image Skeleton */}
      <div className={cn(
        'bg-neutral-200',
        isCompact ? 'aspect-square' : 'aspect-[4/3]'
      )} />

      {/* Content Skeleton */}
      <CardContent className={cn('p-3', isCompact && 'p-2')}>
        {/* Title */}
        <div className="h-4 bg-neutral-200 rounded mb-2" />
        <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />

        {/* Rating */}
        <div className="h-3 bg-neutral-200 rounded w-1/3 mb-2" />

        {/* Store (if not compact) */}
        {!isCompact && (
          <div className="h-3 bg-neutral-200 rounded w-1/2 mb-2" />
        )}

        {/* Price */}
        <div className="h-5 bg-neutral-200 rounded w-1/2 mb-3" />

        {/* Button */}
        <div className={cn(
          'h-8 bg-neutral-200 rounded',
          isCompact && 'h-6'
        )} />
      </CardContent>
    </Card>
  )
}