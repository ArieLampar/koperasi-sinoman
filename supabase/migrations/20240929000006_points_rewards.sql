-- =====================================================
-- POINTS & REWARDS SYSTEM MIGRATION
-- =====================================================
-- Migration: 20240929000006_points_rewards
-- Description: Create points, rewards, and gamification tables

-- Point earning rules
CREATE TABLE point_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50) NOT NULL,
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
    source_type VARCHAR(50),
    source_id UUID,
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
    value DECIMAL(15,2),
    product_id UUID REFERENCES products(id),
    discount_percentage DECIMAL(5,2),

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

-- Create indexes for points system
CREATE INDEX idx_point_transactions_member_id ON point_transactions(member_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at);

-- Insert default point rules
INSERT INTO point_rules (name, description, activity_type, points_per_action, maximum_per_day) VALUES
('Referral Bonus', 'Poin bonus untuk setiap referral yang berhasil', 'referral', 1000, 5),
('Purchase Reward', 'Poin reward untuk setiap pembelian (1% dari total)', 'purchase', 1, NULL),
('Fit Challenge Check-in', 'Poin untuk setiap check-in di Fit Challenge', 'fit_checkin', 10, 1),
('Bank Sampah Deposit', 'Poin untuk setiap setoran ke Bank Sampah', 'bank_sampah', 5, NULL),
('Daily Login', 'Poin untuk login harian', 'login', 5, 1);