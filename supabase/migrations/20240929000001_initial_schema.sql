-- =====================================================
-- KOPERASI SINOMAN SUPERAPP - INITIAL SCHEMA MIGRATION
-- =====================================================
-- Migration: 20240929000001_initial_schema
-- Description: Create core tables for Koperasi Sinoman SuperApp

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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