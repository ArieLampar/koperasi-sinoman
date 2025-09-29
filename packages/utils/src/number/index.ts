/**
 * Number utilities and mathematical functions
 */

// Round to specific decimal places
export function roundTo(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(num * factor) / factor
}

// Clamp number between min and max
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max)
}

// Check if number is between range (inclusive)
export function isBetween(num: number, min: number, max: number): boolean {
  return num >= min && num <= max
}

// Generate random number between min and max
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

// Generate random integer between min and max (inclusive)
export function randomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Convert percentage to decimal
export function percentageToDecimal(percentage: number): number {
  return percentage / 100
}

// Convert decimal to percentage
export function decimalToPercentage(decimal: number): number {
  return decimal * 100
}

// Calculate percentage change
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue === 0 ? 0 : 100
  return ((newValue - oldValue) / oldValue) * 100
}

// Calculate compound interest
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  timeInYears: number,
  compoundingFrequency: number = 12
): number {
  const r = rate / 100
  const n = compoundingFrequency
  const t = timeInYears

  return principal * Math.pow(1 + r / n, n * t)
}

// Calculate simple interest
export function calculateSimpleInterest(
  principal: number,
  rate: number,
  timeInYears: number
): number {
  const r = rate / 100
  return principal * (1 + r * timeInYears)
}

// Calculate monthly payment for loan (PMT formula)
export function calculateLoanPayment(
  principal: number,
  annualRate: number,
  termInMonths: number
): number {
  if (annualRate === 0) return principal / termInMonths

  const monthlyRate = annualRate / 100 / 12
  const denominator = 1 - Math.pow(1 + monthlyRate, -termInMonths)

  return (principal * monthlyRate) / denominator
}

// Calculate loan total interest
export function calculateLoanTotalInterest(
  principal: number,
  annualRate: number,
  termInMonths: number
): number {
  const monthlyPayment = calculateLoanPayment(principal, annualRate, termInMonths)
  const totalPaid = monthlyPayment * termInMonths
  return totalPaid - principal
}

// Financial utilities for Indonesian banking
export function calculateSavingsInterest(
  balance: number,
  annualRate: number,
  days: number = 30
): number {
  const dailyRate = (annualRate / 100) / 365
  return balance * dailyRate * days
}

// Calculate zakat (Islamic wealth tax) - 2.5% for savings
export function calculateZakat(wealth: number, nisab: number = 85000000): number {
  if (wealth < nisab) return 0
  return wealth * 0.025 // 2.5%
}

// Tax calculations for Indonesian context
export function calculatePPh21(
  grossIncome: number,
  ptkp: number = 54000000 // Default PTKP for single person
): number {
  const taxableIncome = Math.max(0, grossIncome - ptkp)

  let tax = 0

  // Indonesian tax brackets (2024)
  if (taxableIncome > 500000000) {
    tax += (taxableIncome - 500000000) * 0.35
    taxableIncome = 500000000
  }
  if (taxableIncome > 250000000) {
    tax += (taxableIncome - 250000000) * 0.30
    taxableIncome = 250000000
  }
  if (taxableIncome > 60000000) {
    tax += (taxableIncome - 60000000) * 0.15
    taxableIncome = 60000000
  }
  if (taxableIncome > 0) {
    tax += taxableIncome * 0.05
  }

  return tax
}

// Array statistics
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, num) => acc + num, 0)
}

export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return sum(numbers) / numbers.length
}

export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0

  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

export function mode(numbers: number[]): number[] {
  if (numbers.length === 0) return []

  const frequency: Record<number, number> = {}
  let maxFreq = 0

  for (const num of numbers) {
    frequency[num] = (frequency[num] || 0) + 1
    maxFreq = Math.max(maxFreq, frequency[num])
  }

  return Object.keys(frequency)
    .filter(key => frequency[Number(key)] === maxFreq)
    .map(Number)
}

export function standardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0

  const avg = average(numbers)
  const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2))
  const avgSquaredDiff = average(squaredDiffs)

  return Math.sqrt(avgSquaredDiff)
}

export function variance(numbers: number[]): number {
  if (numbers.length === 0) return 0

  const avg = average(numbers)
  const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2))

  return average(squaredDiffs)
}

// Range and quartiles
export function range(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return Math.max(...numbers) - Math.min(...numbers)
}

export function quartiles(numbers: number[]): [number, number, number] {
  if (numbers.length === 0) return [0, 0, 0]

  const sorted = [...numbers].sort((a, b) => a - b)
  const q2 = median(sorted)

  const midIndex = Math.floor(sorted.length / 2)
  const lowerHalf = sorted.slice(0, midIndex)
  const upperHalf = sorted.slice(sorted.length % 2 === 0 ? midIndex : midIndex + 1)

  const q1 = median(lowerHalf)
  const q3 = median(upperHalf)

  return [q1, q2, q3]
}

// Utility functions
export function isEven(num: number): boolean {
  return num % 2 === 0
}

export function isOdd(num: number): boolean {
  return num % 2 !== 0
}

export function isPrime(num: number): boolean {
  if (num < 2) return false
  if (num === 2) return true
  if (num % 2 === 0) return false

  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false
  }

  return true
}

export function factorial(num: number): number {
  if (num < 0) return 0
  if (num === 0 || num === 1) return 1

  let result = 1
  for (let i = 2; i <= num; i++) {
    result *= i
  }

  return result
}

export function fibonacci(n: number): number {
  if (n < 0) return 0
  if (n === 0 || n === 1) return n

  let a = 0
  let b = 1

  for (let i = 2; i <= n; i++) {
    const temp = a + b
    a = b
    b = temp
  }

  return b
}

// Greatest Common Divisor
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.floor(a))
  b = Math.abs(Math.floor(b))

  while (b !== 0) {
    const temp = b
    b = a % b
    a = temp
  }

  return a
}

// Least Common Multiple
export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b)
}

// Convert between number bases
export function toBase(num: number, base: number): string {
  return num.toString(base).toUpperCase()
}

export function fromBase(str: string, base: number): number {
  return parseInt(str, base)
}

// Safe division (avoid division by zero)
export function safeDivide(dividend: number, divisor: number): number {
  return divisor === 0 ? 0 : dividend / divisor
}

// Format number for display
export function formatNumber(
  num: number,
  options: {
    decimals?: number
    thousandsSeparator?: string
    decimalSeparator?: string
  } = {}
): string {
  const {
    decimals = 2,
    thousandsSeparator = '.',
    decimalSeparator = ','
  } = options

  const rounded = roundTo(num, decimals)
  const parts = rounded.toFixed(decimals).split('.')

  // Add thousands separator
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)

  // Join with decimal separator
  return parts.join(decimalSeparator)
}

// Convert string to number safely
export function toNumber(value: string | number): number {
  if (typeof value === 'number') return value

  // Remove Indonesian number formatting
  const cleaned = value.replace(/\./g, '').replace(/,/g, '.')
  const parsed = parseFloat(cleaned)

  return isNaN(parsed) ? 0 : parsed
}