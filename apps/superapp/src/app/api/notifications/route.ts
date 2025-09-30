import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createFontteIntegration, FontteIntegration, FontteMessageRequest } from '@koperasi-sinoman/integrations/fonnte'

// =============================================================================
// CONFIGURATION
// =============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const fontte = createFontteIntegration({
  token: process.env.FONNTE_TOKEN!,
  retryAttempts: 3,
  retryDelay: 1000
})

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface NotificationRequest {
  type: 'order_confirmation' | 'referral_notification' | 'promotional' | 'reminder' | 'welcome' | 'custom'
  recipients: Array<{
    phoneNumber: string
    name: string
    customData?: Record<string, any>
  }>
  templateData?: Record<string, any>
  customMessage?: string
  scheduleAt?: string
  priority?: 'low' | 'medium' | 'high'
  batchSize?: number
  delayBetweenMessages?: number
}

interface NotificationResponse {
  success: boolean
  data?: {
    notificationId: string
    totalRecipients: number
    successCount: number
    failedCount: number
    queuedCount: number
    results: Array<{
      phoneNumber: string
      status: 'sent' | 'failed' | 'queued'
      messageId?: string
      error?: string
    }>
  }
  error?: string
}

interface NotificationTemplate {
  type: string
  template: string
  variables: string[]
  category: 'transactional' | 'promotional' | 'system'
}

// =============================================================================
// MESSAGE TEMPLATES
// =============================================================================

const MESSAGE_TEMPLATES: Record<string, NotificationTemplate> = {
  order_confirmation: {
    type: 'order_confirmation',
    category: 'transactional',
    template: `🛒 *Konfirmasi Pesanan*

Halo {{customerName}}!

Pesanan Anda telah diterima:
📦 Order ID: {{orderId}}
💰 Total: {{totalAmount}}
📅 Tanggal: {{orderDate}}

📋 *Detail Produk:*
{{productList}}

Status: {{status}}
{{trackingInfo}}

Terima kasih telah berbelanja di Koperasi Sinoman! 🙏`,
    variables: ['customerName', 'orderId', 'totalAmount', 'orderDate', 'productList', 'status', 'trackingInfo']
  },

  referral_notification: {
    type: 'referral_notification',
    category: 'promotional',
    template: `🎉 *Selamat! Anda Mendapat Komisi Referral*

Halo {{memberName}}!

{{referredName}} telah {{action}} melalui link referral Anda!

💰 Komisi yang didapat: {{commissionAmount}}
📈 Total komisi bulan ini: {{monthlyTotal}}
🏆 Level referral: {{referralLevel}}

Terus bagikan link referral Anda untuk mendapat komisi lebih banyak!

Link referral: {{referralLink}}`,
    variables: ['memberName', 'referredName', 'action', 'commissionAmount', 'monthlyTotal', 'referralLevel', 'referralLink']
  },

  promotional: {
    type: 'promotional',
    category: 'promotional',
    template: `🔥 *{{promoTitle}}*

{{description}}

💰 Hemat hingga {{discount}}%
⏰ Berlaku sampai: {{validUntil}}

{{productList}}

{{promoCode}}
{{actionLink}}

Jangan sampai terlewat! 🏃‍♂️💨`,
    variables: ['promoTitle', 'description', 'discount', 'validUntil', 'productList', 'promoCode', 'actionLink']
  },

  reminder: {
    type: 'reminder',
    category: 'system',
    template: `⏰ *Pengingat: {{title}}*

Halo {{memberName}}!

{{message}}

{{actionRequired}}
{{deadline}}
{{actionLink}}

Terima kasih! 🙏`,
    variables: ['title', 'memberName', 'message', 'actionRequired', 'deadline', 'actionLink']
  },

  welcome: {
    type: 'welcome',
    category: 'system',
    template: `🎊 *Selamat Datang di Koperasi Sinoman!*

Halo {{memberName}}!

Terima kasih telah bergabung dengan keluarga besar Koperasi Sinoman. Kami sangat senang memiliki Anda sebagai anggota!

🎁 *Manfaat Member:*
• Harga spesial untuk produk pilihan
• Akses ke program investasi
• Komisi referral hingga {{referralCommission}}%
• Update promo dan penawaran menarik

{{welcomeBonus}}

Mulai jelajahi aplikasi dan nikmati semua keuntungannya!

Salam hangat,
Tim Koperasi Sinoman 🏢❤️`,
    variables: ['memberName', 'referralCommission', 'welcomeBonus']
  }
}

// =============================================================================
// AUTHENTICATION & VALIDATION
// =============================================================================

const validateAuthentication = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED')
  }

  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Error('INVALID_TOKEN')
  }

  return user
}

const validateNotificationRequest = (request: NotificationRequest): void => {
  if (!request.type) {
    throw new Error('Notification type is required')
  }

  if (!request.recipients || !Array.isArray(request.recipients) || request.recipients.length === 0) {
    throw new Error('Recipients array is required and cannot be empty')
  }

  if (request.recipients.length > 1000) {
    throw new Error('Cannot send to more than 1000 recipients at once')
  }

  // Validate each recipient
  request.recipients.forEach((recipient, index) => {
    if (!recipient.phoneNumber?.trim()) {
      throw new Error(`Recipient ${index + 1}: Phone number is required`)
    }

    if (!recipient.name?.trim()) {
      throw new Error(`Recipient ${index + 1}: Name is required`)
    }

    // Validate phone number format
    if (!fontte.formatPhoneNumber(recipient.phoneNumber)) {
      throw new Error(`Recipient ${index + 1}: Invalid phone number format`)
    }
  })

  // Validate custom message for custom type
  if (request.type === 'custom' && !request.customMessage?.trim()) {
    throw new Error('Custom message is required for custom notification type')
  }

  // Validate template data for non-custom types
  if (request.type !== 'custom' && !MESSAGE_TEMPLATES[request.type]) {
    throw new Error(`Invalid notification type: ${request.type}`)
  }
}

const validatePermissions = async (userId: string, notificationType: string, recipientCount: number) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, notification_quota, used_notifications')
    .eq('id', userId)
    .single()

  if (!profile) {
    throw new Error('USER_NOT_FOUND')
  }

  // Check role permissions for promotional messages
  if (notificationType === 'promotional' && !['admin', 'moderator'].includes(profile.role)) {
    throw new Error('INSUFFICIENT_PERMISSIONS_PROMOTIONAL')
  }

  // Check notification quota
  const remainingQuota = profile.notification_quota - (profile.used_notifications || 0)
  if (remainingQuota < recipientCount) {
    throw new Error(`QUOTA_EXCEEDED: Only ${remainingQuota} notifications remaining`)
  }
}

// =============================================================================
// TEMPLATE PROCESSING
// =============================================================================

const processTemplate = (templateText: string, data: Record<string, any>): string => {
  let processed = templateText

  // Replace template variables
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    const replacement = value !== null && value !== undefined ? String(value) : ''
    processed = processed.replace(regex, replacement)
  })

  // Clean up empty lines and trim
  return processed
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 || line === '')
    .join('\n')
    .trim()
}

const buildMessage = (request: NotificationRequest, recipient: any): string => {
  if (request.type === 'custom') {
    return request.customMessage!
  }

  const template = MESSAGE_TEMPLATES[request.type]
  if (!template) {
    throw new Error(`Template not found for type: ${request.type}`)
  }

  // Merge template data with recipient custom data
  const templateData = {
    ...request.templateData,
    ...recipient.customData,
    recipientName: recipient.name,
    recipientPhone: recipient.phoneNumber
  }

  return processTemplate(template.template, templateData)
}

// =============================================================================
// LOGGING & TRACKING
// =============================================================================

const logNotification = async (
  userId: string,
  notificationId: string,
  request: NotificationRequest,
  results: any[]
) => {
  try {
    const successCount = results.filter(r => r.status === 'sent').length
    const failedCount = results.filter(r => r.status === 'failed').length
    const queuedCount = results.filter(r => r.status === 'queued').length

    await supabase
      .from('notification_logs')
      .insert({
        id: notificationId,
        user_id: userId,
        notification_type: request.type,
        total_recipients: request.recipients.length,
        success_count: successCount,
        failed_count: failedCount,
        queued_count: queuedCount,
        template_data: request.templateData,
        priority: request.priority || 'medium',
        scheduled_at: request.scheduleAt ? new Date(request.scheduleAt) : null,
        results: results
      })

    // Update user's notification quota
    await supabase
      .rpc('increment_user_notifications', {
        user_id: userId,
        count: successCount + queuedCount
      })

  } catch (error) {
    console.error('Failed to log notification:', error)
  }
}

// =============================================================================
// MAIN NOTIFICATION HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Validate authentication
    const user = await validateAuthentication(request)

    // 2. Parse request body
    const notificationRequest: NotificationRequest = await request.json()

    // 3. Validate request
    validateNotificationRequest(notificationRequest)

    // 4. Validate permissions and quota
    await validatePermissions(
      user.id,
      notificationRequest.type,
      notificationRequest.recipients.length
    )

    // 5. Generate notification ID
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 6. Process messages
    const results: Array<{
      phoneNumber: string
      status: 'sent' | 'failed' | 'queued'
      messageId?: string
      error?: string
    }> = []

    const batchSize = notificationRequest.batchSize || 10
    const delay = notificationRequest.delayBetweenMessages || 1000
    const isScheduled = notificationRequest.scheduleAt && new Date(notificationRequest.scheduleAt) > new Date()

    // Process recipients in batches
    for (let i = 0; i < notificationRequest.recipients.length; i += batchSize) {
      const batch = notificationRequest.recipients.slice(i, i + batchSize)

      for (const recipient of batch) {
        try {
          // Build message for this recipient
          const message = buildMessage(notificationRequest, recipient)
          const formattedPhone = fonnte.formatPhoneNumber(recipient.phoneNumber)

          const messageRequest: FontteMessageRequest = {
            target: formattedPhone,
            message: message,
            schedule: notificationRequest.scheduleAt
          }

          let result
          if (isScheduled || notificationRequest.priority === 'low') {
            // Queue the message for later processing
            const queueId = fonnte.queueMessage(messageRequest, 3)
            result = {
              status: true,
              id: queueId,
              message: 'Queued for processing'
            }
          } else {
            // Send immediately
            result = await fonnte.sendMessage(messageRequest)
          }

          if (result.success && result.data) {
            results.push({
              phoneNumber: recipient.phoneNumber,
              status: isScheduled || notificationRequest.priority === 'low' ? 'queued' : 'sent',
              messageId: result.data.id
            })
          } else {
            results.push({
              phoneNumber: recipient.phoneNumber,
              status: 'failed',
              error: result.error || 'Unknown error'
            })
          }
        } catch (error: any) {
          results.push({
            phoneNumber: recipient.phoneNumber,
            status: 'failed',
            error: error.message || 'Unknown error'
          })
        }

        // Add delay between messages if specified
        if (delay > 0 && i < notificationRequest.recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // 7. Log notification
    await logNotification(user.id, notificationId, notificationRequest, results)

    // 8. Prepare response
    const successCount = results.filter(r => r.status === 'sent').length
    const failedCount = results.filter(r => r.status === 'failed').length
    const queuedCount = results.filter(r => r.status === 'queued').length

    const response: NotificationResponse = {
      success: true,
      data: {
        notificationId,
        totalRecipients: notificationRequest.recipients.length,
        successCount,
        failedCount,
        queuedCount,
        results
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('Notification error:', error)

    let statusCode = 500
    let errorMessage = 'An unexpected error occurred'

    switch (error.message) {
      case 'UNAUTHORIZED':
      case 'INVALID_TOKEN':
        statusCode = 401
        errorMessage = 'Authentication required'
        break
      case 'USER_NOT_FOUND':
        statusCode = 404
        errorMessage = 'User not found'
        break
      case 'INSUFFICIENT_PERMISSIONS_PROMOTIONAL':
        statusCode = 403
        errorMessage = 'Insufficient permissions to send promotional messages'
        break
      default:
        if (error.message.startsWith('QUOTA_EXCEEDED')) {
          statusCode = 429
          errorMessage = error.message.replace('QUOTA_EXCEEDED: ', '')
        } else if (error.message.includes('required') || error.message.includes('Invalid')) {
          statusCode = 400
          errorMessage = error.message
        }
    }

    const response: NotificationResponse = {
      success: false,
      error: errorMessage
    }

    return NextResponse.json(response, { status: statusCode })
  }
}

// =============================================================================
// GET HANDLER - Retrieve notification history
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Validate authentication
    const user = await validateAuthentication(request)

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 3. Build query
    let query = supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', user.id)

    if (notificationId) {
      query = query.eq('id', notificationId)
    }

    if (type) {
      query = query.eq('notification_type', type)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // 4. Execute query
    const { data: notifications, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error('DATABASE_ERROR')
    }

    // 5. Return results
    return NextResponse.json({
      success: true,
      data: notifications || [],
      pagination: {
        limit,
        offset,
        total: notifications?.length || 0
      }
    })

  } catch (error: any) {
    console.error('Get notifications error:', error)

    let statusCode = 500
    let errorMessage = 'Failed to retrieve notifications'

    if (error.message === 'UNAUTHORIZED' || error.message === 'INVALID_TOKEN') {
      statusCode = 401
      errorMessage = 'Authentication required'
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}

// =============================================================================
// WEBHOOK HANDLER - Handle incoming WhatsApp messages
// =============================================================================

export async function PUT(request: NextRequest) {
  try {
    // 1. Parse webhook data
    const webhookData = await request.json()

    // 2. Validate webhook
    const result = fontte.handleWebhook(webhookData)

    if (!result.success || !result.data?.isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook data' },
        { status: 400 }
      )
    }

    // 3. Process incoming message
    const message = result.data.processedMessage

    // 4. Store incoming message
    const { error: storeError } = await supabase
      .from('incoming_messages')
      .insert({
        device: message.device,
        sender: message.sender,
        message: message.message,
        member: message.member,
        name: message.name,
        location: message.location,
        file_url: message.file,
        filename: message.filename,
        extension: message.extension,
        file_size: message.size,
        received_at: new Date(message.date)
      })

    if (storeError) {
      console.error('Failed to store incoming message:', storeError)
    }

    // 5. Process auto-responses if needed
    // This is where you could implement chatbot logic, auto-replies, etc.

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE HANDLER - Cancel scheduled notifications
// =============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // 1. Validate authentication
    const user = await validateAuthentication(request)

    // 2. Parse request body
    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID required' },
        { status: 400 }
      )
    }

    // 3. Get notification record
    const { data: notification, error: fetchError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      )
    }

    // 4. Cancel queued messages
    const cancelledCount = notification.results?.filter((result: any) => {
      if (result.status === 'queued' && result.messageId) {
        return fontte.removeFromQueue(result.messageId)
      }
      return false
    }).length || 0

    // 5. Update notification status
    await supabase
      .from('notification_logs')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_count: cancelledCount
      })
      .eq('id', notificationId)

    return NextResponse.json({
      success: true,
      data: {
        notificationId,
        cancelledCount
      }
    })

  } catch (error: any) {
    console.error('Cancel notification error:', error)

    let statusCode = 500
    let errorMessage = 'Failed to cancel notification'

    if (error.message === 'UNAUTHORIZED' || error.message === 'INVALID_TOKEN') {
      statusCode = 401
      errorMessage = 'Authentication required'
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}