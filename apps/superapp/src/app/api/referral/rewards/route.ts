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
        { error: 'Only active members can access reward history' },
        { status: 403 }
      )
    }

    // Get query parameters for pagination and filtering
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const status = url.searchParams.get('status') // pending, paid, cancelled
    const type = url.searchParams.get('type') // referral_bonus, welcome_bonus
    const offset = (page - 1) * limit

    // Build query for reward transactions
    let query = supabase
      .from('member_transactions')
      .select(`
        id,
        type,
        amount,
        description,
        status,
        reference_id,
        created_at,
        updated_at,
        referral:member_referrals!reference_id(
          id,
          referral_type,
          referred_member:cooperative_members!referred_id(
            id,
            full_name,
            member_number
          )
        )
      `)
      .eq('member_id', member.id)
      .in('type', ['referral_bonus', 'welcome_bonus'])
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && ['pending', 'paid', 'cancelled'].includes(status)) {
      query = query.eq('status', status)
    }

    if (type && ['referral_bonus', 'welcome_bonus'].includes(type)) {
      query = query.eq('type', type)
    }

    // Apply pagination
    const { data: rewardHistory, error: historyError } = await query
      .range(offset, offset + limit - 1)

    if (historyError) {
      console.error('Error fetching reward history:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch reward history' },
        { status: 500 }
      )
    }

    // Get total count for pagination with same filters
    let countQuery = supabase
      .from('member_transactions')
      .select('id', { count: 'exact' })
      .eq('member_id', member.id)
      .in('type', ['referral_bonus', 'welcome_bonus'])

    if (status && ['pending', 'paid', 'cancelled'].includes(status)) {
      countQuery = countQuery.eq('status', status)
    }

    if (type && ['referral_bonus', 'welcome_bonus'].includes(type)) {
      countQuery = countQuery.eq('type', type)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting rewards:', countError)
      return NextResponse.json(
        { error: 'Failed to count rewards' },
        { status: 500 }
      )
    }

    // Get summary statistics
    const { data: summaryData, error: summaryError } = await supabase
      .from('member_transactions')
      .select('amount, status, type')
      .eq('member_id', member.id)
      .in('type', ['referral_bonus', 'welcome_bonus'])

    if (summaryError) {
      console.error('Error fetching summary:', summaryError)
      return NextResponse.json(
        { error: 'Failed to fetch summary' },
        { status: 500 }
      )
    }

    // Calculate summary statistics
    const summary = {
      total_earned: summaryData?.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0) || 0,
      pending_rewards: summaryData?.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0) || 0,
      total_referral_bonus: summaryData?.filter(t => t.type === 'referral_bonus' && t.status === 'paid').reduce((sum, t) => sum + t.amount, 0) || 0,
      total_welcome_bonus: summaryData?.filter(t => t.type === 'welcome_bonus' && t.status === 'paid').reduce((sum, t) => sum + t.amount, 0) || 0,
      total_transactions: summaryData?.length || 0
    }

    // Transform data for response
    const transformedHistory = rewardHistory?.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      status: transaction.status,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
      referral_info: transaction.referral ? {
        id: transaction.referral.id,
        type: transaction.referral.referral_type,
        referred_member: transaction.referral.referred_member ? {
          id: transaction.referral.referred_member.id,
          full_name: transaction.referral.referred_member.full_name,
          member_number: transaction.referral.referred_member.member_number
        } : null
      } : null
    })) || []

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: transformedHistory,
      summary,
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
    console.error('Error in referral rewards API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}