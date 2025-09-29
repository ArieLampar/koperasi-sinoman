# @koperasi-sinoman/utils - Usage Examples

This document provides comprehensive examples of how to use all the utility functions in the package.

## 🏦 Complete Indonesian Business Application Example

```typescript
import {
  // Validation
  validateNIK,
  validatePhoneNumber,
  validateEmail,
  validatePasswordStrength,

  // Formatting
  formatCurrency,
  formatNIK,
  formatPhoneNumber,
  formatAddress,
  numberToWords,

  // Date utilities
  formatDate,
  getRelativeTime,
  calculateAge,
  isBusinessDay,

  // Financial calculations
  calculateCompoundInterest,
  calculateZakat,
  calculatePPh21,

  // QR Code generation
  generateQRPaymentData,
  generateQRContactData,
  QR_TEMPLATES,

  // Crypto utilities
  generateId,
  hashPassword,
  generateOTP,

  // Error handling
  ValidationError,
  safeAsync,

  // Constants
  INDONESIAN_PROVINCES,
  INDONESIAN_BANKS,
  CURRENCIES
} from '@koperasi-sinoman/utils'

// ===================================
// MEMBER REGISTRATION EXAMPLE
// ===================================

interface MemberRegistration {
  fullName: string
  nik: string
  email: string
  phone: string
  dateOfBirth: string
  address: {
    street: string
    village: string
    district: string
    city: string
    province: string
    postalCode: string
  }
  monthlyIncome: number
}

async function registerMember(data: MemberRegistration) {
  try {
    // 1. Validate input data
    if (!validateNIK(data.nik)) {
      throw new ValidationError('NIK tidak valid', 'nik', data.nik)
    }

    if (!validatePhoneNumber(data.phone)) {
      throw new ValidationError('Nomor telepon tidak valid', 'phone', data.phone)
    }

    if (!validateEmail(data.email)) {
      throw new ValidationError('Email tidak valid', 'email', data.email)
    }

    // 2. Calculate member details
    const age = calculateAge(data.dateOfBirth)
    if (age < 17) {
      throw new ValidationError('Usia minimal 17 tahun untuk menjadi anggota')
    }

    // 3. Generate member ID and format data
    const memberId = generateId(12)
    const memberNumber = `SIN-${new Date().getFullYear()}-${generateId(6).toUpperCase()}`

    // 4. Format display data
    const formattedData = {
      id: memberId,
      memberNumber,
      fullName: data.fullName,
      nik: formatNIK(data.nik),
      email: data.email,
      phone: formatPhoneNumber(data.phone, 'national'),
      age,
      registrationDate: formatDate(new Date(), 'dd MMMM yyyy'),
      address: formatAddress(data.address),
      monthlyIncome: formatCurrency(data.monthlyIncome),
      monthlyIncomeWords: numberToWords(data.monthlyIncome) + ' rupiah'
    }

    // 5. Calculate financial projections
    const mandatorySavings = 25000 // Monthly mandatory savings
    const projectedSavings = calculateCompoundInterest(
      mandatorySavings * 12, // Annual savings
      5, // 5% interest rate
      5  // 5 years
    )

    // 6. Generate QR codes for member
    const contactQR = generateQRContactData({
      name: data.fullName,
      phone: data.phone,
      email: data.email,
      organization: 'Koperasi Sinoman'
    })

    const paymentQR = generateQRPaymentData({
      merchantName: 'Koperasi Sinoman',
      merchantCity: data.address.city,
      merchantId: memberNumber,
      description: 'Pembayaran Simpanan Wajib'
    })

    console.log('✅ Member registered successfully:', formattedData)
    console.log('📊 5-year savings projection:', formatCurrency(projectedSavings))
    console.log('📱 Contact QR:', contactQR.substring(0, 50) + '...')

    return {
      member: formattedData,
      projections: {
        fiveYearSavings: projectedSavings,
        formattedProjection: formatCurrency(projectedSavings)
      },
      qrCodes: {
        contact: contactQR,
        payment: paymentQR
      }
    }

  } catch (error) {
    console.error('❌ Registration failed:', error)
    throw error
  }
}

// ===================================
// SAVINGS CALCULATION EXAMPLE
// ===================================

interface SavingsAccount {
  type: 'POKOK' | 'WAJIB' | 'SUKARELA' | 'BERJANGKA'
  balance: number
  interestRate: number
  lastTransaction: string
}

function calculateSavingsDetails(accounts: SavingsAccount[]) {
  const summary = {
    totalBalance: 0,
    totalInterest: 0,
    accountDetails: [] as any[],
    zakatDue: 0,
    formattedSummary: {} as any
  }

  accounts.forEach(account => {
    // Calculate interest for the year
    const yearlyInterest = account.balance * (account.interestRate / 100)

    // Calculate time since last transaction
    const timeSinceLastTransaction = getRelativeTime(account.lastTransaction)

    summary.totalBalance += account.balance
    summary.totalInterest += yearlyInterest

    summary.accountDetails.push({
      type: account.type,
      balance: formatCurrency(account.balance),
      interestRate: `${account.interestRate}%`,
      yearlyInterest: formatCurrency(yearlyInterest),
      lastTransaction: timeSinceLastTransaction,
      isBusinessDay: isBusinessDay(new Date())
    })
  })

  // Calculate zakat if applicable
  summary.zakatDue = calculateZakat(summary.totalBalance)

  // Format summary
  summary.formattedSummary = {
    totalBalance: formatCurrency(summary.totalBalance),
    totalBalanceWords: numberToWords(summary.totalBalance) + ' rupiah',
    totalInterest: formatCurrency(summary.totalInterest),
    zakatDue: formatCurrency(summary.zakatDue),
    zakatDueWords: summary.zakatDue > 0 ? numberToWords(summary.zakatDue) + ' rupiah' : 'Tidak ada kewajiban zakat'
  }

  return summary
}

// ===================================
// PAYMENT PROCESSING EXAMPLE
// ===================================

interface PaymentRequest {
  fromAccount: string
  toAccount: string
  amount: number
  description: string
  memberPhone: string
}

async function processPayment(payment: PaymentRequest) {
  const [result, error] = await safeAsync(async () => {
    // 1. Generate transaction ID
    const transactionId = generateId(16)
    const otp = generateOTP(6)

    // 2. Format payment details
    const formattedPayment = {
      id: transactionId,
      from: payment.fromAccount,
      to: payment.toAccount,
      amount: formatCurrency(payment.amount),
      amountWords: numberToWords(payment.amount) + ' rupiah',
      description: payment.description,
      timestamp: formatDate(new Date(), 'dd MMMM yyyy HH:mm'),
      otp
    }

    // 3. Generate payment QR code
    const paymentQR = generateQRPaymentData({
      merchantName: 'Koperasi Sinoman',
      merchantCity: 'Jakarta',
      merchantId: payment.toAccount,
      amount: payment.amount,
      transactionId,
      description: payment.description
    })

    // 4. Send OTP via SMS (simulated)
    const smsQR = QR_TEMPLATES.WHATSAPP(
      payment.memberPhone,
      `Kode OTP untuk transaksi ${formattedPayment.amount}: ${otp}. Jangan berikan kode ini kepada siapapun.`
    )

    console.log('💸 Payment processed:', formattedPayment)
    console.log('📱 Payment QR generated')
    console.log('📨 OTP sent via WhatsApp')

    return {
      transaction: formattedPayment,
      qrCode: paymentQR,
      smsLink: smsQR
    }
  })

  if (error) {
    console.error('❌ Payment failed:', error)
    throw new ValidationError('Payment processing failed', 'payment', payment)
  }

  return result
}

// ===================================
// FINANCIAL REPORT EXAMPLE
// ===================================

interface FinancialData {
  members: Array<{
    id: string
    name: string
    totalSavings: number
    monthlyIncome: number
    joinDate: string
  }>
}

function generateFinancialReport(data: FinancialData) {
  const report = {
    summary: {
      totalMembers: data.members.length,
      totalSavings: 0,
      averageSavings: 0,
      totalMonthlyIncome: 0,
      averageMonthlyIncome: 0
    },
    memberBreakdown: [] as any[],
    taxCalculations: [] as any[],
    formatted: {} as any
  }

  // Calculate totals
  data.members.forEach(member => {
    report.summary.totalSavings += member.totalSavings
    report.summary.totalMonthlyIncome += member.monthlyIncome

    // Calculate member age and tenure
    const age = calculateAge(member.joinDate)
    const tenure = getRelativeTime(member.joinDate)

    // Calculate tax obligations
    const pph21 = calculatePPh21(member.monthlyIncome * 12) // Annual income
    const zakat = calculateZakat(member.totalSavings)

    report.memberBreakdown.push({
      name: member.name,
      age,
      tenure,
      savings: formatCurrency(member.totalSavings),
      monthlyIncome: formatCurrency(member.monthlyIncome),
      pph21: formatCurrency(pph21),
      zakat: formatCurrency(zakat)
    })

    if (pph21 > 0 || zakat > 0) {
      report.taxCalculations.push({
        name: member.name,
        pph21: formatCurrency(pph21),
        zakat: formatCurrency(zakat),
        total: formatCurrency(pph21 + zakat)
      })
    }
  })

  // Calculate averages
  report.summary.averageSavings = report.summary.totalSavings / data.members.length
  report.summary.averageMonthlyIncome = report.summary.totalMonthlyIncome / data.members.length

  // Format summary
  report.formatted = {
    totalMembers: report.summary.totalMembers.toLocaleString('id-ID'),
    totalSavings: formatCurrency(report.summary.totalSavings),
    totalSavingsWords: numberToWords(report.summary.totalSavings) + ' rupiah',
    averageSavings: formatCurrency(report.summary.averageSavings),
    averageMonthlyIncome: formatCurrency(report.summary.averageMonthlyIncome),
    reportDate: formatDate(new Date(), 'dd MMMM yyyy'),
    reportTime: formatDate(new Date(), 'HH:mm')
  }

  return report
}

// ===================================
// EXAMPLE USAGE
// ===================================

async function runExamples() {
  console.log('🏦 Koperasi Sinoman Utilities Examples\n')

  // 1. Member Registration
  console.log('1️⃣ Member Registration Example:')
  try {
    const memberData: MemberRegistration = {
      fullName: 'Budi Santoso',
      nik: '3502011234567890',
      email: 'budi.santoso@example.com',
      phone: '081234567890',
      dateOfBirth: '1990-05-15',
      address: {
        street: 'Jl. Merdeka No. 123',
        village: 'Tonatan',
        district: 'Ponorogo',
        city: 'Ponorogo',
        province: 'Jawa Timur',
        postalCode: '63411'
      },
      monthlyIncome: 5000000
    }

    const registration = await registerMember(memberData)
    console.log('Registration successful!\n')

  } catch (error) {
    console.error('Registration failed:', error, '\n')
  }

  // 2. Savings Calculation
  console.log('2️⃣ Savings Calculation Example:')
  const savingsAccounts: SavingsAccount[] = [
    { type: 'POKOK', balance: 100000, interestRate: 0, lastTransaction: '2024-01-01' },
    { type: 'WAJIB', balance: 300000, interestRate: 5, lastTransaction: '2024-09-01' },
    { type: 'SUKARELA', balance: 1500000, interestRate: 3, lastTransaction: '2024-09-15' },
    { type: 'BERJANGKA', balance: 5000000, interestRate: 8, lastTransaction: '2024-06-01' }
  ]

  const savingsSummary = calculateSavingsDetails(savingsAccounts)
  console.log('Savings summary:', savingsSummary.formattedSummary)
  console.log('')

  // 3. Payment Processing
  console.log('3️⃣ Payment Processing Example:')
  try {
    const payment: PaymentRequest = {
      fromAccount: 'SA-20240001',
      toAccount: 'SA-20240002',
      amount: 250000,
      description: 'Transfer simpanan sukarela',
      memberPhone: '081234567890'
    }

    const paymentResult = await processPayment(payment)
    console.log('Payment processed successfully!\n')

  } catch (error) {
    console.error('Payment failed:', error, '\n')
  }

  // 4. Financial Report
  console.log('4️⃣ Financial Report Example:')
  const financialData: FinancialData = {
    members: [
      { id: '1', name: 'Budi Santoso', totalSavings: 6900000, monthlyIncome: 5000000, joinDate: '2023-01-15' },
      { id: '2', name: 'Siti Nurhaliza', totalSavings: 4500000, monthlyIncome: 3500000, joinDate: '2023-03-20' },
      { id: '3', name: 'Ahmad Wijaya', totalSavings: 8200000, monthlyIncome: 7000000, joinDate: '2022-11-10' }
    ]
  }

  const report = generateFinancialReport(financialData)
  console.log('Financial Report:', report.formatted)
  console.log('')

  // 5. Constants Usage
  console.log('5️⃣ Constants Usage Example:')
  console.log('Indonesian Provinces:', INDONESIAN_PROVINCES.slice(0, 3).map(p => p.name))
  console.log('Major Banks:', INDONESIAN_BANKS.slice(0, 3).map(b => b.name))
  console.log('IDR Currency:', CURRENCIES.IDR)
  console.log('')

  console.log('✅ All examples completed successfully!')
}

// Run examples
if (require.main === module) {
  runExamples().catch(console.error)
}

export {
  registerMember,
  calculateSavingsDetails,
  processPayment,
  generateFinancialReport,
  runExamples
}
```

## 🔧 Quick Start Examples

### Basic Validation
```typescript
import { validateNIK, validatePhoneNumber, formatCurrency } from '@koperasi-sinoman/utils'

// Validate Indonesian ID
if (validateNIK('3502011234567890')) {
  console.log('✅ Valid NIK')
}

// Validate phone number
if (validatePhoneNumber('081234567890')) {
  console.log('✅ Valid phone number')
}

// Format currency
const formatted = formatCurrency(1500000) // "Rp 1.500.000"
```

### QR Code Generation
```typescript
import { generateQRPaymentData, QR_TEMPLATES } from '@koperasi-sinoman/utils'

// Payment QR
const paymentQR = generateQRPaymentData({
  merchantName: 'Koperasi Sinoman',
  merchantCity: 'Jakarta',
  merchantId: 'KOPSIM001',
  amount: 100000
})

// Quick templates
const whatsappQR = QR_TEMPLATES.WHATSAPP('081234567890', 'Hello from Koperasi!')
const contactQR = QR_TEMPLATES.CONTACT('Budi Santoso', '081234567890')
```

### Financial Calculations
```typescript
import { calculateZakat, calculatePPh21, formatCurrency } from '@koperasi-sinoman/utils'

// Calculate zakat (2.5% if above nisab)
const zakat = calculateZakat(100000000) // 100 million IDR
console.log('Zakat due:', formatCurrency(zakat))

// Calculate Indonesian income tax
const tax = calculatePPh21(60000000) // 60 million annual income
console.log('PPh21 tax:', formatCurrency(tax))
```

This comprehensive example demonstrates the real-world usage of all utility functions in an Indonesian cooperative (koperasi) business context.