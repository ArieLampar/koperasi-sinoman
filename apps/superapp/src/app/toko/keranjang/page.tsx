'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Edit,
  ShoppingBag,
  Tag,
  Truck,
  Shield,
  AlertCircle
} from 'lucide-react'

// Hooks and utilities
import { useAuth } from '@/components/providers/auth-provider'
import { useCart } from '@koperasi-sinoman/ui'
import { useMemberData } from '@/hooks/use-member-data'
import { formatCurrency } from '@/lib/utils/currency'

// Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// Types
interface ShippingAddress {
  id?: string
  name: string
  phone: string
  address: string
  district: string
  city: string
  postal_code: string
  is_default: boolean
}

interface CartSummary {
  subtotal: number
  memberDiscount: number
  shippingCost: number
  serviceFee: number
  total: number
}

export default function CartPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartItemsCount } = useCart()
  const { data: memberData } = useMemberData()

  // Local state
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    phone: '',
    address: '',
    district: '',
    city: '',
    postal_code: '',
    is_default: false
  })
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [notes, setNotes] = useState('')
  const [cartSummary, setCartSummary] = useState<CartSummary>({
    subtotal: 0,
    memberDiscount: 0,
    shippingCost: 0,
    serviceFee: 0,
    total: 0
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Load default shipping address
  useEffect(() => {
    if (memberData) {
      // Load default shipping address from member data
      // This would typically come from an API
      setShippingAddress({
        name: memberData.full_name || '',
        phone: memberData.phone || '',
        address: memberData.address || '',
        district: memberData.district || '',
        city: memberData.city || '',
        postal_code: memberData.postal_code || '',
        is_default: true
      })
    }
  }, [memberData])

  // Calculate cart summary
  useEffect(() => {
    const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.id))
    const subtotal = selectedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Member discount (5% for members)
    const isMember = memberData?.status === 'active'
    const memberDiscount = isMember ? Math.floor(subtotal * 0.05) : 0

    // Shipping cost calculation (simplified)
    const shippingCost = selectedCartItems.length > 0 ? 15000 : 0

    // Service fee (1000 for orders under 50000)
    const serviceFee = subtotal < 50000 && selectedCartItems.length > 0 ? 1000 : 0

    const total = subtotal - memberDiscount + shippingCost + serviceFee

    setCartSummary({
      subtotal,
      memberDiscount,
      shippingCost,
      serviceFee,
      total
    })
  }, [cartItems, selectedItems, memberData])

  // Initialize selected items (select all by default)
  useEffect(() => {
    if (cartItems.length > 0 && selectedItems.length === 0) {
      setSelectedItems(cartItems.map(item => item.id))
    }
  }, [cartItems, selectedItems.length])

  // Show loading if not authenticated
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

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(cartItems.map(item => item.id))
    }
  }

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    } else {
      updateQuantity(itemId, newQuantity)
    }
  }

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId)
    setSelectedItems(prev => prev.filter(id => id !== itemId))
  }

  const handleCheckout = () => {
    if (selectedItems.length === 0) return

    // Store selected items and shipping info for checkout
    const checkoutData = {
      items: cartItems.filter(item => selectedItems.includes(item.id)),
      shippingAddress,
      notes,
      summary: cartSummary
    }

    // Store in localStorage or pass via router state
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData))
    router.push('/toko/checkout')
  }

  const isMember = memberData?.status === 'active'

  return (
    <div className="min-h-screen bg-background-secondary pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white sticky top-16 md:top-16 z-40 border-b border-neutral-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-medium text-neutral-900">
              Keranjang Belanja ({cartItemsCount})
            </h1>
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {selectedItems.length === cartItems.length ? 'Batalkan Semua' : 'Pilih Semua'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto lg:px-4 lg:py-6">
        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="bg-white lg:rounded-lg lg:border lg:border-neutral-200 p-8 text-center">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-10 w-10 text-neutral-400" />
            </div>
            <h2 className="text-lg font-medium text-neutral-900 mb-2">
              Keranjang Kosong
            </h2>
            <p className="text-neutral-600 mb-6">
              Yuk, mulai belanja dan tambahkan produk ke keranjang!
            </p>
            <Button onClick={() => router.push('/toko')}>
              Mulai Belanja
            </Button>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Member Benefits Banner */}
              {isMember && (
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-lg lg:border lg:border-primary-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">Diskon Anggota Aktif!</h3>
                      <p className="text-sm text-primary-100">
                        Dapatkan diskon 5% untuk semua pembelian
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              <div className="bg-white lg:rounded-lg lg:border lg:border-neutral-200">
                {cartItems.map((item, index) => (
                  <div key={item.id} className={`p-4 ${index > 0 ? 'border-t border-neutral-200' : ''}`}>
                    <div className="flex items-start space-x-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="mt-2 w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                      />

                      {/* Product Image */}
                      <div className="w-20 h-20 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-neutral-900 line-clamp-2 mb-1">
                          {item.name}
                        </h3>

                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-primary-600">
                            {formatCurrency(item.price)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-neutral-400 hover:text-error-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-neutral-300 rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="p-2 hover:bg-neutral-100 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3 py-2 text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="p-2 hover:bg-neutral-100 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <span className="text-sm font-medium text-neutral-700">
                            Subtotal: {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              <div className="bg-white lg:rounded-lg lg:border lg:border-neutral-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="font-medium text-neutral-900">Alamat Pengiriman</h3>
                  </div>
                  <button
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {isEditingAddress ? 'Simpan' : 'Ubah'}
                  </button>
                </div>

                {isEditingAddress ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Nama penerima"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Nomor telepon"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <Textarea
                      placeholder="Alamat lengkap"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        placeholder="Kecamatan"
                        value={shippingAddress.district}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, district: e.target.value }))}
                      />
                      <Input
                        placeholder="Kota"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      />
                      <Input
                        placeholder="Kode pos"
                        value={shippingAddress.postal_code}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    {shippingAddress.name ? (
                      <div className="text-sm text-neutral-700">
                        <p className="font-medium">{shippingAddress.name} ({shippingAddress.phone})</p>
                        <p className="mt-1">
                          {shippingAddress.address}, {shippingAddress.district}, {shippingAddress.city} {shippingAddress.postal_code}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">Belum ada alamat pengiriman</p>
                    )}
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div className="bg-white lg:rounded-lg lg:border lg:border-neutral-200 p-4">
                <h3 className="font-medium text-neutral-900 mb-3">Catatan Pesanan (Opsional)</h3>
                <Textarea
                  placeholder="Tambahkan catatan untuk penjual..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-6 lg:mt-0">
              <div className="bg-white lg:rounded-lg lg:border lg:border-neutral-200 p-4 sticky top-32">
                <h3 className="font-medium text-neutral-900 mb-4">Ringkasan Pesanan</h3>

                {selectedItems.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Pilih produk untuk melihat ringkasan</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Subtotal ({selectedItems.length} item)</span>
                        <span className="text-neutral-900">{formatCurrency(cartSummary.subtotal)}</span>
                      </div>

                      {cartSummary.memberDiscount > 0 && (
                        <div className="flex justify-between text-success-600">
                          <span>Diskon Anggota (5%)</span>
                          <span>-{formatCurrency(cartSummary.memberDiscount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-neutral-600">Ongkos Kirim</span>
                        <span className="text-neutral-900">{formatCurrency(cartSummary.shippingCost)}</span>
                      </div>

                      {cartSummary.serviceFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Biaya Layanan</span>
                          <span className="text-neutral-900">{formatCurrency(cartSummary.serviceFee)}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-neutral-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-neutral-900">Total Pembayaran</span>
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(cartSummary.total)}
                        </span>
                      </div>
                    </div>

                    {/* Benefits Info */}
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Shield className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-primary-700">
                          <p className="font-medium mb-1">Jaminan Koperasi Sinoman</p>
                          <ul className="space-y-1">
                            <li>• Produk 100% original</li>
                            <li>• Garansi uang kembali</li>
                            <li>• Pengiriman aman</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <Button
                      onClick={handleCheckout}
                      disabled={selectedItems.length === 0 || !shippingAddress.name}
                      className="w-full"
                      size="lg"
                    >
                      Checkout ({selectedItems.length} item)
                    </Button>

                    {!shippingAddress.name && (
                      <p className="text-xs text-error-600 text-center">
                        Lengkapi alamat pengiriman untuk melanjutkan
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}