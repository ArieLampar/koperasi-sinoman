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
        { error: 'Only active members can view leaderboard' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'monthly' // monthly, yearly, all
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // Calculate date range based on period
    let dateFilter = ''
    const now = new Date()

    switch (period) {
      case 'monthly':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        dateFilter = startOfMonth.toISOString()
        break
      case 'yearly':
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        dateFilter = startOfYear.toISOString()
        break
      case 'all':
      default:
        dateFilter = '1970-01-01T00:00:00.000Z' // Beginning of time
        break
    }

    // Get aggregated data for leaderboard
    // This query aggregates points and waste by member
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('waste_contributions')
      .select(`
        member_id,
        points_earned,
        weight_kg,
        cooperative_members!inner(
          id,
          full_name,
          member_number
        )
      `)
      .gte('pickup_date', dateFilter)
      .eq('status', 'completed')

    if (leaderboardError) {
      console.error('Error fetching leaderboard data:', leaderboardError)
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard data' },
        { status: 500 }
      )
    }

    // Process and aggregate the data
    const memberStats = new Map()

    leaderboardData?.forEach(contribution => {
      const memberId = contribution.member_id
      if (!memberStats.has(memberId)) {
        memberStats.set(memberId, {
          member_id: memberId,
          member_name: contribution.cooperative_members.full_name,
          member_number: contribution.cooperative_members.member_number,
          total_points: 0,
          total_waste_kg: 0,
          is_current_user: memberId === member.id
        })
      }

      const stats = memberStats.get(memberId)
      stats.total_points += contribution.points_earned
      stats.total_waste_kg += contribution.weight_kg
    })

    // Convert to array and sort by points (descending)
    const sortedLeaderboard = Array.from(memberStats.values())
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        member_name: entry.member_name,
        member_number: entry.member_number,
        points: entry.total_points,
        waste_kg: entry.total_waste_kg,
        is_current_user: entry.is_current_user
      }))

    // Get current user's rank if not in top results
    let currentUserRank = null
    const currentUserEntry = sortedLeaderboard.find(entry => entry.is_current_user)

    if (!currentUserEntry && memberStats.has(member.id)) {
      // User is not in top results, find their rank
      const allSorted = Array.from(memberStats.values())
        .sort((a, b) => b.total_points - a.total_points)

      const userIndex = allSorted.findIndex(entry => entry.member_id === member.id)
      if (userIndex !== -1) {
        currentUserRank = {
          rank: userIndex + 1,
          member_name: allSorted[userIndex].member_name,
          member_number: allSorted[userIndex].member_number,
          points: allSorted[userIndex].total_points,
          waste_kg: allSorted[userIndex].total_waste_kg,
          is_current_user: true
        }
      }
    }

    return NextResponse.json({
      data: sortedLeaderboard,
      current_user_rank: currentUserRank,
      period,
      total_participants: memberStats.size
    })

  } catch (error) {
    console.error('Error in Bank Sampah leaderboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}