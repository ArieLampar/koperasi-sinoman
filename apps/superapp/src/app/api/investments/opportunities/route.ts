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
        { error: 'Only active members can view investment opportunities' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const riskLevel = url.searchParams.get('risk_level')
    const status = url.searchParams.get('status') || 'available'

    // Build query for investment opportunities
    let query = supabase
      .from('investment_opportunities')
      .select(`
        id,
        name,
        type,
        minimum_investment,
        expected_return,
        duration_months,
        risk_level,
        status,
        total_target,
        current_funding,
        description,
        launch_date,
        created_at
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: opportunities, error: opportunitiesError } = await query

    if (opportunitiesError) {
      console.error('Error fetching investment opportunities:', opportunitiesError)
      return NextResponse.json(
        { error: 'Failed to fetch investment opportunities' },
        { status: 500 }
      )
    }

    // Transform data for response
    const transformedOpportunities = opportunities?.map(opportunity => ({
      id: opportunity.id,
      name: opportunity.name,
      type: opportunity.type,
      minimum_investment: opportunity.minimum_investment,
      expected_return: opportunity.expected_return,
      duration_months: opportunity.duration_months,
      risk_level: opportunity.risk_level,
      status: opportunity.status,
      total_target: opportunity.total_target,
      current_funding: opportunity.current_funding,
      description: opportunity.description,
      launch_date: opportunity.launch_date,
      funding_percentage: Math.round((opportunity.current_funding / opportunity.total_target) * 100)
    })) || []

    return NextResponse.json({ data: transformedOpportunities })

  } catch (error) {
    console.error('Error in investment opportunities API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { opportunity_id, amount } = body

    // Validate request
    if (!opportunity_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid investment data' },
        { status: 400 }
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
        { error: 'Only active members can make investments' },
        { status: 403 }
      )
    }

    // Get investment opportunity
    const { data: opportunity, error: opportunityError } = await supabase
      .from('investment_opportunities')
      .select('*')
      .eq('id', opportunity_id)
      .single()

    if (opportunityError || !opportunity) {
      return NextResponse.json(
        { error: 'Investment opportunity not found' },
        { status: 404 }
      )
    }

    // Validate investment conditions
    if (opportunity.status !== 'available') {
      return NextResponse.json(
        { error: 'Investment opportunity is not available' },
        { status: 400 }
      )
    }

    if (amount < opportunity.minimum_investment) {
      return NextResponse.json(
        { error: `Minimum investment is ${opportunity.minimum_investment}` },
        { status: 400 }
      )
    }

    if ((opportunity.current_funding + amount) > opportunity.total_target) {
      return NextResponse.json(
        { error: 'Investment amount exceeds available funding target' },
        { status: 400 }
      )
    }

    // Calculate maturity date
    const maturityDate = new Date()
    maturityDate.setMonth(maturityDate.getMonth() + opportunity.duration_months)

    // Create investment record
    const { data: investment, error: investmentError } = await supabase
      .from('member_investments')
      .insert({
        member_id: member.id,
        opportunity_id: opportunity.id,
        amount: amount,
        investment_date: new Date().toISOString(),
        status: 'active',
        expected_return: Math.round(amount * (opportunity.expected_return / 100)),
        current_return: 0,
        maturity_date: maturityDate.toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (investmentError) {
      console.error('Error creating investment:', investmentError)
      return NextResponse.json(
        { error: 'Failed to create investment' },
        { status: 500 }
      )
    }

    // Update opportunity funding
    await supabase
      .from('investment_opportunities')
      .update({
        current_funding: opportunity.current_funding + amount,
        status: (opportunity.current_funding + amount) >= opportunity.total_target ? 'full' : 'available'
      })
      .eq('id', opportunity.id)

    // Create transaction record
    await supabase
      .from('member_transactions')
      .insert({
        member_id: member.id,
        type: 'investment',
        amount: -amount, // Negative because it's money going out
        description: `Investasi ${opportunity.name}`,
        status: 'completed',
        reference_id: investment.id,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      data: investment,
      message: 'Investment created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in investment creation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}