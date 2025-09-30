import { SupabaseClient } from '@supabase/supabase-js'

// Common report types
export interface ReportOptions {
  format: 'json' | 'csv' | 'pdf'
  dateFrom: string
  dateTo: string
  timezone?: string
}

export interface ReportFilters {
  [key: string]: any
}

export interface ReportData {
  data: any[]
  metadata: {
    totalRecords: number
    generatedAt: string
    period: {
      from: string
      to: string
    }
    filters?: ReportFilters
  }
}

export interface ExportResult {
  format: string
  data: string | Buffer
  filename: string
  contentType: string
}

// Marketplace specific types
export interface MarketplaceReportFilters extends ReportFilters {
  sellerIds?: string[]
  categoryIds?: string[]
  productIds?: string[]
  status?: string[]
  paymentStatus?: string[]
}

export interface SalesAnalytics {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  totalCommission: number
  topProducts: ProductPerformance[]
  topSellers: SellerMetrics[]
  salesByPeriod: PeriodData[]
  ordersByStatus: StatusData[]
}

export interface ProductPerformance {
  productId: string
  productName: string
  sellerName: string
  categoryName: string
  totalSales: number
  totalOrders: number
  totalQuantity: number
  averageRating: number
  reviewCount: number
  revenue: number
  profit: number
}

export interface SellerMetrics {
  sellerId: string
  sellerName: string
  businessType: string
  totalSales: number
  totalOrders: number
  totalProducts: number
  averageRating: number
  commissionEarned: number
  commissionRate: number
  status: string
}

export interface CommissionCalculation {
  sellerId: string
  sellerName: string
  period: string
  grossSales: number
  commissionRate: number
  commissionAmount: number
  fees: number
  netCommission: number
  orderCount: number
  status: 'pending' | 'calculated' | 'paid'
}

export interface PeriodData {
  period: string
  value: number
  orders?: number
  customers?: number
}

export interface StatusData {
  status: string
  count: number
  percentage: number
}

// Referral specific types
export interface ReferralReportFilters extends ReportFilters {
  memberIds?: string[]
  status?: string[]
  rewardType?: string[]
}

export interface ReferralAnalytics {
  totalReferrals: number
  successfulReferrals: number
  conversionRate: number
  totalRewardsEarned: number
  totalRewardsPaid: number
  pendingRewards: number
  topReferrers: ReferrerMetrics[]
  referralsByPeriod: PeriodData[]
  conversionFunnel: ConversionData[]
}

export interface ReferrerMetrics {
  memberId: string
  memberName: string
  totalReferrals: number
  successfulReferrals: number
  conversionRate: number
  totalRewards: number
  paidRewards: number
  pendingRewards: number
  membershipLevel: string
}

export interface ConversionData {
  stage: string
  count: number
  conversionRate: number
}

// Investment specific types
export interface InvestmentReportFilters extends ReportFilters {
  opportunityIds?: string[]
  investorIds?: string[]
  status?: string[]
  riskLevel?: string[]
}

export interface InvestmentAnalytics {
  totalInvestments: number
  totalInvestors: number
  totalOpportunities: number
  averageROI: number
  totalReturns: number
  activeInvestments: number
  portfolioPerformance: PortfolioMetrics[]
  roiByPeriod: PeriodData[]
  investmentsByRisk: RiskData[]
}

export interface PortfolioMetrics {
  opportunityId: string
  opportunityTitle: string
  category: string
  targetAmount: number
  currentAmount: number
  fundingProgress: number
  investorCount: number
  projectedROI: number
  actualROI: number
  status: string
  riskLevel: string
}

export interface ROICalculation {
  opportunityId: string
  period: string
  revenue: number
  expenses: number
  profit: number
  projectedROI: number
  actualROI: number
  variance: number
}

export interface RiskData {
  riskLevel: string
  count: number
  totalAmount: number
  averageROI: number
}

// Bank Sampah specific types
export interface BankSampahReportFilters extends ReportFilters {
  unitIds?: string[]
  wasteTypes?: string[]
  memberIds?: string[]
}

export interface BankSampahAnalytics {
  totalWasteCollected: number
  totalUnits: number
  totalMembers: number
  environmentalImpact: EnvironmentalImpact
  wasteByType: WasteTypeData[]
  unitPerformance: UnitMetrics[]
  memberEngagement: MemberEngagementData[]
  sustainabilityMetrics: SustainabilityMetrics
}

export interface EnvironmentalImpact {
  co2SavedKg: number
  treesSaved: number
  waterSavedLiters: number
  plasticRecycledKg: number
  organicWasteKg: number
}

export interface UnitMetrics {
  unitId: string
  unitName: string
  location: string
  totalMembers: number
  wasteCollectedKg: number
  revenueGenerated: number
  environmentalScore: number
  status: string
}

export interface WasteTypeData {
  wasteType: string
  totalWeight: number
  totalRevenue: number
  memberCount: number
  recyclingRate: number
}

export interface MemberEngagementData {
  memberId: string
  memberName: string
  totalContributions: number
  wasteContributedKg: number
  pointsEarned: number
  environmentalImpact: number
  lastActivity: string
}

export interface SustainabilityMetrics {
  recyclingRate: number
  wasteReductionRate: number
  memberGrowthRate: number
  revenueGrowthRate: number
  carbonFootprintReduction: number
}

// Database client type
export type DatabaseClient = SupabaseClient<any, 'public', any>