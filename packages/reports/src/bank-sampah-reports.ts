import { DatabaseClient, BankSampahReportFilters, BankSampahAnalytics, EnvironmentalImpact, UnitMetrics, WasteTypeData, MemberEngagementData, SustainabilityMetrics, ReportData, ReportOptions, PeriodData } from './types'
import { DateUtils } from './utils/date-utils'
import { ExportUtils } from './utils/export-utils'
import _ from 'lodash'

export class BankSampahReports {
  constructor(private supabase: DatabaseClient) {}

  /**
   * Generate comprehensive Bank Sampah analytics report
   */
  async generateBankSampahAnalytics(
    options: ReportOptions,
    filters: BankSampahReportFilters = {}
  ): Promise<BankSampahAnalytics> {
    const { dateFrom, dateTo } = options

    // Validate date range
    const dateValidation = DateUtils.validateDateRange(dateFrom, dateTo)
    if (!dateValidation.valid) {
      throw new Error(dateValidation.error)
    }

    // Get Bank Sampah summary metrics
    const { data: summaryData, error: summaryError } = await this.supabase
      .rpc('get_bank_sampah_summary', {
        date_from: dateFrom,
        date_to: dateTo,
        unit_ids: filters.unitIds,
        waste_types: filters.wasteTypes,
        member_ids: filters.memberIds
      })

    if (summaryError) throw summaryError

    // Get environmental impact
    const environmentalImpact = await this.getEnvironmentalImpact(dateFrom, dateTo, filters)

    // Get waste by type
    const wasteByType = await this.getWasteByType(dateFrom, dateTo, filters)

    // Get unit performance
    const unitPerformance = await this.getUnitPerformance(dateFrom, dateTo, filters)

    // Get member engagement
    const memberEngagement = await this.getMemberEngagement(dateFrom, dateTo, filters)

    // Get sustainability metrics
    const sustainabilityMetrics = await this.getSustainabilityMetrics(dateFrom, dateTo, filters)

    const summary = summaryData[0] || {
      total_waste_collected: 0,
      total_units: 0,
      total_members: 0
    }

    return {
      totalWasteCollected: summary.total_waste_collected || 0,
      totalUnits: summary.total_units || 0,
      totalMembers: summary.total_members || 0,
      environmentalImpact,
      wasteByType,
      unitPerformance,
      memberEngagement,
      sustainabilityMetrics
    }
  }

  /**
   * Generate environmental impact report
   */
  async generateEnvironmentalImpactReport(
    options: ReportOptions,
    filters: BankSampahReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const { data, error } = await this.supabase
      .rpc('get_detailed_environmental_impact', {
        date_from: dateFrom,
        date_to: dateTo,
        unit_ids: filters.unitIds,
        waste_types: filters.wasteTypes
      })

    if (error) throw error

    const impactData = data.map((impact: any) => ({
      period: impact.period,
      wasteCollectedKg: impact.waste_collected_kg || 0,
      co2SavedKg: impact.co2_saved_kg || 0,
      treesSaved: impact.trees_saved || 0,
      waterSavedLiters: impact.water_saved_liters || 0,
      plasticRecycledKg: impact.plastic_recycled_kg || 0,
      organicWasteKg: impact.organic_waste_kg || 0,
      recyclingRate: impact.recycling_rate || 0,
      revenueGenerated: impact.revenue_generated || 0,
      participatingMembers: impact.participating_members || 0,
      activeUnits: impact.active_units || 0
    }))

    return {
      data: impactData,
      metadata: {
        totalRecords: impactData.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Generate unit performance report
   */
  async generateUnitPerformanceReport(
    options: ReportOptions,
    filters: BankSampahReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const unitPerformance = await this.getUnitPerformance(dateFrom, dateTo, filters)

    return {
      data: unitPerformance,
      metadata: {
        totalRecords: unitPerformance.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Generate member engagement report
   */
  async generateMemberEngagementReport(
    options: ReportOptions,
    filters: BankSampahReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const memberEngagement = await this.getMemberEngagement(dateFrom, dateTo, filters)

    return {
      data: memberEngagement,
      metadata: {
        totalRecords: memberEngagement.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Generate sustainability metrics report
   */
  async generateSustainabilityReport(
    options: ReportOptions,
    filters: BankSampahReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const { data, error } = await this.supabase
      .rpc('get_sustainability_trends', {
        date_from: dateFrom,
        date_to: dateTo,
        unit_ids: filters.unitIds
      })

    if (error) throw error

    const sustainabilityData = data.map((trend: any) => ({
      period: trend.period,
      recyclingRate: trend.recycling_rate || 0,
      wasteReductionRate: trend.waste_reduction_rate || 0,
      memberGrowthRate: trend.member_growth_rate || 0,
      revenueGrowthRate: trend.revenue_growth_rate || 0,
      carbonFootprintReduction: trend.carbon_footprint_reduction || 0,
      sustainabilityScore: trend.sustainability_score || 0,
      environmentalGoalProgress: trend.environmental_goal_progress || 0
    }))

    return {
      data: sustainabilityData,
      metadata: {
        totalRecords: sustainabilityData.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Calculate carbon footprint analysis
   */
  async calculateCarbonFootprint(
    options: ReportOptions,
    filters: BankSampahReportFilters = {}
  ): Promise<{
    totalCarbonSaved: number
    carbonSavingsByCategory: Array<{
      category: string
      carbonSaved: number
      percentage: number
    }>
    monthlyTrend: Array<{
      month: string
      carbonSaved: number
      wasteProcessed: number
    }>
    projectedAnnualSaving: number
    equivalentTrees: number
    equivalentCarsOffRoad: number
  }> {
    const { dateFrom, dateTo } = options

    const { data, error } = await this.supabase
      .rpc('calculate_carbon_footprint', {
        date_from: dateFrom,
        date_to: dateTo,
        unit_ids: filters.unitIds,
        waste_types: filters.wasteTypes
      })

    if (error) throw error

    return {
      totalCarbonSaved: data.total_carbon_saved || 0,
      carbonSavingsByCategory: data.carbon_savings_by_category || [],
      monthlyTrend: data.monthly_trend || [],
      projectedAnnualSaving: data.projected_annual_saving || 0,
      equivalentTrees: data.equivalent_trees || 0,
      equivalentCarsOffRoad: data.equivalent_cars_off_road || 0
    }
  }

  /**
   * Generate waste management efficiency report
   */
  async generateWasteManagementEfficiency(
    options: ReportOptions,
    filters: BankSampahReportFilters = {}
  ): Promise<{
    overallEfficiency: number
    collectionEfficiency: number
    processingEfficiency: number
    recyclingRate: number
    wasteReductionRate: number
    unitEfficiencyRanking: Array<{
      unitId: string
      unitName: string
      efficiencyScore: number
      wasteProcessed: number
      recyclingRate: number
      rank: number
    }>
    improvementRecommendations: string[]
  }> {
    const { dateFrom, dateTo } = options

    const { data, error } = await this.supabase
      .rpc('calculate_waste_management_efficiency', {
        date_from: dateFrom,
        date_to: dateTo,
        unit_ids: filters.unitIds
      })

    if (error) throw error

    return {
      overallEfficiency: data.overall_efficiency || 0,
      collectionEfficiency: data.collection_efficiency || 0,
      processingEfficiency: data.processing_efficiency || 0,
      recyclingRate: data.recycling_rate || 0,
      wasteReductionRate: data.waste_reduction_rate || 0,
      unitEfficiencyRanking: data.unit_efficiency_ranking || [],
      improvementRecommendations: data.improvement_recommendations || []
    }
  }

  /**
   * Export Bank Sampah report
   */
  async exportReport(
    reportType: 'analytics' | 'environmental' | 'units' | 'members' | 'sustainability',
    options: ReportOptions,
    filters: BankSampahReportFilters = {}
  ) {
    let reportData: ReportData

    switch (reportType) {
      case 'analytics':
        const analytics = await this.generateBankSampahAnalytics(options, filters)
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

      case 'environmental':
        reportData = await this.generateEnvironmentalImpactReport(options, filters)
        break

      case 'units':
        reportData = await this.generateUnitPerformanceReport(options, filters)
        break

      case 'members':
        reportData = await this.generateMemberEngagementReport(options, filters)
        break

      case 'sustainability':
        reportData = await this.generateSustainabilityReport(options, filters)
        break

      default:
        throw new Error(`Unsupported report type: ${reportType}`)
    }

    const filename = ExportUtils.generateFilename(`bank_sampah_${reportType}`, options.format)

    switch (options.format) {
      case 'csv':
        return ExportUtils.exportToCSV(reportData.data, filename)

      case 'pdf':
        return ExportUtils.exportToPDF(reportData, `Bank Sampah ${reportType} Report`, filename)

      case 'json':
      default:
        return ExportUtils.exportToJSON(reportData, filename)
    }
  }

  /**
   * Get environmental impact metrics
   */
  private async getEnvironmentalImpact(
    dateFrom: string,
    dateTo: string,
    filters: BankSampahReportFilters
  ): Promise<EnvironmentalImpact> {
    const { data, error } = await this.supabase
      .rpc('get_environmental_impact', {
        date_from: dateFrom,
        date_to: dateTo,
        unit_ids: filters.unitIds,
        waste_types: filters.wasteTypes
      })

    if (error) throw error

    const impact = data[0] || {}

    return {
      co2SavedKg: impact.co2_saved_kg || 0,
      treesSaved: impact.trees_saved || 0,
      waterSavedLiters: impact.water_saved_liters || 0,
      plasticRecycledKg: impact.plastic_recycled_kg || 0,
      organicWasteKg: impact.organic_waste_kg || 0
    }
  }

  /**
   * Get waste distribution by type
   */
  private async getWasteByType(
    dateFrom: string,
    dateTo: string,
    filters: BankSampahReportFilters
  ): Promise<WasteTypeData[]> {
    const { data, error } = await this.supabase
      .rpc('get_waste_by_type', {
        date_from: dateFrom,
        date_to: dateTo,
        unit_ids: filters.unitIds,
        waste_types: filters.wasteTypes
      })

    if (error) throw error

    return data.map((waste: any) => ({
      wasteType: waste.waste_type,
      totalWeight: waste.total_weight || 0,
      totalRevenue: waste.total_revenue || 0,
      memberCount: waste.member_count || 0,
      recyclingRate: waste.recycling_rate || 0
    }))
  }

  /**
   * Get unit performance metrics
   */
  private async getUnitPerformance(
    dateFrom: string,
    dateTo: string,
    filters: BankSampahReportFilters
  ): Promise<UnitMetrics[]> {
    const { data, error } = await this.supabase
      .rpc('get_unit_performance', {
        date_from: dateFrom,
        date_to: dateTo,
        unit_ids: filters.unitIds
      })

    if (error) throw error

    return data.map((unit: any) => ({
      unitId: unit.unit_id,
      unitName: unit.unit_name,
      location: unit.location,
      totalMembers: unit.total_members || 0,
      wasteCollectedKg: unit.waste_collected_kg || 0,
      revenueGenerated: unit.revenue_generated || 0,
      environmentalScore: unit.environmental_score || 0,
      status: unit.status
    }))
  }

  /**
   * Get member engagement metrics
   */
  private async getMemberEngagement(
    dateFrom: string,
    dateTo: string,
    filters: BankSampahReportFilters
  ): Promise<MemberEngagementData[]> {
    const { data, error } = await this.supabase
      .rpc('get_member_engagement', {
        date_from: dateFrom,
        date_to: dateTo,
        unit_ids: filters.unitIds,
        member_ids: filters.memberIds
      })

    if (error) throw error

    return data.map((member: any) => ({
      memberId: member.member_id,
      memberName: member.member_name,
      totalContributions: member.total_contributions || 0,
      wasteContributedKg: member.waste_contributed_kg || 0,
      pointsEarned: member.points_earned || 0,
      environmentalImpact: member.environmental_impact || 0,
      lastActivity: member.last_activity
    }))
  }

  /**
   * Get sustainability metrics
   */
  private async getSustainabilityMetrics(
    dateFrom: string,
    dateTo: string,
    filters: BankSampahReportFilters
  ): Promise<SustainabilityMetrics> {
    const { data, error } = await this.supabase
      .rpc('get_sustainability_metrics', {
        date_from: dateFrom,
        date_to: dateTo,
        unit_ids: filters.unitIds
      })

    if (error) throw error

    const metrics = data[0] || {}

    return {
      recyclingRate: metrics.recycling_rate || 0,
      wasteReductionRate: metrics.waste_reduction_rate || 0,
      memberGrowthRate: metrics.member_growth_rate || 0,
      revenueGrowthRate: metrics.revenue_growth_rate || 0,
      carbonFootprintReduction: metrics.carbon_footprint_reduction || 0
    }
  }

  /**
   * Generate franchise operation report
   */
  async generateFranchiseOperationReport(
    options: ReportOptions,
    filters: BankSampahReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const { data, error } = await this.supabase
      .rpc('get_franchise_operations', {
        date_from: dateFrom,
        date_to: dateTo,
        unit_ids: filters.unitIds
      })

    if (error) throw error

    const operationData = data.map((operation: any) => ({
      operationId: operation.operation_id,
      unitId: operation.unit_id,
      unitName: operation.unit_name,
      operationType: operation.operation_type,
      description: operation.description,
      scheduledDate: operation.scheduled_date,
      completedDate: operation.completed_date,
      status: operation.status,
      cost: operation.cost || 0,
      effectiveness: operation.effectiveness || 0,
      notes: operation.notes
    }))

    return {
      data: operationData,
      metadata: {
        totalRecords: operationData.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Calculate waste collection trends
   */
  async getWasteCollectionTrends(
    dateFrom: string,
    dateTo: string,
    filters: BankSampahReportFilters = {},
    groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<PeriodData[]> {
    const { data, error } = await this.supabase
      .rpc('get_waste_collection_trends', {
        date_from: dateFrom,
        date_to: dateTo,
        group_by: groupBy,
        unit_ids: filters.unitIds,
        waste_types: filters.wasteTypes
      })

    if (error) throw error

    return data.map((item: any) => ({
      period: item.period,
      value: item.total_waste_kg || 0,
      orders: item.total_collections || 0,
      customers: item.active_members || 0
    }))
  }

  /**
   * Generate waste forecasting
   */
  async generateWasteForecasting(
    unitIds?: string[],
    forecastPeriod: 'month' | 'quarter' | 'year' = 'quarter'
  ): Promise<{
    forecastData: Array<{
      period: string
      predictedWasteKg: number
      confidence: number
      factors: string[]
    }>
    trends: {
      wasteGrowthRate: number
      seasonalPatterns: Array<{
        month: number
        multiplier: number
      }>
    }
    recommendations: string[]
  }> {
    const { data, error } = await this.supabase
      .rpc('generate_waste_forecast', {
        unit_ids: unitIds,
        forecast_period: forecastPeriod
      })

    if (error) throw error

    return {
      forecastData: data.forecast_data || [],
      trends: data.trends || { wasteGrowthRate: 0, seasonalPatterns: [] },
      recommendations: data.recommendations || []
    }
  }

  /**
   * Calculate member retention analysis
   */
  async calculateMemberRetentionAnalysis(
    dateFrom: string,
    dateTo: string,
    filters: BankSampahReportFilters = {}
  ): Promise<{
    overallRetentionRate: number
    retentionByPeriod: Array<{
      period: string
      newMembers: number
      activeMembers: number
      churnedMembers: number
      retentionRate: number
    }>
    retentionFactors: Array<{
      factor: string
      correlation: number
      impact: 'positive' | 'negative'
    }>
    churnRiskSegments: Array<{
      segment: string
      memberCount: number
      churnRisk: number
      recommendedActions: string[]
    }>
  }> {
    const { data, error } = await this.supabase
      .rpc('calculate_member_retention', {
        date_from: dateFrom,
        date_to: dateTo,
        unit_ids: filters.unitIds
      })

    if (error) throw error

    return {
      overallRetentionRate: data.overall_retention_rate || 0,
      retentionByPeriod: data.retention_by_period || [],
      retentionFactors: data.retention_factors || [],
      churnRiskSegments: data.churn_risk_segments || []
    }
  }
}