// Product Card Types
export interface Product {
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

export interface ProductCardProps {
  product: Product
  isMember?: boolean
  onAddToCart?: (productId: string) => void
  onToggleFavorite?: (productId: string) => void
  isAddingToCart?: boolean
  showStore?: boolean
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

// Category Tabs Types
export interface Category {
  id: string
  name: string
  icon: string
  product_count?: number
}

export interface CategoryTabsProps {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
  showProductCount?: boolean
  className?: string
}

// Flash Sale Banner Types
export interface FlashSaleProduct {
  id: string
  slug: string
  name: string
  image: string
  original_price: number
  sale_price: number
  stock: number
  sold: number
}

export interface FlashSaleBannerProps {
  title: string
  subtitle?: string
  endTime: string
  discountPercentage: number
  backgroundImage?: string
  products?: FlashSaleProduct[]
  href?: string
  className?: string
  variant?: 'default' | 'compact' | 'minimal'
}

// Common Types
export interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}