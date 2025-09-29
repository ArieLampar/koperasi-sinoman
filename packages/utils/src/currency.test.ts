/**
 * Test file for currency utilities
 */

import { describe, it, expect } from 'vitest'
import {
  formatIDR,
  formatIDRCompact,
  formatIDRNumber,
  parseIDR,
  toIDRWords,
  calculateSavingsInterest,
  calculateSHUDistribution,
  calculateMandatorySavings,
  calculateLoanPayment,
  isValidCurrencyAmount,
  calculateCurrencyChange
} from './currency'

describe('Currency Formatting', () => {
  describe('formatIDR', () => {
    it('should format Indonesian Rupiah correctly', () => {
      expect(formatIDR(1000000)).toBe('Rp1.000.000')
      expect(formatIDR(1500000)).toBe('Rp1.500.000')
      expect(formatIDR(0)).toBe('Rp0')
    })

    it('should handle options correctly', () => {
      expect(formatIDR(1000000, { showSymbol: false })).toBe('1.000.000')
      expect(formatIDR(1000000, { compact: true })).toBe('Rp1M')
      expect(formatIDR(1500.50, { showDecimals: true })).toBe('Rp1.501')
    })

    it('should handle invalid inputs', () => {
      expect(formatIDR(NaN)).toBe('Rp0')
      expect(formatIDR(Infinity)).toBe('Rp0')
    })
  })

  describe('formatIDRCompact', () => {
    it('should format in compact notation', () => {
      expect(formatIDRCompact(1500000)).toBe('Rp1,5M')
      expect(formatIDRCompact(2300)).toBe('Rp2,3K')
      expect(formatIDRCompact(1000000000)).toBe('Rp1M')
    })
  })

  describe('parseIDR', () => {
    it('should parse Indonesian currency strings', () => {
      expect(parseIDR('Rp 1.000.000')).toBe(1000000)
      expect(parseIDR('1.500.000')).toBe(1500000)
      expect(parseIDR('Rp1,500,000')).toBe(1500000)
      expect(parseIDR('IDR 2.000.000')).toBe(2000000)
    })

    it('should handle invalid inputs', () => {
      expect(parseIDR('')).toBe(0)
      expect(parseIDR('invalid')).toBe(0)
      expect(parseIDR(null as any)).toBe(0)
    })
  })

  describe('toIDRWords', () => {
    it('should convert numbers to Indonesian words', () => {
      expect(toIDRWords(0)).toBe('nol rupiah')
      expect(toIDRWords(1000)).toBe('seribu rupiah')
      expect(toIDRWords(1000000)).toBe('satu juta rupiah')
      expect(toIDRWords(1500000)).toBe('satu juta lima ratus ribu rupiah')
    })

    it('should handle negative numbers', () => {
      expect(toIDRWords(-1000)).toBe('minus seribu rupiah')
    })
  })
})

describe('Savings Interest Calculations', () => {
  describe('calculateSavingsInterest', () => {
    it('should calculate compound interest correctly', () => {
      const config = {
        principal: 1000000,
        annualRate: 6,
        compoundingFrequency: 'monthly' as const,
        termInMonths: 12
      }

      const result = calculateSavingsInterest(config)

      expect(result.principal).toBe(1000000)
      expect(result.interestEarned).toBeGreaterThan(60000)
      expect(result.finalAmount).toBeGreaterThan(1060000)
      expect(result.monthlyBreakdown).toHaveLength(12)
      expect(result.formattedResults.principal).toBe('Rp1.000.000')
    })

    it('should handle different compounding frequencies', () => {
      const dailyConfig = {
        principal: 1000000,
        annualRate: 6,
        compoundingFrequency: 'daily' as const,
        termInMonths: 12
      }

      const yearlyConfig = {
        principal: 1000000,
        annualRate: 6,
        compoundingFrequency: 'yearly' as const,
        termInMonths: 12
      }

      const dailyResult = calculateSavingsInterest(dailyConfig)
      const yearlyResult = calculateSavingsInterest(yearlyConfig)

      // Daily compounding should yield more interest
      expect(dailyResult.interestEarned).toBeGreaterThan(yearlyResult.interestEarned)
    })
  })
})

describe('SHU Distribution Calculations', () => {
  describe('calculateSHUDistribution', () => {
    it('should distribute SHU correctly among members', () => {
      const config = {
        totalSHU: 10000000,
        memberContributions: [
          {
            memberId: '1',
            memberName: 'Budi',
            savingsBalance: 5000000,
            transactionVolume: 2000000,
            membershipDuration: 5,
            membershipType: 'regular' as const
          },
          {
            memberId: '2',
            memberName: 'Siti',
            savingsBalance: 3000000,
            transactionVolume: 1500000,
            membershipDuration: 3,
            membershipType: 'premium' as const
          }
        ],
        distributionRules: {
          savingsPercentage: 40,
          transactionPercentage: 30,
          equalPercentage: 20,
          membershipBonusPercentage: 10
        }
      }

      const result = calculateSHUDistribution(config)

      expect(result.distributionBreakdown).toHaveLength(2)
      expect(result.totalDistributed).toBeCloseTo(10000000, -2)

      const budi = result.distributionBreakdown.find(m => m.memberName === 'Budi')
      const siti = result.distributionBreakdown.find(m => m.memberName === 'Siti')

      expect(budi).toBeDefined()
      expect(siti).toBeDefined()
      expect(budi!.totalSHU).toBeGreaterThan(siti!.totalSHU) // Budi has more savings and transactions
    })

    it('should throw error for invalid distribution rules', () => {
      const config = {
        totalSHU: 10000000,
        memberContributions: [],
        distributionRules: {
          savingsPercentage: 40,
          transactionPercentage: 30,
          equalPercentage: 20,
          membershipBonusPercentage: 20 // Total > 100%
        }
      }

      expect(() => calculateSHUDistribution(config)).toThrow('Distribution rules must total 100%')
    })
  })
})

describe('Additional Financial Calculations', () => {
  describe('calculateMandatorySavings', () => {
    it('should calculate correct amounts for different membership types', () => {
      const regular = calculateMandatorySavings('regular')
      const premium = calculateMandatorySavings('premium')
      const investor = calculateMandatorySavings('investor')

      expect(regular.monthly).toBe(25000)
      expect(premium.monthly).toBe(37500)
      expect(investor.monthly).toBe(50000)
    })

    it('should handle custom base amounts', () => {
      const result = calculateMandatorySavings('premium', 30000)
      expect(result.monthly).toBe(45000)
    })
  })

  describe('calculateLoanPayment', () => {
    it('should calculate loan payments correctly', () => {
      const result = calculateLoanPayment(10000000, 12, 36)

      expect(result.monthlyPayment).toBeGreaterThan(300000)
      expect(result.totalPayment).toBeGreaterThan(10000000)
      expect(result.totalInterest).toBeGreaterThan(0)
      expect(result.formattedResults.principal).toBe('Rp10.000.000')
    })

    it('should handle zero interest rate', () => {
      const result = calculateLoanPayment(12000000, 0, 12)

      expect(result.monthlyPayment).toBe(1000000)
      expect(result.totalInterest).toBe(0)
      expect(result.totalPayment).toBe(12000000)
    })
  })
})

describe('Utility Functions', () => {
  describe('isValidCurrencyAmount', () => {
    it('should validate currency amounts', () => {
      expect(isValidCurrencyAmount(1000)).toBe(true)
      expect(isValidCurrencyAmount(0)).toBe(true)
      expect(isValidCurrencyAmount(-1000)).toBe(false)
      expect(isValidCurrencyAmount(NaN)).toBe(false)
      expect(isValidCurrencyAmount(Infinity)).toBe(false)
      expect(isValidCurrencyAmount('1000')).toBe(false)
    })
  })

  describe('calculateCurrencyChange', () => {
    it('should calculate currency changes correctly', () => {
      const increase = calculateCurrencyChange(1000000, 1200000)
      expect(increase.change).toBe(200000)
      expect(increase.changePercentage).toBe(20)
      expect(increase.isIncrease).toBe(true)
      expect(increase.formattedChange).toBe('+Rp200.000')

      const decrease = calculateCurrencyChange(1000000, 800000)
      expect(decrease.change).toBe(-200000)
      expect(decrease.changePercentage).toBe(-20)
      expect(decrease.isIncrease).toBe(false)
      expect(decrease.formattedChange).toBe('-Rp200.000')
    })

    it('should handle zero base amount', () => {
      const result = calculateCurrencyChange(0, 1000000)
      expect(result.changePercentage).toBe(0)
      expect(result.change).toBe(1000000)
    })
  })
})