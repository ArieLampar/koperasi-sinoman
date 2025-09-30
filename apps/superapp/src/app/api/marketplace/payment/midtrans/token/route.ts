import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createMidtransIntegration } from '@koperasi-sinoman/integrations/midtrans'

// Types
interface CreateTokenRequest {
  order_id: string
  gross_amount: number
  customer_details: {
    first_name: string
    email: string
    phone: string
    billing_address: {
      first_name: string
      phone: string
      address: string
      city: string
      postal_code: string
      country_code: string
    }
    shipping_address: {
      first_name: string
      phone: string
      address: string
      city: string
      postal_code: string
      country_code: string
    }
  }
  item_details: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  payment_type?: string
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

    const body: CreateTokenRequest = await request.json()

    // Validate required fields
    const requiredFields = ['order_id', 'gross_amount', 'customer_details', 'item_details']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select('id, order_number, total_amount, status')
      .eq('order_number', body.order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Verify order is pending
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Order is not in pending status' },
        { status: 400 }
      )
    }

    // Verify amount matches
    if (Math.abs(order.total_amount - body.gross_amount) > 1) {
      return NextResponse.json(
        { error: 'Amount mismatch between order and payment request' },
        { status: 400 }
      )
    }

    // Initialize Midtrans
    const midtrans = createMidtransIntegration({
      clientKey: process.env.MIDTRANS_CLIENT_KEY!,
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
      isProduction: process.env.NODE_ENV === 'production'
    })

    // Prepare transaction request
    const transactionRequest = {
      transaction_details: {
        order_id: body.order_id,
        gross_amount: body.gross_amount
      },
      customer_details: body.customer_details,
      item_details: body.item_details,
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/toko/order/${body.order_id}/success`,
        error: `${process.env.NEXT_PUBLIC_APP_URL}/toko/order/${body.order_id}/error`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/toko/order/${body.order_id}/pending`
      },
      expiry: {
        unit: 'hour',
        duration: 24
      }
    }

    // Create payment token
    const result = await midtrans.createPaymentToken(transactionRequest)

    if (!result.success) {
      console.error('Midtrans token creation failed:', result.error)
      return NextResponse.json(
        { error: `Payment token creation failed: ${result.error}` },
        { status: 400 }
      )
    }

    // Save payment token to order
    const { error: updateError } = await supabase
      .from('marketplace_orders')
      .update({
        midtrans_token: result.data!.token,
        midtrans_redirect_url: result.data!.redirect_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Error saving payment token:', updateError)
      // Don't fail the request, token is still valid
    }

    return NextResponse.json({
      data: {
        token: result.data!.token,
        redirect_url: result.data!.redirect_url,
        order_id: body.order_id
      }
    })

  } catch (error) {
    console.error('Error in Midtrans token API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}