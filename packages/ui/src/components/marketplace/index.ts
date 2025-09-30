// =============================================================================
// MARKETPLACE COMPONENTS - MAIN EXPORTS
// =============================================================================

// Product Grid & Card Components
export {
  ProductGrid,
  ProductCard,
  ProductGridSkeleton,
  ProductGridEmpty,
  productGridVariants,
  productCardVariants,
  type Product,
  type ProductGridProps,
  type ProductCardProps
} from './product-grid'

// Standalone Product Card
export {
  ProductCard as StandaloneProductCard,
  productCardVariants as standaloneProductCardVariants,
  type ProductCardProps as StandaloneProductCardProps
} from './product-card'

// Category Filter Components
export {
  CategoryFilter,
  CategoryGrid,
  CategoryItem,
  categoryFilterVariants,
  type Category,
  type CategoryFilterProps
} from './category-filter'

// Price Display Components
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
} from './price-display'

// Cart & Wishlist Button Components
export {
  CartButton,
  WishlistButton,
  QuantitySelector,
  cartButtonVariants,
  type CartButtonProps,
  type WishlistButtonProps
} from './cart-button'

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

// All marketplace components (for namespace imports)
import * as ProductComponents from './product-grid'
import * as ProductCardComponents from './product-card'
import * as CategoryComponents from './category-filter'
import * as PriceComponents from './price-display'
import * as CartComponents from './cart-button'

export const Marketplace = {
  ...ProductComponents,
  ...ProductCardComponents,
  ...CategoryComponents,
  ...PriceComponents,
  ...CartComponents
}