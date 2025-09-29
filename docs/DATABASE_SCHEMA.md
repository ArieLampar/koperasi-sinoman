# Database Schema Documentation - Phase 1

**KOPERASI SINOMAN SUPERAPP**

*Database Design for Core Platform MVP*

---

## 1. OVERVIEW

### 1.1 Schema Purpose
This document defines the database schema for Phase 1 of the Koperasi Sinoman SuperApp, focusing on the core functionality required for the MVP launch with 1,000 target members.

### 1.2 Database Technology
- **Database System:** PostgreSQL 15+ (via Supabase)
- **Extensions:** uuid-ossp, pgcrypto
- **Authentication:** Supabase Auth integration
- **Real-time:** Supabase Realtime for live updates

### 1.3 Phase 1 Scope
The schema supports the following core features:
- **Member Registration & Authentication** with KYC
- **Savings Management** (Pokok, Wajib, Sukarela)
- **Transaction Processing** with payment gateway integration
- **Fit Challenge Program** with progress tracking
- **Basic Admin Dashboard** with member and financial management

---

## 2. ENTITY RELATIONSHIP DIAGRAM

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│    auth.users   │    │    members       │    │ member_documents│
│                 │    │                  │    │                 │
│ - id (PK)       │◄───┤ - id (PK)        │───►│ - id (PK)       │
│ - email         │    │ - auth_user_id   │    │ - member_id (FK)│
│ - phone         │    │ - member_number  │    │ - document_type │
│                 │    │ - full_name      │    │ - document_url  │
└─────────────────┘    │ - email          │    │ - status        │
                       │ - phone          │    └─────────────────┘
                       │ - nik            │
                       │ - status         │    ┌─────────────────┐
                       │ - referral_code  │    │   referrals     │
                       │ - referred_by    │───►│                 │
                       └──────────────────┘    │ - id (PK)       │
                               │               │ - referrer_id   │
                               │               │ - referred_id   │
                               │               │ - status        │
                               │               └─────────────────┘
                               │
                       ┌───────▼──────────┐    ┌─────────────────┐
                       │ savings_accounts │    │ savings_types   │
                       │                  │    │                 │
                       │ - id (PK)        │───►│ - id (PK)       │
                       │ - member_id (FK) │    │ - name          │
                       │ - savings_type_id│    │ - code          │
                       │ - balance        │    │ - min_amount    │
                       │ - account_number │    │ - withdrawable  │
                       └───────┬──────────┘    │ - mandatory     │
                               │               └─────────────────┘
                               │
                       ┌───────▼──────────┐    ┌─────────────────┐
                       │   transactions   │    │transaction_types│
                       │                  │    │                 │
                       │ - id (PK)        │───►│ - id (PK)       │
                       │ - member_id (FK) │    │ - name          │
                       │ - account_id (FK)│    │ - code          │
                       │ - type_id (FK)   │    │ - category      │
                       │ - amount         │    │ - description   │
                       │ - status         │    └─────────────────┘
                       │ - reference_id   │
                       └──────────────────┘
                               │
                               │
                       ┌───────▼──────────┐    ┌─────────────────┐
                       │ fit_participants │    │fit_challenge_   │
                       │                  │    │    batches      │
                       │ - id (PK)        │───►│                 │
                       │ - member_id (FK) │    │ - id (PK)       │
                       │ - batch_id (FK)  │    │ - name          │
                       │ - payment_status │    │ - start_date    │
                       │ - progress_data  │    │ - end_date      │
                       └──────────────────┘    │ - max_participants
                                               │ - status        │
                       ┌──────────────────┐    └─────────────────┘
                       │ fit_progress     │
                       │                  │
                       │ - id (PK)        │
                       │ - participant_id │
                       │ - week_number    │
                       │ - weight         │
                       │ - measurements   │
                       │ - photo_url      │
                       └──────────────────┘
```

---

## 3. CORE TABLES SPECIFICATION

### 3.1 Authentication & Membership

#### 3.1.1 members
**Purpose:** Core member data and profile information

```sql
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Unique Identifiers
    member_number VARCHAR(20) UNIQUE NOT NULL, -- Format: SIN-YYYY-XXXXXX
    nik VARCHAR(16) UNIQUE NOT NULL, -- Indonesian ID number

    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),

    -- Address Information
    address TEXT NOT NULL,
    village VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Ponorogo',
    province VARCHAR(100) DEFAULT 'Jawa Timur',
    postal_code VARCHAR(10),

    -- Membership Details
    membership_type VARCHAR(20) DEFAULT 'regular'
        CHECK (membership_type IN ('regular', 'investor', 'premium')),
    membership_status VARCHAR(20) DEFAULT 'pending'
        CHECK (membership_status IN ('pending', 'active', 'suspended', 'inactive')),
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- KYC & Verification
    kyc_status VARCHAR(20) DEFAULT 'pending'
        CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    kyc_verified_by UUID REFERENCES members(id),

    -- Profile & Optional Fields
    profile_picture_url TEXT,
    bio TEXT,
    occupation VARCHAR(100),

    -- Referral System
    referral_code VARCHAR(10) UNIQUE NOT NULL
        DEFAULT UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
    referred_by UUID REFERENCES members(id),

    -- System Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_members_member_number ON members(member_number);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_nik ON members(nik);
CREATE INDEX idx_members_status ON members(membership_status);
CREATE INDEX idx_members_referred_by ON members(referred_by);
```

**Business Rules:**
- Member number auto-generated with format SIN-YYYY-XXXXXX
- NIK must be valid 16-digit Indonesian ID
- Email and phone must be unique across the system
- KYC verification required before account activation
- Referral code auto-generated and unique

#### 3.1.2 member_documents
**Purpose:** KYC document storage and verification tracking

```sql
CREATE TABLE member_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

    -- Document Information
    document_type VARCHAR(50) NOT NULL
        CHECK (document_type IN ('ktp', 'selfie', 'kk', 'npwp', 'bank_statement')),
    document_url TEXT NOT NULL,
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),

    -- Verification Status
    verification_status VARCHAR(20) DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES members(id),
    rejection_reason TEXT,
    verification_notes TEXT,

    -- System Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_member_documents_member_id ON member_documents(member_id);
CREATE INDEX idx_member_documents_type ON member_documents(document_type);
CREATE INDEX idx_member_documents_status ON member_documents(verification_status);
```

**Business Rules:**
- KTP (ID card) and selfie are mandatory for verification
- Each document type can have multiple versions (latest takes precedence)
- Documents stored in secure cloud storage (Cloudinary)
- Admin verification required for account activation

#### 3.1.3 referrals
**Purpose:** Track referral relationships and bonus calculations

```sql
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

    -- Referral Details
    referral_code_used VARCHAR(10) NOT NULL,
    referral_bonus DECIMAL(15,2) DEFAULT 0,
    bonus_type VARCHAR(20) DEFAULT 'cash'
        CHECK (bonus_type IN ('cash', 'points', 'discount')),

    -- Status Tracking
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'qualified', 'paid', 'expired')),
    qualified_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- System Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(referred_id), -- Each member can only be referred once
    CHECK(referrer_id != referred_id) -- Cannot refer yourself
);

-- Indexes
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);
```

**Business Rules:**
- Each member can only be referred once
- Referral bonus paid after referred member completes registration
- Bonus amount configurable based on membership type

### 3.2 Savings & Financial System

#### 3.2.1 savings_types
**Purpose:** Define different types of savings accounts

```sql
CREATE TABLE savings_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Type Information
    name VARCHAR(100) NOT NULL, -- 'Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela'
    code VARCHAR(20) UNIQUE NOT NULL, -- 'SP', 'SW', 'SS'
    description TEXT,

    -- Financial Rules
    minimum_amount DECIMAL(15,2) DEFAULT 0,
    maximum_amount DECIMAL(15,2),
    is_withdrawable BOOLEAN DEFAULT true,
    is_mandatory BOOLEAN DEFAULT false,
    interest_rate DECIMAL(5,4) DEFAULT 0, -- Annual percentage

    -- Configuration
    auto_create_on_registration BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    -- System Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default data insertion
INSERT INTO savings_types (name, code, description, minimum_amount, is_withdrawable, is_mandatory, auto_create_on_registration) VALUES
('Simpanan Pokok', 'SP', 'Simpanan wajib sekali seumur hidup saat pendaftaran', 80000, false, true, true),
('Simpanan Wajib', 'SW', 'Simpanan wajib bulanan untuk anggota aktif', 10000, false, true, true),
('Simpanan Sukarela', 'SS', 'Simpanan sukarela yang dapat ditarik sewaktu-waktu', 10000, true, false, true);
```

#### 3.2.2 savings_accounts
**Purpose:** Individual savings accounts for each member

```sql
CREATE TABLE savings_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    savings_type_id UUID NOT NULL REFERENCES savings_types(id),

    -- Account Information
    account_number VARCHAR(20) UNIQUE NOT NULL, -- Format: SA-YYYY-XXXXXX
    balance DECIMAL(15,2) DEFAULT 0 CHECK (balance >= 0),

    -- Virtual Account for Payments
    virtual_account_number VARCHAR(50) UNIQUE,
    bank_code VARCHAR(10),

    -- Account Status
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'frozen', 'closed')),
    opened_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_date TIMESTAMP WITH TIME ZONE,

    -- Interest Calculation
    last_interest_calculated_at TIMESTAMP WITH TIME ZONE,
    total_interest_earned DECIMAL(15,2) DEFAULT 0,

    -- System Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(member_id, savings_type_id) -- One account per member per savings type
);

-- Indexes
CREATE INDEX idx_savings_accounts_member ON savings_accounts(member_id);
CREATE INDEX idx_savings_accounts_type ON savings_accounts(savings_type_id);
CREATE INDEX idx_savings_accounts_account_number ON savings_accounts(account_number);
CREATE INDEX idx_savings_accounts_va ON savings_accounts(virtual_account_number);
```

**Business Rules:**
- One account per member per savings type
- Account number auto-generated with format SA-YYYY-XXXXXX
- Virtual account number for payment gateway integration
- Balance cannot be negative

#### 3.2.3 transaction_types
**Purpose:** Define types of financial transactions

```sql
CREATE TABLE transaction_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Type Information
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('deposit', 'withdrawal', 'transfer', 'fee', 'interest', 'bonus')),
    description TEXT,

    -- Transaction Rules
    affects_balance BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    minimum_amount DECIMAL(15,2) DEFAULT 0,
    maximum_amount DECIMAL(15,2),

    -- Configuration
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,

    -- System Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default data
INSERT INTO transaction_types (name, code, category, description) VALUES
('Setoran Simpanan Pokok', 'SP_DEPOSIT', 'deposit', 'Setoran simpanan pokok saat pendaftaran'),
('Setoran Simpanan Wajib', 'SW_DEPOSIT', 'deposit', 'Setoran simpanan wajib bulanan'),
('Setoran Simpanan Sukarela', 'SS_DEPOSIT', 'deposit', 'Setoran simpanan sukarela'),
('Penarikan Simpanan Sukarela', 'SS_WITHDRAWAL', 'withdrawal', 'Penarikan simpanan sukarela'),
('Bunga Simpanan', 'INTEREST', 'interest', 'Bunga simpanan sukarela dan berjangka'),
('Bonus Referral', 'REFERRAL_BONUS', 'bonus', 'Bonus dari referral member baru');
```

#### 3.2.4 transactions
**Purpose:** Record all financial transactions

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    savings_account_id UUID REFERENCES savings_accounts(id),
    transaction_type_id UUID NOT NULL REFERENCES transaction_types(id),

    -- Transaction Details
    transaction_number VARCHAR(30) UNIQUE NOT NULL, -- Format: TXN-YYYY-XXXXXX
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT,

    -- Balance Tracking
    balance_before DECIMAL(15,2) DEFAULT 0,
    balance_after DECIMAL(15,2) DEFAULT 0,

    -- Payment Information
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    payment_gateway_response JSONB,

    -- Status & Processing
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES members(id),

    -- Additional Data
    metadata JSONB,
    notes TEXT,

    -- System Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_member ON transactions(member_id);
CREATE INDEX idx_transactions_account ON transactions(savings_account_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_number ON transactions(transaction_number);
CREATE INDEX idx_transactions_payment_ref ON transactions(payment_reference);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

**Business Rules:**
- Transaction number auto-generated with format TXN-YYYY-XXXXXX
- All amounts must be positive (use transaction type to determine debit/credit)
- Balance tracking for audit purposes
- Payment gateway response stored as JSONB for flexibility

### 3.3 Fit Challenge System

#### 3.3.1 fit_challenge_batches
**Purpose:** Manage Fit Challenge program batches

```sql
CREATE TABLE fit_challenge_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Batch Information
    name VARCHAR(100) NOT NULL,
    description TEXT,
    batch_number VARCHAR(20) UNIQUE NOT NULL, -- Format: FC-YYYY-XXX

    -- Schedule
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_start_date DATE,
    registration_end_date DATE,

    -- Capacity & Participants
    max_participants INTEGER DEFAULT 100,
    current_participants INTEGER DEFAULT 0,
    waitlist_count INTEGER DEFAULT 0,

    -- Pricing
    program_fee DECIMAL(15,2) DEFAULT 600000,
    early_bird_fee DECIMAL(15,2),
    early_bird_deadline DATE,

    -- Location & Logistics
    venue_name VARCHAR(200),
    venue_address TEXT,
    trainer_names TEXT[],

    -- Status & Management
    status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'open', 'full', 'active', 'completed', 'cancelled')),
    created_by UUID REFERENCES members(id),

    -- System Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CHECK (end_date > start_date),
    CHECK (max_participants > 0)
);

-- Indexes
CREATE INDEX idx_fit_batches_status ON fit_challenge_batches(status);
CREATE INDEX idx_fit_batches_start_date ON fit_challenge_batches(start_date);
CREATE INDEX idx_fit_batches_registration ON fit_challenge_batches(registration_start_date, registration_end_date);
```

#### 3.3.2 fit_challenge_participants
**Purpose:** Track participants in Fit Challenge batches

```sql
CREATE TABLE fit_challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES fit_challenge_batches(id) ON DELETE CASCADE,

    -- Registration Details
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    participant_number VARCHAR(20) UNIQUE NOT NULL, -- Format: FCP-YYYY-XXXXXX

    -- Payment Information
    payment_status VARCHAR(20) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
    amount_paid DECIMAL(15,2) DEFAULT 0,
    payment_deadline DATE,

    -- Initial Assessment
    initial_weight DECIMAL(5,2),
    initial_height DECIMAL(5,2),
    initial_body_fat DECIMAL(5,2),
    initial_muscle_mass DECIMAL(5,2),

    -- Goals
    target_weight DECIMAL(5,2),
    target_body_fat DECIMAL(5,2),
    personal_goals TEXT,

    -- Current Progress
    current_weight DECIMAL(5,2),
    current_body_fat DECIMAL(5,2),
    current_muscle_mass DECIMAL(5,2),

    -- Status & Completion
    participation_status VARCHAR(20) DEFAULT 'active'
        CHECK (participation_status IN ('waitlist', 'active', 'completed', 'dropped_out', 'disqualified')),
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    final_assessment_date DATE,

    -- Medical Information
    medical_conditions TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),

    -- System Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(member_id, batch_id), -- One registration per member per batch
    CHECK (initial_weight > 0),
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- Indexes
CREATE INDEX idx_fit_participants_member ON fit_challenge_participants(member_id);
CREATE INDEX idx_fit_participants_batch ON fit_challenge_participants(batch_id);
CREATE INDEX idx_fit_participants_status ON fit_challenge_participants(participation_status);
CREATE INDEX idx_fit_participants_payment ON fit_challenge_participants(payment_status);
```

#### 3.3.3 fit_progress_tracking
**Purpose:** Track weekly progress for Fit Challenge participants

```sql
CREATE TABLE fit_progress_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES fit_challenge_participants(id) ON DELETE CASCADE,

    -- Progress Information
    week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
    check_in_date DATE NOT NULL,

    -- Measurements
    weight DECIMAL(5,2),
    body_fat_percentage DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),

    -- Body Measurements
    chest_circumference DECIMAL(5,2),
    waist_circumference DECIMAL(5,2),
    hip_circumference DECIMAL(5,2),
    arm_circumference DECIMAL(5,2),
    thigh_circumference DECIMAL(5,2),

    -- Progress Photos
    progress_photo_front_url TEXT,
    progress_photo_side_url TEXT,
    progress_photo_back_url TEXT,

    -- Workout & Nutrition
    workouts_completed INTEGER DEFAULT 0,
    total_workouts_planned INTEGER DEFAULT 0,
    nutrition_adherence_score INTEGER CHECK (nutrition_adherence_score BETWEEN 0 AND 10),

    -- Notes & Feedback
    participant_notes TEXT,
    trainer_feedback TEXT,
    trainer_id UUID REFERENCES members(id),

    -- System Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(participant_id, week_number) -- One entry per participant per week
);

-- Indexes
CREATE INDEX idx_fit_progress_participant ON fit_progress_tracking(participant_id);
CREATE INDEX idx_fit_progress_week ON fit_progress_tracking(week_number);
CREATE INDEX idx_fit_progress_date ON fit_progress_tracking(check_in_date);
```

### 3.4 System Administration

#### 3.4.1 admin_users
**Purpose:** Admin user management with role-based access

```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,

    -- Admin Information
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('super_admin', 'admin', 'staff', 'trainer', 'auditor')),

    -- Permissions
    permissions JSONB DEFAULT '[]',

    -- Access Control
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,

    -- System Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_users_member ON admin_users(member_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);
```

#### 3.4.2 audit_logs
**Purpose:** System audit trail for security and compliance

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who & When
    user_id UUID REFERENCES members(id),
    admin_user_id UUID REFERENCES admin_users(id),
    session_id VARCHAR(100),

    -- Action Details
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),

    -- Change Tracking
    old_values JSONB,
    new_values JSONB,

    -- Request Information
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,

    -- System Information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 4. BUSINESS RULES & CONSTRAINTS

### 4.1 Member Registration Rules
1. **Unique Identifiers**
   - Email, phone, and NIK must be unique system-wide
   - Member number auto-generated with format SIN-YYYY-XXXXXX
   - Referral code auto-generated and unique

2. **KYC Requirements**
   - KTP (ID card) document mandatory
   - Selfie photo mandatory
   - Admin verification required before activation
   - Member status remains 'pending' until KYC approval

3. **Age Restrictions**
   - Minimum age: 17 years old
   - Maximum age: 65 years old for new registrations

### 4.2 Savings Account Rules
1. **Simpanan Pokok (Initial Capital)**
   - Amount: Rp 80,000 (fixed)
   - Mandatory during registration
   - Non-withdrawable while member is active
   - One-time payment per member

2. **Simpanan Wajib (Monthly Mandatory)**
   - Amount: Rp 10,000/month minimum
   - Due monthly from registration date
   - Non-withdrawable while member is active
   - Grace period: 7 days after due date

3. **Simpanan Sukarela (Voluntary)**
   - Minimum deposit: Rp 10,000
   - No maximum limit
   - Withdrawable anytime with 24-hour processing
   - Interest calculated monthly

### 4.3 Transaction Processing Rules
1. **General Rules**
   - All amounts must be positive
   - Transaction numbers auto-generated (TXN-YYYY-XXXXXX)
   - Balance tracking required for audit trail
   - Real-time balance updates via database triggers

2. **Payment Processing**
   - Pending status for new transactions
   - Completed status after payment confirmation
   - Failed transactions can be retried
   - Cancelled transactions require admin approval

3. **Validation Rules**
   - Withdrawal amount cannot exceed available balance
   - Minimum amounts enforced per savings type
   - Maximum daily transaction limits configurable

### 4.4 Fit Challenge Rules
1. **Registration Rules**
   - Maximum 100 participants per batch
   - Payment required within 7 days of registration
   - Medical questionnaire mandatory
   - One active registration per member

2. **Progress Tracking**
   - Weekly check-ins required
   - Initial assessment within first week
   - Progress photos optional but encouraged
   - Trainer feedback for each check-in

3. **Completion Criteria**
   - Minimum 6 out of 8 check-ins required
   - Final assessment in week 8
   - Certificate issued for successful completion
   - Refund policy for medical withdrawals

---

## 5. DATA FLOW DOCUMENTATION

### 5.1 Member Registration Flow

```
1. User Registration (Frontend)
   ↓
2. Create auth.users record (Supabase Auth)
   ↓
3. Create members record (Application)
   ↓ [Trigger: auto_generate_member_number]
4. Generate member number (SIN-YYYY-XXXXXX)
   ↓
5. Upload KYC documents (Cloudinary)
   ↓
6. Create member_documents records
   ↓ [Trigger: auto_create_savings_accounts]
7. Create default savings accounts (SP, SW, SS)
   ↓
8. Generate virtual account numbers
   ↓
9. Send welcome notification (WhatsApp/Email)
```

### 5.2 Transaction Processing Flow

```
1. User initiates transaction (Frontend)
   ↓
2. Validate transaction rules (API)
   ↓
3. Create transaction record (status: pending)
   ↓
4. Generate transaction number (TXN-YYYY-XXXXXX)
   ↓
5. Send to payment gateway (Midtrans)
   ↓
6. Receive payment confirmation (Webhook)
   ↓ [Trigger: update_balance_on_completion]
7. Update transaction status (completed)
   ↓
8. Update savings account balance
   ↓
9. Create audit log entry
   ↓
10. Send confirmation notification
```

### 5.3 Fit Challenge Registration Flow

```
1. Member selects available batch (Frontend)
   ↓
2. Check batch capacity (API)
   ↓
3. Create fit_challenge_participants record
   ↓
4. Generate participant number (FCP-YYYY-XXXXXX)
   ↓
5. Process payment (Rp 600,000)
   ↓
6. Update batch participant count
   ↓ [Trigger: check_batch_capacity]
7. Update batch status if full
   ↓
8. Send confirmation and program details
   ↓
9. Schedule initial assessment reminder
```

### 5.4 Data Synchronization Patterns

#### Real-time Updates (Supabase Realtime)
- Balance changes in savings accounts
- Transaction status updates
- Fit Challenge progress updates
- Admin dashboard metrics

#### Batch Processing (Scheduled)
- Interest calculations (monthly)
- Member status updates (daily)
- Report generation (daily/weekly/monthly)
- Data archival (monthly)

#### Event-driven Updates (Database Triggers)
- Auto-generation of unique numbers
- Balance updates on transaction completion
- Audit log creation on data changes
- Notification triggers

---

## 6. SECURITY & COMPLIANCE

### 6.1 Row Level Security (RLS) Policies

```sql
-- Members can only access their own data
CREATE POLICY member_access_own_data ON members
    FOR ALL USING (auth.uid() = auth_user_id);

-- Admins can access all member data
CREATE POLICY admin_access_all_members ON members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.member_id = (
                SELECT id FROM members WHERE auth_user_id = auth.uid()
            )
            AND au.is_active = true
        )
    );

-- Savings accounts access
CREATE POLICY member_access_own_savings ON savings_accounts
    FOR ALL USING (
        member_id = (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Transactions access
CREATE POLICY member_access_own_transactions ON transactions
    FOR ALL USING (
        member_id = (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );
```

### 6.2 Data Encryption & Privacy
1. **Sensitive Data Encryption**
   - NIK encrypted at application level
   - Phone numbers hashed for indexing
   - Document URLs secured with signed URLs

2. **Personal Data Protection**
   - GDPR/PDPL compliance for data retention
   - Right to data portability
   - Right to be forgotten implementation

3. **Audit Requirements**
   - All data changes logged in audit_logs
   - IP address and user agent tracking
   - Session management and timeout

### 6.3 Backup & Recovery Strategy
1. **Automated Backups**
   - Daily full database backups (Supabase)
   - Point-in-time recovery capability
   - Cross-region backup replication

2. **Recovery Procedures**
   - RTO (Recovery Time Objective): 4 hours
   - RPO (Recovery Point Objective): 1 hour
   - Disaster recovery testing monthly

---

## 7. PERFORMANCE OPTIMIZATION

### 7.1 Database Indexes
All critical query paths are optimized with appropriate indexes:
- Primary keys (automatic)
- Foreign key constraints
- Unique constraints
- Composite indexes for complex queries
- Partial indexes for filtered queries

### 7.2 Query Optimization
1. **Savings Dashboard Queries**
   - Materialized view for member summary
   - Indexed timestamp columns for date ranges
   - Efficient JOIN patterns

2. **Transaction History**
   - Partitioning by date for large datasets
   - Archived old transactions (>2 years)
   - Optimized pagination queries

3. **Admin Reports**
   - Pre-aggregated data in summary tables
   - Cached frequently requested reports
   - Background job processing for heavy queries

### 7.3 Scaling Considerations
1. **Read Replicas**
   - Separate read-only database for reports
   - Load balancing for dashboard queries

2. **Connection Pooling**
   - PgBouncer for connection management
   - Configurable pool sizes per application

3. **Monitoring & Alerting**
   - Query performance monitoring
   - Slow query alerts
   - Database health metrics

---

## 8. MIGRATION & DEPLOYMENT

### 8.1 Migration Strategy
Phase 1 database deployment follows this sequence:

```bash
# 1. Create core tables
supabase db push --file 01_core_tables.sql

# 2. Insert reference data
supabase db push --file 02_reference_data.sql

# 3. Create functions and triggers
supabase db push --file 03_functions_triggers.sql

# 4. Apply RLS policies
supabase db push --file 04_security_policies.sql

# 5. Create indexes and optimize
supabase db push --file 05_indexes_optimization.sql
```

### 8.2 Data Seeding
Initial data setup for Phase 1:

```sql
-- Savings types
INSERT INTO savings_types (name, code, minimum_amount, is_withdrawable, is_mandatory)
VALUES
    ('Simpanan Pokok', 'SP', 80000, false, true),
    ('Simpanan Wajib', 'SW', 10000, false, true),
    ('Simpanan Sukarela', 'SS', 10000, true, false);

-- Transaction types
INSERT INTO transaction_types (name, code, category)
VALUES
    ('Setoran Simpanan Pokok', 'SP_DEPOSIT', 'deposit'),
    ('Setoran Simpanan Wajib', 'SW_DEPOSIT', 'deposit'),
    ('Setoran Simpanan Sukarela', 'SS_DEPOSIT', 'deposit'),
    ('Penarikan Simpanan Sukarela', 'SS_WITHDRAWAL', 'withdrawal');

-- Admin user roles
INSERT INTO admin_users (member_id, username, role, permissions)
VALUES
    (NULL, 'superadmin', 'super_admin', '["all"]'),
    (NULL, 'admin1', 'admin', '["member_management", "financial_reports"]');
```

### 8.3 Testing Strategy
1. **Unit Tests**
   - Database function testing
   - Constraint validation
   - Trigger functionality

2. **Integration Tests**
   - API endpoint testing
   - Payment gateway integration
   - Real-time subscription testing

3. **Load Testing**
   - Concurrent user simulation
   - Transaction throughput testing
   - Database performance under load

---

## 9. MONITORING & MAINTENANCE

### 9.1 Health Checks
```sql
-- Check system health
SELECT
    'members' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today
FROM members
UNION ALL
SELECT
    'transactions',
    COUNT(*),
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')
FROM transactions;

-- Check data integrity
SELECT
    COUNT(*) as orphaned_savings_accounts
FROM savings_accounts sa
LEFT JOIN members m ON sa.member_id = m.id
WHERE m.id IS NULL;
```

### 9.2 Maintenance Tasks
1. **Daily Tasks**
   - Backup verification
   - Failed transaction cleanup
   - Performance metric collection

2. **Weekly Tasks**
   - Index fragmentation analysis
   - Query performance review
   - Security audit log review

3. **Monthly Tasks**
   - Data archival
   - Capacity planning review
   - Disaster recovery testing

---

## CONCLUSION

This database schema provides a robust foundation for Phase 1 of the Koperasi Sinoman SuperApp, supporting the core features required for MVP launch with 1,000 target members. The design emphasizes:

- **Scalability** - Efficient indexing and query optimization for growth
- **Security** - Comprehensive RLS policies and audit trails
- **Reliability** - ACID compliance and data integrity constraints
- **Performance** - Optimized for expected usage patterns
- **Compliance** - Meeting Indonesian cooperative and data protection requirements

The schema is designed to evolve seamlessly into Phase 2 requirements while maintaining backward compatibility and data integrity throughout the platform's growth.

---

*Document Version: 1.0*
*Last Updated: September 2025*
*Prepared by: Koperasi Sinoman Technology Team*