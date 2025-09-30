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
        { error: 'Only active members can access investment data' },
        { status: 403 }
      )
    }

    // Get member investments
    const { data: investments, error: investmentsError } = await supabase
      .from('member_investments')
      .select(`
        id,
        amount,
        investment_date,
        status,
        expected_return,
        current_return,
        maturity_date,
        investment_opportunity:investment_opportunities(
          id,
          name,
          type,
          expected_return
        )
      `)
      .eq('member_id', member.id)

    if (investmentsError) {
      console.error('Error fetching investments:', investmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch investments' },
        { status: 500 }
      )
    }

    // Calculate summary statistics
    const totalInvested = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
    const totalReturns = investments?.reduce((sum, inv) => sum + inv.current_return, 0) || 0
    const activeInvestments = investments?.filter(inv => inv.status === 'active').length || 0
    const completedInvestments = investments?.filter(inv => inv.status === 'completed').length || 0

    // Calculate pending returns (for matured investments)
    const pendingReturns = investments?.filter(inv =>
      inv.status === 'active' && new Date(inv.maturity_date) <= new Date()
    ).reduce((sum, inv) => sum + inv.expected_return, 0) || 0

    // Calculate portfolio performance
    const portfolioPerformance = totalInvested > 0 ?
      ((totalReturns / totalInvested) * 100) : 0

    const summary = {
      total_invested: totalInvested,
      total_returns: totalReturns,
      active_investments: activeInvestments,
      completed_investments: completedInvestments,
      pending_returns: pendingReturns,
      portfolio_performance: Number(portfolioPerformance.toFixed(2))
    }

    return NextResponse.json({ data: summary })

  } catch (error) {
    console.error('Error in investment summary API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}