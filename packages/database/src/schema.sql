-- =====================================================
-- KOPERASI SINOMAN DATABASE SCHEMA - PHASE 1
-- =====================================================
-- Description: Comprehensive database schema for Koperasi Sinoman
-- Version: 1.0.0
-- Created: 2024-09-29
-- Phase: 1 (Core membership and savings functionality)
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

-- Gender options
CREATE TYPE gender_type AS ENUM ('male', 'female');

-- Membership types
CREATE TYPE membership_type AS ENUM ('regular', 'premium', 'investor');

-- Membership status
CREATE TYPE membership_status AS ENUM ('pending', 'active', 'suspended', 'inactive', 'terminated');

-- KYC status
CREATE TYPE kyc_status AS ENUM ('pending', 'in_review', 'verified', 'rejected', 'expired');

-- Savings account types
CREATE TYPE savings_type_code AS ENUM ('POKOK', 'WAJIB', 'SUKARELA', 'BERJANGKA');

-- Savings account status
CREATE TYPE savings_account_status AS ENUM ('active', 'frozen', 'closed');

-- Transaction types
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'transfer', 'adjustment', 'fee', 'interest');

-- Transaction status
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Admin roles
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'manager', 'operator', 'viewer');

-- Referral status
CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'expired');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Members table
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Information
    member_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    nik VARCHAR(16) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_type NOT NULL,

    -- Address Information
    address TEXT NOT NULL,
    village VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,

    -- Membership Information
    membership_type membership_type NOT NULL DEFAULT 'regular',
    membership_status membership_status NOT NULL DEFAULT 'pending',
    registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    activation_date TIMESTAMP WITH TIME ZONE,

    -- KYC Information
    kyc_status kyc_status NOT NULL DEFAULT 'pending',
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    kyc_verified_by UUID,
    kyc_notes TEXT,

    -- Additional Information
    occupation VARCHAR(255),
    monthly_income BIGINT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),

    -- Profile & Preferences
    profile_photo_url TEXT,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID,
    preferences JSONB DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,

    -- Constraints
    CONSTRAINT members_nik_length CHECK (LENGTH(nik) = 16),
    CONSTRAINT members_phone_format CHECK (phone ~ '^(\+62|62|0)[0-9]{8,13}$'),
    CONSTRAINT members_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT members_monthly_income_positive CHECK (monthly_income IS NULL OR monthly_income >= 0),
    CONSTRAINT members_activation_after_registration CHECK (activation_date IS NULL OR activation_date >= registration_date),

    -- Foreign Keys
    FOREIGN KEY (referred_by) REFERENCES members(id) ON DELETE SET NULL,
    FOREIGN KEY (kyc_verified_by) REFERENCES members(id) ON DELETE SET NULL
);

-- KYC Documents table
CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL,

    -- Document Information
    document_type VARCHAR(50) NOT NULL, -- 'ktp', 'selfie', 'signature', 'address_proof'
    document_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,

    -- Verification Information
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    verification_notes TEXT,

    -- Metadata
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT kyc_documents_file_size_positive CHECK (file_size > 0),
    CONSTRAINT kyc_documents_document_type_valid CHECK (document_type IN ('ktp', 'selfie', 'signature', 'address_proof')),

    -- Foreign Keys
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES members(id) ON DELETE SET NULL
);

-- Savings Types table
CREATE TABLE savings_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Type Information
    code savings_type_code UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Rules and Constraints
    minimum_balance BIGINT NOT NULL DEFAULT 0,
    minimum_deposit BIGINT NOT NULL DEFAULT 0,
    maximum_deposit BIGINT,
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    allows_withdrawal BOOLEAN NOT NULL DEFAULT TRUE,
    withdrawal_fee_percentage DECIMAL(5,4) DEFAULT 0,
    withdrawal_fee_fixed BIGINT DEFAULT 0,

    -- Interest Configuration
    annual_interest_rate DECIMAL(5,4) DEFAULT 0,
    interest_calculation_method VARCHAR(20) DEFAULT 'simple', -- 'simple', 'compound'
    interest_payment_frequency VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'

    -- Term Configuration (for BERJANGKA)
    term_months INTEGER,
    early_withdrawal_penalty_percentage DECIMAL(5,4),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,

    -- Constraints
    CONSTRAINT savings_types_minimum_balance_positive CHECK (minimum_balance >= 0),
    CONSTRAINT savings_types_minimum_deposit_positive CHECK (minimum_deposit >= 0),
    CONSTRAINT savings_types_maximum_deposit_valid CHECK (maximum_deposit IS NULL OR maximum_deposit >= minimum_deposit),
    CONSTRAINT savings_types_interest_rate_valid CHECK (annual_interest_rate >= 0 AND annual_interest_rate <= 1),
    CONSTRAINT savings_types_withdrawal_fee_valid CHECK (withdrawal_fee_percentage >= 0 AND withdrawal_fee_percentage <= 1),
    CONSTRAINT savings_types_term_months_valid CHECK (term_months IS NULL OR term_months > 0),
    CONSTRAINT savings_types_penalty_valid CHECK (early_withdrawal_penalty_percentage IS NULL OR (early_withdrawal_penalty_percentage >= 0 AND early_withdrawal_penalty_percentage <= 1))
);

-- Savings Accounts table
CREATE TABLE savings_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL,
    savings_type_id UUID NOT NULL,

    -- Account Information
    account_number VARCHAR(30) UNIQUE NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0,
    status savings_account_status NOT NULL DEFAULT 'active',

    -- Term Savings Information (for BERJANGKA)
    maturity_date DATE,
    auto_renewal BOOLEAN DEFAULT FALSE,

    -- Interest Information
    last_interest_calculation_date DATE,
    total_interest_earned BIGINT DEFAULT 0,

    -- Metadata
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,

    -- Constraints
    CONSTRAINT savings_accounts_balance_positive CHECK (balance >= 0),
    CONSTRAINT savings_accounts_closed_after_opened CHECK (closed_at IS NULL OR closed_at >= opened_at),
    CONSTRAINT savings_accounts_total_interest_positive CHECK (total_interest_earned >= 0),

    -- Foreign Keys
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (savings_type_id) REFERENCES savings_types(id) ON DELETE RESTRICT
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Transaction Basic Information
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    savings_account_id UUID NOT NULL,
    type transaction_type NOT NULL,
    amount BIGINT NOT NULL,

    -- Related Account (for transfers)
    related_account_id UUID,

    -- Balances (for audit trail)
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,

    -- Transaction Details
    description TEXT,
    reference_number VARCHAR(100),
    notes TEXT,

    -- Fee Information
    fee_amount BIGINT DEFAULT 0,
    fee_description TEXT,

    -- Status and Processing
    status transaction_status NOT NULL DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID,

    -- Reversal Information
    is_reversal BOOLEAN NOT NULL DEFAULT FALSE,
    reversed_transaction_id UUID,
    reversal_reason TEXT,

    -- External Reference (for integration)
    external_reference VARCHAR(100),
    channel VARCHAR(50) DEFAULT 'admin', -- 'admin', 'mobile', 'web', 'atm'

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,

    -- Constraints
    CONSTRAINT transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT transactions_fee_amount_positive CHECK (fee_amount >= 0),
    CONSTRAINT transactions_balance_consistency CHECK (
        (type IN ('deposit', 'transfer') AND balance_after = balance_before + amount) OR
        (type IN ('withdrawal', 'fee') AND balance_after = balance_before - amount) OR
        (type = 'adjustment')
    ),
    CONSTRAINT transactions_processed_when_completed CHECK (
        (status = 'completed' AND processed_at IS NOT NULL AND processed_by IS NOT NULL) OR
        (status != 'completed')
    ),

    -- Foreign Keys
    FOREIGN KEY (savings_account_id) REFERENCES savings_accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (related_account_id) REFERENCES savings_accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES members(id) ON DELETE SET NULL,
    FOREIGN KEY (reversed_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- Referrals table
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Referral Information
    referrer_id UUID NOT NULL,
    referred_id UUID NOT NULL,
    referral_code VARCHAR(20) NOT NULL,

    -- Status and Rewards
    status referral_status NOT NULL DEFAULT 'pending',
    reward_amount BIGINT DEFAULT 0,
    reward_paid_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT referrals_different_members CHECK (referrer_id != referred_id),
    CONSTRAINT referrals_reward_amount_positive CHECK (reward_amount >= 0),

    -- Foreign Keys
    FOREIGN KEY (referrer_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Admin Users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Information
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),

    -- Authentication
    password_hash TEXT NOT NULL,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,

    -- Role and Permissions
    role admin_role NOT NULL,
    permissions JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,

    -- Two-Factor Authentication
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret TEXT,
    backup_codes TEXT[],

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,

    -- Constraints
    CONSTRAINT admin_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT admin_users_phone_format CHECK (phone IS NULL OR phone ~ '^(\+62|62|0)[0-9]{8,13}$'),
    CONSTRAINT admin_users_failed_attempts_positive CHECK (failed_login_attempts >= 0),

    -- Foreign Keys
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event Information
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    record_id UUID NOT NULL,

    -- Changes
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],

    -- Actor Information
    actor_type VARCHAR(20) NOT NULL, -- 'member', 'admin', 'system'
    actor_id UUID,
    actor_email VARCHAR(255),

    -- Request Context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),

    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT audit_logs_operation_valid CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    CONSTRAINT audit_logs_actor_type_valid CHECK (actor_type IN ('member', 'admin', 'system'))
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Members indexes
CREATE INDEX idx_members_member_number ON members(member_number);
CREATE INDEX idx_members_nik ON members(nik);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_membership_status ON members(membership_status);
CREATE INDEX idx_members_kyc_status ON members(kyc_status);
CREATE INDEX idx_members_referral_code ON members(referral_code);
CREATE INDEX idx_members_referred_by ON members(referred_by);
CREATE INDEX idx_members_created_at ON members(created_at);
CREATE INDEX idx_members_full_name_gin ON members USING GIN (to_tsvector('indonesian', full_name));

-- KYC Documents indexes
CREATE INDEX idx_kyc_documents_member_id ON kyc_documents(member_id);
CREATE INDEX idx_kyc_documents_document_type ON kyc_documents(document_type);
CREATE INDEX idx_kyc_documents_is_verified ON kyc_documents(is_verified);
CREATE INDEX idx_kyc_documents_uploaded_at ON kyc_documents(uploaded_at);

-- Savings Types indexes
CREATE INDEX idx_savings_types_code ON savings_types(code);
CREATE INDEX idx_savings_types_is_active ON savings_types(is_active);
CREATE INDEX idx_savings_types_sort_order ON savings_types(sort_order);

-- Savings Accounts indexes
CREATE INDEX idx_savings_accounts_member_id ON savings_accounts(member_id);
CREATE INDEX idx_savings_accounts_savings_type_id ON savings_accounts(savings_type_id);
CREATE INDEX idx_savings_accounts_account_number ON savings_accounts(account_number);
CREATE INDEX idx_savings_accounts_status ON savings_accounts(status);
CREATE INDEX idx_savings_accounts_opened_at ON savings_accounts(opened_at);
CREATE INDEX idx_savings_accounts_maturity_date ON savings_accounts(maturity_date) WHERE maturity_date IS NOT NULL;

-- Transactions indexes
CREATE INDEX idx_transactions_transaction_number ON transactions(transaction_number);
CREATE INDEX idx_transactions_savings_account_id ON transactions(savings_account_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_processed_at ON transactions(processed_at);
CREATE INDEX idx_transactions_related_account_id ON transactions(related_account_id) WHERE related_account_id IS NOT NULL;
CREATE INDEX idx_transactions_external_reference ON transactions(external_reference) WHERE external_reference IS NOT NULL;
CREATE INDEX idx_transactions_channel ON transactions(channel);

-- Referrals indexes
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_created_at ON referrals(created_at);

-- Admin Users indexes
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX idx_admin_users_last_login_at ON admin_users(last_login_at);

-- Audit Logs indexes
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_actor_type ON audit_logs(actor_type);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate member number
CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS TRIGGER AS $$
DECLARE
    year_str TEXT;
    sequence_num INTEGER;
    new_member_number TEXT;
BEGIN
    -- Get current year
    year_str := EXTRACT(YEAR FROM NOW())::TEXT;

    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(member_number FROM 10 FOR 6) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM members
    WHERE member_number LIKE 'SIN-' || year_str || '-%';

    -- Generate new member number
    new_member_number := 'SIN-' || year_str || '-' || LPAD(sequence_num::TEXT, 6, '0');

    NEW.member_number := new_member_number;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate account number
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TRIGGER AS $$
DECLARE
    year_str TEXT;
    sequence_num INTEGER;
    new_account_number TEXT;
BEGIN
    -- Get current year
    year_str := EXTRACT(YEAR FROM NOW())::TEXT;

    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(account_number FROM 4 FOR 10) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM savings_accounts
    WHERE account_number LIKE 'SA-' || year_str || '%';

    -- Generate new account number
    new_account_number := 'SA-' || year_str || LPAD(sequence_num::TEXT, 10, '0');

    NEW.account_number := new_account_number;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TRIGGER AS $$
DECLARE
    date_str TEXT;
    sequence_num INTEGER;
    new_transaction_number TEXT;
BEGIN
    -- Get current date in YYYYMMDD format
    date_str := TO_CHAR(NOW(), 'YYYYMMDD');

    -- Get next sequence number for this date
    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 12 FOR 8) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM transactions
    WHERE transaction_number LIKE 'TXN-' || date_str || '%';

    -- Generate new transaction number
    new_transaction_number := 'TXN-' || date_str || '-' || LPAD(sequence_num::TEXT, 8, '0');

    NEW.transaction_number := new_transaction_number;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit_logs%ROWTYPE;
    excluded_columns TEXT[] := ARRAY['updated_at'];
    col_name TEXT;
    old_val TEXT;
    new_val TEXT;
    changed_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
    audit_row.id = uuid_generate_v4();
    audit_row.table_name = TG_TABLE_NAME;
    audit_row.operation = TG_OP;
    audit_row.timestamp = NOW();

    -- Set record ID
    IF TG_OP = 'DELETE' THEN
        audit_row.record_id = OLD.id;
        audit_row.old_values = to_jsonb(OLD);
    ELSE
        audit_row.record_id = NEW.id;
        audit_row.new_values = to_jsonb(NEW);
    END IF;

    -- For UPDATE operations, track changed fields
    IF TG_OP = 'UPDATE' THEN
        audit_row.old_values = to_jsonb(OLD);

        -- Compare old and new values to identify changed fields
        FOR col_name IN
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = TG_TABLE_NAME
            AND table_schema = TG_TABLE_SCHEMA
        LOOP
            IF col_name = ANY(excluded_columns) THEN
                CONTINUE;
            END IF;

            EXECUTE format('SELECT ($1).%I::TEXT', col_name) INTO old_val USING OLD;
            EXECUTE format('SELECT ($1).%I::TEXT', col_name) INTO new_val USING NEW;

            IF old_val IS DISTINCT FROM new_val THEN
                changed_fields := array_append(changed_fields, col_name);
            END IF;
        END LOOP;

        audit_row.changed_fields = changed_fields;
    END IF;

    -- Try to get actor information from session variables
    BEGIN
        audit_row.actor_type = COALESCE(current_setting('audit.actor_type', true), 'system');
        audit_row.actor_id = NULLIF(current_setting('audit.actor_id', true), '')::UUID;
        audit_row.actor_email = NULLIF(current_setting('audit.actor_email', true), '');
        audit_row.ip_address = NULLIF(current_setting('audit.ip_address', true), '')::INET;
        audit_row.user_agent = NULLIF(current_setting('audit.user_agent', true), '');
        audit_row.request_id = NULLIF(current_setting('audit.request_id', true), '');
    EXCEPTION WHEN OTHERS THEN
        -- If session variables are not available, use default values
        audit_row.actor_type = 'system';
    END;

    INSERT INTO audit_logs VALUES (audit_row.*);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER tr_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_kyc_documents_updated_at
    BEFORE UPDATE ON kyc_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_savings_types_updated_at
    BEFORE UPDATE ON savings_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_savings_accounts_updated_at
    BEFORE UPDATE ON savings_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply auto-generation triggers
CREATE TRIGGER tr_members_generate_number
    BEFORE INSERT ON members
    FOR EACH ROW
    WHEN (NEW.member_number IS NULL)
    EXECUTE FUNCTION generate_member_number();

CREATE TRIGGER tr_savings_accounts_generate_number
    BEFORE INSERT ON savings_accounts
    FOR EACH ROW
    WHEN (NEW.account_number IS NULL)
    EXECUTE FUNCTION generate_account_number();

CREATE TRIGGER tr_transactions_generate_number
    BEFORE INSERT ON transactions
    FOR EACH ROW
    WHEN (NEW.transaction_number IS NULL)
    EXECUTE FUNCTION generate_transaction_number();

-- Apply audit triggers
CREATE TRIGGER tr_members_audit
    AFTER INSERT OR UPDATE OR DELETE ON members
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER tr_savings_accounts_audit
    AFTER INSERT OR UPDATE OR DELETE ON savings_accounts
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER tr_transactions_audit
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER tr_admin_users_audit
    AFTER INSERT OR UPDATE OR DELETE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Members policies
CREATE POLICY "Members can view their own data" ON members
    FOR SELECT USING (auth.uid()::TEXT = id::TEXT);

CREATE POLICY "Members can update their own profile" ON members
    FOR UPDATE USING (auth.uid()::TEXT = id::TEXT)
    WITH CHECK (auth.uid()::TEXT = id::TEXT);

CREATE POLICY "Admins can manage all members" ON members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id::TEXT = auth.uid()::TEXT
            AND is_active = true
            AND role IN ('super_admin', 'admin', 'manager')
        )
    );

-- KYC Documents policies
CREATE POLICY "Members can view their own KYC documents" ON kyc_documents
    FOR SELECT USING (
        member_id::TEXT = auth.uid()::TEXT
    );

CREATE POLICY "Members can upload their own KYC documents" ON kyc_documents
    FOR INSERT WITH CHECK (
        member_id::TEXT = auth.uid()::TEXT
    );

CREATE POLICY "Admins can manage all KYC documents" ON kyc_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id::TEXT = auth.uid()::TEXT
            AND is_active = true
            AND role IN ('super_admin', 'admin', 'manager')
        )
    );

-- Savings Types policies (read-only for members)
CREATE POLICY "Everyone can view active savings types" ON savings_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage savings types" ON savings_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id::TEXT = auth.uid()::TEXT
            AND is_active = true
            AND role IN ('super_admin', 'admin')
        )
    );

-- Savings Accounts policies
CREATE POLICY "Members can view their own savings accounts" ON savings_accounts
    FOR SELECT USING (
        member_id::TEXT = auth.uid()::TEXT
    );

CREATE POLICY "Admins can manage all savings accounts" ON savings_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id::TEXT = auth.uid()::TEXT
            AND is_active = true
            AND role IN ('super_admin', 'admin', 'manager', 'operator')
        )
    );

-- Transactions policies
CREATE POLICY "Members can view their own transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM savings_accounts sa
            WHERE sa.id = savings_account_id
            AND sa.member_id::TEXT = auth.uid()::TEXT
        )
    );

CREATE POLICY "Admins can manage all transactions" ON transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id::TEXT = auth.uid()::TEXT
            AND is_active = true
            AND role IN ('super_admin', 'admin', 'manager', 'operator')
        )
    );

-- Referrals policies
CREATE POLICY "Members can view their own referrals" ON referrals
    FOR SELECT USING (
        referrer_id::TEXT = auth.uid()::TEXT
        OR referred_id::TEXT = auth.uid()::TEXT
    );

CREATE POLICY "Members can create referrals as referrer" ON referrals
    FOR INSERT WITH CHECK (
        referrer_id::TEXT = auth.uid()::TEXT
    );

CREATE POLICY "Admins can manage all referrals" ON referrals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id::TEXT = auth.uid()::TEXT
            AND is_active = true
            AND role IN ('super_admin', 'admin', 'manager')
        )
    );

-- Admin Users policies
CREATE POLICY "Admins can view admin users based on role hierarchy" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id::TEXT = auth.uid()::TEXT
            AND au.is_active = true
            AND (
                au.role = 'super_admin' OR
                (au.role = 'admin' AND admin_users.role NOT IN ('super_admin')) OR
                (au.role = 'manager' AND admin_users.role IN ('operator', 'viewer')) OR
                admin_users.id::TEXT = auth.uid()::TEXT
            )
        )
    );

CREATE POLICY "Only super admins can create/modify admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id::TEXT = auth.uid()::TEXT
            AND is_active = true
            AND role = 'super_admin'
        )
    );

-- Audit Logs policies (read-only for admins)
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id::TEXT = auth.uid()::TEXT
            AND is_active = true
            AND role IN ('super_admin', 'admin', 'manager')
        )
    );

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default savings types
INSERT INTO savings_types (code, name, description, minimum_balance, minimum_deposit, is_mandatory, allows_withdrawal, annual_interest_rate, is_active, sort_order) VALUES
('POKOK', 'Simpanan Pokok', 'Simpanan pokok yang wajib dibayar saat menjadi anggota', 100000, 100000, true, false, 0.0000, true, 1),
('WAJIB', 'Simpanan Wajib', 'Simpanan wajib bulanan yang harus dibayar setiap bulan', 0, 25000, true, false, 0.0500, true, 2),
('SUKARELA', 'Simpanan Sukarela', 'Simpanan sukarela yang dapat ditarik sewaktu-waktu', 10000, 10000, false, true, 0.0300, true, 3),
('BERJANGKA', 'Simpanan Berjangka', 'Simpanan dengan jangka waktu tertentu dan bunga lebih tinggi', 1000000, 1000000, false, false, 0.0800, true, 4);

-- Update BERJANGKA savings type with term configuration
UPDATE savings_types
SET
    term_months = 12,
    early_withdrawal_penalty_percentage = 0.0200,
    interest_calculation_method = 'compound',
    interest_payment_frequency = 'monthly'
WHERE code = 'BERJANGKA';

-- Create default super admin (password should be changed on first login)
INSERT INTO admin_users (email, full_name, role, password_hash, must_change_password, is_active, is_verified) VALUES
('admin@koperasi-sinoman.com', 'System Administrator', 'super_admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrmu.K6', true, true, true);

-- Add comments to tables
COMMENT ON TABLE members IS 'Tabel anggota koperasi dengan informasi lengkap dan status KYC';
COMMENT ON TABLE kyc_documents IS 'Dokumen KYC yang diupload oleh anggota untuk verifikasi';
COMMENT ON TABLE savings_types IS 'Jenis-jenis simpanan yang tersedia di koperasi';
COMMENT ON TABLE savings_accounts IS 'Rekening simpanan anggota untuk setiap jenis simpanan';
COMMENT ON TABLE transactions IS 'Transaksi keuangan pada rekening simpanan';
COMMENT ON TABLE referrals IS 'Program referral anggota untuk mendapatkan anggota baru';
COMMENT ON TABLE admin_users IS 'Pengguna admin sistem dengan berbagai tingkat akses';
COMMENT ON TABLE audit_logs IS 'Log audit untuk melacak semua perubahan data penting';

-- =====================================================
-- END OF SCHEMA
-- =====================================================