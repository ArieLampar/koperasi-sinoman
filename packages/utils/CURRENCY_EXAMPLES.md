# Currency Utilities - Indonesian Cooperative Examples

This document demonstrates how to use the currency utilities for Indonesian cooperative (koperasi) business operations, including savings interest calculations and SHU (Sisa Hasil Usaha) distribution.

## 🏦 Basic Currency Formatting

```typescript
import {
  formatIDR,
  formatIDRCompact,
  parseIDR,
  toIDRWords
} from '@koperasi-sinoman/utils/currency'

// Basic formatting
const amount = 1500000
console.log(formatIDR(amount)) // "Rp1.500.000"
console.log(formatIDRCompact(amount)) // "Rp1,5M"
console.log(toIDRWords(amount)) // "satu juta lima ratus ribu rupiah"

// Parse currency strings
const parsed = parseIDR("Rp 2.500.000") // 2500000
const fromString = parseIDR("2,500,000 IDR") // 2500000

// For check writing or formal documents
const words = toIDRWords(25000000) // "dua puluh lima juta rupiah"
```

## 💰 Savings Interest Calculations

### Simple Savings Account

```typescript
import { calculateSavingsInterest } from '@koperasi-sinoman/utils/currency'

// Regular savings account with 5% annual interest, compounded monthly
const savingsConfig = {
  principal: 5000000, // Rp 5,000,000 initial deposit
  annualRate: 5, // 5% per year
  compoundingFrequency: 'monthly' as const,
  termInMonths: 12 // 1 year
}

const result = calculateSavingsInterest(savingsConfig)

console.log('Savings Calculation Results:')
console.log('Principal:', result.formattedResults.principal) // "Rp5.000.000"
console.log('Interest Earned:', result.formattedResults.interestEarned) // "Rp255.681"
console.log('Final Amount:', result.formattedResults.finalAmount) // "Rp5.255.681"
console.log('Effective Rate:', result.formattedResults.effectiveRate) // "5.12%"

// Monthly breakdown
result.monthlyBreakdown.forEach((month, index) => {
  console.log(`Month ${month.month}:`)
  console.log(`  Starting: ${month.formattedStarting}`)
  console.log(`  Interest: ${month.formattedInterest}`)
  console.log(`  Ending: ${month.formattedEnding}`)
})
```

### Term Deposit (Simpanan Berjangka)

```typescript
// High-yield term deposit with quarterly compounding
const termDepositConfig = {
  principal: 25000000, // Rp 25,000,000
  annualRate: 8, // 8% per year
  compoundingFrequency: 'quarterly' as const,
  termInMonths: 24 // 2 years
}

const termResult = calculateSavingsInterest(termDepositConfig)

console.log('Term Deposit Results:')
console.log('Initial Investment:', termResult.formattedResults.principal)
console.log('Total Interest:', termResult.formattedResults.interestEarned)
console.log('Maturity Value:', termResult.formattedResults.finalAmount)
console.log('Effective Annual Rate:', termResult.formattedResults.effectiveRate)
```

## 📊 SHU (Sisa Hasil Usaha) Distribution

### Complete SHU Distribution Example

```typescript
import { calculateSHUDistribution } from '@koperasi-sinoman/utils/currency'

// Koperasi has Rp 50,000,000 SHU to distribute among members
const shuConfig = {
  totalSHU: 50000000,
  memberContributions: [
    {
      memberId: 'SIN-2024-001',
      memberName: 'Budi Santoso',
      savingsBalance: 15000000, // Total savings in cooperative
      transactionVolume: 8000000, // Annual transaction volume
      membershipDuration: 5, // 5 years as member
      membershipType: 'regular' as const
    },
    {
      memberId: 'SIN-2024-002',
      memberName: 'Siti Nurhaliza',
      savingsBalance: 22000000,
      transactionVolume: 12000000,
      membershipDuration: 8,
      membershipType: 'premium' as const
    },
    {
      memberId: 'SIN-2024-003',
      memberName: 'Ahmad Wijaya',
      savingsBalance: 35000000,
      transactionVolume: 15000000,
      membershipDuration: 3,
      membershipType: 'investor' as const
    },
    {
      memberId: 'SIN-2024-004',
      memberName: 'Dewi Kusuma',
      savingsBalance: 8000000,
      transactionVolume: 5000000,
      membershipDuration: 2,
      membershipType: 'regular' as const
    }
  ],
  distributionRules: {
    savingsPercentage: 40, // 40% based on savings balance
    transactionPercentage: 30, // 30% based on transaction volume
    equalPercentage: 20, // 20% distributed equally
    membershipBonusPercentage: 10 // 10% based on membership duration/type
  }
}

const shuResult = calculateSHUDistribution(shuConfig)

console.log('SHU Distribution Summary:')
console.log('Total Distributed:', shuResult.summaryByComponent.formattedSummary.totalDistributed)
console.log('Savings Component:', shuResult.summaryByComponent.formattedSummary.totalSavingsComponent)
console.log('Transaction Component:', shuResult.summaryByComponent.formattedSummary.totalTransactionComponent)
console.log('Equal Component:', shuResult.summaryByComponent.formattedSummary.totalEqualComponent)
console.log('Membership Bonus:', shuResult.summaryByComponent.formattedSummary.totalMembershipBonus)

console.log('\nIndividual Member SHU:')
shuResult.distributionBreakdown.forEach(member => {
  console.log(`\n${member.memberName} (${member.memberId}):`)
  console.log(`  Savings Component: ${member.formattedResults.savingsComponent}`)
  console.log(`  Transaction Component: ${member.formattedResults.transactionComponent}`)
  console.log(`  Equal Component: ${member.formattedResults.equalComponent}`)
  console.log(`  Membership Bonus: ${member.formattedResults.membershipBonus}`)
  console.log(`  Total SHU: ${member.formattedResults.totalSHU}`)
})
```

### SHU Distribution Report Generator

```typescript
function generateSHUReport(shuResult: SHUDistributionResult) {
  const report = {
    title: 'LAPORAN DISTRIBUSI SISA HASIL USAHA (SHU)',
    subtitle: 'KOPERASI SINOMAN',
    date: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    summary: shuResult.summaryByComponent.formattedSummary,
    members: shuResult.distributionBreakdown.map(member => ({
      nama: member.memberName,
      nomorAnggota: member.memberId,
      komponen: {
        simpanan: member.formattedResults.savingsComponent,
        transaksi: member.formattedResults.transactionComponent,
        merata: member.formattedResults.equalComponent,
        bonus: member.formattedResults.membershipBonus
      },
      totalSHU: member.formattedResults.totalSHU,
      totalSHUKata: toIDRWords(member.totalSHU)
    }))
  }

  return report
}

// Generate and print report
const report = generateSHUReport(shuResult)
console.log('\n' + '='.repeat(60))
console.log(report.title)
console.log(report.subtitle)
console.log('Tanggal:', report.date)
console.log('='.repeat(60))

report.members.forEach((member, index) => {
  console.log(`\n${index + 1}. ${member.nama} (${member.nomorAnggota})`)
  console.log(`   Komponen Simpanan: ${member.komponen.simpanan}`)
  console.log(`   Komponen Transaksi: ${member.komponen.transaksi}`)
  console.log(`   Komponen Merata: ${member.komponen.merata}`)
  console.log(`   Bonus Keanggotaan: ${member.komponen.bonus}`)
  console.log(`   TOTAL SHU: ${member.totalSHU}`)
  console.log(`   Terbilang: ${member.totalSHUKata}`)
})
```

## 💳 Loan Calculations

### Loan Payment Calculator

```typescript
import { calculateLoanPayment } from '@koperasi-sinoman/utils/currency'

// Business loan calculation
const loanConfig = {
  principal: 50000000, // Rp 50,000,000 loan
  annualInterestRate: 15, // 15% annual interest
  termInMonths: 36 // 3 years
}

const loanResult = calculateLoanPayment(
  loanConfig.principal,
  loanConfig.annualInterestRate,
  loanConfig.termInMonths
)

console.log('Loan Payment Calculation:')
console.log('Loan Amount:', loanResult.formattedResults.principal)
console.log('Monthly Payment:', loanResult.formattedResults.monthlyPayment)
console.log('Total Payment:', loanResult.formattedResults.totalPayment)
console.log('Total Interest:', loanResult.formattedResults.totalInterest)

// Generate payment schedule
function generatePaymentSchedule(principal: number, monthlyPayment: number, annualRate: number, termMonths: number) {
  const monthlyRate = annualRate / 100 / 12
  let balance = principal
  const schedule = []

  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = balance * monthlyRate
    const principalPayment = monthlyPayment - interestPayment
    balance -= principalPayment

    schedule.push({
      month,
      payment: formatIDR(monthlyPayment),
      principal: formatIDR(principalPayment),
      interest: formatIDR(interestPayment),
      balance: formatIDR(Math.max(0, balance))
    })
  }

  return schedule
}

const schedule = generatePaymentSchedule(
  loanConfig.principal,
  loanResult.monthlyPayment,
  loanConfig.annualInterestRate,
  loanConfig.termInMonths
)

console.log('\nPayment Schedule (First 6 months):')
console.log('Month | Payment      | Principal    | Interest     | Balance')
console.log('------|--------------|--------------|--------------|-------------')

schedule.slice(0, 6).forEach(payment => {
  console.log(
    `${payment.month.toString().padStart(5)} | ` +
    `${payment.payment.padStart(12)} | ` +
    `${payment.principal.padStart(12)} | ` +
    `${payment.interest.padStart(12)} | ` +
    `${payment.balance.padStart(12)}`
  )
})
```

## 📈 Mandatory Savings Calculator

```typescript
import { calculateMandatorySavings } from '@koperasi-sinoman/utils/currency'

// Calculate mandatory savings for different membership types
const membershipTypes = ['regular', 'premium', 'investor'] as const

console.log('Mandatory Monthly Savings by Membership Type:')
membershipTypes.forEach(type => {
  const savings = calculateMandatorySavings(type)
  const annualAmount = savings.monthly * 12

  console.log(`${type.charAt(0).toUpperCase() + type.slice(1)}:`)
  console.log(`  Monthly: ${savings.formatted}`)
  console.log(`  Annual: ${formatIDR(annualAmount)}`)
  console.log(`  Annual (words): ${toIDRWords(annualAmount)}`)
  console.log()
})

// Custom base amount calculation
const customBase = calculateMandatorySavings('premium', 30000)
console.log('Premium membership with custom base (Rp 30,000):')
console.log('Monthly savings:', customBase.formatted)
```

## 💹 Investment Projections

### 5-Year Savings Projection

```typescript
function calculateSavingsProjection(monthlyDeposit: number, annualRate: number, years: number) {
  const projections = []
  let totalDeposits = 0
  let currentBalance = 0

  for (let year = 1; year <= years; year++) {
    // Calculate for this year
    for (let month = 1; month <= 12; month++) {
      totalDeposits += monthlyDeposit
      // Add monthly deposit and calculate monthly interest
      currentBalance += monthlyDeposit
      currentBalance += currentBalance * (annualRate / 100 / 12)
    }

    const totalInterest = currentBalance - totalDeposits
    const roi = totalDeposits > 0 ? (totalInterest / totalDeposits) * 100 : 0

    projections.push({
      year,
      totalDeposits: formatIDR(totalDeposits),
      totalInterest: formatIDR(totalInterest),
      totalBalance: formatIDR(currentBalance),
      roi: `${roi.toFixed(2)}%`
    })
  }

  return projections
}

// Member savings projection
const monthlyDeposit = 500000 // Rp 500,000 per month
const projections = calculateSavingsProjection(monthlyDeposit, 6, 5)

console.log('5-Year Savings Projection (Monthly deposit: Rp 500,000, 6% annual interest):')
console.log('Year | Total Deposits | Total Interest | Total Balance  | ROI')
console.log('-----|----------------|----------------|----------------|--------')

projections.forEach(projection => {
  console.log(
    `${projection.year.toString().padStart(4)} | ` +
    `${projection.totalDeposits.padStart(14)} | ` +
    `${projection.totalInterest.padStart(14)} | ` +
    `${projection.totalBalance.padStart(14)} | ` +
    `${projection.roi.padStart(7)}`
  )
})
```

## 🎯 Real-World Usage Example

### Complete Member Financial Summary

```typescript
interface MemberFinancialData {
  memberId: string
  memberName: string
  membershipType: 'regular' | 'premium' | 'investor'
  membershipDuration: number
  accounts: {
    pokok: number
    wajib: number
    sukarela: number
    berjangka: number
  }
  loans: {
    outstanding: number
    monthlyPayment: number
  }
  transactions: {
    annualVolume: number
  }
}

function generateMemberFinancialSummary(member: MemberFinancialData) {
  // Calculate total savings
  const totalSavings = Object.values(member.accounts).reduce((sum, amount) => sum + amount, 0)

  // Calculate mandatory savings
  const mandatorySavings = calculateMandatorySavings(member.membershipType)

  // Calculate savings interest (assuming 5% for regular accounts)
  const savingsInterest = calculateSavingsInterest({
    principal: member.accounts.sukarela + member.accounts.berjangka,
    annualRate: 5,
    compoundingFrequency: 'monthly',
    termInMonths: 12
  })

  // Mock SHU calculation (simplified)
  const estimatedSHU = (totalSavings * 0.02) + (member.transactions.annualVolume * 0.01)

  const summary = {
    member: {
      id: member.memberId,
      name: member.memberName,
      type: member.membershipType,
      duration: `${member.membershipDuration} tahun`
    },
    savings: {
      pokok: formatIDR(member.accounts.pokok),
      wajib: formatIDR(member.accounts.wajib),
      sukarela: formatIDR(member.accounts.sukarela),
      berjangka: formatIDR(member.accounts.berjangka),
      total: formatIDR(totalSavings),
      totalWords: toIDRWords(totalSavings)
    },
    mandatorySavings: {
      monthly: mandatorySavings.formatted,
      annual: formatIDR(mandatorySavings.monthly * 12)
    },
    projectedInterest: {
      annual: savingsInterest.formattedResults.interestEarned,
      effectiveRate: savingsInterest.formattedResults.effectiveRate
    },
    loans: {
      outstanding: formatIDR(member.loans.outstanding),
      monthlyPayment: formatIDR(member.loans.monthlyPayment)
    },
    estimatedAnnualSHU: formatIDR(estimatedSHU),
    netWorth: formatIDR(totalSavings - member.loans.outstanding)
  }

  return summary
}

// Example usage
const memberData: MemberFinancialData = {
  memberId: 'SIN-2024-001',
  memberName: 'Budi Santoso',
  membershipType: 'premium',
  membershipDuration: 5,
  accounts: {
    pokok: 100000,
    wajib: 1500000,
    sukarela: 8500000,
    berjangka: 15000000
  },
  loans: {
    outstanding: 5000000,
    monthlyPayment: 500000
  },
  transactions: {
    annualVolume: 25000000
  }
}

const summary = generateMemberFinancialSummary(memberData)

console.log('RINGKASAN KEUANGAN ANGGOTA')
console.log('=' .repeat(40))
console.log(`Nama: ${summary.member.name}`)
console.log(`ID Anggota: ${summary.member.id}`)
console.log(`Jenis Keanggotaan: ${summary.member.type}`)
console.log(`Lama Keanggotaan: ${summary.member.duration}`)
console.log()
console.log('SIMPANAN:')
console.log(`  Simpanan Pokok: ${summary.savings.pokok}`)
console.log(`  Simpanan Wajib: ${summary.savings.wajib}`)
console.log(`  Simpanan Sukarela: ${summary.savings.sukarela}`)
console.log(`  Simpanan Berjangka: ${summary.savings.berjangka}`)
console.log(`  Total Simpanan: ${summary.savings.total}`)
console.log(`  Terbilang: ${summary.savings.totalWords}`)
console.log()
console.log('PROYEKSI KEUANGAN:')
console.log(`  Simpanan Wajib Bulanan: ${summary.mandatorySavings.monthly}`)
console.log(`  Simpanan Wajib Tahunan: ${summary.mandatorySavings.annual}`)
console.log(`  Proyeksi Bunga Tahunan: ${summary.projectedInterest.annual}`)
console.log(`  Estimasi SHU Tahunan: ${summary.estimatedAnnualSHU}`)
console.log()
console.log('PINJAMAN:')
console.log(`  Saldo Pinjaman: ${summary.loans.outstanding}`)
console.log(`  Angsuran Bulanan: ${summary.loans.monthlyPayment}`)
console.log()
console.log(`KEKAYAAN BERSIH: ${summary.netWorth}`)
```

This comprehensive example demonstrates how the currency utilities can be used in real Indonesian cooperative scenarios, from basic formatting to complex financial calculations and reporting.