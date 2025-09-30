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
        { error: 'Only active members can view investment portfolio' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering and pagination
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query for member investments
    let query = supabase
      .from('member_investments')
      .select(`
        id,
        amount,
        investment_date,
        status,
        expected_return,
        current_return,
        maturity_date,
        created_at,
        investment_opportunity:investment_opportunities(
          id,
          name,
          type,
          expected_return,
          duration_months,
          risk_level
        )
      `)
      .eq('member_id', member.id)
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status && ['active', 'completed', 'pending'].includes(status)) {
      query = query.eq('status', status)
    }

    // Apply pagination
    const { data: investments, error: investmentsError } = await query
      .range(offset, offset + limit - 1)

    if (investmentsError) {
      console.error('Error fetching member investments:', investmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch investment portfolio' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('member_investments')
      .select('id', { count: 'exact' })
      .eq('member_id', member.id)

    if (status && ['active', 'completed', 'pending'].includes(status)) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting investments:', countError)
      return NextResponse.json(
        { error: 'Failed to count investments' },
        { status: 500 }
      )
    }

    // Transform data for response
    const transformedInvestments = investments?.map(investment => {
      const isMatured = new Date(investment.maturity_date) <= new Date()
      const daysToMaturity = Math.ceil(
        (new Date(investment.maturity_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: investment.id,
        opportunity_id: investment.investment_opportunity?.id,
        opportunity_name: investment.investment_opportunity?.name,
        opportunity_type: investment.investment_opportunity?.type,
        amount: investment.amount,
        investment_date: investment.investment_date,
        status: investment.status,
        expected_return: investment.expected_return,
        current_return: investment.current_return,
        duration_months: investment.investment_opportunity?.duration_months,
        maturity_date: investment.maturity_date,
        is_matured: isMatured,
        days_to_maturity: daysToMaturity,
        risk_level: investment.investment_opportunity?.risk_level,
        return_percentage: investment.amount > 0 ?
          ((investment.current_return / investment.amount) * 100).toFixed(2) : 0
      }
    }) || []

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: transformedInvestments,
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
    console.error('Error in investment portfolio API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}