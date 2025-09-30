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
        { error: 'Only active members can view pickup requests' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering and pagination
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query for pickup requests
    let query = supabase
      .from('waste_pickup_requests')
      .select('*')
      .eq('member_id', member.id)
      .order('requested_date', { ascending: false })

    // Apply status filter
    if (status && ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      query = query.eq('status', status)
    }

    // Apply pagination
    const { data: pickupRequests, error: requestsError } = await query
      .range(offset, offset + limit - 1)

    if (requestsError) {
      console.error('Error fetching pickup requests:', requestsError)
      return NextResponse.json(
        { error: 'Failed to fetch pickup requests' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('waste_pickup_requests')
      .select('id', { count: 'exact' })
      .eq('member_id', member.id)

    if (status && ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting pickup requests:', countError)
      return NextResponse.json(
        { error: 'Failed to count pickup requests' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: pickupRequests || [],
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
    console.error('Error in pickup requests API:', error)
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
    const {
      requested_date,
      preferred_time,
      address,
      estimated_weight,
      waste_types,
      notes
    } = body

    // Validate request
    if (!requested_date || !preferred_time || !address || !estimated_weight || !waste_types) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!Array.isArray(waste_types) || waste_types.length === 0) {
      return NextResponse.json(
        { error: 'At least one waste type must be specified' },
        { status: 400 }
      )
    }

    if (estimated_weight <= 0) {
      return NextResponse.json(
        { error: 'Estimated weight must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate requested date is not in the past
    const requestDate = new Date(requested_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (requestDate < today) {
      return NextResponse.json(
        { error: 'Pickup date cannot be in the past' },
        { status: 400 }
      )
    }

    // Get member data
    const { data: member, error: memberError } = await supabase
      .from('cooperative_members')
      .select('id, status, address as member_address')
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
        { error: 'Only active members can request waste pickup' },
        { status: 403 }
      )
    }

    // Calculate pickup fee (optional, can be 0 for free pickup)
    const pickupFee = estimated_weight > 10 ? 0 : 5000 // Free for >10kg, 5000 for smaller amounts

    // Create pickup request
    const { data: pickupRequest, error: requestError } = await supabase
      .from('waste_pickup_requests')
      .insert({
        member_id: member.id,
        requested_date,
        preferred_time,
        address: address || member.member_address,
        estimated_weight,
        waste_types,
        status: 'pending',
        notes,
        pickup_fee: pickupFee,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating pickup request:', requestError)
      return NextResponse.json(
        { error: 'Failed to create pickup request' },
        { status: 500 }
      )
    }

    // Create a notification or integration with external Bank Sampah system
    // This could trigger SMS/WhatsApp notification to pickup team
    try {
      // TODO: Integrate with external Bank Sampah management system
      // await notifyPickupTeam(pickupRequest)
    } catch (notificationError) {
      console.error('Warning: Failed to notify pickup team:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      data: pickupRequest,
      message: 'Pickup request created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in pickup request creation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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
    const { pickup_request_id, status, actual_weight, waste_contributions } = body

    // Validate request
    if (!pickup_request_id) {
      return NextResponse.json(
        { error: 'Pickup request ID is required' },
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

    // Get pickup request
    const { data: pickupRequest, error: requestError } = await supabase
      .from('waste_pickup_requests')
      .select('*')
      .eq('id', pickup_request_id)
      .eq('member_id', member.id)
      .single()

    if (requestError || !pickupRequest) {
      return NextResponse.json(
        { error: 'Pickup request not found' },
        { status: 404 }
      )
    }

    // Update pickup request
    const updateData: any = {}
    if (status) updateData.status = status
    if (actual_weight) updateData.actual_weight = actual_weight

    const { error: updateError } = await supabase
      .from('waste_pickup_requests')
      .update(updateData)
      .eq('id', pickup_request_id)

    if (updateError) {
      console.error('Error updating pickup request:', updateError)
      return NextResponse.json(
        { error: 'Failed to update pickup request' },
        { status: 500 }
      )
    }

    // If status is completed and we have waste contributions, create them
    if (status === 'completed' && waste_contributions && Array.isArray(waste_contributions)) {
      for (const contribution of waste_contributions) {
        if (contribution.waste_type && contribution.weight_kg > 0) {
          // Use the contributions API logic to create contributions
          const contributionResponse = await fetch('/api/bank-sampah/contributions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify({
              ...contribution,
              pickup_request_id
            })
          })

          if (!contributionResponse.ok) {
            console.error('Error creating waste contribution for completed pickup')
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Pickup request updated successfully'
    })

  } catch (error) {
    console.error('Error in pickup request update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}