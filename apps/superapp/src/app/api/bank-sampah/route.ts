import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// External Bank Sampah API configuration
const BANK_SAMPAH_API_BASE_URL = process.env.BANK_SAMPAH_API_URL || 'https://api.banksampahdemo.com'
const BANK_SAMPAH_API_KEY = process.env.BANK_SAMPAH_API_KEY
const BANK_SAMPAH_PARTNER_ID = process.env.BANK_SAMPAH_PARTNER_ID || 'koperasi-sinoman'

// Types for external API responses
interface ExternalBankSampahMember {
  member_id: string
  points_balance: number
  total_points_earned: number
  total_waste_kg: number
  rank: number
  environmental_impact: {
    co2_saved_kg: number
    trees_saved: number
    water_saved_liters: number
  }
  created_at: string
  last_activity: string
}

interface ExternalWasteContribution {
  id: string
  member_id: string
  waste_type: string
  weight_kg: number
  points_earned: number
  collection_date: string
  status: string
  location: string
  collector_id?: string
}

interface ExternalPickupRequest {
  id: string
  member_id: string
  requested_date: string
  scheduled_date?: string
  address: string
  waste_types: string[]
  estimated_weight: number
  actual_weight?: number
  status: 'pending' | 'scheduled' | 'collected' | 'completed' | 'cancelled'
  pickup_fee: number
  notes?: string
}

// Helper function to make authenticated requests to external API
async function makeExternalAPIRequest(endpoint: string, options: RequestInit = {}) {
  if (!BANK_SAMPAH_API_KEY) {
    throw new Error('Bank Sampah API key not configured')
  }

  const url = `${BANK_SAMPAH_API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BANK_SAMPAH_API_KEY}`,
    'X-Partner-ID': BANK_SAMPAH_PARTNER_ID,
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers,
    timeout: 10000 // 10 second timeout
  })

  if (!response.ok) {
    throw new Error(`External API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// GET: Fetch member data from external Bank Sampah system
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
      .select('id, member_number, status, external_bank_sampah_id')
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
        { error: 'Only active members can access Bank Sampah data' },
        { status: 403 }
      )
    }

    // Get query parameters
    const url = new URL(request.url)
    const dataType = url.searchParams.get('type') || 'summary'
    const page = url.searchParams.get('page') || '1'
    const limit = url.searchParams.get('limit') || '20'

    // Use external Bank Sampah ID or fallback to member number
    const externalMemberId = member.external_bank_sampah_id || member.member_number

    try {
      let externalData

      switch (dataType) {
        case 'summary':
          // Fetch member summary from external API
          externalData = await makeExternalAPIRequest(
            `/members/${externalMemberId}/summary`
          )
          break

        case 'contributions':
          // Fetch contribution history
          externalData = await makeExternalAPIRequest(
            `/members/${externalMemberId}/contributions?page=${page}&limit=${limit}`
          )
          break

        case 'pickups':
          // Fetch pickup requests
          externalData = await makeExternalAPIRequest(
            `/members/${externalMemberId}/pickups?page=${page}&limit=${limit}`
          )
          break

        case 'leaderboard':
          // Fetch leaderboard data
          externalData = await makeExternalAPIRequest(
            `/leaderboard?partner_id=${BANK_SAMPAH_PARTNER_ID}&page=${page}&limit=${limit}`
          )
          break

        default:
          return NextResponse.json(
            { error: 'Invalid data type requested' },
            { status: 400 }
          )
      }

      // Transform external data to match our internal format
      const transformedData = transformExternalData(dataType, externalData, member)

      // Cache the data in our local database for offline access
      await cacheExternalData(supabase, member.id, dataType, transformedData)

      return NextResponse.json({
        data: transformedData,
        source: 'external',
        cached_at: new Date().toISOString()
      })

    } catch (externalError) {
      console.error('External API error:', externalError)

      // Fallback to cached data if external API fails
      const cachedData = await getCachedData(supabase, member.id, dataType)

      if (cachedData) {
        return NextResponse.json({
          data: cachedData,
          source: 'cache',
          warning: 'External service unavailable, showing cached data'
        })
      }

      return NextResponse.json(
        { error: 'External service unavailable and no cached data found' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Error in Bank Sampah API integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create pickup request or contribution in external system
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
    const { action, ...data } = body

    // Get member data
    const { data: member, error: memberError } = await supabase
      .from('cooperative_members')
      .select('id, member_number, status, external_bank_sampah_id')
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
        { error: 'Only active members can interact with Bank Sampah' },
        { status: 403 }
      )
    }

    const externalMemberId = member.external_bank_sampah_id || member.member_number

    try {
      let result

      switch (action) {
        case 'create_pickup_request':
          result = await makeExternalAPIRequest(
            `/members/${externalMemberId}/pickup-requests`,
            {
              method: 'POST',
              body: JSON.stringify({
                ...data,
                partner_id: BANK_SAMPAH_PARTNER_ID
              })
            }
          )
          break

        case 'register_member':
          result = await makeExternalAPIRequest(
            `/members`,
            {
              method: 'POST',
              body: JSON.stringify({
                member_id: externalMemberId,
                name: member.full_name,
                phone: member.phone,
                address: member.address,
                partner_id: BANK_SAMPAH_PARTNER_ID,
                ...data
              })
            }
          )

          // Update member record with external ID
          if (result.id) {
            await supabase
              .from('cooperative_members')
              .update({ external_bank_sampah_id: result.id })
              .eq('id', member.id)
          }
          break

        case 'redeem_points':
          result = await makeExternalAPIRequest(
            `/members/${externalMemberId}/redeem`,
            {
              method: 'POST',
              body: JSON.stringify({
                points: data.points,
                redemption_type: data.redemption_type,
                description: data.description
              })
            }
          )
          break

        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          )
      }

      // Log the transaction in our local database
      await supabase
        .from('bank_sampah_transactions')
        .insert({
          member_id: member.id,
          external_transaction_id: result.id,
          action,
          data: JSON.stringify(data),
          result: JSON.stringify(result),
          created_at: new Date().toISOString()
        })

      return NextResponse.json({
        data: result,
        message: `${action} completed successfully`
      }, { status: 201 })

    } catch (externalError) {
      console.error('External API error:', externalError)

      // Store failed request for later retry
      await supabase
        .from('bank_sampah_failed_requests')
        .insert({
          member_id: member.id,
          action,
          data: JSON.stringify(data),
          error_message: externalError.message,
          retry_count: 0,
          created_at: new Date().toISOString()
        })

      return NextResponse.json(
        { error: 'External service error, request queued for retry' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Error in Bank Sampah API integration POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to transform external data format to internal format
function transformExternalData(dataType: string, externalData: any, member: any) {
  switch (dataType) {
    case 'summary':
      return {
        total_points: externalData.points_balance || 0,
        available_points: externalData.points_balance || 0,
        redeemed_points: (externalData.total_points_earned || 0) - (externalData.points_balance || 0),
        this_month_points: externalData.this_month_points || 0,
        total_waste_kg: externalData.total_waste_kg || 0,
        environmental_impact: externalData.environmental_impact || {
          co2_saved_kg: 0,
          trees_saved: 0,
          water_saved_liters: 0
        },
        rank: externalData.rank || 0
      }

    case 'contributions':
      return (externalData.contributions || []).map((contrib: ExternalWasteContribution) => ({
        id: contrib.id,
        waste_type: contrib.waste_type,
        weight_kg: contrib.weight_kg,
        points_earned: contrib.points_earned,
        pickup_date: contrib.collection_date,
        status: contrib.status,
        description: `Collected at ${contrib.location}`
      }))

    case 'pickups':
      return (externalData.pickup_requests || []).map((pickup: ExternalPickupRequest) => ({
        id: pickup.id,
        requested_date: pickup.requested_date,
        preferred_time: pickup.scheduled_date ? 'Scheduled' : 'TBD',
        address: pickup.address,
        estimated_weight: pickup.estimated_weight,
        waste_types: pickup.waste_types,
        status: pickup.status,
        notes: pickup.notes,
        pickup_fee: pickup.pickup_fee
      }))

    case 'leaderboard':
      return (externalData.leaderboard || []).map((entry: any, index: number) => ({
        rank: index + 1,
        member_name: entry.member_name || entry.name,
        points: entry.points || 0,
        waste_kg: entry.total_waste_kg || 0,
        is_current_user: entry.member_id === (member.external_bank_sampah_id || member.member_number)
      }))

    default:
      return externalData
  }
}

// Helper function to cache external data
async function cacheExternalData(supabase: any, memberId: string, dataType: string, data: any) {
  try {
    await supabase
      .from('bank_sampah_cache')
      .upsert({
        member_id: memberId,
        data_type: dataType,
        data: JSON.stringify(data),
        cached_at: new Date().toISOString()
      }, {
        onConflict: 'member_id,data_type'
      })
  } catch (error) {
    console.error('Error caching external data:', error)
  }
}

// Helper function to get cached data
async function getCachedData(supabase: any, memberId: string, dataType: string) {
  try {
    const { data, error } = await supabase
      .from('bank_sampah_cache')
      .select('data, cached_at')
      .eq('member_id', memberId)
      .eq('data_type', dataType)
      .single()

    if (error || !data) return null

    // Check if cache is not too old (24 hours)
    const cacheAge = Date.now() - new Date(data.cached_at).getTime()
    const maxCacheAge = 24 * 60 * 60 * 1000 // 24 hours

    if (cacheAge > maxCacheAge) return null

    return JSON.parse(data.data)
  } catch (error) {
    console.error('Error getting cached data:', error)
    return null
  }
}