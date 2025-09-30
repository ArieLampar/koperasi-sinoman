'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Star,
  Heart,
  Share2,
  ShoppingCart,
  Plus,
  Minus,
  MapPin,
  Shield,
  Truck,
  MessageCircle,
  ThumbsUp,
  Eye,
  ShoppingBag,
  Clock,
  Award
} from 'lucide-react'

// Hooks and utilities
import { useAuth } from '@/components/providers/auth-provider'
import { useCart } from '@koperasi-sinoman/ui'
import { useMemberData } from '@/hooks/use-member-data'
import { formatCurrency } from '@/lib/utils/currency'
import { formatRelativeTime } from '@/lib/utils/date'

// Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Types (same as in page.tsx)
interface Product {
  id: string
  slug: string
  name: string
  description: string
  long_description: string
  images: string[]
  price: number
  member_price?: number
  rating: number
  review_count: number
  category: string
  is_flash_sale: boolean
  flash_sale_price?: number
  flash_sale_end?: string
  stock: number
  sku: string
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  store: {
    id: string
    name: string
    location: string
    rating: number
    verified: boolean
    logo: string
  }
  specifications: Array<{
    key: string
    value: string
  }>
  reviews: Array<{
    id: string
    user_name: string
    user_avatar?: string
    rating: number
    comment: string
    date: string
    images?: string[]
    helpful_count: number
  }>
  related_products: Array<{
    id: string
    slug: string
    name: string
    image: string
    price: number
    member_price?: number
    rating: number
    store_name: string
  }>
  tags: string[]
  is_favorite?: boolean
  view_count: number
  sold_count: number
  created_at: string
  updated_at: string
}

interface Props {
  product: Product
}

export default function ProductDetailClient({ product }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { data: memberData } = useMemberData()

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(product.is_favorite || false)
  const [activeTab, setActiveTab] = useState('description')

  const isMember = memberData?.status === 'active'

  const currentPrice = product.is_flash_sale && product.flash_sale_price
    ? product.flash_sale_price
    : isMember && product.member_price
    ? product.member_price
    : product.price

  const originalPrice = product.is_flash_sale && product.flash_sale_price
    ? product.price
    : isMember && product.member_price
    ? product.price
    : null

  const discountPercentage = originalPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: currentPrice,
      image: product.images[0],
      quantity
    })
  }

  const handleBuyNow = () => {
    handleAddToCart()
    router.push('/toko/keranjang')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="min-h-screen bg-background-secondary pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white sticky top-16 md:top-16 z-40 border-b border-neutral-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-medium text-neutral-900 truncate mx-4">
            {product.name}
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-accent-red text-accent-red' : 'text-neutral-600'}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Share2 className="h-5 w-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto lg:px-4 lg:py-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Product Images */}
          <div className="bg-white lg:rounded-lg lg:border lg:border-neutral-200 lg:p-6">
            <div className="aspect-square relative bg-neutral-50 lg:rounded-lg overflow-hidden mb-4">
              <Image
                src={product.images[selectedImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 space-y-2">
                {product.is_flash_sale && (
                  <Badge className="bg-accent-orange text-white">Flash Sale</Badge>
                )}
                {isMember && product.member_price && (
                  <Badge className="bg-primary-600 text-white">Harga Anggota</Badge>
                )}
                {discountPercentage > 0 && (
                  <Badge className="bg-accent-red text-white">-{discountPercentage}%</Badge>
                )}
              </div>
            </div>

            {/* Image Thumbnails */}
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide px-4 lg:px-0">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImageIndex === index
                      ? 'border-primary-600'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6 mt-6 lg:mt-0">
            {/* Basic Info */}
            <div className="bg-white p-4 lg:p-6 lg:rounded-lg lg:border lg:border-neutral-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-neutral-600">
                  {product.rating} ({product.review_count} ulasan)
                </span>
                <span className="text-sm text-neutral-400">•</span>
                <div className="flex items-center text-sm text-neutral-600">
                  <Eye className="h-3 w-3 mr-1" />
                  {product.view_count} dilihat
                </div>
              </div>

              <h1 className="text-xl font-bold text-neutral-900 mb-3">
                {product.name}
              </h1>

              <p className="text-neutral-600 mb-4">
                {product.description}
              </p>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(currentPrice)}
                  </span>
                  {originalPrice && (
                    <span className="text-lg text-neutral-500 line-through">
                      {formatCurrency(originalPrice)}
                    </span>
                  )}
                </div>
                {!isMember && product.member_price && (
                  <p className="text-sm text-secondary-600">
                    Harga khusus anggota: {formatCurrency(product.member_price)}
                  </p>
                )}
              </div>

              {/* Stock & Sales Info */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center text-sm text-neutral-600">
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  {product.sold_count} terjual
                </div>
                <div className="flex items-center text-sm text-neutral-600">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    product.stock > 10 ? 'bg-success-500' :
                    product.stock > 0 ? 'bg-warning-500' : 'bg-error-500'
                  }`} />
                  {product.stock > 0 ? `Stok: ${product.stock}` : 'Stok habis'}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-sm font-medium text-neutral-900">Jumlah:</span>
                <div className="flex items-center border border-neutral-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Keranjang
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex items-center justify-center"
                >
                  Beli Sekarang
                </Button>
              </div>
            </div>

            {/* Store Info */}
            <div className="bg-white p-4 lg:p-6 lg:rounded-lg lg:border lg:border-neutral-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100">
                  <Image
                    src={product.store.logo}
                    alt={product.store.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-neutral-900">{product.store.name}</h3>
                    {product.store.verified && (
                      <Shield className="h-4 w-4 text-primary-600" />
                    )}
                  </div>
                  <div className="flex items-center text-sm text-neutral-600 mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {product.store.location}
                    <span className="mx-2">•</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {product.store.rating}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Kunjungi Toko
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8 bg-white lg:rounded-lg lg:border lg:border-neutral-200">
          {/* Tab Navigation */}
          <div className="border-b border-neutral-200">
            <div className="flex space-x-8 px-4 lg:px-6">
              {[
                { id: 'description', label: 'Deskripsi' },
                { id: 'specifications', label: 'Spesifikasi' },
                { id: 'reviews', label: `Ulasan (${product.review_count})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 lg:p-6">
            {activeTab === 'description' && (
              <div className="prose prose-neutral max-w-none">
                <p className="whitespace-pre-line">{product.long_description}</p>

                {product.tags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="space-y-4">
                {product.specifications.map((spec, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <span className="text-neutral-600">{spec.key}</span>
                    <span className="font-medium text-neutral-900">{spec.value}</span>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-neutral-200">
                  <div>
                    <h4 className="font-medium mb-2">Detail Produk</h4>
                    <div className="space-y-2 text-sm text-neutral-600">
                      <div>SKU: {product.sku}</div>
                      <div>Berat: {product.weight}g</div>
                      <div>Dimensi: {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Review Summary */}
                <div className="flex items-center space-x-6 p-4 bg-neutral-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-neutral-900">{product.rating}</div>
                    <div className="flex items-center justify-center mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-neutral-300'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-neutral-600 mt-1">
                      {product.review_count} ulasan
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {product.reviews.map((review) => (
                    <div key={review.id} className="border-b border-neutral-200 pb-6">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          {review.user_avatar ? (
                            <Image
                              src={review.user_avatar}
                              alt={review.user_name}
                              width={40}
                              height={40}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-primary-600 font-medium">
                              {review.user_name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-neutral-900">{review.user_name}</h4>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-neutral-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-neutral-500">
                              {formatRelativeTime(review.date)}
                            </span>
                          </div>
                          <p className="text-neutral-700 mb-3">{review.comment}</p>

                          {review.images && review.images.length > 0 && (
                            <div className="flex space-x-2 mb-3">
                              {review.images.map((image, index) => (
                                <div key={index} className="w-16 h-16 rounded-lg overflow-hidden">
                                  <Image
                                    src={image}
                                    alt={`Review image ${index + 1}`}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          <button className="flex items-center text-sm text-neutral-600 hover:text-primary-600">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Membantu ({review.helpful_count})
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {product.related_products.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 px-4 lg:px-0">
              Produk Terkait
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 lg:px-0">
              {product.related_products.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/toko/produk/${relatedProduct.slug}`}
                  className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-neutral-900 line-clamp-2 mb-2">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center mb-2">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-xs text-neutral-600">{relatedProduct.rating}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-primary-600">
                          {formatCurrency(isMember && relatedProduct.member_price ? relatedProduct.member_price : relatedProduct.price)}
                        </span>
                        {isMember && relatedProduct.member_price && (
                          <span className="text-xs text-neutral-500 line-through">
                            {formatCurrency(relatedProduct.price)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">{relatedProduct.store_name}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}