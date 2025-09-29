/**
 * Currency formatting utilities for Indonesian Rupiah (IDR)
 * Includes savings interest calculations and SHU (Sisa Hasil Usaha) calculations
 * for Indonesian cooperative (koperasi) business operations
 */

// Indonesian Rupiah currency configuration
export const IDR_CONFIG = {
  code: 'IDR',
  symbol: 'Rp',
  name: 'Indonesian Rupiah',
  locale: 'id-ID',
  decimals: 0, // Rupiah typically doesn't use decimal places
  thousandsSeparator: '.',
  decimalSeparator: ',',
  symbolPosition: 'before', // Rp 1.000.000
} as const

// Currency formatting options
export interface CurrencyFormatOptions {
  showSymbol?: boolean
  showDecimals?: boolean
  useGrouping?: boolean
  locale?: string
  compact?: boolean
  showCurrency?: boolean
}

// Default formatting options
const DEFAULT_OPTIONS: Required<CurrencyFormatOptions> = {
  showSymbol: true,
  showDecimals: false,
  useGrouping: true,
  locale: IDR_CONFIG.locale,
  compact: false,
  showCurrency: false,
}

/**
 * Format number as Indonesian Rupiah currency
 */
export function formatIDR(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  if (isNaN(amount) || !isFinite(amount)) {
    return opts.showSymbol ? 'Rp 0' : '0'
  }

  const formatter = new Intl.NumberFormat(opts.locale, {
    style: opts.showSymbol ? 'currency' : 'decimal',
    currency: IDR_CONFIG.code,
    minimumFractionDigits: opts.showDecimals ? 0 : 0,
    maximumFractionDigits: opts.showDecimals ? 2 : 0,
    useGrouping: opts.useGrouping,
    notation: opts.compact ? 'compact' : 'standard',
    compactDisplay: 'short',
  })

  let formatted = formatter.format(amount)

  // Add currency code if requested
  if (opts.showCurrency && !opts.showSymbol) {
    formatted += ` ${IDR_CONFIG.code}`
  }

  return formatted
}

/**
 * Format currency with compact notation (e.g., 1.5M, 2.3K)
 */
export function formatIDRCompact(amount: number): string {
  return formatIDR(amount, { compact: true })
}

/**
 * Format currency without symbol (numbers only)
 */
export function formatIDRNumber(amount: number): string {
  return formatIDR(amount, { showSymbol: false })
}

/**
 * Format currency with decimals
 */
export function formatIDRWithDecimals(amount: number): string {
  return formatIDR(amount, { showDecimals: true })
}

/**
 * Parse Indonesian formatted currency string to number
 */
export function parseIDR(currencyString: string): number {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0
  }

  // Remove currency symbol, spaces, and normalize separators
  const cleaned = currencyString
    .replace(/Rp\s?/gi, '') // Remove Rupiah symbol
    .replace(/IDR\s?/gi, '') // Remove currency code
    .replace(/\s/g, '') // Remove spaces
    .replace(/\./g, '') // Remove thousands separators (dots)
    .replace(/,/g, '.') // Convert decimal separator (comma to dot)
    .trim()

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Convert number to Indonesian words (for check writing, etc.)
 */
export function toIDRWords(amount: number): string {
  if (amount === 0) return 'nol rupiah'
  if (amount < 0) return 'minus ' + toIDRWords(-amount)

  const ones = [
    '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
    'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'
  ]

  const tens = [
    '', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh',
    'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'
  ]

  function convertHundreds(n: number): string {
    let result = ''

    if (n >= 100) {
      const hundreds = Math.floor(n / 100)
      result += (hundreds === 1 ? 'seratus' : ones[hundreds] + ' ratus')
      n %= 100
      if (n > 0) result += ' '
    }

    if (n >= 20) {
      const tensDigit = Math.floor(n / 10)
      result += tens[tensDigit]
      n %= 10
      if (n > 0) result += ' ' + ones[n]
    } else if (n > 0) {
      result += ones[n]
    }

    return result
  }

  let result = ''
  const trillions = Math.floor(amount / 1000000000000)
  const billions = Math.floor((amount % 1000000000000) / 1000000000)
  const millions = Math.floor((amount % 1000000000) / 1000000)
  const thousands = Math.floor((amount % 1000000) / 1000)
  const remainder = amount % 1000

  if (trillions > 0) {
    result += (trillions === 1 ? 'satu triliun' : convertHundreds(trillions) + ' triliun')
    if (billions > 0 || millions > 0 || thousands > 0 || remainder > 0) result += ' '
  }

  if (billions > 0) {
    result += (billions === 1 ? 'satu miliar' : convertHundreds(billions) + ' miliar')
    if (millions > 0 || thousands > 0 || remainder > 0) result += ' '
  }

  if (millions > 0) {
    result += (millions === 1 ? 'satu juta' : convertHundreds(millions) + ' juta')
    if (thousands > 0 || remainder > 0) result += ' '
  }

  if (thousands > 0) {
    result += (thousands === 1 ? 'seribu' : convertHundreds(thousands) + ' ribu')
    if (remainder > 0) result += ' '
  }

  if (remainder > 0) {
    result += convertHundreds(remainder)
  }

  return result.trim() + ' rupiah'
}

// ===================================
// SAVINGS INTEREST CALCULATIONS
// ===================================

export interface SavingsInterestConfig {
  principal: number
  annualRate: number // Percentage (e.g., 5 for 5%)
  compoundingFrequency: 'daily' | 'monthly' | 'quarterly' | 'yearly'
  termInMonths: number
}

export interface SavingsInterestResult {
  principal: number
  interestEarned: number
  finalAmount: number
  effectiveRate: number
  monthlyBreakdown: Array<{
    month: number
    startingBalance: number
    interestEarned: number
    endingBalance: number
    formattedStarting: string
    formattedInterest: string
    formattedEnding: string
  }>
  formattedResults: {
    principal: string
    interestEarned: string
    finalAmount: string
    effectiveRate: string
  }
}

/**
 * Calculate savings interest for Indonesian cooperative accounts
 */
export function calculateSavingsInterest(config: SavingsInterestConfig): SavingsInterestResult {
  const { principal, annualRate, compoundingFrequency, termInMonths } = config

  // Convert annual rate to decimal
  const rate = annualRate / 100

  // Determine compounding periods per year
  const periodsPerYear = {
    daily: 365,
    monthly: 12,
    quarterly: 4,
    yearly: 1
  }[compoundingFrequency]

  // Calculate compound interest
  const periodicRate = rate / periodsPerYear
  const totalPeriods = (termInMonths / 12) * periodsPerYear
  const finalAmount = principal * Math.pow(1 + periodicRate, totalPeriods)
  const interestEarned = finalAmount - principal

  // Calculate effective annual rate
  const effectiveRate = Math.pow(1 + periodicRate, periodsPerYear) - 1

  // Generate monthly breakdown
  const monthlyBreakdown = []
  let currentBalance = principal

  for (let month = 1; month <= termInMonths; month++) {
    const periodsInMonth = periodsPerYear / 12
    const monthlyRate = periodicRate * periodsInMonth
    const monthlyInterest = currentBalance * monthlyRate
    const newBalance = currentBalance + monthlyInterest

    monthlyBreakdown.push({
      month,
      startingBalance: currentBalance,
      interestEarned: monthlyInterest,
      endingBalance: newBalance,
      formattedStarting: formatIDR(currentBalance),
      formattedInterest: formatIDR(monthlyInterest),
      formattedEnding: formatIDR(newBalance)
    })

    currentBalance = newBalance
  }

  return {
    principal,
    interestEarned,
    finalAmount,
    effectiveRate,
    monthlyBreakdown,
    formattedResults: {
      principal: formatIDR(principal),
      interestEarned: formatIDR(interestEarned),
      finalAmount: formatIDR(finalAmount),
      effectiveRate: `${(effectiveRate * 100).toFixed(2)}%`
    }
  }
}

// ===================================
// SHU (SISA HASIL USAHA) CALCULATIONS
// ===================================

export interface SHUDistributionConfig {
  totalSHU: number // Total SHU available for distribution
  memberContributions: Array<{
    memberId: string
    memberName: string
    savingsBalance: number // Total savings balance
    transactionVolume: number // Annual transaction volume
    membershipDuration: number // Years as member
    membershipType: 'regular' | 'premium' | 'investor'
  }>
  distributionRules: {
    savingsPercentage: number // % based on savings balance
    transactionPercentage: number // % based on transaction volume
    equalPercentage: number // % distributed equally
    membershipBonusPercentage: number // % based on membership duration/type
  }
}

export interface SHUDistributionResult {
  totalDistributed: number
  distributionBreakdown: Array<{
    memberId: string
    memberName: string
    savingsComponent: number
    transactionComponent: number
    equalComponent: number
    membershipBonus: number
    totalSHU: number
    formattedResults: {
      savingsComponent: string
      transactionComponent: string
      equalComponent: string
      membershipBonus: string
      totalSHU: string
    }
  }>
  summaryByComponent: {
    totalSavingsComponent: number
    totalTransactionComponent: number
    totalEqualComponent: number
    totalMembershipBonus: number
    formattedSummary: {
      totalSavingsComponent: string
      totalTransactionComponent: string
      totalEqualComponent: string
      totalMembershipBonus: string
      totalDistributed: string
    }
  }
}

/**
 * Calculate SHU (Sisa Hasil Usaha) distribution for cooperative members
 */
export function calculateSHUDistribution(config: SHUDistributionConfig): SHUDistributionResult {
  const { totalSHU, memberContributions, distributionRules } = config

  // Validate distribution rules total to 100%
  const totalPercentage = Object.values(distributionRules).reduce((sum, pct) => sum + pct, 0)
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error('Distribution rules must total 100%')
  }

  // Calculate component amounts
  const savingsPool = totalSHU * (distributionRules.savingsPercentage / 100)
  const transactionPool = totalSHU * (distributionRules.transactionPercentage / 100)
  const equalPool = totalSHU * (distributionRules.equalPercentage / 100)
  const membershipPool = totalSHU * (distributionRules.membershipBonusPercentage / 100)

  // Calculate totals for proportional distribution
  const totalSavings = memberContributions.reduce((sum, member) => sum + member.savingsBalance, 0)
  const totalTransactions = memberContributions.reduce((sum, member) => sum + member.transactionVolume, 0)
  const totalMembers = memberContributions.length

  // Membership type multipliers
  const membershipMultipliers = {
    regular: 1.0,
    premium: 1.2,
    investor: 1.5
  }

  // Calculate total membership points for bonus distribution
  const totalMembershipPoints = memberContributions.reduce((sum, member) => {
    const durationBonus = Math.min(member.membershipDuration, 10) * 0.1 // Max 100% bonus for 10+ years
    const typeMultiplier = membershipMultipliers[member.membershipType]
    return sum + (1 + durationBonus) * typeMultiplier
  }, 0)

  // Calculate individual distributions
  const distributionBreakdown = memberContributions.map(member => {
    // Savings-based component
    const savingsComponent = totalSavings > 0
      ? (member.savingsBalance / totalSavings) * savingsPool
      : 0

    // Transaction-based component
    const transactionComponent = totalTransactions > 0
      ? (member.transactionVolume / totalTransactions) * transactionPool
      : 0

    // Equal distribution component
    const equalComponent = equalPool / totalMembers

    // Membership bonus component
    const durationBonus = Math.min(member.membershipDuration, 10) * 0.1
    const typeMultiplier = membershipMultipliers[member.membershipType]
    const membershipPoints = (1 + durationBonus) * typeMultiplier
    const membershipBonus = (membershipPoints / totalMembershipPoints) * membershipPool

    const totalMemberSHU = savingsComponent + transactionComponent + equalComponent + membershipBonus

    return {
      memberId: member.memberId,
      memberName: member.memberName,
      savingsComponent,
      transactionComponent,
      equalComponent,
      membershipBonus,
      totalSHU: totalMemberSHU,
      formattedResults: {
        savingsComponent: formatIDR(savingsComponent),
        transactionComponent: formatIDR(transactionComponent),
        equalComponent: formatIDR(equalComponent),
        membershipBonus: formatIDR(membershipBonus),
        totalSHU: formatIDR(totalMemberSHU)
      }
    }
  })

  // Calculate summary
  const totalDistributed = distributionBreakdown.reduce((sum, member) => sum + member.totalSHU, 0)

  const summaryByComponent = {
    totalSavingsComponent: distributionBreakdown.reduce((sum, member) => sum + member.savingsComponent, 0),
    totalTransactionComponent: distributionBreakdown.reduce((sum, member) => sum + member.transactionComponent, 0),
    totalEqualComponent: distributionBreakdown.reduce((sum, member) => sum + member.equalComponent, 0),
    totalMembershipBonus: distributionBreakdown.reduce((sum, member) => sum + member.membershipBonus, 0),
    formattedSummary: {
      totalSavingsComponent: formatIDR(savingsPool),
      totalTransactionComponent: formatIDR(transactionPool),
      totalEqualComponent: formatIDR(equalPool),
      totalMembershipBonus: formatIDR(membershipPool),
      totalDistributed: formatIDR(totalDistributed)
    }
  }

  return {
    totalDistributed,
    distributionBreakdown,
    summaryByComponent
  }
}

// ===================================
// ADDITIONAL FINANCIAL CALCULATIONS
// ===================================

/**
 * Calculate monthly mandatory savings payment
 */
export function calculateMandatorySavings(
  membershipType: 'regular' | 'premium' | 'investor',
  baseAmount: number = 25000
): { monthly: number; formatted: string } {
  const multipliers = {
    regular: 1.0,
    premium: 1.5,
    investor: 2.0
  }

  const monthly = baseAmount * multipliers[membershipType]

  return {
    monthly,
    formatted: formatIDR(monthly)
  }
}

/**
 * Calculate dividend yield for cooperative shares
 */
export function calculateDividendYield(
  shareValue: number,
  annualDividend: number
): { yieldPercentage: number; formattedYield: string; annualIncome: string } {
  const yieldPercentage = shareValue > 0 ? (annualDividend / shareValue) * 100 : 0

  return {
    yieldPercentage,
    formattedYield: `${yieldPercentage.toFixed(2)}%`,
    annualIncome: formatIDR(annualDividend)
  }
}

/**
 * Calculate loan payment for cooperative loans
 */
export function calculateLoanPayment(
  principal: number,
  annualInterestRate: number,
  termInMonths: number
): {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
  formattedResults: {
    monthlyPayment: string
    totalPayment: string
    totalInterest: string
    principal: string
  }
} {
  if (annualInterestRate === 0) {
    const monthlyPayment = principal / termInMonths
    return {
      monthlyPayment,
      totalPayment: principal,
      totalInterest: 0,
      formattedResults: {
        monthlyPayment: formatIDR(monthlyPayment),
        totalPayment: formatIDR(principal),
        totalInterest: formatIDR(0),
        principal: formatIDR(principal)
      }
    }
  }

  const monthlyRate = annualInterestRate / 100 / 12
  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termInMonths)) /
                        (Math.pow(1 + monthlyRate, termInMonths) - 1)
  const totalPayment = monthlyPayment * termInMonths
  const totalInterest = totalPayment - principal

  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    formattedResults: {
      monthlyPayment: formatIDR(monthlyPayment),
      totalPayment: formatIDR(totalPayment),
      totalInterest: formatIDR(totalInterest),
      principal: formatIDR(principal)
    }
  }
}

/**
 * Convert between different currency denominations
 */
export const DENOMINATION_VALUES = {
  sen: 1,
  rupiah: 100,
  ribu: 100000,
  juta: 100000000,
  miliar: 100000000000,
  triliun: 100000000000000
} as const

export function convertDenomination(
  amount: number,
  from: keyof typeof DENOMINATION_VALUES,
  to: keyof typeof DENOMINATION_VALUES
): number {
  const baseAmount = amount * DENOMINATION_VALUES[from]
  return baseAmount / DENOMINATION_VALUES[to]
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Check if amount is valid currency value
 */
export function isValidCurrencyAmount(amount: unknown): boolean {
  if (typeof amount !== 'number') return false
  return isFinite(amount) && !isNaN(amount) && amount >= 0
}

/**
 * Round currency amount to nearest valid denomination
 */
export function roundToNearestRupiah(amount: number): number {
  return Math.round(amount)
}

/**
 * Calculate percentage of amount
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return (amount * percentage) / 100
}

/**
 * Format currency range (min - max)
 */
export function formatCurrencyRange(min: number, max: number): string {
  return `${formatIDR(min)} - ${formatIDR(max)}`
}

/**
 * Calculate currency appreciation/depreciation
 */
export function calculateCurrencyChange(
  oldAmount: number,
  newAmount: number
): {
  change: number
  changePercentage: number
  isIncrease: boolean
  formattedChange: string
  formattedPercentage: string
} {
  const change = newAmount - oldAmount
  const changePercentage = oldAmount > 0 ? (change / oldAmount) * 100 : 0
  const isIncrease = change > 0

  return {
    change,
    changePercentage,
    isIncrease,
    formattedChange: `${isIncrease ? '+' : ''}${formatIDR(change)}`,
    formattedPercentage: `${isIncrease ? '+' : ''}${changePercentage.toFixed(2)}%`
  }
}

// Export all currency-related constants and utilities
export {
  IDR_CONFIG as CURRENCY_CONFIG,
  DEFAULT_OPTIONS as DEFAULT_CURRENCY_OPTIONS,
}

