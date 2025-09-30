import { DatabaseClient, ReferralReportFilters, ReferralAnalytics, ReferrerMetrics, ConversionData, ReportData, ReportOptions, PeriodData } from './types'
import { DateUtils } from './utils/date-utils'
import { ExportUtils } from './utils/export-utils'
import _ from 'lodash'

export class ReferralReports {
  constructor(private supabase: DatabaseClient) {}

  /**
   * Generate comprehensive referral analytics report
   */
  async generateReferralAnalytics(
    options: ReportOptions,
    filters: ReferralReportFilters = {}
  ): Promise<ReferralAnalytics> {
    const { dateFrom, dateTo } = options

    // Validate date range
    const dateValidation = DateUtils.validateDateRange(dateFrom, dateTo)
    if (!dateValidation.valid) {
      throw new Error(dateValidation.error)
    }

    // Get referral summary metrics
    const { data: summaryData, error: summaryError } = await this.supabase
      .rpc('get_referral_summary', {
        date_from: dateFrom,
        date_to: dateTo,
        member_ids: filters.memberIds,
        status_filter: filters.status
      })

    if (summaryError) throw summaryError

    // Get top referrers
    const topReferrers = await this.getTopReferrers(dateFrom, dateTo, filters, 10)

    // Get referral trends by period
    const referralsByPeriod = await this.getReferralsByPeriod(dateFrom, dateTo, filters, 'day')

    // Get conversion funnel data
    const conversionFunnel = await this.getConversionFunnel(dateFrom, dateTo, filters)

    const summary = summaryData[0] || {
      total_referrals: 0,
      successful_referrals: 0,
      total_rewards_earned: 0,
      total_rewards_paid: 0,
      pending_rewards: 0
    }

    const conversionRate = summary.total_referrals > 0
      ? (summary.successful_referrals / summary.total_referrals) * 100
      : 0

    return {
      totalReferrals: summary.total_referrals || 0,
      successfulReferrals: summary.successful_referrals || 0,
      conversionRate,
      totalRewardsEarned: summary.total_rewards_earned || 0,
      totalRewardsPaid: summary.total_rewards_paid || 0,
      pendingRewards: summary.pending_rewards || 0,
      topReferrers,
      referralsByPeriod,
      conversionFunnel
    }
  }

  /**
   * Generate referrer performance report
   */
  async generateReferrerPerformanceReport(
    options: ReportOptions,
    filters: ReferralReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const referrers = await this.getReferrerMetrics(dateFrom, dateTo, filters)

    return {
      data: referrers,
      metadata: {
        totalRecords: referrers.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Generate reward calculations report
   */
  async generateRewardCalculationsReport(
    options: ReportOptions,
    filters: ReferralReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const rewards = await this.calculateRewards(dateFrom, dateTo, filters)

    return {
      data: rewards,
      metadata: {
        totalRecords: rewards.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Generate referral payout report
   */
  async generatePayoutReport(
    options: ReportOptions,
    filters: ReferralReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const payouts = await this.getPayouts(dateFrom, dateTo, filters)

    return {
      data: payouts,
      metadata: {
        totalRecords: payouts.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Calculate pending rewards for processing
   */
  async calculatePendingRewards(
    filters: ReferralReportFilters = {}
  ): Promise<Array<{
    memberId: string
    memberName: string
    totalPendingRewards: number
    pendingReferrals: number
    eligibleForPayout: boolean
    minimumThresholdMet: boolean
  }>> {
    const { data, error } = await this.supabase
      .rpc('calculate_pending_rewards', {
        member_ids: filters.memberIds
      })

    if (error) throw error

    return data.map((item: any) => ({
      memberId: item.member_id,
      memberName: item.member_name,
      totalPendingRewards: item.total_pending_rewards || 0,
      pendingReferrals: item.pending_referrals || 0,
      eligibleForPayout: item.eligible_for_payout || false,
      minimumThresholdMet: item.minimum_threshold_met || false
    }))
  }

  /**
   * Process reward payouts
   */
  async processRewardPayouts(
    memberIds: string[],
    processedBy: string
  ): Promise<{
    processedCount: number
    totalAmount: number
    failedPayouts: Array<{ memberId: string; error: string }>
  }> {
    const results = {
      processedCount: 0,
      totalAmount: 0,
      failedPayouts: [] as Array<{ memberId: string; error: string }>
    }

    for (const memberId of memberIds) {
      try {
        const { data, error } = await this.supabase
          .rpc('process_referral_payout', {
            member_id: memberId,
            processed_by: processedBy
          })

        if (error) throw error

        results.processedCount++
        results.totalAmount += data.amount || 0

      } catch (error) {
        results.failedPayouts.push({
          memberId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  /**
   * Export referral report
   */
  async exportReport(
    reportType: 'analytics' | 'referrers' | 'rewards' | 'payouts',
    options: ReportOptions,
    filters: ReferralReportFilters = {}
  ) {
    let reportData: ReportData

    switch (reportType) {
      case 'analytics':
        const analytics = await this.generateReferralAnalytics(options, filters)
        reportData = {
          data: [analytics],
          metadata: {
            totalRecords: 1,
            generatedAt: new Date().toISOString(),
            period: { from: options.dateFrom, to: options.dateTo },
            filters
          }
        }
        break

      case 'referrers':
        reportData = await this.generateReferrerPerformanceReport(options, filters)
        break

      case 'rewards':
        reportData = await this.generateRewardCalculationsReport(options, filters)
        break

      case 'payouts':
        reportData = await this.generatePayoutReport(options, filters)
        break

      default:
        throw new Error(`Unsupported report type: ${reportType}`)
    }

    const filename = ExportUtils.generateFilename(`referral_${reportType}`, options.format)

    switch (options.format) {
      case 'csv':
        return ExportUtils.exportToCSV(reportData.data, filename)

      case 'pdf':
        return ExportUtils.exportToPDF(reportData, `Referral ${reportType} Report`, filename)

      case 'json':
      default:
        return ExportUtils.exportToJSON(reportData, filename)
    }
  }

  /**
   * Get top performing referrers
   */
  private async getTopReferrers(
    dateFrom: string,
    dateTo: string,
    filters: ReferralReportFilters,
    limit: number = 10
  ): Promise<ReferrerMetrics[]> {
    const { data, error } = await this.supabase
      .rpc('get_top_referrers', {
        date_from: dateFrom,
        date_to: dateTo,
        member_ids: filters.memberIds,
        limit_count: limit
      })

    if (error) throw error

    return data.map((referrer: any) => ({
      memberId: referrer.member_id,
      memberName: referrer.member_name,
      totalReferrals: referrer.total_referrals || 0,
      successfulReferrals: referrer.successful_referrals || 0,
      conversionRate: referrer.conversion_rate || 0,
      totalRewards: referrer.total_rewards || 0,
      paidRewards: referrer.paid_rewards || 0,
      pendingRewards: referrer.pending_rewards || 0,
      membershipLevel: referrer.membership_level || 'basic'
    }))
  }

  /**
   * Get referrer metrics details
   */
  private async getReferrerMetrics(
    dateFrom: string,
    dateTo: string,
    filters: ReferralReportFilters
  ): Promise<ReferrerMetrics[]> {
    const { data, error } = await this.supabase
      .rpc('get_referrer_metrics', {
        date_from: dateFrom,
        date_to: dateTo,
        member_ids: filters.memberIds,
        status_filter: filters.status
      })

    if (error) throw error

    return data.map((referrer: any) => ({
      memberId: referrer.member_id,
      memberName: referrer.member_name,
      totalReferrals: referrer.total_referrals || 0,
      successfulReferrals: referrer.successful_referrals || 0,
      conversionRate: referrer.conversion_rate || 0,
      totalRewards: referrer.total_rewards || 0,
      paidRewards: referrer.paid_rewards || 0,
      pendingRewards: referrer.pending_rewards || 0,
      membershipLevel: referrer.membership_level || 'basic'
    }))
  }

  /**
   * Calculate reward details
   */
  private async calculateRewards(
    dateFrom: string,
    dateTo: string,
    filters: ReferralReportFilters
  ) {
    const { data, error } = await this.supabase
      .rpc('get_reward_calculations', {
        date_from: dateFrom,
        date_to: dateTo,
        member_ids: filters.memberIds,
        reward_type: filters.rewardType,
        status_filter: filters.status
      })

    if (error) throw error

    return data.map((reward: any) => ({
      referralId: reward.referral_id,
      referrerId: reward.referrer_id,
      referrerName: reward.referrer_name,
      referredId: reward.referred_id,
      referredName: reward.referred_name,
      rewardType: reward.reward_type,
      rewardAmount: reward.reward_amount || 0,
      bonusAmount: reward.bonus_amount || 0,
      totalReward: reward.total_reward || 0,
      status: reward.status,
      eligibilityMet: reward.eligibility_met || false,
      qualificationDate: reward.qualification_date,
      payoutDate: reward.payout_date,
      created_at: reward.created_at
    }))
  }

  /**
   * Get payout history
   */
  private async getPayouts(
    dateFrom: string,
    dateTo: string,
    filters: ReferralReportFilters
  ) {
    const { data, error } = await this.supabase
      .from('member_transactions')
      .select(`
        id,
        member_id,
        amount,
        type,
        status,
        description,
        created_at,
        processed_at,
        processed_by,
        cooperative_members!inner(full_name, member_number)
      `)
      .eq('type', 'referral_reward')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
      .in('member_id', filters.memberIds || [])

    if (error) throw error

    return data.map((payout: any) => ({
      payoutId: payout.id,
      memberId: payout.member_id,
      memberName: payout.cooperative_members.full_name,
      memberNumber: payout.cooperative_members.member_number,
      amount: payout.amount,
      status: payout.status,
      description: payout.description,
      createdAt: payout.created_at,
      processedAt: payout.processed_at,
      processedBy: payout.processed_by
    }))
  }

  /**
   * Get referrals by time period
   */
  private async getReferralsByPeriod(
    dateFrom: string,
    dateTo: string,
    filters: ReferralReportFilters,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<PeriodData[]> {
    const { data, error } = await this.supabase
      .rpc('get_referrals_by_period', {
        date_from: dateFrom,
        date_to: dateTo,
        group_by: groupBy,
        member_ids: filters.memberIds,
        status_filter: filters.status
      })

    if (error) throw error

    return data.map((item: any) => ({
      period: item.period,
      value: item.total_referrals || 0,
      orders: item.successful_referrals || 0,
      customers: item.new_members || 0
    }))
  }

  /**
   * Get conversion funnel data
   */
  private async getConversionFunnel(
    dateFrom: string,
    dateTo: string,
    filters: ReferralReportFilters
  ): Promise<ConversionData[]> {
    const { data, error } = await this.supabase
      .rpc('get_referral_conversion_funnel', {
        date_from: dateFrom,
        date_to: dateTo,
        member_ids: filters.memberIds
      })

    if (error) throw error

    // Calculate conversion rates
    const funnelData = data || []
    const totalReferrals = funnelData.find((stage: any) => stage.stage === 'referral_sent')?.count || 0

    return funnelData.map((stage: any, index: number) => ({
      stage: this.formatStageName(stage.stage),
      count: stage.count || 0,
      conversionRate: totalReferrals > 0 ? (stage.count / totalReferrals) * 100 : 0
    }))
  }

  /**
   * Format stage names for display
   */
  private formatStageName(stage: string): string {
    const stageNames: Record<string, string> = {
      'referral_sent': 'Referral Sent',
      'referral_clicked': 'Link Clicked',
      'registration_started': 'Registration Started',
      'registration_completed': 'Registration Completed',
      'membership_activated': 'Membership Activated',
      'first_transaction': 'First Transaction',
      'reward_qualified': 'Reward Qualified'
    }

    return stageNames[stage] || stage
  }

  /**
   * Get referral conversion analysis
   */
  async getConversionAnalysis(
    dateFrom: string,
    dateTo: string,
    filters: ReferralReportFilters = {}
  ): Promise<{
    overallConversionRate: number
    conversionBySource: Array<{ source: string; rate: number; count: number }>
    conversionByMemberLevel: Array<{ level: string; rate: number; count: number }>
    timeToConversion: {
      average: number
      median: number
      distribution: Array<{ range: string; count: number }>
    }
  }> {
    const { data, error } = await this.supabase
      .rpc('get_conversion_analysis', {
        date_from: dateFrom,
        date_to: dateTo,
        member_ids: filters.memberIds
      })

    if (error) throw error

    return {
      overallConversionRate: data.overall_conversion_rate || 0,
      conversionBySource: data.conversion_by_source || [],
      conversionByMemberLevel: data.conversion_by_member_level || [],
      timeToConversion: data.time_to_conversion || {
        average: 0,
        median: 0,
        distribution: []
      }
    }
  }
}