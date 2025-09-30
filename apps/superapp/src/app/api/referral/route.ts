import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createReferralSchema } from '@koperasi-sinoman/database/schemas/member-schemas'

// Types
interface CreateReferralRequest {
  referred_member_id: string
  referral_type?: 'signup' | 'purchase' | 'activity'
}

interface ReferralReward {
  signup_bonus: number
  activity_bonus: number
  milestone_bonus: number
  referrer_percentage: number
  referred_bonus: number
}

// Business rules for referral rewards
const REFERRAL_REWARDS: Record<string, ReferralReward> = {
  'bronze': {
    signup_bonus: 50000,
    activity_bonus: 25000,
    milestone_bonus: 100000,
    referrer_percentage: 0.05,
    referred_bonus: 25000
  },
  'silver': {
    signup_bonus: 75000,
    activity_bonus: 35000,
    milestone_bonus: 150000,
    referrer_percentage: 0.07,
    referred_bonus: 35000
  },
  'gold': {
    signup_bonus: 100000,
    activity_bonus: 50000,
    milestone_bonus: 200000,
    referrer_percentage: 0.10,
    referred_bonus: 50000
  },
  'platinum': {
    signup_bonus: 150000,
    activity_bonus: 75000,
    milestone_bonus: 300000,
    referrer_percentage: 0.15,
    referred_bonus: 75000
  }
}

// Calculate member rank based on referral count
function calculateMemberRank(referralCount: number): { rank: string; nextRank: string; progress: number } {
  const ranks = [
    { name: 'bronze', minReferrals: 0, maxReferrals: 4 },
    { name: 'silver', minReferrals: 5, maxReferrals: 14 },
    { name: 'gold', minReferrals: 15, maxReferrals: 49 },
    { name: 'platinum', minReferrals: 50, maxReferrals: Infinity }
  ]

  const currentRank = ranks.find(rank =>
    referralCount >= rank.minReferrals && referralCount <= rank.maxReferrals
  ) || ranks[0]

  const currentIndex = ranks.findIndex(rank => rank.name === currentRank.name)
  const nextRank = ranks[currentIndex + 1] || currentRank

  const progress = currentRank.maxReferrals === Infinity ? 100 :
    ((referralCount - currentRank.minReferrals) / (currentRank.maxReferrals - currentRank.minReferrals + 1)) * 100

  return {
    rank: currentRank.name,
    nextRank: nextRank.name,
    progress: Math.min(100, Math.max(0, progress))
  }
}

// Generate unique referral code
function generateReferralCode(memberNumber: string): string {
  const timestamp = Date.now().toString().slice(-4)
  const random = Math.random().toString(36).substr(2, 3).toUpperCase()
  return `${memberNumber}${timestamp}${random}`
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
      .select('id, member_number, status, referral_code')
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
        { error: 'Only active members can access referral program' },
        { status: 403 }
      )
    }

    // Generate referral code if not exists
    let referralCode = member.referral_code
    if (!referralCode) {
      referralCode = generateReferralCode(member.member_number)

      await supabase
        .from('cooperative_members')
        .update({ referral_code: referralCode })
        .eq('id', member.id)
    }

    // Get referral statistics
    const { data: referralStats, error: statsError } = await supabase
      .from('member_referrals')
      .select(`
        id,
        referred_member:cooperative_members!referred_id(
          id,
          full_name,
          email,
          status,
          created_at
        ),
        created_at,
        status,
        bonus_amount,
        bonus_status
      `)
      .eq('referrer_id', member.id)

    if (statsError) {
      console.error('Error fetching referral stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch referral statistics' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalReferrals = referralStats?.length || 0
    const activeReferrals = referralStats?.filter(ref =>
      ref.referred_member?.status === 'active'
    ).length || 0

    const totalEarnings = referralStats?.reduce((sum, ref) =>
      sum + (ref.bonus_status === 'paid' ? ref.bonus_amount : 0), 0
    ) || 0

    const pendingEarnings = referralStats?.reduce((sum, ref) =>
      sum + (ref.bonus_status === 'pending' ? ref.bonus_amount : 0), 0
    ) || 0

    // Calculate this month's statistics
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const thisMonthReferrals = referralStats?.filter(ref =>
      new Date(ref.created_at) >= thisMonth
    ).length || 0

    const thisMonthEarnings = referralStats?.filter(ref =>
      new Date(ref.created_at) >= thisMonth && ref.bonus_status === 'paid'
    ).reduce((sum, ref) => sum + ref.bonus_amount, 0) || 0

    // Calculate rank and progress
    const { rank, nextRank, progress } = calculateMemberRank(totalReferrals)

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://koperasi-sinoman.com'
    const referralLink = `${baseUrl}/auth/register?ref=${referralCode}`

    const responseData = {
      total_referrals: totalReferrals,
      active_referrals: activeReferrals,
      total_earnings: totalEarnings,
      pending_earnings: pendingEarnings,
      this_month_referrals: thisMonthReferrals,
      this_month_earnings: thisMonthEarnings,
      referral_code: referralCode,
      referral_link: referralLink,
      rank,
      next_rank: nextRank,
      progress_to_next_rank: progress
    }

    return NextResponse.json({ data: responseData })

  } catch (error) {
    console.error('Error in referral GET API:', error)
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

    const body: CreateReferralRequest = await request.json()

    // Validate request
    if (!body.referred_member_id) {
      return NextResponse.json(
        { error: 'Referred member ID is required' },
        { status: 400 }
      )
    }

    // Get referrer member data
    const { data: referrer, error: referrerError } = await supabase
      .from('cooperative_members')
      .select('id, member_number, status, referral_code')
      .eq('user_id', user.id)
      .single()

    if (referrerError || !referrer) {
      return NextResponse.json(
        { error: 'Referrer not found' },
        { status: 404 }
      )
    }

    if (referrer.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active members can refer others' },
        { status: 403 }
      )
    }

    // Get referred member data
    const { data: referred, error: referredError } = await supabase
      .from('cooperative_members')
      .select('id, status')
      .eq('id', body.referred_member_id)
      .single()

    if (referredError || !referred) {
      return NextResponse.json(
        { error: 'Referred member not found' },
        { status: 404 }
      )
    }

    // Check if referral already exists
    const { data: existingReferral, error: checkError } = await supabase
      .from('member_referrals')
      .select('id')
      .eq('referrer_id', referrer.id)
      .eq('referred_id', referred.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing referral:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing referral' },
        { status: 500 }
      )
    }

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Referral already exists' },
        { status: 409 }
      )
    }

    // Get referrer's current rank for reward calculation
    const { data: referralCount } = await supabase
      .from('member_referrals')
      .select('id', { count: 'exact' })
      .eq('referrer_id', referrer.id)

    const { rank } = calculateMemberRank(referralCount?.length || 0)
    const rewards = REFERRAL_REWARDS[rank] || REFERRAL_REWARDS.bronze

    // Calculate bonus amount based on referral type
    let bonusAmount = rewards.signup_bonus
    if (body.referral_type === 'purchase') {
      bonusAmount = rewards.activity_bonus
    } else if (body.referral_type === 'activity') {
      bonusAmount = rewards.milestone_bonus
    }

    // Create referral record
    const { data: referral, error: createError } = await supabase
      .from('member_referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: referred.id,
        referral_type: body.referral_type || 'signup',
        bonus_amount: bonusAmount,
        bonus_status: 'pending',
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating referral:', createError)
      return NextResponse.json(
        { error: 'Failed to create referral' },
        { status: 500 }
      )
    }

    // Create bonus transaction for referrer
    await supabase
      .from('member_transactions')
      .insert({
        member_id: referrer.id,
        type: 'referral_bonus',
        amount: bonusAmount,
        description: `Bonus referral dari ${referred.id}`,
        status: 'pending',
        reference_id: referral.id,
        created_at: new Date().toISOString()
      })

    // Create welcome bonus for referred member if signup
    if (body.referral_type === 'signup' || !body.referral_type) {
      await supabase
        .from('member_transactions')
        .insert({
          member_id: referred.id,
          type: 'welcome_bonus',
          amount: rewards.referred_bonus,
          description: 'Bonus selamat datang dari program referral',
          status: 'pending',
          reference_id: referral.id,
          created_at: new Date().toISOString()
        })
    }

    return NextResponse.json({
      data: referral,
      message: 'Referral created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in referral POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}