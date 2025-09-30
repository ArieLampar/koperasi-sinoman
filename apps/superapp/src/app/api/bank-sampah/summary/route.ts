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
        { error: 'Only active members can access Bank Sampah data' },
        { status: 403 }
      )
    }

    // Get member's waste contributions
    const { data: contributions, error: contributionsError } = await supabase
      .from('waste_contributions')
      .select('*')
      .eq('member_id', member.id)

    if (contributionsError) {
      console.error('Error fetching contributions:', contributionsError)
      return NextResponse.json(
        { error: 'Failed to fetch contributions' },
        { status: 500 }
      )
    }

    // Get member's points transactions
    const { data: pointsTransactions, error: pointsError } = await supabase
      .from('member_transactions')
      .select('*')
      .eq('member_id', member.id)
      .eq('type', 'waste_points')

    if (pointsError) {
      console.error('Error fetching points transactions:', pointsError)
      return NextResponse.json(
        { error: 'Failed to fetch points data' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalPoints = pointsTransactions?.reduce((sum, tx) =>
      sum + (tx.status === 'completed' ? tx.amount : 0), 0
    ) || 0

    const redeemedPoints = pointsTransactions?.reduce((sum, tx) =>
      sum + (tx.status === 'completed' && tx.amount < 0 ? Math.abs(tx.amount) : 0), 0
    ) || 0

    const availablePoints = totalPoints - redeemedPoints

    // Calculate this month's points
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const thisMonthPoints = pointsTransactions?.filter(tx =>
      new Date(tx.created_at) >= thisMonth && tx.status === 'completed' && tx.amount > 0
    ).reduce((sum, tx) => sum + tx.amount, 0) || 0

    // Calculate total waste
    const totalWasteKg = contributions?.reduce((sum, contrib) =>
      sum + contrib.weight_kg, 0
    ) || 0

    // Calculate environmental impact (estimated formulas)
    const co2SavedKg = Math.round(totalWasteKg * 2.1) // 2.1 kg CO2 saved per kg waste recycled
    const treesSaved = Math.round(totalWasteKg * 0.017) // 1 tree saved per ~60kg recycled waste
    const waterSavedLiters = Math.round(totalWasteKg * 15) // 15L water saved per kg recycled

    const summary = {
      total_points: totalPoints,
      available_points: availablePoints,
      redeemed_points: redeemedPoints,
      this_month_points: thisMonthPoints,
      total_waste_kg: totalWasteKg,
      environmental_impact: {
        co2_saved_kg: co2SavedKg,
        trees_saved: treesSaved,
        water_saved_liters: waterSavedLiters
      }
    }

    return NextResponse.json({ data: summary })

  } catch (error) {
    console.error('Error in Bank Sampah summary API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}