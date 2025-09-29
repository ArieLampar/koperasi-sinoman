-- =====================================================
-- KOPERASI SINOMAN SUPERAPP - INITIAL SCHEMA MIGRATION
-- =====================================================
-- Migration: 20240929000001_initial_schema
-- Description: Create core tables for Koperasi Sinoman SuperApp

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- RESET EXISTING SCHEMA (IF ANY)
-- =====================================================
-- Drop existing tables to ensure clean migration
DROP TABLE IF EXISTS shu_allocations CASCADE;
DROP TABLE IF EXISTS shu_distributions CASCADE;
DROP TABLE IF EXISTS time_deposits CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS shopping_carts CASCADE;
DROP TABLE IF EXISTS fit_check_ins CASCADE;
DROP TABLE IF EXISTS fit_leaderboard CASCADE;
DROP TABLE IF EXISTS fit_participants CASCADE;
DROP TABLE IF EXISTS fit_challenges CASCADE;
DROP TABLE IF EXISTS bank_sampah_investments CASCADE;
DROP TABLE IF EXISTS bank_sampah_member_summary CASCADE;
DROP TABLE IF EXISTS bank_sampah_units CASCADE;
DROP TABLE IF EXISTS point_redemptions CASCADE;
DROP TABLE IF EXISTS point_transactions CASCADE;
DROP TABLE IF EXISTS point_rules CASCADE;
DROP TABLE IF EXISTS member_points CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS savings_accounts CASCADE;
DROP TABLE IF EXISTS savings_types CASCADE;
DROP TABLE IF EXISTS transaction_types CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS sellers CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS member_documents CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- =====================================================
-- AUTHENTICATION & MEMBERSHIP TABLES
-- =====================================================

-- Core member data
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    member_number VARCHAR(20) UNIQUE NOT NULL,

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
    UNIQUE(referred_id)
);

-- Create indexes for members
CREATE INDEX idx_members_member_number ON members(member_number);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_nik ON members(nik);
CREATE INDEX idx_members_status ON members(membership_status);
CREATE INDEX idx_members_referred_by ON members(referred_by);