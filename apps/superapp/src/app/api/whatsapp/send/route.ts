import { NextRequest, NextResponse } from 'next/server';
import { fonteService } from '@/lib/whatsapp/fonnte.service';
import type { WhatsAppMessage } from '@/lib/whatsapp/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.recipient || !body.type || !body.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: recipient, type, data',
        },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = [
      'welcome',
      'payment_success',
      'otp',
      'fit_challenge_reminder',
      'order_shipped',
      'bank_sampah_pickup',
      'referral_bonus',
      'savings_update',
    ];

    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create message object
    const message: WhatsAppMessage = {
      recipient: body.recipient,
      type: body.type,
      data: body.data,
      memberId: body.memberId,
    };

    // Send message
    await fonteService.send(message);

    return NextResponse.json({
      success: true,
      message: 'WhatsApp notification sent successfully',
    });
  } catch (error) {
    console.error('WhatsApp API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp notification',
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check notification status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const recipient = searchParams.get('recipient');

    if (!recipient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing recipient parameter',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Use this endpoint to check notification status',
      recipient,
    });
  } catch (error) {
    console.error('WhatsApp status check error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check notification status',
      },
      { status: 500 }
    );
  }
}