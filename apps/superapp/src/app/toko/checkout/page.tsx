'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Info
} from 'lucide-react'

// Hooks and utilities
import { useAuth } from '@/components/providers/auth-provider'
import { useMemberData } from '@/hooks/use-member-data'
import { formatCurrency } from '@/lib/utils/currency'

// Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Types
interface CheckoutItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

interface ShippingAddress {
  name: string
  phone: string
  address: string
  district: string
  city: string
  postal_code: string
}

interface CheckoutData {
  items: CheckoutItem[]
  shippingAddress: ShippingAddress
  notes: string
  summary: {
    subtotal: number
    memberDiscount: number
    shippingCost: number
    serviceFee: number
    total: number
  }
}

interface PaymentMethod {
  id: string
  name: string
  type: 'credit_card' | 'bank_transfer' | 'ewallet' | 'convenience_store'
  icon: React.ReactNode
  description: string
  fee: number
  processing_time: string
}

interface Order {
  id: string
  order_number: string
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'expired'
  total: number
  created_at: string
  midtrans_token?: string
  midtrans_redirect_url?: string
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'credit_card',
    name: 'Kartu Kredit/Debit',
    type: 'credit_card',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Visa, Mastercard, JCB',
    fee: 0,
    processing_time: 'Instant'
  },
  {
    id: 'gopay',
    name: 'GoPay',
    type: 'ewallet',
    icon: <Wallet className="h-5 w-5" />,
    description: 'Bayar dengan saldo GoPay',
    fee: 0,
    processing_time: 'Instant'
  },
  {
    id: 'ovo',
    name: 'OVO',
    type: 'ewallet',
    icon: <Smartphone className="h-5 w-5" />,
    description: 'Bayar dengan saldo OVO',
    fee: 0,
    processing_time: 'Instant'
  },
  {
    id: 'dana',
    name: 'DANA',
    type: 'ewallet',
    icon: <Smartphone className="h-5 w-5" />,
    description: 'Bayar dengan saldo DANA',
    fee: 0,
    processing_time: 'Instant'
  },
  {
    id: 'bank_transfer',
    name: 'Transfer Bank',
    type: 'bank_transfer',
    icon: <Building2 className="h-5 w-5" />,
    description: 'BCA, BNI, BRI, Mandiri',
    fee: 4000,
    processing_time: '1-3 jam'
  },
  {
    id: 'indomaret',
    name: 'Indomaret',
    type: 'convenience_store',
    icon: <Package className="h-5 w-5" />,
    description: 'Bayar di kasir Indomaret',
    fee: 2500,
    processing_time: 'Instant'
  },
  {
    id: 'alfamart',
    name: 'Alfamart',
    type: 'convenience_store',
    icon: <Package className="h-5 w-5" />,
    description: 'Bayar di kasir Alfamart',
    fee: 2500,
    processing_time: 'Instant'
  }
]

export default function CheckoutPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { data: memberData } = useMemberData()

  // State
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)

  // Load checkout data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('checkoutData')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setCheckoutData(data)
      } catch (error) {
        console.error('Error parsing checkout data:', error)
        router.push('/toko/keranjang')
      }
    } else {
      router.push('/toko/keranjang')
    }
  }, [router])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Show loading if not authenticated or no checkout data
  if (authLoading || !user || !checkoutData) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat...</p>
        </div>
      </div>
    )
  }

  const selectedMethod = paymentMethods.find(method => method.id === selectedPaymentMethod)
  const totalWithPaymentFee = checkoutData.summary.total + (selectedMethod?.fee || 0)

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      setError('Pilih metode pembayaran')
      return
    }

    if (!checkoutData.shippingAddress.name) {
      setError('Alamat pengiriman tidak lengkap')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create order in backend
      const orderResponse = await fetch('/api/marketplace/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: checkoutData.items,
          shipping_address: checkoutData.shippingAddress,
          payment_method: selectedPaymentMethod,
          notes: checkoutData.notes,
          summary: {
            ...checkoutData.summary,
            payment_fee: selectedMethod?.fee || 0,
            total: totalWithPaymentFee
          }
        }),
      })

      if (!orderResponse.ok) {
        throw new Error('Failed to create order')
      }

      const orderData = await orderResponse.json()
      setOrder(orderData)

      // Get Midtrans payment token
      const paymentResponse = await fetch('/api/marketplace/payment/midtrans/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderData.order_number,
          gross_amount: totalWithPaymentFee,
          customer_details: {
            first_name: checkoutData.shippingAddress.name,
            email: user.email,
            phone: checkoutData.shippingAddress.phone,
            billing_address: {
              first_name: checkoutData.shippingAddress.name,
              phone: checkoutData.shippingAddress.phone,
              address: checkoutData.shippingAddress.address,
              city: checkoutData.shippingAddress.city,
              postal_code: checkoutData.shippingAddress.postal_code,
              country_code: 'IDN'
            },
            shipping_address: {
              first_name: checkoutData.shippingAddress.name,
              phone: checkoutData.shippingAddress.phone,
              address: checkoutData.shippingAddress.address,
              city: checkoutData.shippingAddress.city,
              postal_code: checkoutData.shippingAddress.postal_code,
              country_code: 'IDN'
            }
          },
          item_details: checkoutData.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          payment_type: selectedPaymentMethod
        }),
      })

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment token')
      }

      const paymentData = await paymentResponse.json()

      // Update order with payment token
      await fetch(`/api/marketplace/orders/${orderData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          midtrans_token: paymentData.token,
          midtrans_redirect_url: paymentData.redirect_url
        }),
      })

      // Clear checkout data from localStorage
      localStorage.removeItem('checkoutData')

      // Redirect to Midtrans payment page or show payment instructions
      if (paymentData.redirect_url) {
        window.location.href = paymentData.redirect_url
      } else {
        // For some payment methods, show payment instructions
        router.push(`/toko/order/${orderData.order_number}?token=${paymentData.token}`)
      }

    } catch (error) {
      console.error('Payment error:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pembayaran')
    } finally {
      setIsProcessing(false)
    }
  }

  const isMember = memberData?.status === 'active'

  return (
    <div className="min-h-screen bg-background-secondary pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white sticky top-16 md:top-16 z-40 border-b border-neutral-200">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-medium text-neutral-900">Checkout</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto lg:px-4 lg:py-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Shipping Address */}
            <div className="bg-white lg:rounded-lg lg:border lg:border-neutral-200 p-4">
              <div className="flex items-center mb-3">
                <MapPin className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="font-medium text-neutral-900">Alamat Pengiriman</h3>
              </div>
              <div className="text-sm text-neutral-700">
                <p className="font-medium">{checkoutData.shippingAddress.name} ({checkoutData.shippingAddress.phone})</p>
                <p className="mt-1">
                  {checkoutData.shippingAddress.address}, {checkoutData.shippingAddress.district}, {checkoutData.shippingAddress.city} {checkoutData.shippingAddress.postal_code}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white lg:rounded-lg lg:border lg:border-neutral-200 p-4">
              <h3 className="font-medium text-neutral-900 mb-4">Pesanan ({checkoutData.items.length} item)</h3>
              <div className="space-y-4">
                {checkoutData.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-neutral-900 line-clamp-2">{item.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-neutral-600">Qty: {item.quantity}</span>
                        <span className="font-medium text-primary-600">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {checkoutData.notes && (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <h4 className="text-sm font-medium text-neutral-900 mb-2">Catatan:</h4>
                  <p className="text-sm text-neutral-600">{checkoutData.notes}</p>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="bg-white lg:rounded-lg lg:border lg:border-neutral-200 p-4">
              <h3 className="font-medium text-neutral-900 mb-4">Metode Pembayaran</h3>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        checked={selectedPaymentMethod === method.id}
                        onChange={() => setSelectedPaymentMethod(method.id)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <div className="text-neutral-600">{method.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-neutral-900">{method.name}</h4>
                          {method.fee > 0 && (
                            <span className="text-sm text-neutral-600">
                              +{formatCurrency(method.fee)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600">{method.description}</p>
                        <div className="flex items-center text-xs text-neutral-500 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {method.processing_time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-6 lg:mt-0">
            <div className="bg-white lg:rounded-lg lg:border lg:border-neutral-200 p-4 sticky top-32">
              <h3 className="font-medium text-neutral-900 mb-4">Ringkasan Pembayaran</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Subtotal ({checkoutData.items.length} item)</span>
                  <span className="text-neutral-900">{formatCurrency(checkoutData.summary.subtotal)}</span>
                </div>

                {checkoutData.summary.memberDiscount > 0 && (
                  <div className="flex justify-between text-success-600">
                    <span>Diskon Anggota (5%)</span>
                    <span>-{formatCurrency(checkoutData.summary.memberDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-neutral-600">Ongkos Kirim</span>
                  <span className="text-neutral-900">{formatCurrency(checkoutData.summary.shippingCost)}</span>
                </div>

                {checkoutData.summary.serviceFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Biaya Layanan</span>
                    <span className="text-neutral-900">{formatCurrency(checkoutData.summary.serviceFee)}</span>
                  </div>
                )}

                {selectedMethod && selectedMethod.fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Biaya Payment</span>
                    <span className="text-neutral-900">{formatCurrency(selectedMethod.fee)}</span>
                  </div>
                )}

                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-neutral-900">Total Pembayaran</span>
                    <span className="text-lg font-bold text-primary-600">
                      {formatCurrency(totalWithPaymentFee)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mt-4">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-primary-700">
                    <p className="font-medium mb-1">Pembayaran Aman</p>
                    <p>Transaksi Anda dilindungi dengan enkripsi SSL dan sistem keamanan Midtrans.</p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-3 mt-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-error-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-error-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Pay Button */}
              <Button
                onClick={handlePayment}
                disabled={!selectedPaymentMethod || isProcessing}
                className="w-full mt-4"
                size="lg"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </div>
                ) : (
                  `Bayar ${formatCurrency(totalWithPaymentFee)}`
                )}
              </Button>

              {/* Terms */}
              <div className="mt-4 text-xs text-neutral-500 text-center">
                <p>
                  Dengan melanjutkan pembayaran, Anda menyetujui{' '}
                  <Link href="/terms" className="text-primary-600 hover:underline">
                    Syarat & Ketentuan
                  </Link>{' '}
                  Koperasi Sinoman.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}