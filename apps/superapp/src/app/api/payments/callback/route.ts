import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createMidtransIntegration } from '@koperasi-sinoman/integrations/midtrans'
import { createFontteIntegration } from '@koperasi-sinoman/integrations/fonnte'

// Types
interface MidtransNotification {
  transaction_time: string
  transaction_status: string
  transaction_id: string
  status_message: string
  status_code: string
  signature_key: string
  payment_type: string
  order_id: string
  merchant_id: string
  gross_amount: string
  fraud_status: string
  currency: string
  settlement_time?: string
  expiry_time?: string
}

interface OrderUpdateData {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'expired'
  midtrans_transaction_id?: string
  midtrans_payment_type?: string
  midtrans_transaction_time?: string
  midtrans_settlement_time?: string
  updated_at: string
}

// WhatsApp message templates
const createPaymentSuccessMessage = (orderData: any) => {
  const itemsList = orderData.items
    .map((item: any, index: number) => `${index + 1}. ${item.product_name} (${item.quantity}x)`)
    .join('\n')

  return `✅ *Pembayaran Berhasil - Koperasi Sinoman*

Halo ${orderData.shipping_address.name},

Terima kasih! Pembayaran Anda telah berhasil diproses.

📋 *Detail Pesanan:*
🆔 Nomor Pesanan: ${orderData.order_number}
💰 Total Pembayaran: Rp ${orderData.total_amount.toLocaleString('id-ID')}
📦 Status: Sedang Diproses

🛍️ *Item yang Dibeli:*
${itemsList}

📍 *Alamat Pengiriman:*
${orderData.shipping_address.name}
${orderData.shipping_address.phone}
${orderData.shipping_address.address}, ${orderData.shipping_address.district}
${orderData.shipping_address.city} ${orderData.shipping_address.postal_code}

Pesanan Anda akan segera diproses oleh penjual. Kami akan mengirimkan notifikasi ketika pesanan dikirim.

Terima kasih telah berbelanja di Koperasi Sinoman! 🛒

_Pesan otomatis dari sistem Koperasi Sinoman_`
}

const createPaymentFailedMessage = (orderData: any) => {
  return `❌ *Pembayaran Gagal - Koperasi Sinoman*

Halo ${orderData.shipping_address.name},

Maaf, pembayaran untuk pesanan Anda tidak dapat diproses.

📋 *Detail Pesanan:*
🆔 Nomor Pesanan: ${orderData.order_number}
💰 Total: Rp ${orderData.total_amount.toLocaleString('id-ID')}
❌ Status: Pembayaran Gagal

Silakan coba lagi dengan metode pembayaran yang berbeda atau hubungi customer service kami.

📞 Customer Service: 0800-123-4567
💬 WhatsApp: wa.me/6281234567890

Stok produk telah dikembalikan ke sistem.

_Pesan otomatis dari sistem Koperasi Sinoman_`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const notification: MidtransNotification = await request.json()

    console.log('Payment callback received:', {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      payment_type: notification.payment_type
    })

    // Initialize Midtrans integration
    const midtrans = createMidtransIntegration({
      clientKey: process.env.MIDTRANS_CLIENT_KEY!,
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
      isProduction: process.env.NODE_ENV === 'production'
    })

    // Verify signature and get transaction status
    const callbackResult = await midtrans.handleCallback(notification)

    if (!callbackResult.success) {
      console.error('Invalid callback signature:', callbackResult.error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const transactionStatus = callbackResult.data!.transactionStatus

    if (!transactionStatus) {
      console.error('No transaction status in callback')
      return NextResponse.json(
        { error: 'No transaction status' },
        { status: 400 }
      )
    }

    // Find order by order number
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        items:marketplace_order_items(
          *,
          product:marketplace_products(name, price)
        )
      `)
      .eq('order_number', transactionStatus.order_id)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', transactionStatus.order_id, orderError)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get user contact information
    const { data: userData } = await supabase
      .from('cooperative_members')
      .select('phone, full_name, user_id')
      .eq('user_id', order.user_id)
      .single()

    // Determine new order status based on payment status
    let updateData: OrderUpdateData = {
      status: order.status,
      payment_status: order.payment_status,
      midtrans_transaction_id: transactionStatus.transaction_id,
      midtrans_payment_type: transactionStatus.payment_type,
      midtrans_transaction_time: transactionStatus.transaction_time,
      midtrans_settlement_time: transactionStatus.settlement_time || null,
      updated_at: new Date().toISOString()
    }

    let shouldSendNotification = false
    let notificationMessage = ''
    let shouldRestoreStock = false

    // Handle different transaction statuses
    switch (transactionStatus.transaction_status) {
      case 'capture':
      case 'settlement':
        if (transactionStatus.fraud_status === 'accept') {
          updateData.status = 'processing'
          updateData.payment_status = 'paid'
          shouldSendNotification = true
          notificationMessage = createPaymentSuccessMessage(order)
        }
        break

      case 'pending':
        updateData.payment_status = 'pending'
        // Don't send notification for pending status
        break

      case 'deny':
      case 'cancel':
      case 'expire':
      case 'failure':
        updateData.status = 'cancelled'
        updateData.payment_status = 'failed'
        shouldSendNotification = true
        shouldRestoreStock = true
        notificationMessage = createPaymentFailedMessage(order)
        break

      default:
        console.log('Unhandled transaction status:', transactionStatus.transaction_status)
        break
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('marketplace_orders')
      .update(updateData)
      .eq('id', order.id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    // Restore stock if payment failed
    if (shouldRestoreStock && order.items) {
      console.log('Restoring stock for failed payment:', order.order_number)

      for (const item of order.items) {
        const { error: stockError } = await supabase.rpc('increase_product_stock', {
          product_id: item.product_id,
          quantity: item.quantity
        })

        if (stockError) {
          console.error('Error restoring stock for product:', item.product_id, stockError)
          // Log but don't fail the callback
        }
      }
    }

    // Log payment event
    const { error: logError } = await supabase
      .from('marketplace_payment_logs')
      .insert({
        order_id: order.id,
        payment_method: 'midtrans',
        transaction_id: transactionStatus.transaction_id,
        status: transactionStatus.transaction_status,
        amount: parseFloat(transactionStatus.gross_amount),
        payment_type: transactionStatus.payment_type,
        fraud_status: transactionStatus.fraud_status,
        raw_response: notification,
        processed_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging payment event:', logError)
      // Don't fail the callback for logging errors
    }

    // Send WhatsApp notification if configured
    if (shouldSendNotification && userData?.phone && process.env.FONNTE_TOKEN) {
      try {
        const fontte = createFontteIntegration({
          apiKey: process.env.FONNTE_TOKEN!,
          token: process.env.FONTTE_TOKEN!,
          retryAttempts: 3,
          retryDelay: 1000
        })

        // Format phone number for WhatsApp
        const formattedPhone = fontte.formatPhoneNumber(userData.phone)

        // Queue the message with retry mechanism
        const messageId = fontte.queueMessage({
          target: formattedPhone,
          message: notificationMessage
        })

        console.log('WhatsApp notification queued:', {
          messageId,
          phone: formattedPhone,
          orderNumber: order.order_number
        })

        // Log notification attempt
        await supabase
          .from('marketplace_notifications')
          .insert({
            order_id: order.id,
            user_id: order.user_id,
            type: 'whatsapp',
            recipient: formattedPhone,
            message: notificationMessage,
            status: 'queued',
            external_id: messageId,
            created_at: new Date().toISOString()
          })

      } catch (notificationError) {
        console.error('Error sending WhatsApp notification:', notificationError)

        // Log failed notification
        await supabase
          .from('marketplace_notifications')
          .insert({
            order_id: order.id,
            user_id: order.user_id,
            type: 'whatsapp',
            recipient: userData.phone,
            message: notificationMessage,
            status: 'failed',
            error: notificationError instanceof Error ? notificationError.message : String(notificationError),
            created_at: new Date().toISOString()
          })
      }
    }

    // Send email notification as backup
    if (shouldSendNotification) {
      try {
        // Get user email
        const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id)

        if (authUser.user?.email) {
          // Queue email notification (implement based on your email service)
          console.log('Email notification should be sent to:', authUser.user.email)

          // Example: Send via your email service
          // await sendOrderNotificationEmail({
          //   to: authUser.user.email,
          //   subject: updateData.payment_status === 'paid' ? 'Pembayaran Berhasil' : 'Pembayaran Gagal',
          //   orderData: order,
          //   status: updateData.payment_status
          // })
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError)
      }
    }

    // Update order analytics
    try {
      await supabase.rpc('update_marketplace_analytics', {
        order_id: order.id,
        event_type: updateData.payment_status === 'paid' ? 'payment_success' : 'payment_failed',
        amount: order.total_amount
      })
    } catch (analyticsError) {
      console.error('Error updating analytics:', analyticsError)
    }

    console.log('Payment callback processed successfully:', {
      orderNumber: order.order_number,
      newStatus: updateData.status,
      paymentStatus: updateData.payment_status,
      notificationSent: shouldSendNotification
    })

    return NextResponse.json({
      status: 'success',
      message: 'Payment callback processed successfully'
    })

  } catch (error) {
    console.error('Error processing payment callback:', error)

    // Return success to prevent Midtrans retries for system errors
    // Log the error for investigation
    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal server error - callback logged for investigation'
      },
      { status: 200 } // Return 200 to prevent retries
    )
  }
}