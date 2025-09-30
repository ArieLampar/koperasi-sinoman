import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get member data
    const { data: member, error: memberError } = await supabase
      .from('cooperative_members')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    if (member.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active members can access referral history' },
        { status: 403 }
      )
    }

    // Get query parameters for pagination
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get referral history with pagination
    const { data: referralHistory, error: historyError } = await supabase
      .from('member_referrals')
      .select(`
        id,
        referral_type,
        bonus_amount,
        bonus_status,
        status,
        created_at,
        referred_member:cooperative_members!referred_id(
          id,
          full_name,
          email,
          member_number,
          status,
          created_at
        )
      `)
      .eq('referrer_id', member.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (historyError) {
      console.error('Error fetching referral history:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch referral history' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('member_referrals')
      .select('id', { count: 'exact' })
      .eq('referrer_id', member.id)

    if (countError) {
      console.error('Error counting referrals:', countError)
      return NextResponse.json(
        { error: 'Failed to count referrals' },
        { status: 500 }
      )
    }

    // Transform data for response
    const transformedHistory = referralHistory?.map(referral => ({
      id: referral.id,
      referred_member: {
        id: referral.referred_member?.id,
        full_name: referral.referred_member?.full_name,
        email: referral.referred_member?.email,
        member_number: referral.referred_member?.member_number,
        status: referral.referred_member?.status,
        joined_date: referral.referred_member?.created_at
      },
      referral_type: referral.referral_type,
      bonus_amount: referral.bonus_amount,
      bonus_status: referral.bonus_status,
      status: referral.status,
      created_at: referral.created_at
    })) || []

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: transformedHistory,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    })

  } catch (error) {
    console.error('Error in referral history API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}