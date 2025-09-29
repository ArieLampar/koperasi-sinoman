import { z } from 'zod'
import {
  uuidSchema,
  amountSchema,
  percentageSchema,
  dateSchema,
  transactionStatusSchema,
  paymentMethodSchema,
  accountStatusSchema,
  paginationSchema,
  createUpdateSchema,
  createFilterSchema,
} from './common-schemas'

// Savings type schemas
export const createSavingsTypeSchema = z.object({
  name: z.string().min(1, 'Name required').max(100, 'Name too long'),
  code: z.string().min(1, 'Code required').max(20, 'Code too long').regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores'),
  description: z.string().max(1000, 'Description too long').optional(),
  minimum_amount: amountSchema.default(0),
  is_withdrawable: z.boolean().default(true),
  is_mandatory: z.boolean().default(false),
  interest_rate: z.number().min(0, 'Interest rate must be positive').max(1, 'Interest rate cannot exceed 100%').default(0),
})

export const updateSavingsTypeSchema = createUpdateSchema(createSavingsTypeSchema.shape)

// Savings account schemas
export const createSavingsAccountSchema = z.object({
  member_id: uuidSchema,
  savings_type_id: uuidSchema,
})

export const updateSavingsAccountSchema = z.object({
  status: accountStatusSchema,
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const savingsAccountFiltersSchema = createFilterSchema({
  member_id: uuidSchema,
  savings_type_id: uuidSchema,
  status: accountStatusSchema,
  balance_min: amountSchema,
  balance_max: amountSchema,
  search: z.string().min(1, 'Search query required'),
})

// Time deposit schemas
export const createTimeDepositSchema = z.object({
  savings_account_id: uuidSchema,
  principal_amount: amountSchema.min(100000, 'Minimum deposit is Rp 100,000'),
  term_months: z.enum(['3', '6', '12', '24']).transform(val => parseInt(val)),
  auto_rollover: z.boolean().default(false),
})

export const updateTimeDepositSchema = z.object({
  auto_rollover: z.boolean(),
  status: z.enum(['active', 'matured', 'closed']),
})

// Transaction schemas
export const createTransactionSchema = z.object({
  member_id: uuidSchema,
  savings_account_id: uuidSchema.optional(),
  transaction_type_id: uuidSchema,
  amount: amountSchema.min(1000, 'Minimum transaction amount is Rp 1,000'),
  description: z.string().max(500, 'Description too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  payment_method: paymentMethodSchema.optional(),
  payment_reference: z.string().max(255, 'Payment reference too long').optional(),
})

export const processTransactionSchema = z.object({
  transaction_id: uuidSchema,
  processed_by: uuidSchema,
  payment_status: transactionStatusSchema,
  notes: z.string().max(1000, 'Notes too long').optional(),
  payment_reference: z.string().max(255, 'Payment reference too long').optional(),
})

export const transactionFiltersSchema = createFilterSchema({
  member_id: uuidSchema,
  savings_account_id: uuidSchema,
  transaction_type_id: uuidSchema,
  payment_status: transactionStatusSchema,
  payment_method: paymentMethodSchema,
  amount_min: amountSchema,
  amount_max: amountSchema,
  date_from: dateSchema,
  date_to: dateSchema,
  search: z.string().min(1, 'Search query required'),
})

export const transactionQuerySchema = z.object({
  ...transactionFiltersSchema.shape,
  ...paginationSchema.shape,
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// Bulk transaction schemas
export const bulkDepositSchema = z.object({
  transactions: z.array(z.object({
    member_id: uuidSchema,
    savings_type_id: uuidSchema,
    amount: amountSchema.min(1000, 'Minimum deposit is Rp 1,000'),
    description: z.string().max(500, 'Description too long').optional(),
  })).min(1, 'At least one transaction required').max(1000, 'Maximum 1000 transactions allowed'),
  processed_by: uuidSchema,
  payment_method: paymentMethodSchema.default('cash'),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const bulkWithdrawalSchema = z.object({
  transactions: z.array(z.object({
    savings_account_id: uuidSchema,
    amount: amountSchema.min(1000, 'Minimum withdrawal is Rp 1,000'),
    description: z.string().max(500, 'Description too long').optional(),
  })).min(1, 'At least one transaction required').max(100, 'Maximum 100 transactions allowed'),
  processed_by: uuidSchema,
  payment_method: paymentMethodSchema.default('cash'),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

// SHU (Sisa Hasil Usaha) schemas
export const createShuDistributionSchema = z.object({
  year: z.number().int().min(2020, 'Invalid year').max(new Date().getFullYear(), 'Year cannot be in the future'),
  total_shu: amountSchema.min(1000000, 'Minimum SHU is Rp 1,000,000'),
  distribution_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const shuCalculationSchema = z.object({
  distribution_id: uuidSchema,
  member_filters: z.object({
    membership_status: z.array(z.string()).optional(),
    join_date_before: z.string().datetime().optional(),
    membership_types: z.array(z.string()).optional(),
  }).optional(),
  calculation_method: z.enum(['equal', 'proportional', 'custom']).default('proportional'),
  weights: z.object({
    savings_weight: z.number().min(0).max(1).default(0.6),
    transaction_weight: z.number().min(0).max(1).default(0.3),
    participation_weight: z.number().min(0).max(1).default(0.1),
  }).refine(
    data => data.savings_weight + data.transaction_weight + data.participation_weight === 1,
    'Weights must sum to 1.0'
  ).optional(),
})

export const shuAllocationSchema = z.object({
  distribution_id: uuidSchema,
  member_id: uuidSchema,
  shu_amount: amountSchema,
  distribution_method: z.enum(['savings', 'cash', 'reinvest']).default('savings'),
})

// Manual adjustment schemas
export const manualAdjustmentSchema = z.object({
  savings_account_id: uuidSchema,
  amount: z.number().refine(val => val !== 0, 'Adjustment amount cannot be zero'),
  type: z.enum(['correction', 'penalty', 'bonus', 'fee_waiver', 'interest_adjustment']),
  reason: z.string().min(10, 'Reason required').max(500, 'Reason too long'),
  reference_transaction_id: uuidSchema.optional(),
  approved_by: uuidSchema,
  notes: z.string().max(1000, 'Notes too long').optional(),
})

// Interest calculation schemas
export const calculateInterestSchema = z.object({
  account_ids: z.array(uuidSchema).optional(), // If not provided, calculate for all eligible accounts
  calculation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  interest_period: z.enum(['daily', 'monthly', 'quarterly', 'annually']).default('monthly'),
  dry_run: z.boolean().default(false), // Preview calculation without applying
})

// Savings report schemas
export const savingsReportSchema = z.object({
  report_type: z.enum(['balance', 'transactions', 'growth', 'interest', 'shu']),
  period_from: dateSchema,
  period_to: dateSchema,
  filters: z.object({
    member_ids: z.array(uuidSchema).optional(),
    savings_type_ids: z.array(uuidSchema).optional(),
    account_statuses: z.array(accountStatusSchema).optional(),
  }).optional(),
  format: z.enum(['json', 'csv', 'xlsx', 'pdf']).default('json'),
  group_by: z.enum(['member', 'savings_type', 'month', 'quarter', 'year']).optional(),
})

// Account closure schemas
export const closeSavingsAccountSchema = z.object({
  savings_account_id: uuidSchema,
  closure_reason: z.enum(['member_request', 'account_inactive', 'violation', 'death', 'transfer']),
  final_balance_disposition: z.enum(['transfer_to_other_account', 'cash_withdrawal', 'donation']),
  target_account_id: uuidSchema.optional(), // Required if disposition is transfer
  closure_fee: amountSchema.default(0),
  notes: z.string().max(1000, 'Notes too long').optional(),
  processed_by: uuidSchema,
})

// Transfer schemas
export const internalTransferSchema = z.object({
  from_account_id: uuidSchema,
  to_account_id: uuidSchema,
  amount: amountSchema.min(10000, 'Minimum transfer amount is Rp 10,000'),
  description: z.string().max(500, 'Description too long').optional(),
  reference_number: z.string().max(50, 'Reference number too long').optional(),
  processed_by: uuidSchema,
}).refine(
  data => data.from_account_id !== data.to_account_id,
  'Source and destination accounts must be different'
)

// Validation helper functions
export function validateSavingsTransaction(data: unknown) {
  return createTransactionSchema.safeParse(data)
}

export function validateTransactionFilters(data: unknown) {
  return transactionFiltersSchema.safeParse(data)
}

export function validateShuCalculation(data: unknown) {
  return shuCalculationSchema.safeParse(data)
}

export function validateManualAdjustment(data: unknown) {
  return manualAdjustmentSchema.safeParse(data)
}