'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers/supabase-provider'
import { useAuth } from '@/components/providers/auth-provider'

// Types
export interface Product {
  id: string
  slug: string
  name: string
  description: string
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
  store: {
    id: string
    name: string
    location: string
    rating: number
    verified: boolean
    logo: string
  }
  tags: string[]
  view_count: number
  sold_count: number
  is_favorite?: boolean
}

export interface Category {
  id: string
  name: string
  icon: string
  product_count: number
}

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: Product
  current_price: number
  subtotal: number
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'expired'
  total_amount: number
  subtotal: number
  discount_amount: number
  shipping_cost: number
  service_fee: number
  payment_fee: number
  shipping_address: {
    name: string
    phone: string
    address: string
    district: string
    city: string
    postal_code: string
  }
  items: Array<{
    id: string
    product_name: string
    price: number
    quantity: number
    subtotal: number
    product?: {
      name: string
      image: string
      slug: string
    }
  }>
  created_at: string
  updated_at: string
}

export interface FlashSale {
  id: string
  title: string
  subtitle: string
  end_time: string
  discount_percentage: number
  banner_image: string
  products: Product[]
}

export interface ProductFilters {
  category?: string
  search?: string
  min_price?: number
  max_price?: number
  store_id?: string
  is_flash_sale?: boolean
  sort_by?: 'name' | 'price' | 'rating' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

// Products Hook
export function useProducts(filters: ProductFilters = {}, enabled: boolean = true) {
  const { supabase } = useSupabase()

  return useQuery({
    queryKey: ['marketplace-products', filters],
    queryFn: async (): Promise<Product[]> => {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`/api/marketplace/products?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      return data.data || []
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Single Product Hook
export function useProduct(slug: string, enabled: boolean = true) {
  const { supabase } = useSupabase()

  return useQuery({
    queryKey: ['marketplace-product', slug],
    queryFn: async (): Promise<Product | null> => {
      const response = await fetch(`/api/marketplace/products/${slug}`)

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error('Failed to fetch product')
      }

      const data = await response.json()
      return data.data
    },
    enabled: enabled && !!slug,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Categories Hook
export function useCategories() {
  const { supabase } = useSupabase()

  return useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: async (): Promise<Category[]> => {
      const response = await fetch('/api/marketplace/categories')

      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      return data.data || []
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Cart Hooks
export function useCart() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const cartQuery = useQuery({
    queryKey: ['marketplace-cart', user?.id],
    queryFn: async (): Promise<CartItem[]> => {
      if (!user) return []

      const response = await fetch('/api/marketplace/cart')

      if (!response.ok) {
        throw new Error('Failed to fetch cart')
      }

      const data = await response.json()
      return data.data || []
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  const addToCartMutation = useMutation({
    mutationFn: async ({ product_id, quantity }: { product_id: string; quantity: number }) => {
      const response = await fetch('/api/marketplace/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id, quantity }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add to cart')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch cart
      queryClient.invalidateQueries({ queryKey: ['marketplace-cart', user?.id] })
    },
  })

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ product_id, quantity }: { product_id: string; quantity: number }) => {
      const response = await fetch(`/api/marketplace/cart/${product_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update quantity')
      }

      return response.json()
    },
    onMutate: async ({ product_id, quantity }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['marketplace-cart', user?.id] })

      const previousCart = queryClient.getQueryData<CartItem[]>(['marketplace-cart', user?.id])

      queryClient.setQueryData<CartItem[]>(['marketplace-cart', user?.id], (oldCart = []) => {
        return oldCart.map(item =>
          item.product_id === product_id
            ? { ...item, quantity, subtotal: item.current_price * quantity }
            : item
        )
      })

      return { previousCart }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(['marketplace-cart', user?.id], context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-cart', user?.id] })
    },
  })

  const removeFromCartMutation = useMutation({
    mutationFn: async (product_id: string) => {
      const response = await fetch(`/api/marketplace/cart?product_id=${product_id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove from cart')
      }

      return response.json()
    },
    onMutate: async (product_id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['marketplace-cart', user?.id] })

      const previousCart = queryClient.getQueryData<CartItem[]>(['marketplace-cart', user?.id])

      queryClient.setQueryData<CartItem[]>(['marketplace-cart', user?.id], (oldCart = []) => {
        return oldCart.filter(item => item.product_id !== product_id)
      })

      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['marketplace-cart', user?.id], context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-cart', user?.id] })
    },
  })

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/marketplace/cart', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to clear cart')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.setQueryData(['marketplace-cart', user?.id], [])
    },
  })

  return {
    cart: cartQuery.data || [],
    isLoading: cartQuery.isLoading,
    error: cartQuery.error,
    cartCount: cartQuery.data?.length || 0,
    cartTotal: cartQuery.data?.reduce((sum, item) => sum + item.subtotal, 0) || 0,
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
  }
}

// Orders Hook
export function useOrders(status?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['marketplace-orders', user?.id, status],
    queryFn: async (): Promise<Order[]> => {
      if (!user) return []

      const params = new URLSearchParams()
      if (status) {
        params.append('status', status)
      }

      const response = await fetch(`/api/marketplace/orders?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      return data.data || []
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Single Order Hook
export function useOrder(orderId: string, enabled: boolean = true) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['marketplace-order', orderId],
    queryFn: async (): Promise<Order | null> => {
      if (!user || !orderId) return null

      const response = await fetch(`/api/marketplace/orders/${orderId}`)

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error('Failed to fetch order')
      }

      const data = await response.json()
      return data.data
    },
    enabled: enabled && !!user && !!orderId,
    staleTime: 30 * 1000, // 30 seconds (for real-time payment status)
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Flash Sales Hook
export function useFlashSales() {
  return useQuery({
    queryKey: ['marketplace-flash-sales'],
    queryFn: async (): Promise<FlashSale[]> => {
      const response = await fetch('/api/marketplace/flash-sales')

      if (!response.ok) {
        throw new Error('Failed to fetch flash sales')
      }

      const data = await response.json()
      return data.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Checkout Hook
export function useCheckout() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (checkoutData: {
      items: Array<{
        product_id: string
        quantity: number
        price: number
        name: string
      }>
      shipping_address: {
        name: string
        phone: string
        address: string
        district: string
        city: string
        postal_code: string
      }
      payment_method: string
      notes?: string
      voucher_code?: string
      use_member_discount?: boolean
    }) => {
      const response = await fetch('/api/marketplace/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Checkout failed')
      }

      return response.json()
    },
    onSuccess: () => {
      // Clear cart and invalidate related queries
      queryClient.setQueryData(['marketplace-cart', user?.id], [])
      queryClient.invalidateQueries({ queryKey: ['marketplace-orders', user?.id] })
    },
  })
}

// Marketplace Data Hook (combines multiple data sources)
export function useMarketplaceData() {
  const products = useProducts()
  const categories = useCategories()
  const flashSales = useFlashSales()

  // Calculate combined loading state
  const isLoading = products.isLoading || categories.isLoading || flashSales.isLoading

  // Calculate if any query has error
  const error = products.error || categories.error || flashSales.error

  // Return combined data and states
  return {
    data: {
      products: products.data || [],
      categories: categories.data || [],
      flashSales: flashSales.data || [],
    },
    isLoading,
    error,
    // Individual query states for more granular control
    productsLoading: products.isLoading,
    categoriesLoading: categories.isLoading,
    flashSalesLoading: flashSales.isLoading,
    productsError: products.error,
    categoriesError: categories.error,
    flashSalesError: flashSales.error,
  }
}