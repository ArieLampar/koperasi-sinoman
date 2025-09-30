// Export all report classes
export { MarketplaceReports } from './marketplace-reports'
export { ReferralReports } from './referral-reports'
export { InvestmentReports } from './investment-reports'
export { BankSampahReports } from './bank-sampah-reports'

// Export utility classes
export { DateUtils } from './utils/date-utils'
export { ExportUtils } from './utils/export-utils'

// Export all types
export * from './types'

// Main Reports factory class
import { MarketplaceReports } from './marketplace-reports'
import { ReferralReports } from './referral-reports'
import { InvestmentReports } from './investment-reports'
import { BankSampahReports } from './bank-sampah-reports'
import { DatabaseClient } from './types'

export class ReportsFactory {
  private supabase: DatabaseClient

  constructor(supabaseClient: DatabaseClient) {
    this.supabase = supabaseClient
  }

  /**
   * Get marketplace reports instance
   */
  marketplace(): MarketplaceReports {
    return new MarketplaceReports(this.supabase)
  }

  /**
   * Get referral reports instance
   */
  referral(): ReferralReports {
    return new ReferralReports(this.supabase)
  }

  /**
   * Get investment reports instance
   */
  investment(): InvestmentReports {
    return new InvestmentReports(this.supabase)
  }

  /**
   * Get Bank Sampah reports instance
   */
  bankSampah(): BankSampahReports {
    return new BankSampahReports(this.supabase)
  }

  /**
   * Generate comprehensive business report across all domains
   */
  async generateBusinessOverview(
    dateFrom: string,
    dateTo: string,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ) {
    const options = { dateFrom, dateTo, format }

    // Generate reports from all domains
    const [marketplaceAnalytics, referralAnalytics, investmentAnalytics, bankSampahAnalytics] = await Promise.all([
      this.marketplace().generateSalesAnalytics(options),
      this.referral().generateReferralAnalytics(options),
      this.investment().generateInvestmentAnalytics(options),
      this.bankSampah().generateBankSampahAnalytics(options)
    ])

    const businessOverview = {
      generatedAt: new Date().toISOString(),
      period: { from: dateFrom, to: dateTo },
      summary: {
        marketplace: {
          totalSales: marketplaceAnalytics.totalSales,
          totalOrders: marketplaceAnalytics.totalOrders,
          averageOrderValue: marketplaceAnalytics.averageOrderValue,
          totalCommission: marketplaceAnalytics.totalCommission
        },
        referral: {
          totalReferrals: referralAnalytics.totalReferrals,
          successfulReferrals: referralAnalytics.successfulReferrals,
          conversionRate: referralAnalytics.conversionRate,
          totalRewards: referralAnalytics.totalRewardsEarned
        },
        investment: {
          totalInvestments: investmentAnalytics.totalInvestments,
          totalInvestors: investmentAnalytics.totalInvestors,
          averageROI: investmentAnalytics.averageROI,
          totalReturns: investmentAnalytics.totalReturns
        },
        bankSampah: {
          totalWasteCollected: bankSampahAnalytics.totalWasteCollected,
          totalUnits: bankSampahAnalytics.totalUnits,
          totalMembers: bankSampahAnalytics.totalMembers,
          environmentalImpact: bankSampahAnalytics.environmentalImpact
        }
      },
      detailed: {
        marketplace: marketplaceAnalytics,
        referral: referralAnalytics,
        investment: investmentAnalytics,
        bankSampah: bankSampahAnalytics
      }
    }

    return businessOverview
  }

  /**
   * Generate KPI dashboard data
   */
  async generateKPIDashboard(
    dateFrom: string,
    dateTo: string
  ): Promise<{
    revenue: {
      marketplace: number
      investment: number
      bankSampah: number
      total: number
    }
    growth: {
      memberGrowth: number
      revenueGrowth: number
      wasteGrowth: number
      investmentGrowth: number
    }
    engagement: {
      activeMembers: number
      referralRate: number
      investmentParticipation: number
      wasteParticipation: number
    }
    sustainability: {
      co2Saved: number
      wasteRecycled: number
      environmentalScore: number
    }
  }> {
    // This would aggregate KPIs from all business domains
    // Implementation would depend on specific business requirements

    const businessOverview = await this.generateBusinessOverview(dateFrom, dateTo)

    return {
      revenue: {
        marketplace: businessOverview.summary.marketplace.totalSales,
        investment: businessOverview.summary.investment.totalReturns,
        bankSampah: businessOverview.detailed.bankSampah.unitPerformance.reduce((sum, unit) => sum + unit.revenueGenerated, 0),
        total: businessOverview.summary.marketplace.totalSales + businessOverview.summary.investment.totalReturns
      },
      growth: {
        memberGrowth: 0, // Would calculate from period comparison
        revenueGrowth: 0, // Would calculate from period comparison
        wasteGrowth: 0, // Would calculate from period comparison
        investmentGrowth: 0 // Would calculate from period comparison
      },
      engagement: {
        activeMembers: businessOverview.summary.bankSampah.totalMembers,
        referralRate: businessOverview.summary.referral.conversionRate,
        investmentParticipation: businessOverview.summary.investment.totalInvestors,
        wasteParticipation: businessOverview.summary.bankSampah.totalMembers
      },
      sustainability: {
        co2Saved: businessOverview.summary.bankSampah.environmentalImpact.co2SavedKg,
        wasteRecycled: businessOverview.summary.bankSampah.totalWasteCollected,
        environmentalScore: 0 // Would calculate composite score
      }
    }
  }
}

// Default export
export default ReportsFactory