-- =====================================================
-- KOPERASI SINOMAN SUPERAPP - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Version: 1.0
-- Date: September 2025
-- Description: Complete Supabase database schema for Koperasi Sinoman digital platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. AUTHENTICATION & MEMBERSHIP TABLES
-- =====================================================

-- Core member data
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    member_number VARCHAR(20) UNIQUE NOT NULL, -- Format: SIN-YYYY-XXXXXX

    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    nik VARCHAR(16) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),

    -- Address
    address TEXT NOT NULL,
    village VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Ponorogo',
    province VARCHAR(100) DEFAULT 'Jawa Timur',
    postal_code VARCHAR(10),

    -- Membership Details
    membership_type VARCHAR(20) DEFAULT 'regular' CHECK (membership_type IN ('regular', 'investor', 'premium')),
    membership_status VARCHAR(20) DEFAULT 'pending' CHECK (membership_status IN ('pending', 'active', 'suspended', 'inactive')),
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- KYC & Verification
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    kyc_verified_by UUID REFERENCES members(id),

    -- Profile
    profile_picture_url TEXT,
    bio TEXT,
    occupation VARCHAR(100),

    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Referral
    referred_by UUID REFERENCES members(id),
    referral_code VARCHAR(10) UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8))
);

-- Member documents for KYC
CREATE TABLE member_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('ktp', 'selfie', 'kk', 'npwp', 'bank_statement')),
    document_url TEXT NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES members(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral tracking
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    referral_bonus DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_id) -- Each member can only be referred once
);

-- =====================================================
-- 2. SAVINGS & FINANCIAL TABLES
-- =====================================================

-- Savings account types
CREATE TABLE savings_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- 'Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela', 'Simpanan Berjangka'
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    minimum_amount DECIMAL(15,2) DEFAULT 0,
    is_withdrawable BOOLEAN DEFAULT true,
    is_mandatory BOOLEAN DEFAULT false,
    interest_rate DECIMAL(5,4) DEFAULT 0, -- Annual percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member savings accounts
CREATE TABLE savings_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    savings_type_id UUID NOT NULL REFERENCES savings_types(id),
    account_number VARCHAR(20) UNIQUE NOT NULL, -- Format: SA-YYYY-XXXXXX
    balance DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, savings_type_id)
);

-- Time deposit (Simpanan Berjangka) details
CREATE TABLE time_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    savings_account_id UUID NOT NULL REFERENCES savings_accounts(id) ON DELETE CASCADE,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,4) NOT NULL,
    term_months INTEGER NOT NULL CHECK (term_months IN (3, 6, 12, 24)),
    maturity_date DATE NOT NULL,
    auto_rollover BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matured', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction types
CREATE TABLE transaction_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('deposit', 'withdrawal', 'transfer', 'fee', 'interest', 'bonus')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    savings_account_id UUID REFERENCES savings_accounts(id),
    transaction_type_id UUID NOT NULL REFERENCES transaction_types(id),

    -- Transaction details
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2),
    balance_after DECIMAL(15,2),
    description TEXT,
    notes TEXT,

    -- Payment details
    payment_method VARCHAR(50), -- 'bank_transfer', 'virtual_account', 'cash', 'qris'
    payment_reference TEXT,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

    -- System tracking
    processed_by UUID REFERENCES members(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Related transaction (for transfers)
    related_transaction_id UUID REFERENCES transactions(id)
);

-- SHU (Sisa Hasil Usaha) distribution
CREATE TABLE shu_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    total_shu DECIMAL(15,2) NOT NULL,
    distribution_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'distributed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual SHU allocations
CREATE TABLE shu_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distribution_id UUID NOT NULL REFERENCES shu_distributions(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id),

    -- Calculation base
    savings_balance DECIMAL(15,2),
    transaction_volume DECIMAL(15,2),
    participation_score DECIMAL(5,2), -- 0-100

    -- SHU amount
    shu_amount DECIMAL(15,2) NOT NULL,
    distribution_method VARCHAR(20) DEFAULT 'savings' CHECK (distribution_method IN ('savings', 'cash', 'reinvest')),

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'distributed', 'failed')),
    distributed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. MARKETPLACE & E-COMMERCE TABLES
-- =====================================================

-- Product categories
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sellers/vendors
CREATE TABLE sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id), -- NULL if koperasi store
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) CHECK (business_type IN ('koperasi', 'umkm', 'individual')),
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),

    -- Business documents
    business_license TEXT,
    tax_number VARCHAR(50),

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Commission
    commission_rate DECIMAL(5,4) DEFAULT 0.05, -- 5%

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES sellers(id),
    category_id UUID NOT NULL REFERENCES product_categories(id),

    -- Product details
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,

    -- Pricing
    price DECIMAL(15,2) NOT NULL,
    member_price DECIMAL(15,2), -- Special price for members
    cost_price DECIMAL(15,2), -- For margin calculation

    -- Inventory
    sku VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    max_order_quantity INTEGER,

    -- Physical properties
    weight DECIMAL(10,3), -- in kg
    dimensions JSON, -- {length, width, height}

    -- Product images
    images JSON, -- Array of image URLs

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,

    -- Status & settings
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'discontinued')),
    is_featured BOOLEAN DEFAULT false,
    is_digital BOOLEAN DEFAULT false,
    requires_shipping BOOLEAN DEFAULT true,

    -- Dates
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants (for size, color, etc.)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- "Size: L", "Color: Red"
    value VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(15,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    sku VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping carts
CREATE TABLE shopping_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    session_id TEXT, -- For guest users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cart_id, product_id, variant_id)
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- Format: ORD-YYYY-XXXXXX

    -- Order totals
    subtotal DECIMAL(15,2) NOT NULL,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

    -- Shipping details
    shipping_address JSON NOT NULL, -- Full address object
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),

    -- Payment details
    payment_method VARCHAR(50),
    payment_reference TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Dates
    expected_delivery_date DATE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    seller_id UUID NOT NULL REFERENCES sellers(id),

    -- Product details at time of order
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,

    -- Commission
    commission_rate DECIMAL(5,4),
    commission_amount DECIMAL(15,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. FIT CHALLENGE TABLES
-- =====================================================

-- Fit challenge programs/batches
CREATE TABLE fit_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Program details
    duration_weeks INTEGER DEFAULT 8,
    max_participants INTEGER DEFAULT 100,
    fee DECIMAL(15,2) NOT NULL DEFAULT 600000,

    -- Schedule
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE NOT NULL,

    -- Locations and trainers
    locations JSON, -- Array of gym locations
    trainers JSON, -- Array of trainer info

    -- Status
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'ongoing', 'completed', 'cancelled')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participant registrations
CREATE TABLE fit_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    challenge_id UUID NOT NULL REFERENCES fit_challenges(id) ON DELETE CASCADE,

    -- Registration details
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    payment_reference TEXT,

    -- Initial measurements
    initial_weight DECIMAL(5,2),
    initial_body_fat DECIMAL(5,2),
    initial_muscle_mass DECIMAL(5,2),
    initial_photos JSON, -- URLs to before photos

    -- Goals
    target_weight DECIMAL(5,2),
    target_body_fat DECIMAL(5,2),
    personal_goals TEXT,

    -- Completion status
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'completed', 'dropped_out')),
    completion_date TIMESTAMP WITH TIME ZONE,
    final_score DECIMAL(5,2), -- 0-100

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, challenge_id)
);

-- Daily check-ins and progress tracking
CREATE TABLE fit_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES fit_participants(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,

    -- Measurements
    weight DECIMAL(5,2),
    body_fat DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),

    -- Activities
    workout_completed BOOLEAN DEFAULT false,
    workout_type VARCHAR(100),
    workout_duration INTEGER, -- minutes
    calories_burned INTEGER,

    -- Nutrition
    meals_logged INTEGER DEFAULT 0,
    water_intake DECIMAL(5,2), -- liters

    -- Progress photos
    photos JSON, -- URLs to progress photos

    -- Notes
    notes TEXT,
    mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),

    -- Points earned
    points_earned INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, check_in_date)
);

-- Fit challenge leaderboard (computed/cached)
CREATE TABLE fit_leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES fit_challenges(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES fit_participants(id) ON DELETE CASCADE,

    -- Scoring
    total_points INTEGER DEFAULT 0,
    weight_loss_score DECIMAL(5,2) DEFAULT 0,
    consistency_score DECIMAL(5,2) DEFAULT 0,
    improvement_score DECIMAL(5,2) DEFAULT 0,

    -- Rankings
    current_rank INTEGER,
    previous_rank INTEGER,

    -- Last updated
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(challenge_id, participant_id)
);

-- =====================================================
-- 5. BANK SAMPAH INTEGRATION TABLES
-- =====================================================

-- Bank Sampah units/locations
CREATE TABLE bank_sampah_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT NOT NULL,

    -- Contact info
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_name VARCHAR(255),

    -- Operational details
    operational_hours JSON, -- Operating schedule
    capacity_kg DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'construction', 'operational', 'maintenance', 'closed')),

    -- Financial
    investment_amount DECIMAL(15,2),
    monthly_revenue DECIMAL(15,2),
    monthly_expenses DECIMAL(15,2),

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member participation in Bank Sampah (read-only from Bank Sampah App)
CREATE TABLE bank_sampah_member_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    unit_id UUID NOT NULL REFERENCES bank_sampah_units(id),

    -- Summary data (synced from Bank Sampah App)
    total_weight_kg DECIMAL(10,2) DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    total_earnings DECIMAL(15,2) DEFAULT 0,

    -- Environmental impact
    co2_saved_kg DECIMAL(10,2) DEFAULT 0,
    trees_equivalent INTEGER DEFAULT 0,

    -- Last activity
    last_deposit_date DATE,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(member_id, unit_id)
);

-- Investment in Bank Sampah units
CREATE TABLE bank_sampah_investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID NOT NULL REFERENCES members(id),
    unit_id UUID NOT NULL REFERENCES bank_sampah_units(id),

    -- Investment details
    investment_amount DECIMAL(15,2) NOT NULL,
    investment_date DATE NOT NULL,
    expected_roi_percentage DECIMAL(5,2), -- Annual ROI

    -- Returns tracking
    total_returns DECIMAL(15,2) DEFAULT 0,
    last_payout_date DATE,

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'defaulted')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. POINTS & REWARDS SYSTEM
-- =====================================================

-- Point earning rules
CREATE TABLE point_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50) NOT NULL, -- 'referral', 'purchase', 'fit_checkin', 'bank_sampah'
    points_per_action INTEGER NOT NULL,
    maximum_per_day INTEGER,
    maximum_per_month INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member points balance
CREATE TABLE member_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) UNIQUE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    redeemed_points INTEGER DEFAULT 0,
    expired_points INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Point transactions
CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),

    -- Transaction details
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
    points_amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,

    -- Source/reason
    source_type VARCHAR(50), -- 'referral', 'purchase', 'fit_checkin', 'bank_sampah', 'manual'
    source_id UUID, -- Reference to related record
    description TEXT,

    -- Expiry (for earned points)
    expires_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards catalog
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type VARCHAR(50) CHECK (reward_type IN ('product', 'discount', 'cashback', 'service')),

    -- Reward details
    value DECIMAL(15,2), -- Monetary value
    product_id UUID REFERENCES products(id), -- If product reward
    discount_percentage DECIMAL(5,2), -- If discount reward

    -- Availability
    stock_quantity INTEGER,
    max_redemptions_per_member INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,

    -- Validity
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Point redemptions
CREATE TABLE point_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    reward_id UUID NOT NULL REFERENCES rewards(id),

    -- Redemption details
    points_spent INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'fulfilled', 'cancelled')),

    -- Fulfillment
    fulfillment_reference TEXT,
    fulfilled_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. NOTIFICATIONS & COMMUNICATIONS
-- =====================================================

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'email', 'whatsapp', 'push', 'sms'
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables JSON, -- Template variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sent notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id),
    template_id UUID REFERENCES notification_templates(id),

    -- Notification details
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,

    -- Delivery
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),

    -- Tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Related data
    related_type VARCHAR(50), -- 'transaction', 'order', 'fit_challenge'
    related_id UUID,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. SYSTEM ADMINISTRATION
-- =====================================================

-- Admin users (extends members table)
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'finance', 'customer_service', 'manager')),
    permissions JSON, -- Array of permission strings
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES members(id),

    -- Action details
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,

    -- Changes
    old_values JSON,
    new_values JSON,

    -- Context
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES members(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- Members indexes
CREATE INDEX idx_members_member_number ON members(member_number);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_nik ON members(nik);
CREATE INDEX idx_members_status ON members(membership_status);
CREATE INDEX idx_members_referred_by ON members(referred_by);

-- Savings indexes
CREATE INDEX idx_savings_accounts_member_id ON savings_accounts(member_id);
CREATE INDEX idx_savings_accounts_type_id ON savings_accounts(savings_type_id);

-- Transactions indexes
CREATE INDEX idx_transactions_member_id ON transactions(member_id);
CREATE INDEX idx_transactions_account_id ON savings_accounts(id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_reference ON transactions(reference_number);

-- Products indexes
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(is_featured);

-- Orders indexes
CREATE INDEX idx_orders_member_id ON orders(member_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Fit challenge indexes
CREATE INDEX idx_fit_participants_member_id ON fit_participants(member_id);
CREATE INDEX idx_fit_participants_challenge_id ON fit_participants(challenge_id);
CREATE INDEX idx_fit_checkins_participant_id ON fit_check_ins(participant_id);
CREATE INDEX idx_fit_checkins_date ON fit_check_ins(check_in_date);

-- Points indexes
CREATE INDEX idx_point_transactions_member_id ON point_transactions(member_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_member_id ON notifications(member_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fit_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Members can only see their own data
CREATE POLICY "Members can view own profile" ON members
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Members can update own profile" ON members
    FOR UPDATE USING (auth_user_id = auth.uid());

-- Savings accounts - members can only see their own
CREATE POLICY "Members can view own savings" ON savings_accounts
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Transactions - members can only see their own
CREATE POLICY "Members can view own transactions" ON transactions
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Orders - members can only see their own
CREATE POLICY "Members can view own orders" ON orders
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Admin access policies (to be refined based on roles)
CREATE POLICY "Admins can view all data" ON members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            JOIN members m ON au.member_id = m.id
            WHERE m.auth_user_id = auth.uid() AND au.is_active = true
        )
    );

-- =====================================================
-- 11. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_accounts_updated_at BEFORE UPDATE ON savings_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique member numbers
CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    new_member_number VARCHAR(20);
BEGIN
    -- Get the next sequence number for this year
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(member_number FROM 9) AS INTEGER)), 0
    ) + 1 INTO next_num
    FROM members
    WHERE member_number LIKE 'SIN-' || EXTRACT(YEAR FROM NOW()) || '-%';

    -- Format: SIN-YYYY-XXXXXX (6 digits, zero-padded)
    new_member_number := 'SIN-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(next_num::TEXT, 6, '0');

    NEW.member_number := new_member_number;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-generate member numbers
CREATE TRIGGER generate_member_number_trigger
    BEFORE INSERT ON members
    FOR EACH ROW
    WHEN (NEW.member_number IS NULL OR NEW.member_number = '')
    EXECUTE FUNCTION generate_member_number();

-- Function to update member points balance
CREATE OR REPLACE FUNCTION update_member_points_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert member points balance
    INSERT INTO member_points (member_id, total_points, available_points, last_updated)
    VALUES (NEW.member_id, NEW.points_amount, NEW.points_amount, NOW())
    ON CONFLICT (member_id) DO UPDATE SET
        total_points = CASE
            WHEN NEW.transaction_type = 'earned' THEN member_points.total_points + NEW.points_amount
            WHEN NEW.transaction_type = 'redeemed' THEN member_points.total_points
            WHEN NEW.transaction_type = 'expired' THEN member_points.total_points
            ELSE member_points.total_points + NEW.points_amount
        END,
        available_points = CASE
            WHEN NEW.transaction_type = 'earned' THEN member_points.available_points + NEW.points_amount
            WHEN NEW.transaction_type = 'redeemed' THEN member_points.available_points - NEW.points_amount
            WHEN NEW.transaction_type = 'expired' THEN member_points.available_points - NEW.points_amount
            ELSE member_points.available_points
        END,
        redeemed_points = CASE
            WHEN NEW.transaction_type = 'redeemed' THEN member_points.redeemed_points + NEW.points_amount
            ELSE member_points.redeemed_points
        END,
        expired_points = CASE
            WHEN NEW.transaction_type = 'expired' THEN member_points.expired_points + NEW.points_amount
            ELSE member_points.expired_points
        END,
        last_updated = NOW();

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update points balance
CREATE TRIGGER update_member_points_balance_trigger
    AFTER INSERT ON point_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_member_points_balance();

-- =====================================================
-- 12. INITIAL DATA SEEDING
-- =====================================================

-- Insert default savings types
INSERT INTO savings_types (name, code, description, minimum_amount, is_withdrawable, is_mandatory) VALUES
('Simpanan Pokok', 'SP', 'Simpanan wajib saat mendaftar sebagai anggota', 80000, false, true),
('Simpanan Wajib', 'SW', 'Simpanan wajib bulanan', 10000, false, true),
('Simpanan Sukarela', 'SS', 'Simpanan yang dapat ditarik sewaktu-waktu', 10000, true, false),
('Simpanan Berjangka', 'SB', 'Simpanan dengan jangka waktu tertentu', 100000, false, false);

-- Insert default transaction types
INSERT INTO transaction_types (name, code, category, description) VALUES
('Setoran Simpanan Pokok', 'SP_DEPOSIT', 'deposit', 'Setoran simpanan pokok saat mendaftar'),
('Setoran Simpanan Wajib', 'SW_DEPOSIT', 'deposit', 'Setoran simpanan wajib bulanan'),
('Setoran Simpanan Sukarela', 'SS_DEPOSIT', 'deposit', 'Setoran simpanan sukarela'),
('Penarikan Simpanan Sukarela', 'SS_WITHDRAWAL', 'withdrawal', 'Penarikan simpanan sukarela'),
('Setoran Simpanan Berjangka', 'SB_DEPOSIT', 'deposit', 'Setoran simpanan berjangka'),
('Bunga Simpanan', 'INTEREST', 'interest', 'Bunga simpanan berjangka'),
('Pembagian SHU', 'SHU', 'bonus', 'Pembagian Sisa Hasil Usaha'),
('Biaya Admin', 'ADMIN_FEE', 'fee', 'Biaya administrasi'),
('Transfer Antar Anggota', 'TRANSFER', 'transfer', 'Transfer dana antar anggota');

-- Insert default product categories
INSERT INTO product_categories (name, slug, description) VALUES
('Protein Package', 'protein-package', 'Paket protein harian untuk anggota'),
('Fresh Produce', 'fresh-produce', 'Sayuran dan buah-buahan segar'),
('UMKM Products', 'umkm-products', 'Produk dari UMKM lokal Ponorogo'),
('Koperasi Store', 'koperasi-store', 'Sembako dan kebutuhan sehari-hari'),
('Health & Fitness', 'health-fitness', 'Produk kesehatan dan kebugaran');

-- Insert default point rules
INSERT INTO point_rules (name, description, activity_type, points_per_action, maximum_per_day) VALUES
('Referral Bonus', 'Poin bonus untuk setiap referral yang berhasil', 'referral', 1000, 5),
('Purchase Reward', 'Poin reward untuk setiap pembelian (1% dari total)', 'purchase', 1, NULL),
('Fit Challenge Check-in', 'Poin untuk setiap check-in di Fit Challenge', 'fit_checkin', 10, 1),
('Bank Sampah Deposit', 'Poin untuk setiap setoran ke Bank Sampah', 'bank_sampah', 5, NULL),
('Daily Login', 'Poin untuk login harian', 'login', 5, 1);

-- Insert system settings
INSERT INTO system_settings (key, value, description, type, is_public) VALUES
('app_name', 'Koperasi Sinoman', 'Nama aplikasi', 'string', true),
('app_version', '1.0.0', 'Versi aplikasi', 'string', true),
('maintenance_mode', 'false', 'Mode maintenance', 'boolean', false),
('referral_bonus_amount', '50000', 'Bonus referral dalam rupiah', 'number', false),
('max_loan_multiplier', '3', 'Maksimal pinjaman = simpanan x multiplier', 'number', false),
('shu_percentage', '15', 'Persentase SHU dari keuntungan', 'number', false);

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- Grant permissions for app usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON SCHEMA public IS 'Koperasi Sinoman SuperApp Database Schema v1.0';
COMMENT ON TABLE members IS 'Core member data with KYC and profile information';
COMMENT ON TABLE savings_accounts IS 'Member savings accounts for different types of savings';
COMMENT ON TABLE transactions IS 'All financial transactions including deposits, withdrawals, and transfers';
COMMENT ON TABLE products IS 'E-commerce products from koperasi and UMKM partners';
COMMENT ON TABLE orders IS 'Customer orders from the marketplace';
COMMENT ON TABLE fit_challenges IS 'Fitness challenge programs offered by the cooperative';
COMMENT ON TABLE fit_participants IS 'Members participating in fitness challenges';
COMMENT ON TABLE bank_sampah_units IS 'Bank Sampah locations and operational data';
COMMENT ON TABLE member_points IS 'Points balance for gamification and rewards';