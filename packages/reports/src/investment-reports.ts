import { DatabaseClient, InvestmentReportFilters, InvestmentAnalytics, PortfolioMetrics, ROICalculation, RiskData, ReportData, ReportOptions, PeriodData } from './types'
import { DateUtils } from './utils/date-utils'
import { ExportUtils } from './utils/export-utils'
import _ from 'lodash'

export class InvestmentReports {
  constructor(private supabase: DatabaseClient) {}

  /**
   * Generate comprehensive investment analytics report
   */
  async generateInvestmentAnalytics(
    options: ReportOptions,
    filters: InvestmentReportFilters = {}
  ): Promise<InvestmentAnalytics> {
    const { dateFrom, dateTo } = options

    // Validate date range
    const dateValidation = DateUtils.validateDateRange(dateFrom, dateTo)
    if (!dateValidation.valid) {
      throw new Error(dateValidation.error)
    }

    // Get investment summary metrics
    const { data: summaryData, error: summaryError } = await this.supabase
      .rpc('get_investment_summary', {
        date_from: dateFrom,
        date_to: dateTo,
        opportunity_ids: filters.opportunityIds,
        investor_ids: filters.investorIds,
        status_filter: filters.status
      })

    if (summaryError) throw summaryError

    // Get portfolio performance
    const portfolioPerformance = await this.getPortfolioPerformance(dateFrom, dateTo, filters)

    // Get ROI trends by period
    const roiByPeriod = await this.getROIByPeriod(dateFrom, dateTo, filters, 'month')

    // Get investments by risk level
    const investmentsByRisk = await this.getInvestmentsByRisk(dateFrom, dateTo, filters)

    const summary = summaryData[0] || {
      total_investments: 0,
      total_investors: 0,
      total_opportunities: 0,
      total_returns: 0,
      active_investments: 0,
      average_roi: 0
    }

    return {
      totalInvestments: summary.total_investments || 0,
      totalInvestors: summary.total_investors || 0,
      totalOpportunities: summary.total_opportunities || 0,
      averageROI: summary.average_roi || 0,
      totalReturns: summary.total_returns || 0,
      activeInvestments: summary.active_investments || 0,
      portfolioPerformance,
      roiByPeriod,
      investmentsByRisk
    }
  }

  /**
   * Generate ROI performance report
   */
  async generateROIPerformanceReport(
    options: ReportOptions,
    filters: InvestmentReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const roiCalculations = await this.getROICalculations(dateFrom, dateTo, filters)

    return {
      data: roiCalculations,
      metadata: {
        totalRecords: roiCalculations.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Generate portfolio performance report
   */
  async generatePortfolioReport(
    options: ReportOptions,
    filters: InvestmentReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const portfolios = await this.getPortfolioPerformance(dateFrom, dateTo, filters)

    return {
      data: portfolios,
      metadata: {
        totalRecords: portfolios.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Generate investor performance report
   */
  async generateInvestorReport(
    options: ReportOptions,
    filters: InvestmentReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const investors = await this.getInvestorMetrics(dateFrom, dateTo, filters)

    return {
      data: investors,
      metadata: {
        totalRecords: investors.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Calculate investment projections
   */
  async calculateInvestmentProjections(
    opportunityId: string,
    scenarios: Array<{
      name: string
      revenueGrowthRate: number
      expenseGrowthRate: number
      marketConditions: 'optimistic' | 'realistic' | 'pessimistic'
    }>
  ): Promise<Array<{
    scenario: string
    projectedROI: number
    projectedReturns: number
    riskAdjustedReturn: number
    projectionDetails: Array<{
      period: string
      revenue: number
      expenses: number
      profit: number
      roi: number
    }>
  }>> {
    const projections = []

    for (const scenario of scenarios) {
      const { data, error } = await this.supabase
        .rpc('calculate_investment_projection', {
          opportunity_id: opportunityId,
          revenue_growth_rate: scenario.revenueGrowthRate,
          expense_growth_rate: scenario.expenseGrowthRate,
          market_conditions: scenario.marketConditions
        })

      if (error) throw error

      projections.push({
        scenario: scenario.name,
        projectedROI: data.projected_roi || 0,
        projectedReturns: data.projected_returns || 0,
        riskAdjustedReturn: data.risk_adjusted_return || 0,
        projectionDetails: data.projection_details || []
      })
    }

    return projections
  }

  /**
   * Calculate portfolio diversification analysis
   */
  async calculatePortfolioDiversification(
    investorId?: string,
    filters: InvestmentReportFilters = {}
  ): Promise<{
    diversificationScore: number
    concentrationRisk: number
    sectorAllocation: Array<{ sector: string; percentage: number; amount: number }>
    riskAllocation: Array<{ riskLevel: string; percentage: number; amount: number }>
    recommendations: string[]
  }> {
    const { data, error } = await this.supabase
      .rpc('calculate_portfolio_diversification', {
        investor_id: investorId,
        opportunity_ids: filters.opportunityIds
      })

    if (error) throw error

    return {
      diversificationScore: data.diversification_score || 0,
      concentrationRisk: data.concentration_risk || 0,
      sectorAllocation: data.sector_allocation || [],
      riskAllocation: data.risk_allocation || [],
      recommendations: data.recommendations || []
    }
  }

  /**
   * Export investment report
   */
  async exportReport(
    reportType: 'analytics' | 'roi' | 'portfolio' | 'investors',
    options: ReportOptions,
    filters: InvestmentReportFilters = {}
  ) {
    let reportData: ReportData

    switch (reportType) {
      case 'analytics':
        const analytics = await this.generateInvestmentAnalytics(options, filters)
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

      case 'roi':
        reportData = await this.generateROIPerformanceReport(options, filters)
        break

      case 'portfolio':
        reportData = await this.generatePortfolioReport(options, filters)
        break

      case 'investors':
        reportData = await this.generateInvestorReport(options, filters)
        break

      default:
        throw new Error(`Unsupported report type: ${reportType}`)
    }

    const filename = ExportUtils.generateFilename(`investment_${reportType}`, options.format)

    switch (options.format) {
      case 'csv':
        return ExportUtils.exportToCSV(reportData.data, filename)

      case 'pdf':
        return ExportUtils.exportToPDF(reportData, `Investment ${reportType} Report`, filename)

      case 'json':
      default:
        return ExportUtils.exportToJSON(reportData, filename)
    }
  }

  /**
   * Get portfolio performance metrics
   */
  private async getPortfolioPerformance(
    dateFrom: string,
    dateTo: string,
    filters: InvestmentReportFilters
  ): Promise<PortfolioMetrics[]> {
    const { data, error } = await this.supabase
      .rpc('get_portfolio_performance', {
        date_from: dateFrom,
        date_to: dateTo,
        opportunity_ids: filters.opportunityIds,
        status_filter: filters.status,
        risk_level: filters.riskLevel
      })

    if (error) throw error

    return data.map((portfolio: any) => ({
      opportunityId: portfolio.opportunity_id,
      opportunityTitle: portfolio.opportunity_title,
      category: portfolio.category,
      targetAmount: portfolio.target_amount || 0,
      currentAmount: portfolio.current_amount || 0,
      fundingProgress: portfolio.funding_progress || 0,
      investorCount: portfolio.investor_count || 0,
      projectedROI: portfolio.projected_roi || 0,
      actualROI: portfolio.actual_roi || 0,
      status: portfolio.status,
      riskLevel: portfolio.risk_level
    }))
  }

  /**
   * Get ROI calculations
   */
  private async getROICalculations(
    dateFrom: string,
    dateTo: string,
    filters: InvestmentReportFilters
  ): Promise<ROICalculation[]> {
    const { data, error } = await this.supabase
      .rpc('get_roi_calculations', {
        date_from: dateFrom,
        date_to: dateTo,
        opportunity_ids: filters.opportunityIds
      })

    if (error) throw error

    return data.map((roi: any) => ({
      opportunityId: roi.opportunity_id,
      period: roi.period,
      revenue: roi.revenue || 0,
      expenses: roi.expenses || 0,
      profit: roi.profit || 0,
      projectedROI: roi.projected_roi || 0,
      actualROI: roi.actual_roi || 0,
      variance: roi.variance || 0
    }))
  }

  /**
   * Get investor metrics
   */
  private async getInvestorMetrics(
    dateFrom: string,
    dateTo: string,
    filters: InvestmentReportFilters
  ) {
    const { data, error } = await this.supabase
      .rpc('get_investor_metrics', {
        date_from: dateFrom,
        date_to: dateTo,
        investor_ids: filters.investorIds,
        opportunity_ids: filters.opportunityIds
      })

    if (error) throw error

    return data.map((investor: any) => ({
      investorId: investor.investor_id,
      investorName: investor.investor_name,
      memberNumber: investor.member_number,
      totalInvestments: investor.total_investments || 0,
      totalAmount: investor.total_amount || 0,
      activeInvestments: investor.active_investments || 0,
      completedInvestments: investor.completed_investments || 0,
      totalReturns: investor.total_returns || 0,
      averageROI: investor.average_roi || 0,
      portfolioValue: investor.portfolio_value || 0,
      riskProfile: investor.risk_profile || 'medium',
      joinDate: investor.join_date,
      lastInvestment: investor.last_investment
    }))
  }

  /**
   * Get ROI trends by period
   */
  private async getROIByPeriod(
    dateFrom: string,
    dateTo: string,
    filters: InvestmentReportFilters,
    groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<PeriodData[]> {
    const { data, error } = await this.supabase
      .rpc('get_roi_by_period', {
        date_from: dateFrom,
        date_to: dateTo,
        group_by: groupBy,
        opportunity_ids: filters.opportunityIds,
        risk_level: filters.riskLevel
      })

    if (error) throw error

    return data.map((item: any) => ({
      period: item.period,
      value: item.average_roi || 0,
      orders: item.total_investments || 0,
      customers: item.active_opportunities || 0
    }))
  }

  /**
   * Get investments by risk level
   */
  private async getInvestmentsByRisk(
    dateFrom: string,
    dateTo: string,
    filters: InvestmentReportFilters
  ): Promise<RiskData[]> {
    const { data, error } = await this.supabase
      .rpc('get_investments_by_risk', {
        date_from: dateFrom,
        date_to: dateTo,
        opportunity_ids: filters.opportunityIds,
        investor_ids: filters.investorIds
      })

    if (error) throw error

    return data.map((risk: any) => ({
      riskLevel: risk.risk_level,
      count: risk.count || 0,
      totalAmount: risk.total_amount || 0,
      averageROI: risk.average_roi || 0
    }))
  }

  /**
   * Generate unit business performance report
   */
  async generateUnitBusinessReport(
    options: ReportOptions,
    filters: InvestmentReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const { data, error } = await this.supabase
      .rpc('get_unit_business_performance', {
        date_from: dateFrom,
        date_to: dateTo,
        opportunity_ids: filters.opportunityIds
      })

    if (error) throw error

    const unitBusinessData = data.map((unit: any) => ({
      unitId: unit.unit_id,
      unitName: unit.unit_name,
      businessType: unit.business_type,
      location: unit.location,
      investmentOpportunityId: unit.investment_opportunity_id,
      targetAmount: unit.target_amount || 0,
      currentAmount: unit.current_amount || 0,
      fundingProgress: unit.funding_progress || 0,
      investorCount: unit.investor_count || 0,
      monthlyRevenue: unit.monthly_revenue || 0,
      monthlyExpenses: unit.monthly_expenses || 0,
      monthlyProfit: unit.monthly_profit || 0,
      actualROI: unit.actual_roi || 0,
      projectedROI: unit.projected_roi || 0,
      roiVariance: unit.roi_variance || 0,
      operationalEfficiency: unit.operational_efficiency || 0,
      status: unit.status,
      riskLevel: unit.risk_level,
      lastUpdated: unit.last_updated
    }))

    return {
      data: unitBusinessData,
      metadata: {
        totalRecords: unitBusinessData.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Calculate investment risk analysis
   */
  async calculateRiskAnalysis(
    opportunityId: string
  ): Promise<{
    overallRiskScore: number
    riskFactors: Array<{
      factor: string
      score: number
      impact: 'low' | 'medium' | 'high'
      description: string
    }>
    recommendations: string[]
    stressTestResults: Array<{
      scenario: string
      impactOnROI: number
      probabilityOfLoss: number
    }>
  }> {
    const { data, error } = await this.supabase
      .rpc('calculate_investment_risk', {
        opportunity_id: opportunityId
      })

    if (error) throw error

    return {
      overallRiskScore: data.overall_risk_score || 0,
      riskFactors: data.risk_factors || [],
      recommendations: data.recommendations || [],
      stressTestResults: data.stress_test_results || []
    }
  }

  /**
   * Generate investment performance benchmarking
   */
  async generatePerformanceBenchmarking(
    opportunityIds: string[],
    benchmarkType: 'sector' | 'risk_level' | 'size' = 'sector'
  ): Promise<Array<{
    opportunityId: string
    opportunityName: string
    actualROI: number
    benchmarkROI: number
    relativePerformance: number
    percentileRank: number
    benchmarkGroup: string
  }>> {
    const { data, error } = await this.supabase
      .rpc('get_performance_benchmarking', {
        opportunity_ids: opportunityIds,
        benchmark_type: benchmarkType
      })

    if (error) throw error

    return data.map((benchmark: any) => ({
      opportunityId: benchmark.opportunity_id,
      opportunityName: benchmark.opportunity_name,
      actualROI: benchmark.actual_roi || 0,
      benchmarkROI: benchmark.benchmark_roi || 0,
      relativePerformance: benchmark.relative_performance || 0,
      percentileRank: benchmark.percentile_rank || 0,
      benchmarkGroup: benchmark.benchmark_group
    }))
  }
}