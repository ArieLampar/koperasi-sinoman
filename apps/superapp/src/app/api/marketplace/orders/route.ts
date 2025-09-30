import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Types
interface OrderItem {
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

interface OrderSummary {
  subtotal: number
  memberDiscount: number
  shippingCost: number
  serviceFee: number
  payment_fee: number
  total: number
}

interface CreateOrderRequest {
  items: OrderItem[]
  shipping_address: ShippingAddress
  payment_method: string
  notes?: string
  summary: OrderSummary
}

// Generate order number
function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substr(2, 6).toUpperCase()

  return `KS${year}${month}${day}${random}`
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Number(searchParams.get('limit')) || 20
    const offset = Number(searchParams.get('offset')) || 0

    // Build query
    let query = supabase
      .from('marketplace_orders')
      .select(`
        *,
        items:marketplace_order_items(
          *,
          product:marketplace_products(
            name,
            image,
            slug
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: orders,
      pagination: {
        limit,
        offset,
        total: orders?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in orders GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: CreateOrderRequest = await request.json()

    // Validate required fields
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      )
    }

    if (!body.shipping_address || !body.shipping_address.name) {
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

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Start transaction
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        status: 'pending',
        payment_status: 'pending',
        payment_method: body.payment_method,
        subtotal: body.summary.subtotal,
        discount_amount: body.summary.memberDiscount,
        shipping_cost: body.summary.shippingCost,
        service_fee: body.summary.serviceFee,
        payment_fee: body.summary.payment_fee,
        total_amount: body.summary.total,
        shipping_address: body.shipping_address,
        notes: body.notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Insert order items
    const orderItems = body.items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      product_image: item.image,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('marketplace_order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)

      // Rollback: delete the order
      await supabase
        .from('marketplace_orders')
        .delete()
        .eq('id', order.id)

      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    // Update product stock
    for (const item of body.items) {
      const { error: stockError } = await supabase.rpc('decrease_product_stock', {
        product_id: item.id,
        quantity: item.quantity
      })

      if (stockError) {
        console.error('Error updating product stock:', stockError)
        // Log but don't fail the order creation
      }
    }

    // Fetch complete order with items
    const { data: completeOrder, error: fetchError } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        items:marketplace_order_items(*)
      `)
      .eq('id', order.id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete order:', fetchError)
      return NextResponse.json({ data: order }, { status: 201 })
    }

    return NextResponse.json({ data: completeOrder }, { status: 201 })

  } catch (error) {
    console.error('Error in orders POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}