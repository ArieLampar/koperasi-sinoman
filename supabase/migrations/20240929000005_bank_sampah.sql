-- =====================================================
-- BANK SAMPAH INTEGRATION MIGRATION
-- =====================================================
-- Migration: 20240929000005_bank_sampah
-- Description: Create Bank Sampah integration and investment tracking tables

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
    operational_hours JSON,
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

-- Member participation in Bank Sampah (synced from Bank Sampah App)
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
    expected_roi_percentage DECIMAL(5,2),

    -- Returns tracking
    total_returns DECIMAL(15,2) DEFAULT 0,
    last_payout_date DATE,

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'defaulted')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);