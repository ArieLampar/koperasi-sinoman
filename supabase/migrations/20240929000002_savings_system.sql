-- =====================================================
-- SAVINGS & FINANCIAL SYSTEM MIGRATION
-- =====================================================
-- Migration: 20240929000002_savings_system
-- Description: Create savings and financial transaction tables

-- Savings account types
CREATE TABLE savings_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    minimum_amount DECIMAL(15,2) DEFAULT 0,
    is_withdrawable BOOLEAN DEFAULT true,
    is_mandatory BOOLEAN DEFAULT false,
    interest_rate DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member savings accounts
CREATE TABLE savings_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    savings_type_id UUID NOT NULL REFERENCES savings_types(id),
    account_number VARCHAR(20) UNIQUE NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, savings_type_id)
);

-- Time deposit details
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
    payment_method VARCHAR(50),
    payment_reference TEXT,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

    -- System tracking
    processed_by UUID REFERENCES members(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Related transaction
    related_transaction_id UUID REFERENCES transactions(id)
);

-- SHU distribution
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
    participation_score DECIMAL(5,2),

    -- SHU amount
    shu_amount DECIMAL(15,2) NOT NULL,
    distribution_method VARCHAR(20) DEFAULT 'savings' CHECK (distribution_method IN ('savings', 'cash', 'reinvest')),

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'distributed', 'failed')),
    distributed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for savings system
CREATE INDEX idx_savings_accounts_member_id ON savings_accounts(member_id);
CREATE INDEX idx_savings_accounts_type_id ON savings_accounts(savings_type_id);
CREATE INDEX idx_transactions_member_id ON transactions(member_id);
CREATE INDEX idx_transactions_account_id ON transactions(savings_account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_reference ON transactions(reference_number);

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