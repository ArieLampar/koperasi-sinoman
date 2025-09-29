/**
 * Complete TypeScript type definitions for Koperasi Sinoman database
 * Generated from Supabase schema with proper relationships and constraints
 */

// Base types
export type UUID = string
export type Timestamp = string
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Common enums and types
export type Gender = 'male' | 'female'
export type MembershipStatus = 'pending' | 'active' | 'suspended' | 'inactive'
export type MembershipType = 'regular' | 'investor' | 'premium'
export type KycStatus = 'pending' | 'verified' | 'rejected'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type DocumentType = 'ktp' | 'selfie' | 'kk' | 'npwp' | 'bank_statement'

// Financial types
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type PaymentMethod = 'bank_transfer' | 'virtual_account' | 'cash' | 'qris'
export type TransactionCategory = 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest' | 'bonus'
export type AccountStatus = 'active' | 'frozen' | 'closed'
export type DistributionStatus = 'pending' | 'distributed' | 'cancelled'
export type DistributionMethod = 'savings' | 'cash' | 'reinvest'
export type ReferralStatus = 'pending' | 'completed' | 'paid'

// Business types
export type BusinessType = 'koperasi' | 'umkm' | 'individual'
export type SellerStatus = 'pending' | 'active' | 'suspended' | 'rejected'
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'discontinued'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

// =====================================================
// AUTHENTICATION & MEMBERSHIP TABLES
// =====================================================

export interface Member {
  // Primary fields
  id: UUID
  auth_user_id?: UUID
  member_number: string // Format: SIN-YYYY-XXXXXX

  // Personal Information
  full_name: string
  nik: string // 16 digits Indonesian National ID
  email: string
  phone: string // Indonesian phone format
  date_of_birth: string // Date string
  gender: Gender

  // Address
  address: string
  village?: string
  district?: string
  city: string
  province: string
  postal_code?: string

  // Membership Details
  membership_type: MembershipType
  membership_status: MembershipStatus
  join_date: Timestamp

  // KYC & Verification
  kyc_status: KycStatus
  kyc_verified_at?: Timestamp
  kyc_verified_by?: UUID

  // Profile
  profile_picture_url?: string
  bio?: string
  occupation?: string

  // System fields
  created_at: Timestamp
  updated_at?: Timestamp

  // Referral
  referred_by?: UUID
  referral_code: string // 8 character code
}

export interface MemberDocument {
  id: UUID
  member_id: UUID
  document_type: DocumentType
  document_url: string
  verification_status: VerificationStatus
  verified_at?: Timestamp
  verified_by?: UUID
  notes?: string
  created_at: Timestamp
}

export interface Referral {
  id: UUID
  referrer_id: UUID
  referred_id: UUID
  referral_bonus: number // Decimal(15,2)
  status: ReferralStatus
  created_at: Timestamp
}

// =====================================================
// SAVINGS & FINANCIAL TABLES
// =====================================================

export interface SavingsType {
  id: UUID
  name: string // 'Simpanan Pokok', 'Simpanan Wajib', etc.
  code: string // Unique code like 'POKOK', 'WAJIB'
  description?: string
  minimum_amount: number // Decimal(15,2)
  is_withdrawable: boolean
  is_mandatory: boolean
  interest_rate: number // Decimal(5,4) - annual percentage
  created_at: Timestamp
}

export interface SavingsAccount {
  id: UUID
  member_id: UUID
  savings_type_id: UUID
  account_number: string // Format: SA-YYYY-XXXXXX
  balance: number // Decimal(15,2)
  status: AccountStatus
  opened_at: Timestamp
  closed_at?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}

export interface TimeDeposit {
  id: UUID
  savings_account_id: UUID
  principal_amount: number // Decimal(15,2)
  interest_rate: number // Decimal(5,4)
  term_months: 3 | 6 | 12 | 24
  maturity_date: string // Date
  auto_rollover: boolean
  status: 'active' | 'matured' | 'closed'
  created_at: Timestamp
}

export interface TransactionType {
  id: UUID
  name: string
  code: string
  category: TransactionCategory
  description?: string
  created_at: Timestamp
}

export interface Transaction {
  id: UUID
  member_id: UUID
  savings_account_id?: UUID
  transaction_type_id: UUID

  // Transaction details
  reference_number: string // Unique reference
  amount: number // Decimal(15,2)
  balance_before?: number // Decimal(15,2)
  balance_after?: number // Decimal(15,2)
  description?: string
  notes?: string

  // Payment details
  payment_method?: PaymentMethod
  payment_reference?: string
  payment_status: TransactionStatus

  // System tracking
  processed_by?: UUID
  processed_at?: Timestamp
  created_at: Timestamp

  // Related transaction (for transfers)
  related_transaction_id?: UUID
}

export interface ShuDistribution {
  id: UUID
  year: number
  total_shu: number // Decimal(15,2)
  distribution_date: string // Date
  status: DistributionStatus
  notes?: string
  created_at: Timestamp
}

export interface ShuAllocation {
  id: UUID
  distribution_id: UUID
  member_id: UUID

  // Calculation base
  savings_balance: number // Decimal(15,2)
  transaction_volume: number // Decimal(15,2)
  participation_score: number // Decimal(5,2) 0-100

  // SHU amount
  shu_amount: number // Decimal(15,2)
  distribution_method: DistributionMethod

  // Status
  status: 'pending' | 'distributed' | 'failed'
  distributed_at?: Timestamp
  created_at: Timestamp
}

// =====================================================
// MARKETPLACE & E-COMMERCE TABLES
// =====================================================

export interface ProductCategory {
  id: UUID
  name: string
  slug: string
  description?: string
  parent_id?: UUID
  image_url?: string
  sort_order: number
  is_active: boolean
  created_at: Timestamp
}

export interface Seller {
  id: UUID
  member_id?: UUID // NULL if koperasi store
  business_name: string
  business_type: BusinessType
  description?: string
  address?: string
  phone?: string
  email?: string

  // Business documents
  business_license?: string
  tax_number?: string

  // Status
  status: SellerStatus
  verified_at?: Timestamp

  // Commission
  commission_rate: number // Decimal(5,4)

  created_at: Timestamp
  updated_at: Timestamp
}

export interface Product {
  id: UUID
  seller_id: UUID
  category_id: UUID

  // Product details
  name: string
  slug: string
  description?: string
  short_description?: string

  // Pricing
  price: number // Decimal(15,2)
  member_price?: number // Special price for members
  cost_price?: number // For margin calculation

  // Inventory
  sku?: string
  stock_quantity: number
  min_stock_level: number
  max_order_quantity?: number

  // Physical properties
  weight?: number // in kg
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }

  // Product images
  images?: string[] // Array of image URLs

  // SEO
  meta_title?: string
  meta_description?: string

  // Status & settings
  status: ProductStatus
  is_featured: boolean
  is_digital: boolean
  requires_shipping: boolean

  // Dates
  available_from?: Timestamp
  available_until?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}

export interface ProductVariant {
  id: UUID
  product_id: UUID
  name: string // "Size: L", "Color: Red"
  value: string
  price_adjustment: number // Decimal(15,2)
  stock_quantity: number
  sku?: string
  is_active: boolean
  created_at: Timestamp
}

export interface Order {
  id: UUID
  member_id: UUID
  order_number: string

  // Order totals
  subtotal: number // Decimal(15,2)
  tax_amount: number // Decimal(15,2)
  shipping_amount: number // Decimal(15,2)
  discount_amount: number // Decimal(15,2)
  total_amount: number // Decimal(15,2)

  // Status
  status: OrderStatus
  payment_status: PaymentStatus

  // Addresses
  shipping_address: {
    recipient_name: string
    phone: string
    address: string
    city: string
    province: string
    postal_code: string
    notes?: string
  }

  // Payment
  payment_method?: string
  payment_reference?: string
  paid_at?: Timestamp

  // Shipping
  shipping_method?: string
  tracking_number?: string
  shipped_at?: Timestamp
  delivered_at?: Timestamp

  // Notes
  customer_notes?: string
  admin_notes?: string

  created_at: Timestamp
  updated_at: Timestamp
}

export interface OrderItem {
  id: UUID
  order_id: UUID
  product_id: UUID
  product_variant_id?: UUID

  // Product snapshot (at time of order)
  product_name: string
  product_sku?: string
  variant_name?: string

  // Pricing
  unit_price: number // Decimal(15,2)
  quantity: number
  total_price: number // Decimal(15,2)

  // Commission
  commission_rate: number // Decimal(5,4)
  commission_amount: number // Decimal(15,2)

  // Status
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
  created_at: Timestamp
}

// =====================================================
// EXTENDED TYPES WITH RELATIONSHIPS
// =====================================================

export interface MemberWithDetails extends Member {
  documents?: MemberDocument[]
  referrer?: Pick<Member, 'id' | 'full_name' | 'member_number'>
  referred_members?: Pick<Member, 'id' | 'full_name' | 'member_number'>[]
  savings_accounts?: SavingsAccountWithDetails[]
  total_savings?: number
  total_transactions?: number
}

export interface SavingsAccountWithDetails extends SavingsAccount {
  savings_type: SavingsType
  member: Pick<Member, 'id' | 'full_name' | 'member_number'>
  time_deposit?: TimeDeposit
  recent_transactions?: TransactionWithDetails[]
}

export interface TransactionWithDetails extends Transaction {
  transaction_type: TransactionType
  savings_account?: SavingsAccount & {
    savings_type: SavingsType
  }
  member: Pick<Member, 'id' | 'full_name' | 'member_number'>
  processed_by_member?: Pick<Member, 'id' | 'full_name'>
  related_transaction?: Pick<Transaction, 'id' | 'reference_number' | 'amount'>
}

export interface ProductWithDetails extends Product {
  category: ProductCategory
  seller: Seller & {
    member?: Pick<Member, 'id' | 'full_name' | 'member_number'>
  }
  variants?: ProductVariant[]
  reviews_count?: number
  average_rating?: number
  total_sold?: number
}

export interface OrderWithDetails extends Order {
  member: Pick<Member, 'id' | 'full_name' | 'member_number' | 'email' | 'phone'>
  items: (OrderItem & {
    product: Pick<Product, 'id' | 'name' | 'images' | 'seller_id'>
    product_variant?: Pick<ProductVariant, 'id' | 'name' | 'value'>
  })[]
  total_items: number
  seller_info?: {
    seller_id: UUID
    business_name: string
    commission_total: number
  }[]
}

// =====================================================
// DATABASE SCHEMA TYPE
// =====================================================

export interface Database {
  public: {
    Tables: {
      // Authentication & Membership
      members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'created_at' | 'updated_at' | 'member_number' | 'referral_code'>
        Update: Partial<Omit<Member, 'id' | 'created_at' | 'member_number' | 'referral_code'>>
      }
      member_documents: {
        Row: MemberDocument
        Insert: Omit<MemberDocument, 'id' | 'created_at' | 'verified_at' | 'verified_by'>
        Update: Partial<Omit<MemberDocument, 'id' | 'created_at' | 'member_id'>>
      }
      referrals: {
        Row: Referral
        Insert: Omit<Referral, 'id' | 'created_at'>
        Update: Partial<Omit<Referral, 'id' | 'created_at' | 'referrer_id' | 'referred_id'>>
      }

      // Savings & Financial
      savings_types: {
        Row: SavingsType
        Insert: Omit<SavingsType, 'id' | 'created_at'>
        Update: Partial<Omit<SavingsType, 'id' | 'created_at' | 'code'>>
      }
      savings_accounts: {
        Row: SavingsAccount
        Insert: Omit<SavingsAccount, 'id' | 'created_at' | 'updated_at' | 'account_number' | 'balance' | 'opened_at'>
        Update: Partial<Omit<SavingsAccount, 'id' | 'created_at' | 'member_id' | 'savings_type_id' | 'account_number'>>
      }
      time_deposits: {
        Row: TimeDeposit
        Insert: Omit<TimeDeposit, 'id' | 'created_at' | 'status'>
        Update: Partial<Omit<TimeDeposit, 'id' | 'created_at' | 'savings_account_id' | 'principal_amount'>>
      }
      transaction_types: {
        Row: TransactionType
        Insert: Omit<TransactionType, 'id' | 'created_at'>
        Update: Partial<Omit<TransactionType, 'id' | 'created_at' | 'code'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at' | 'reference_number' | 'balance_before' | 'balance_after' | 'processed_at'>
        Update: Partial<Omit<Transaction, 'id' | 'created_at' | 'member_id' | 'reference_number'>>
      }
      shu_distributions: {
        Row: ShuDistribution
        Insert: Omit<ShuDistribution, 'id' | 'created_at'>
        Update: Partial<Omit<ShuDistribution, 'id' | 'created_at' | 'year'>>
      }
      shu_allocations: {
        Row: ShuAllocation
        Insert: Omit<ShuAllocation, 'id' | 'created_at' | 'distributed_at'>
        Update: Partial<Omit<ShuAllocation, 'id' | 'created_at' | 'distribution_id' | 'member_id'>>
      }

      // Marketplace & E-commerce
      product_categories: {
        Row: ProductCategory
        Insert: Omit<ProductCategory, 'id' | 'created_at'>
        Update: Partial<Omit<ProductCategory, 'id' | 'created_at'>>
      }
      sellers: {
        Row: Seller
        Insert: Omit<Seller, 'id' | 'created_at' | 'updated_at' | 'verified_at'>
        Update: Partial<Omit<Seller, 'id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'seller_id'>>
      }
      product_variants: {
        Row: ProductVariant
        Insert: Omit<ProductVariant, 'id' | 'created_at'>
        Update: Partial<Omit<ProductVariant, 'id' | 'created_at' | 'product_id'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_number' | 'paid_at' | 'shipped_at' | 'delivered_at'>
        Update: Partial<Omit<Order, 'id' | 'created_at' | 'member_id' | 'order_number'>>
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id' | 'created_at'>
        Update: Partial<Omit<OrderItem, 'id' | 'created_at' | 'order_id' | 'product_id'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      gender: Gender
      membership_status: MembershipStatus
      membership_type: MembershipType
      kyc_status: KycStatus
      verification_status: VerificationStatus
      document_type: DocumentType
      transaction_status: TransactionStatus
      payment_method: PaymentMethod
      transaction_category: TransactionCategory
      account_status: AccountStatus
      distribution_status: DistributionStatus
      distribution_method: DistributionMethod
      referral_status: ReferralStatus
      business_type: BusinessType
      seller_status: SellerStatus
      product_status: ProductStatus
      order_status: OrderStatus
      payment_status: PaymentStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =====================================================
// UTILITY TYPES
// =====================================================

// Table type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Table names as union type
export type TableName = keyof Database['public']['Tables']

// Function to get table type
export type GetTableType<T extends TableName> = Database['public']['Tables'][T]['Row']

// Relationship helpers
export type MemberRelations = {
  documents: MemberDocument[]
  savings_accounts: SavingsAccount[]
  transactions: Transaction[]
  referrals_given: Referral[]
  referrals_received: Referral[]
  orders: Order[]
}

export type SavingsAccountRelations = {
  member: Member
  savings_type: SavingsType
  transactions: Transaction[]
  time_deposit?: TimeDeposit
}

export type ProductRelations = {
  category: ProductCategory
  seller: Seller
  variants: ProductVariant[]
  order_items: OrderItem[]
}

export type OrderRelations = {
  member: Member
  items: OrderItem[]
}

// Query result types
export interface QueryResult<T> {
  data: T | null
  error: Error | null
}

export interface QueryListResult<T> {
  data: T[] | null
  error: Error | null
  count?: number
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// Filter and search types
export interface FilterOptions {
  [key: string]: any
}

export interface SortOptions {
  column: string
  order: 'asc' | 'desc'
}

export interface SearchOptions {
  query?: string
  fields?: string[]
  filters?: FilterOptions
  sort?: SortOptions[]
  pagination?: PaginationParams
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginatedResponse<T>['pagination']
}

// Audit and system types
export interface AuditLog {
  id: UUID
  table_name: string
  record_id: UUID
  operation: 'create' | 'read' | 'update' | 'delete'
  old_values?: Json
  new_values?: Json
  user_id?: UUID
  ip_address?: string
  user_agent?: string
  created_at: Timestamp
}

// Statistics and summary types
export interface MemberStats {
  total_members: number
  active_members: number
  pending_members: number
  verified_members: number
  total_referrals: number
  new_members_this_month: number
  growth_rate: number
}

export interface SavingsStats {
  total_accounts: number
  total_balance: number
  total_deposits_today: number
  total_withdrawals_today: number
  pending_transactions: number
  by_type: {
    savings_type_id: UUID
    type_name: string
    account_count: number
    total_balance: number
  }[]
}

export interface MarketplaceStats {
  total_products: number
  active_products: number
  total_orders: number
  pending_orders: number
  total_sales: number
  total_commission: number
  top_categories: {
    category_id: UUID
    category_name: string
    product_count: number
    sales_amount: number
  }[]
  top_sellers: {
    seller_id: UUID
    business_name: string
    product_count: number
    sales_amount: number
  }[]
}

// Export all types as default
export default Database