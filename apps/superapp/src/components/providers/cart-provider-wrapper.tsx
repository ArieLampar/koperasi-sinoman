'use client'

import { CartProvider } from '@koperasi-sinoman/ui'
import { useAuth } from './auth-provider'
import { toast } from 'react-hot-toast'

interface CartProviderWrapperProps {
  children: React.ReactNode
}

export function CartProviderWrapper({ children }: CartProviderWrapperProps) {
  const { user, memberData } = useAuth()

  const handleCartChange = (items: any[]) => {
    // You can add analytics or other side effects here
    if (typeof window !== 'undefined') {
      // Track cart changes for analytics
      console.log('Cart updated:', items.length, 'items')
    }
  }

  const handleError = (error: string) => {
    toast.error(error)
  }

  const handleSuccess = (message: string) => {
    toast.success(message)
  }

  return (
    <CartProvider
      userId={user?.id}
      isMember={!!memberData?.is_member}
      storageKey="koperasi-sinoman-cart"
      syncInterval={30000}
      apiBasePath="/api/marketplace/cart"
      onCartChange={handleCartChange}
      onError={handleError}
      onSuccess={handleSuccess}
    >
      {children}
    </CartProvider>
  )
}