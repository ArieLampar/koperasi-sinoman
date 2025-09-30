import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createMidtransIntegration } from '@koperasi-sinoman/integrations/midtrans'

// Types
interface CheckoutItem {
  product_id: string
  quantity: number
  price: number
  name: string
}

interface ShippingAddress {
  name: string
  phone: string
  address: string
  district: string
  city: string
  postal_code: string
  country?: string
}

interface CheckoutRequest {
  items: CheckoutItem[]
  shipping_address: ShippingAddress
  payment_method: string
  notes?: string
  voucher_code?: string
  use_member_discount?: boolean
}

interface CheckoutResponse {
  order: {
    id: string
    order_number: string
    total_amount: number
    status: string
    payment_status: string
  }
  payment: {
    token?: string
    redirect_url?: string
    payment_instructions?: any
  }
  summary: {
    subtotal: number
    discount_amount: number
    shipping_cost: number
    service_fee: number
    payment_fee: number
    total: number
  }
}

// Generate unique order number
function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()

  return `KS${year}${month}${day}${timestamp}${random}`
}

// Calculate shipping cost based on location and weight
function calculateShippingCost(city: string, totalWeight: number): number {
  // Simplified shipping calculation
  const baseRate = 10000
  const weightRate = Math.ceil(totalWeight / 1000) * 2000
  const locationMultiplier = city.toLowerCase().includes('jakarta') ? 1 : 1.5

  return Math.floor((baseRate + weightRate) * locationMultiplier)
}

// Calculate service fee
function calculateServiceFee(subtotal: number): number {
  // Free service fee for orders above 50k
  return subtotal < 50000 ? 1000 : 0
}

// Get payment method fee
function getPaymentMethodFee(paymentMethod: string): number {
  const fees: Record<string, number> = {
    'bank_transfer': 4000,
    'indomaret': 2500,
    'alfamart': 2500,
    'credit_card': 0,
    'gopay': 0,
    'ovo': 0,
    'dana': 0,
    'shopeepay': 0
  }

  return fees[paymentMethod] || 0
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: CheckoutRequest = await request.json()

    // Validate request
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      )
    }

    if (!body.shipping_address?.name || !body.shipping_address?.address) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      )
    }

    if (!body.payment_method) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      )
    }

    // Start database transaction
    const { data: transaction, error: transactionError } = await supabase.rpc('begin_transaction')
    if (transactionError) {
      console.error('Error starting transaction:', transactionError)
      return NextResponse.json(
        { error: 'Transaction error' },
        { status: 500 }
      )
    }

    try {
      // Validate products and stock
      const productIds = body.items.map(item => item.product_id)
      const { data: products, error: productsError } = await supabase
        .from('marketplace_products')
        .select('id, name, price, member_price, stock, weight, store_id')
        .in('id', productIds)
        .eq('status', 'active')

      if (productsError || !products || products.length !== body.items.length) {
        await supabase.rpc('rollback_transaction')
        return NextResponse.json(
          { error: 'Some products are not available' },
          { status: 400 }
        )
      }

      // Check member status for discount eligibility
      const { data: memberData } = await supabase
        .from('cooperative_members')
        .select('status')
        .eq('user_id', user.id)
        .single()

      const isMember = memberData?.status === 'active'

      // Validate stock and calculate totals
      let subtotal = 0
      let totalWeight = 0
      const validatedItems: any[] = []

      for (const item of body.items) {
        const product = products.find(p => p.id === item.product_id)
        if (!product) {
          await supabase.rpc('rollback_transaction')
          return NextResponse.json(
            { error: `Product ${item.product_id} not found` },
            { status: 400 }
          )
        }

        if (product.stock < item.quantity) {
          await supabase.rpc('rollback_transaction')
          return NextResponse.json(
            { error: `Insufficient stock for product: ${product.name}` },
            { status: 400 }
          )
        }

        // Use member price if applicable
        const effectivePrice = isMember && product.member_price ? product.member_price : product.price
        const itemSubtotal = effectivePrice * item.quantity

        subtotal += itemSubtotal
        totalWeight += (product.weight || 500) * item.quantity

        validatedItems.push({
          product_id: item.product_id,
          product_name: product.name,
          price: effectivePrice,
          quantity: item.quantity,
          subtotal: itemSubtotal,
          store_id: product.store_id
        })
      }

      // Calculate fees and discounts
      const memberDiscountRate = isMember && body.use_member_discount ? 0.05 : 0
      const discountAmount = Math.floor(subtotal * memberDiscountRate)
      const shippingCost = calculateShippingCost(body.shipping_address.city, totalWeight)
      const serviceFee = calculateServiceFee(subtotal)
      const paymentFee = getPaymentMethodFee(body.payment_method)

      const totalAmount = subtotal - discountAmount + shippingCost + serviceFee + paymentFee

      // Create order
      const orderNumber = generateOrderNumber()
      const { data: order, error: orderError } = await supabase
        .from('marketplace_orders')
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          status: 'pending',
          payment_status: 'pending',
          payment_method: body.payment_method,
          subtotal,
          discount_amount: discountAmount,
          shipping_cost: shippingCost,
          service_fee: serviceFee,
          payment_fee: paymentFee,
          total_amount: totalAmount,
          shipping_address: body.shipping_address,
          notes: body.notes || null,
          voucher_code: body.voucher_code || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (orderError) {
        await supabase.rpc('rollback_transaction')
        console.error('Error creating order:', orderError)
        return NextResponse.json(
          { error: 'Failed to create order' },
          { status: 500 }
        )
      }

      // Create order items
      const orderItems = validatedItems.map(item => ({
        ...item,
        order_id: order.id
      }))

      const { error: itemsError } = await supabase
        .from('marketplace_order_items')
        .insert(orderItems)

      if (itemsError) {
        await supabase.rpc('rollback_transaction')
        console.error('Error creating order items:', itemsError)
        return NextResponse.json(
          { error: 'Failed to create order items' },
          { status: 500 }
        )
      }

      // Update product stock
      for (const item of body.items) {
        const { error: stockError } = await supabase.rpc('decrease_product_stock', {
          product_id: item.product_id,
          quantity: item.quantity
        })

        if (stockError) {
          await supabase.rpc('rollback_transaction')
          console.error('Error updating stock:', stockError)
          return NextResponse.json(
            { error: 'Failed to update product stock' },
            { status: 500 }
          )
        }
      }

      // Initialize Midtrans for payment processing
      const midtrans = createMidtransIntegration({
        clientKey: process.env.MIDTRANS_CLIENT_KEY!,
        serverKey: process.env.MIDTRANS_SERVER_KEY!,
        isProduction: process.env.NODE_ENV === 'production'
      })

      // Prepare payment request
      const paymentRequest = {
        transaction_details: {
          order_id: orderNumber,
          gross_amount: totalAmount
        },
        customer_details: {
          first_name: body.shipping_address.name,
          email: user.email!,
          phone: body.shipping_address.phone,
          billing_address: {
            first_name: body.shipping_address.name,
            phone: body.shipping_address.phone,
            address: body.shipping_address.address,
            city: body.shipping_address.city,
            postal_code: body.shipping_address.postal_code,
            country_code: 'IDN'
          },
          shipping_address: {
            first_name: body.shipping_address.name,
            phone: body.shipping_address.phone,
            address: body.shipping_address.address,
            city: body.shipping_address.city,
            postal_code: body.shipping_address.postal_code,
            country_code: 'IDN'
          }
        },
        item_details: validatedItems.map(item => ({
          id: item.product_id,
          name: item.product_name,
          price: item.price,
          quantity: item.quantity
        })),
        callbacks: {
          finish: `${process.env.NEXT_PUBLIC_APP_URL}/toko/order/${orderNumber}/success`,
          error: `${process.env.NEXT_PUBLIC_APP_URL}/toko/order/${orderNumber}/error`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/toko/order/${orderNumber}/pending`
        },
        expiry: {
          unit: 'hour',
          duration: 24
        }
      }

      // Create payment token
      const paymentResult = await midtrans.createPaymentToken(paymentRequest)

      if (!paymentResult.success) {
        await supabase.rpc('rollback_transaction')
        console.error('Payment token creation failed:', paymentResult.error)
        return NextResponse.json(
          { error: `Payment processing failed: ${paymentResult.error}` },
          { status: 400 }
        )
      }

      // Update order with payment token
      const { error: updateError } = await supabase
        .from('marketplace_orders')
        .update({
          midtrans_token: paymentResult.data!.token,
          midtrans_redirect_url: paymentResult.data!.redirect_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (updateError) {
        await supabase.rpc('rollback_transaction')
        console.error('Error updating order with payment data:', updateError)
        return NextResponse.json(
          { error: 'Failed to update order with payment information' },
          { status: 500 }
        )
      }

      // Commit transaction
      await supabase.rpc('commit_transaction')

      // Prepare response
      const response: CheckoutResponse = {
        order: {
          id: order.id,
          order_number: orderNumber,
          total_amount: totalAmount,
          status: order.status,
          payment_status: order.payment_status
        },
        payment: {
          token: paymentResult.data!.token,
          redirect_url: paymentResult.data!.redirect_url
        },
        summary: {
          subtotal,
          discount_amount: discountAmount,
          shipping_cost: shippingCost,
          service_fee: serviceFee,
          payment_fee: paymentFee,
          total: totalAmount
        }
      }

      return NextResponse.json({ data: response }, { status: 201 })

    } catch (error) {
      // Rollback on any error
      await supabase.rpc('rollback_transaction')
      throw error
    }

  } catch (error) {
    console.error('Error in checkout API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}