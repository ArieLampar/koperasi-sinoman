'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface CartItem {
  id: string
  product_id: string
  name: string
  image: string
  price: number
  quantity: number
  stock?: number
  store_name?: string
  seller_id?: string
  member_price?: number
  discount_percentage?: number
}

export interface CartSummary {
  subtotal: number
  itemCount: number
  totalItems: number
  memberDiscount: number
  finalTotal: number
}

interface CartContextType {
  // State
  cartItems: CartItem[]
  cartSummary: CartSummary
  isLoading: boolean
  error: string | null

  // Actions
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>

  // Computed values
  cartItemsCount: number
  cartTotal: number
  isInCart: (productId: string) => boolean
  getCartItem: (productId: string) => CartItem | undefined
}

export interface CartProviderProps {
  children: React.ReactNode
  storageKey?: string
  syncInterval?: number
  apiBasePath?: string
  onCartChange?: (items: CartItem[]) => void
  onError?: (error: string) => void
  onSuccess?: (message: string) => void
  userId?: string
  isMember?: boolean
}

// =============================================================================
// CONTEXT
// =============================================================================

const CartContext = createContext<CartContextType | undefined>(undefined)

// =============================================================================
// CART PROVIDER COMPONENT
// =============================================================================

export function CartProvider({
  children,
  storageKey = 'koperasi-sinoman-cart',
  syncInterval = 30000,
  apiBasePath = '/api/marketplace/cart',
  onCartChange,
  onError,
  onSuccess,
  userId,
  isMember = false
}: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncTimer, setSyncTimer] = useState<NodeJS.Timeout | null>(null)

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  // Calculate cart summary with member discounts
  const cartSummary: CartSummary = (() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const basePrice = isMember && item.member_price ? item.member_price : item.price
      return sum + (basePrice * item.quantity)
    }, 0)

    const originalTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const memberDiscount = originalTotal - subtotal

    return {
      subtotal: originalTotal,
      itemCount: cartItems.length,
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      memberDiscount,
      finalTotal: subtotal
    }
  })()

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Load cart from localStorage on mount
  useEffect(() => {
    loadCartFromStorage()
  }, [])

  // Handle user changes
  useEffect(() => {
    if (userId) {
      refreshCart()
      startSyncTimer()
    } else {
      // Clear cart when user logs out
      setCartItems([])
      stopSyncTimer()
    }

    return () => {
      stopSyncTimer()
    }
  }, [userId])

  // Save cart to localStorage whenever cartItems change
  useEffect(() => {
    saveCartToStorage()
    onCartChange?.(cartItems)
  }, [cartItems, onCartChange])

  // =============================================================================
  // STORAGE FUNCTIONS
  // =============================================================================

  const loadCartFromStorage = () => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsedCart = JSON.parse(stored)
        if (Array.isArray(parsedCart)) {
          setCartItems(parsedCart)
        }
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error)
    }
  }

  const saveCartToStorage = () => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(storageKey, JSON.stringify(cartItems))
    } catch (error) {
      console.error('Error saving cart to storage:', error)
    }
  }

  const clearCartStorage = () => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Error clearing cart storage:', error)
    }
  }

  // =============================================================================
  // SYNC TIMER FUNCTIONS
  // =============================================================================

  const startSyncTimer = () => {
    if (syncTimer) {
      clearInterval(syncTimer)
    }

    const timer = setInterval(() => {
      if (userId) {
        syncCartWithServer()
      }
    }, syncInterval)

    setSyncTimer(timer)
  }

  const stopSyncTimer = () => {
    if (syncTimer) {
      clearInterval(syncTimer)
      setSyncTimer(null)
    }
  }

  // =============================================================================
  // SERVER SYNC FUNCTIONS
  // =============================================================================

  const syncCartWithServer = async () => {
    if (!userId) return

    try {
      await fetch(apiBasePath, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))
        }),
      })
    } catch (error) {
      console.error('Error syncing cart with server:', error)
    }
  }

  const refreshCart = async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(apiBasePath)

      if (!response.ok) {
        throw new Error('Failed to fetch cart')
      }

      const data = await response.json()
      const serverCart: CartItem[] = data.data?.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.product?.name || 'Unknown Product',
        image: item.product?.images?.[0] || '',
        price: item.current_price || item.product?.price || 0,
        member_price: item.product?.member_price,
        quantity: item.quantity,
        stock: item.product?.stock,
        store_name: item.product?.store?.name,
        seller_id: item.product?.seller_id,
        discount_percentage: item.product?.discount_percentage
      })) || []

      setCartItems(serverCart)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load cart'
      console.error('Error refreshing cart:', error)
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================================================
  // CART ACTIONS
  // =============================================================================

  const addToCart = useCallback(async (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const quantity = item.quantity || 1

    // Check stock availability
    if (item.stock !== undefined && item.stock < quantity) {
      const errorMessage = 'Stok tidak mencukupi'
      onError?.(errorMessage)
      return
    }

    // Optimistic update
    const existingItemIndex = cartItems.findIndex(cartItem => cartItem.product_id === item.product_id)
    let newCartItems: CartItem[]

    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = cartItems[existingItemIndex]
      const newQuantity = existingItem.quantity + quantity

      // Check total quantity against stock
      if (item.stock !== undefined && item.stock < newQuantity) {
        const errorMessage = 'Stok tidak mencukupi'
        onError?.(errorMessage)
        return
      }

      newCartItems = cartItems.map((cartItem, index) =>
        index === existingItemIndex
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      )
    } else {
      // Add new item
      const newItem: CartItem = {
        ...item,
        quantity
      }
      newCartItems = [...cartItems, newItem]
    }

    setCartItems(newCartItems)

    // Update server if user is logged in
    if (userId) {
      try {
        const response = await fetch(apiBasePath, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: item.product_id,
            quantity
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to add item to cart')
        }

        onSuccess?.('Produk ditambahkan ke keranjang')
      } catch (error) {
        // Revert optimistic update on error
        setCartItems(cartItems)
        const errorMessage = 'Gagal menambahkan ke keranjang'
        console.error('Error adding to cart:', error)
        onError?.(errorMessage)
      }
    } else {
      onSuccess?.('Produk ditambahkan ke keranjang')
    }
  }, [cartItems, userId, onError, onSuccess, apiBasePath])

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }

    // Check stock availability
    const item = cartItems.find(item => item.product_id === productId)
    if (item?.stock !== undefined && item.stock < quantity) {
      const errorMessage = 'Stok tidak mencukupi'
      onError?.(errorMessage)
      return
    }

    // Optimistic update
    const previousCart = cartItems
    const newCartItems = cartItems.map(item =>
      item.product_id === productId
        ? { ...item, quantity }
        : item
    )

    setCartItems(newCartItems)

    // Update server if user is logged in
    if (userId) {
      try {
        const response = await fetch(`${apiBasePath}/${productId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity }),
        })

        if (!response.ok) {
          throw new Error('Failed to update quantity')
        }
      } catch (error) {
        // Revert optimistic update on error
        setCartItems(previousCart)
        const errorMessage = 'Gagal mengupdate jumlah'
        console.error('Error updating quantity:', error)
        onError?.(errorMessage)
      }
    }
  }, [cartItems, userId, onError, apiBasePath])

  const removeFromCart = useCallback(async (productId: string) => {
    // Optimistic update
    const previousCart = cartItems
    const newCartItems = cartItems.filter(item => item.product_id !== productId)

    setCartItems(newCartItems)

    // Update server if user is logged in
    if (userId) {
      try {
        const response = await fetch(`${apiBasePath}?product_id=${productId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to remove item from cart')
        }

        onSuccess?.('Produk dihapus dari keranjang')
      } catch (error) {
        // Revert optimistic update on error
        setCartItems(previousCart)
        const errorMessage = 'Gagal menghapus dari keranjang'
        console.error('Error removing from cart:', error)
        onError?.(errorMessage)
      }
    } else {
      onSuccess?.('Produk dihapus dari keranjang')
    }
  }, [cartItems, userId, onError, onSuccess, apiBasePath])

  const clearCart = useCallback(async () => {
    // Optimistic update
    const previousCart = cartItems
    setCartItems([])
    clearCartStorage()

    // Update server if user is logged in
    if (userId) {
      try {
        const response = await fetch(apiBasePath, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to clear cart')
        }

        onSuccess?.('Keranjang dikosongkan')
      } catch (error) {
        // Revert optimistic update on error
        setCartItems(previousCart)
        const errorMessage = 'Gagal mengosongkan keranjang'
        console.error('Error clearing cart:', error)
        onError?.(errorMessage)
      }
    } else {
      onSuccess?.('Keranjang dikosongkan')
    }
  }, [cartItems, userId, onError, onSuccess, apiBasePath])

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const isInCart = useCallback((productId: string): boolean => {
    return cartItems.some(item => item.product_id === productId)
  }, [cartItems])

  const getCartItem = useCallback((productId: string): CartItem | undefined => {
    return cartItems.find(item => item.product_id === productId)
  }, [cartItems])

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const value: CartContextType = {
    // State
    cartItems,
    cartSummary,
    isLoading,
    error,

    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,

    // Computed values
    cartItemsCount: cartSummary.itemCount,
    cartTotal: cartSummary.finalTotal,
    isInCart,
    getCartItem,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used inside CartProvider')
  }
  return context
}

// =============================================================================
// CART BADGE COMPONENT
// =============================================================================

export interface CartBadgeProps {
  className?: string
  maxCount?: number
  showZero?: boolean
}

export function CartBadge({ className = '', maxCount = 99, showZero = false }: CartBadgeProps) {
  const { cartItemsCount } = useCart()

  if (!showZero && cartItemsCount === 0) return null

  const displayCount = cartItemsCount > maxCount ? `${maxCount}+` : cartItemsCount.toString()

  return (
    <span
      className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ${className}`}
    >
      {displayCount}
    </span>
  )
}

// =============================================================================
// CART SUMMARY COMPONENT
// =============================================================================

export interface CartSummaryProps {
  className?: string
  showItemCount?: boolean
  showMemberDiscount?: boolean
  currency?: string
  locale?: string
}

export function CartSummaryDisplay({
  className = '',
  showItemCount = true,
  showMemberDiscount = true,
  currency = 'IDR',
  locale = 'id-ID'
}: CartSummaryProps) {
  const { cartSummary } = useCart()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showItemCount && (
        <div className="flex justify-between text-sm">
          <span>Total Item</span>
          <span>{cartSummary.totalItems} item</span>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{formatPrice(cartSummary.subtotal)}</span>
      </div>

      {showMemberDiscount && cartSummary.memberDiscount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Diskon Member</span>
          <span>-{formatPrice(cartSummary.memberDiscount)}</span>
        </div>
      )}

      <div className="flex justify-between font-semibold text-base pt-2 border-t">
        <span>Total</span>
        <span>{formatPrice(cartSummary.finalTotal)}</span>
      </div>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  CartItem,
  CartSummary,
  CartProviderProps,
  CartBadgeProps,
  CartSummaryProps
}