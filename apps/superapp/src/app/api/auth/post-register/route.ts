import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeMessage } from '@/lib/whatsapp/helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, email' },
        { status: 400 }
      );
    }

    // Get member data from database
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, full_name, phone, member_number, status')
      .eq('id', userId)
      .single();

    if (memberError || !member) {
      console.error('Member not found:', memberError);
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Send welcome WhatsApp message
    if (member.phone && member.member_number) {
      try {
        await sendWelcomeMessage(
          member.phone,
          member.full_name,
          member.member_number,
          member.id
        );
        console.log(`Welcome message sent to ${member.phone}`);
      } catch (error) {
        console.error('Failed to send welcome message:', error);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Post-registration processing completed',
      member: {
        id: member.id,
        name: member.full_name,
        memberNumber: member.member_number,
      },
    });
  } catch (error) {
    console.error('Post-registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}