import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Points calculation based on waste type
const WASTE_POINTS_RATE = {
  organic: 2, // 2 points per kg
  plastic: 5, // 5 points per kg
  paper: 3, // 3 points per kg
  metal: 8, // 8 points per kg
  glass: 4, // 4 points per kg
  electronic: 15 // 15 points per kg
}

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
        { error: 'Only active members can view waste contributions' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering and pagination
    const url = new URL(request.url)
    const wasteType = url.searchParams.get('waste_type')
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query for waste contributions
    let query = supabase
      .from('waste_contributions')
      .select('*')
      .eq('member_id', member.id)
      .order('pickup_date', { ascending: false })

    // Apply filters
    if (wasteType) {
      query = query.eq('waste_type', wasteType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    const { data: contributions, error: contributionsError } = await query
      .range(offset, offset + limit - 1)

    if (contributionsError) {
      console.error('Error fetching waste contributions:', contributionsError)
      return NextResponse.json(
        { error: 'Failed to fetch waste contributions' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('waste_contributions')
      .select('id', { count: 'exact' })
      .eq('member_id', member.id)

    if (wasteType) {
      countQuery = countQuery.eq('waste_type', wasteType)
    }

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting contributions:', countError)
      return NextResponse.json(
        { error: 'Failed to count contributions' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: contributions || [],
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
    console.error('Error in waste contributions API:', error)
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
    const { waste_type, weight_kg, pickup_request_id, description } = body

    // Validate request
    if (!waste_type || !weight_kg || weight_kg <= 0) {
      return NextResponse.json(
        { error: 'Invalid contribution data' },
        { status: 400 }
      )
    }

    if (!['organic', 'plastic', 'paper', 'metal', 'glass', 'electronic'].includes(waste_type)) {
      return NextResponse.json(
        { error: 'Invalid waste type' },
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
        { error: 'Only active members can make waste contributions' },
        { status: 403 }
      )
    }

    // Calculate points earned
    const pointsRate = WASTE_POINTS_RATE[waste_type as keyof typeof WASTE_POINTS_RATE] || 1
    const pointsEarned = Math.round(weight_kg * pointsRate)

    // Create waste contribution record
    const { data: contribution, error: contributionError } = await supabase
      .from('waste_contributions')
      .insert({
        member_id: member.id,
        waste_type,
        weight_kg,
        points_earned: pointsEarned,
        pickup_date: new Date().toISOString(),
        status: 'collected',
        description,
        pickup_request_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (contributionError) {
      console.error('Error creating waste contribution:', contributionError)
      return NextResponse.json(
        { error: 'Failed to create waste contribution' },
        { status: 500 }
      )
    }

    // Create points transaction
    await supabase
      .from('member_transactions')
      .insert({
        member_id: member.id,
        type: 'waste_points',
        amount: pointsEarned,
        description: `Poin dari kontribusi sampah ${waste_type} ${weight_kg} kg`,
        status: 'completed',
        reference_id: contribution.id,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      data: contribution,
      message: 'Waste contribution recorded successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in waste contribution creation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}