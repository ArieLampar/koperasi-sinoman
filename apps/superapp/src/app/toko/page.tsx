'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  ShoppingCart,
  Filter,
  Star,
  Clock,
  MapPin,
  Tag,
  Heart,
  Plus,
  Minus,
  ArrowRight
} from 'lucide-react'

// Hooks and utilities
import { useAuth } from '@/components/providers/auth-provider'
import { useCart } from '@koperasi-sinoman/ui'
import { useMemberData } from '@/hooks/use-member-data'
import { useMarketplaceData } from '@/hooks/use-marketplace'
import { formatCurrency } from '@/lib/utils/currency'
import { formatTimeRemaining } from '@/lib/utils/date'

// Components
import {
  ProductCardSkeleton,
  CategoryTabSkeleton,
  FlashSaleBannerSkeleton
} from '@/components/ui/loading-skeleton'

// Types
interface Product {
  id: string
  slug?: string
  name: string
  description: string
  image: string
  price: number
  member_price?: number
  rating: number
  review_count: number
  category: string
  is_flash_sale: boolean
  flash_sale_price?: number
  flash_sale_end?: string
  stock: number
  store_name: string
  store_location: string
  is_favorite?: boolean
}

interface Category {
  id: string
  name: string
  icon: string
  product_count: number
}

interface FlashSale {
  id: string
  title: string
  subtitle: string
  end_time: string
  discount_percentage: number
  banner_image: string
  products: Product[]
}

const categories: Category[] = [
  { id: 'all', name: 'Semua', icon: '🛍️', product_count: 0 },
  { id: 'flash_sale', name: 'Flash Sale', icon: '⚡', product_count: 0 },
  { id: 'food', name: 'Makanan', icon: '🍎', product_count: 0 },
  { id: 'beverage', name: 'Minuman', icon: '🥤', product_count: 0 },
  { id: 'health', name: 'Kesehatan', icon: '💊', product_count: 0 },
]

export default function MarketplacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { cartItems, addToCart, cartItemsCount } = useCart()

  // Data hooks
  const { data: memberData } = useMemberData()
  const {
    data: {
      products = [],
      flashSales = [],
      categories: apiCategories = []
    } = {},
    isLoading: marketplaceLoading
  } = useMarketplaceData()

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentFlashSale, setCurrentFlashSale] = useState<FlashSale | null>(null)

  // Handle URL query parameters
  useEffect(() => {
    const category = searchParams.get('category')
    if (category && ['all', 'flash_sale', 'food', 'beverage', 'health'].includes(category)) {
      setSelectedCategory(category)
    }
  }, [searchParams])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Update categories with product counts from API
  useEffect(() => {
    if (apiCategories.length > 0) {
      // Update categories with actual counts from API
    }
  }, [apiCategories])

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'flash_sale') {
        filtered = filtered.filter(product => product.is_flash_sale)
      } else {
        filtered = filtered.filter(product => product.category === selectedCategory)
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.store_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [products, selectedCategory, searchQuery])

  // Set current flash sale
  useEffect(() => {
    if (flashSales.length > 0) {
      // Find the most relevant active flash sale
      const activeFlashSale = flashSales.find(sale =>
        new Date(sale.end_time) > new Date()
      )
      setCurrentFlashSale(activeFlashSale || flashSales[0])
    }
  }, [flashSales])

  // Show loading or redirect if not authenticated
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat...</p>
        </div>
      </div>
    )
  }

  const isMember = memberData?.status === 'active'

  const handleAddToCart = (product: Product) => {
    const price = isMember && product.member_price ? product.member_price :
                  product.is_flash_sale && product.flash_sale_price ? product.flash_sale_price :
                  product.price

    addToCart({
      id: product.id,
      name: product.name,
      price,
      image: product.image,
      quantity: 1
    })
  }

  const getProductPrice = (product: Product) => {
    if (product.is_flash_sale && product.flash_sale_price) {
      return product.flash_sale_price
    }
    if (isMember && product.member_price) {
      return product.member_price
    }
    return product.price
  }

  const getOriginalPrice = (product: Product) => {
    if (product.is_flash_sale && product.flash_sale_price) {
      return product.price
    }
    if (isMember && product.member_price) {
      return product.price
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background-secondary pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white sticky top-16 md:top-16 z-40 border-b border-neutral-200">
        <div className="px-4 py-4">
          {/* Search Bar and Cart */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari produk, toko, atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Link
              href="/toko/keranjang"
              className="relative p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent-orange text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </div>

          {/* Tagline */}
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold text-primary-600 mb-1">
              Sehat Bareng, Kaya Bareng, Bareng Sinoman
            </h1>
            <p className="text-sm text-neutral-600">
              {isMember ? 'Nikmati harga khusus anggota' : 'Daftar sebagai anggota untuk harga special'}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {marketplaceLoading ? (
              <CategoryTabSkeleton />
            ) : (
              categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full border transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:border-primary-300'
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                  {category.product_count > 0 && (
                    <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">
                      {category.product_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Flash Sale Banner */}
        {currentFlashSale && (
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-accent-orange to-accent-red text-white">
            {marketplaceLoading ? (
              <FlashSaleBannerSkeleton />
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">{currentFlashSale.title}</h2>
                    <p className="text-orange-100">{currentFlashSale.subtitle}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/20 rounded-lg px-3 py-2">
                      <Clock className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-sm font-medium">
                        {formatTimeRemaining(currentFlashSale.end_time)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flash Sale Products Preview */}
                <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
                  {currentFlashSale.products.slice(0, 5).map((product) => (
                    <Link
                      key={product.id}
                      href={`/toko/produk/${product.slug || product.id}`}
                      className="flex-shrink-0 w-20 text-center"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden mb-2 border-2 border-white/50">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-medium truncate">{product.name}</p>
                      <p className="text-xs text-orange-200">
                        {formatCurrency(product.flash_sale_price || product.price)}
                      </p>
                    </Link>
                  ))}
                  <Link
                    href="/toko?category=flash_sale"
                    className="flex-shrink-0 w-20 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-white/50 flex items-center justify-center mb-2">
                      <ArrowRight className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-medium">Lihat Semua</p>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              {selectedCategory === 'all' ? 'Semua Produk' :
               categories.find(cat => cat.id === selectedCategory)?.name}
            </h3>
            <button className="flex items-center text-primary-600 hover:text-primary-700">
              <Filter className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Filter</span>
            </button>
          </div>

          {marketplaceLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/toko/produk/${product.slug || product.id}`}>
                    <div className="relative">
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="w-full h-48 object-cover"
                      />

                      {/* Flash Sale Badge */}
                      {product.is_flash_sale && (
                        <div className="absolute top-2 left-2 bg-accent-orange text-white text-xs px-2 py-1 rounded-full font-medium">
                          Flash Sale
                        </div>
                      )}

                      {/* Member Badge */}
                      {isMember && product.member_price && (
                        <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Member
                        </div>
                      )}

                      {/* Favorite Button */}
                      <button className="absolute bottom-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                        <Heart className={`h-4 w-4 ${product.is_favorite ? 'fill-accent-red text-accent-red' : 'text-neutral-600'}`} />
                      </button>
                    </div>
                  </Link>

                  <div className="p-3">
                    <Link href={`/toko/produk/${product.slug || product.id}`}>
                      <h4 className="font-medium text-neutral-900 mb-1 line-clamp-2 hover:text-primary-600">
                        {product.name}
                      </h4>
                    </Link>

                    {/* Rating */}
                    <div className="flex items-center mb-2">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-xs text-neutral-600">
                        {product.rating} ({product.review_count})
                      </span>
                    </div>

                    {/* Store Info */}
                    <div className="flex items-center text-xs text-neutral-500 mb-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{product.store_name} • {product.store_location}</span>
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-primary-600">
                          {formatCurrency(getProductPrice(product))}
                        </span>
                        {getOriginalPrice(product) && (
                          <span className="text-xs text-neutral-500 line-through">
                            {formatCurrency(getOriginalPrice(product)!)}
                          </span>
                        )}
                      </div>
                      {!isMember && product.member_price && (
                        <p className="text-xs text-secondary-600 mt-1">
                          Harga anggota: {formatCurrency(product.member_price)}
                        </p>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        product.stock === 0
                          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {product.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-600">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Produk tidak ditemukan</h3>
              <p className="text-sm">
                {searchQuery
                  ? `Tidak ada hasil untuk "${searchQuery}"`
                  : 'Belum ada produk dalam kategori ini'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}