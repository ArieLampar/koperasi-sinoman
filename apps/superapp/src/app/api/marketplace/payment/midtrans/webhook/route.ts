import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createMidtransIntegration } from '@koperasi-sinoman/integrations/midtrans'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const notification = await request.json()

    console.log('Midtrans webhook received:', notification)

    // Initialize Midtrans
    const midtrans = createMidtransIntegration({
      clientKey: process.env.MIDTRANS_CLIENT_KEY!,
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
      isProduction: process.env.NODE_ENV === 'production'
    })

    // Handle callback with signature verification
    const result = await midtrans.handleCallback(notification)

    if (!result.success) {
      console.error('Invalid webhook signature:', result.error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const transactionStatus = result.data!.transactionStatus

    if (!transactionStatus) {
      console.error('No transaction status in webhook')
      return NextResponse.json(
        { error: 'No transaction status' },
        { status: 400 }
      )
    }

    // Find order by order_number
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select('id, status, payment_status, user_id')
      .eq('order_number', transactionStatus.order_id)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', transactionStatus.order_id)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Determine order status based on transaction status
    let newStatus = order.status
    let newPaymentStatus = order.payment_status

    switch (transactionStatus.transaction_status) {
      case 'capture':
      case 'settlement':
        if (transactionStatus.fraud_status === 'accept') {
          newStatus = 'processing'
          newPaymentStatus = 'paid'
        }
        break

      case 'pending':
        newPaymentStatus = 'pending'
        break

      case 'deny':
      case 'cancel':
      case 'expire':
      case 'failure':
        newStatus = 'cancelled'
        newPaymentStatus = 'failed'
        break
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('marketplace_orders')
      .update({
        status: newStatus,
        payment_status: newPaymentStatus,
        midtrans_transaction_id: transactionStatus.transaction_id,
        midtrans_payment_type: transactionStatus.payment_type,
        midtrans_transaction_time: transactionStatus.transaction_time,
        midtrans_settlement_time: transactionStatus.settlement_time || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    // If payment failed, restore product stock
    if (newPaymentStatus === 'failed') {
      const { data: orderItems, error: itemsError } = await supabase
        .from('marketplace_order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id)

      if (!itemsError && orderItems) {
        for (const item of orderItems) {
          await supabase.rpc('increase_product_stock', {
            product_id: item.product_id,
            quantity: item.quantity
          })
        }
      }
    }

    // Log payment event
    await supabase
      .from('marketplace_payment_logs')
      .insert({
        order_id: order.id,
        payment_method: 'midtrans',
        transaction_id: transactionStatus.transaction_id,
        status: transactionStatus.transaction_status,
        amount: parseFloat(transactionStatus.gross_amount),
        raw_response: notification,
        created_at: new Date().toISOString()
      })

    // TODO: Send notification to user
    // This could include email, SMS, or push notification
    if (newPaymentStatus === 'paid') {
      console.log(`Payment successful for order ${transactionStatus.order_id}`)
      // Send success notification
    } else if (newPaymentStatus === 'failed') {
      console.log(`Payment failed for order ${transactionStatus.order_id}`)
      // Send failure notification
    }

    return NextResponse.json({ status: 'ok' })

  } catch (error) {
    console.error('Error in Midtrans webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}