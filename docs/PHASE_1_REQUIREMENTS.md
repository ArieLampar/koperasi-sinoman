# Phase 1 Requirements - Core Platform MVP

**KOPERASI SINOMAN SUPERAPP**

*Platform Digital Koperasi Sinoman Ponorogo*

---

## 1. EXECUTIVE SUMMARY

### 1.1 Phase 1 Overview
**Timeline:** Week 1-8 (2 months)
**Target Users:** 1,000 active members
**Objective:** Establish core SuperApp foundation with essential features for member onboarding, savings management, and Fit Challenge program.

### 1.2 Success Criteria
- **User Registration:** 1,000+ verified members
- **Savings Collection:** Rp 80 Juta in Simpanan Pokok
- **Fit Challenge:** 2 successful batches (200 participants)
- **Platform Stability:** 99% uptime, <2s load time
- **User Engagement:** 70% monthly active users

---

## 2. CORE FEATURES & MODULES

### 2.1 Member Authentication & Registration

#### 2.1.1 Features
- [x] **Multi-step registration with KYC**
  - Personal information form
  - ID document upload (KTP)
  - Phone number verification (OTP)
  - Profile photo capture
  - Digital signature collection

- [x] **Authentication System**
  - Email/password login
  - Phone number + OTP
  - Session management
  - Password reset functionality
  - Remember me option

- [x] **Digital Member Card**
  - QR code generation with member ID
  - Member information display
  - Downloadable/shareable format
  - Digital wallet integration

#### 2.1.2 Technical Specifications
- **Database Tables:** `members`, `member_documents`, `auth_sessions`
- **Authentication:** Supabase Auth + custom middleware
- **File Storage:** Cloudinary for document/photo storage
- **OTP Service:** Fonnte WhatsApp API integration

### 2.2 Savings Management (Simpanan)

#### 2.2.1 Core Savings Types

**A. Simpanan Pokok (Mandatory Initial)**
- Amount: Rp 80,000 (one-time)
- Payment: During registration
- Status: Non-withdrawable while member

**B. Simpanan Wajib (Monthly Mandatory)**
- Amount: Rp 10,000/month
- Auto-debit setup option
- Payment reminders via WhatsApp
- Grace period: 7 days

**C. Simpanan Sukarela (Voluntary)**
- Minimum: Rp 10,000 per transaction
- Maximum: No limit
- Withdrawal: Anytime with 24h processing
- Interest calculation: Monthly

#### 2.2.2 Features
- [x] **Virtual Account System**
  - Unique VA number per member
  - Automatic payment recognition
  - Real-time balance updates
  - Transaction history tracking

- [x] **Payment Integration**
  - Midtrans payment gateway
  - Bank transfer (all major banks)
  - E-wallet support (OVO, GoPay, Dana)
  - Manual cash deposit recording

- [x] **Savings Dashboard**
  - Real-time balance display
  - Monthly savings target tracking
  - Transaction history with filters
  - Downloadable statements
  - SHU projection calculator

#### 2.2.3 Technical Specifications
- **Database Tables:** `savings_accounts`, `transactions`, `payment_methods`
- **Payment Gateway:** Midtrans Core API
- **Real-time Updates:** Supabase Realtime subscriptions
- **Calculations:** Automated SHU distribution algorithm

### 2.3 Sinoman Fit Challenge Module

#### 2.3.1 Program Structure
- **Duration:** 8 weeks per batch
- **Capacity:** 100 participants maximum
- **Fee:** Rp 600,000 total breakdown:
  - Rp 400,000 → Program fee
  - Rp 80,000 → Simpanan Pokok (if new member)
  - Rp 120,000 → Simpanan Wajib (1 year prepaid)

#### 2.3.2 Features
- [x] **Registration & Payment**
  - Online registration form
  - Medical questionnaire
  - Payment processing
  - Batch allocation system
  - Waitlist management

- [x] **Progress Tracking**
  - Initial body measurements
  - Weekly check-in system
  - Progress photo uploads
  - Weight/measurement logging
  - Goal setting and tracking

- [x] **Community Features**
  - Batch member directory
  - Group chat integration
  - Progress sharing
  - Motivational notifications
  - Leaderboard (optional participation)

- [x] **Content Management**
  - Weekly workout plans
  - Nutrition guidelines
  - Educational content library
  - Video exercise demonstrations
  - Recipe database

#### 2.3.3 Technical Specifications
- **Database Tables:** `fit_challenge_batches`, `participants`, `progress_tracking`, `workout_plans`
- **File Storage:** Cloudinary for progress photos
- **Notifications:** Scheduled WhatsApp messages via Fonnte
- **Content Delivery:** Next.js dynamic routes for workout plans

### 2.4 Basic Admin Dashboard

#### 2.4.1 Features
- [x] **Member Management**
  - Member list with search/filter
  - KYC document verification
  - Account status management
  - Communication tools

- [x] **Financial Overview**
  - Daily/monthly collections summary
  - Outstanding payments tracking
  - Transaction monitoring
  - Basic financial reports

- [x] **Fit Challenge Administration**
  - Batch creation and management
  - Participant tracking
  - Progress monitoring
  - Communication with participants

#### 2.4.2 Technical Specifications
- **Access Control:** Role-based permissions (Admin, Staff)
- **Dashboard Framework:** React with Recharts for analytics
- **Export Functionality:** CSV/PDF report generation
- **Real-time Data:** Live updates via Supabase subscriptions

---

## 3. TECHNICAL ARCHITECTURE

### 3.1 Technology Stack

#### Frontend
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand + React Query
- **PWA:** Next-PWA for mobile app-like experience

#### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth + custom policies
- **API:** Next.js API Routes + tRPC
- **File Storage:** Cloudinary
- **Cache:** Redis (Upstash)

#### Integrations
- **Payment:** Midtrans Core API
- **Notifications:** Fonnte WhatsApp API
- **Monitoring:** Sentry
- **Analytics:** Vercel Analytics

#### Infrastructure
- **Hosting:** Vercel (Frontend + API)
- **Database:** Supabase Cloud
- **CDN:** Vercel Edge Network
- **Domain:** Custom domain with SSL

### 3.2 Database Schema (Core Tables)

```sql
-- Members
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  id_number VARCHAR UNIQUE NOT NULL,
  date_of_birth DATE,
  address TEXT,
  profile_photo_url VARCHAR,
  member_number VARCHAR UNIQUE,
  status VARCHAR DEFAULT 'pending', -- pending, active, suspended
  referral_code VARCHAR UNIQUE,
  referred_by UUID REFERENCES members(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Savings Accounts
CREATE TABLE savings_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  account_type VARCHAR NOT NULL, -- pokok, wajib, sukarela
  balance DECIMAL(15,2) DEFAULT 0,
  virtual_account_number VARCHAR UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  savings_account_id UUID REFERENCES savings_accounts(id),
  type VARCHAR NOT NULL, -- deposit, withdrawal
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  payment_method VARCHAR,
  reference_id VARCHAR,
  status VARCHAR DEFAULT 'pending', -- pending, completed, failed
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fit Challenge Batches
CREATE TABLE fit_challenge_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_participants INTEGER DEFAULT 100,
  current_participants INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'open', -- open, full, active, completed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fit Challenge Participants
CREATE TABLE fit_challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  batch_id UUID REFERENCES fit_challenge_batches(id),
  payment_status VARCHAR DEFAULT 'pending',
  initial_weight DECIMAL(5,2),
  target_weight DECIMAL(5,2),
  current_weight DECIMAL(5,2),
  completion_status VARCHAR DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 Security Requirements

#### Data Protection
- **Encryption:** All sensitive data encrypted at rest
- **HTTPS:** End-to-end SSL encryption
- **API Security:** Rate limiting, CORS protection
- **Input Validation:** Server-side validation for all inputs

#### Authentication & Authorization
- **Multi-factor:** OTP verification for sensitive operations
- **Session Management:** Secure JWT tokens with expiration
- **Role-based Access:** Admin/Member permission levels
- **Audit Trail:** Complete transaction logging

#### Compliance
- **Data Privacy:** Indonesian Personal Data Protection compliance
- **Financial Regulations:** Kemenkop UKM guidelines
- **Security Standards:** OWASP best practices

---

## 4. USER STORIES & ACCEPTANCE CRITERIA

### 4.1 Member Registration

#### User Story 1: New Member Registration
**As a** prospective member
**I want to** register for Koperasi Sinoman
**So that** I can access savings and program services

**Acceptance Criteria:**
- [ ] User can complete multi-step registration form
- [ ] KTP document upload is required and validated
- [ ] Phone number verification via OTP is mandatory
- [ ] Simpanan Pokok payment (Rp 80,000) is processed during registration
- [ ] Digital member card is generated upon completion
- [ ] Welcome message is sent via WhatsApp

#### User Story 2: Member Authentication
**As a** registered member
**I want to** securely log into my account
**So that** I can access my savings and program information

**Acceptance Criteria:**
- [ ] User can log in with email/password or phone/OTP
- [ ] Session persists across browser sessions if "Remember me" is selected
- [ ] Password reset functionality is available
- [ ] Account lockout after 5 failed attempts
- [ ] Login history is tracked for security

### 4.2 Savings Management

#### User Story 3: View Savings Dashboard
**As a** member
**I want to** view my current savings balance and history
**So that** I can track my financial progress

**Acceptance Criteria:**
- [ ] Dashboard shows real-time balance for all savings types
- [ ] Transaction history is displayed with date, type, and amount
- [ ] Monthly savings targets are visible with progress indicators
- [ ] SHU projection is calculated and displayed
- [ ] Statements can be downloaded as PDF

#### User Story 4: Make Voluntary Savings Deposit
**As a** member
**I want to** deposit money into my voluntary savings
**So that** I can increase my savings balance

**Acceptance Criteria:**
- [ ] Minimum deposit amount is Rp 10,000
- [ ] Multiple payment methods are available (bank transfer, e-wallet)
- [ ] Payment confirmation is received within 5 minutes
- [ ] Balance is updated in real-time
- [ ] Transaction receipt is provided

### 4.3 Fit Challenge Program

#### User Story 5: Register for Fit Challenge
**As a** member
**I want to** register for the Fit Challenge program
**So that** I can improve my health with structured support

**Acceptance Criteria:**
- [ ] Available batches are displayed with start dates and capacity
- [ ] Registration form includes medical questionnaire
- [ ] Payment of Rp 600,000 is processed (breakdown shown)
- [ ] Confirmation email/WhatsApp is sent
- [ ] Batch allocation is confirmed

#### User Story 6: Track Fitness Progress
**As a** Fit Challenge participant
**I want to** record my weekly progress
**So that** I can monitor my health improvements

**Acceptance Criteria:**
- [ ] Initial measurements can be recorded (weight, body fat, etc.)
- [ ] Weekly check-ins are available with photo upload
- [ ] Progress charts show improvement over time
- [ ] Goal achievement notifications are sent
- [ ] Progress can be shared with batch community (optional)

### 4.4 Admin Management

#### User Story 7: Manage Member Accounts
**As an** admin
**I want to** manage member registrations and accounts
**So that** I can ensure proper member verification and support

**Acceptance Criteria:**
- [ ] Admin can view all member applications
- [ ] KYC documents can be reviewed and approved/rejected
- [ ] Member status can be updated (active, suspended, etc.)
- [ ] Communication tools are available to contact members
- [ ] Member activity reports can be generated

---

## 5. TESTING REQUIREMENTS

### 5.1 Testing Strategy

#### Unit Testing
- **Framework:** Jest + React Testing Library
- **Coverage Target:** 80% minimum
- **Focus Areas:**
  - Authentication functions
  - Payment processing logic
  - Calculation algorithms (SHU, interest)
  - Data validation functions

#### Integration Testing
- **API Testing:** Supertest for API endpoints
- **Database Testing:** Test database with realistic data
- **Payment Gateway:** Midtrans sandbox testing
- **WhatsApp Integration:** Fonnte test environment

#### End-to-End Testing
- **Framework:** Playwright
- **Test Scenarios:**
  - Complete member registration flow
  - Savings deposit and withdrawal process
  - Fit Challenge registration and participation
  - Admin dashboard operations

#### Performance Testing
- **Load Testing:** Artillery.js for API load testing
- **Frontend Performance:** Lighthouse CI for performance metrics
- **Database Performance:** Query optimization and indexing
- **Target Metrics:**
  - Page load time: <2 seconds
  - API response time: <500ms
  - Concurrent users: 1,000+ without degradation

### 5.2 Testing Checklist

#### Functional Testing
- [ ] User registration and verification complete successfully
- [ ] All payment methods work correctly
- [ ] Savings calculations are accurate
- [ ] Fit Challenge workflows function properly
- [ ] Admin dashboard provides correct data and controls
- [ ] WhatsApp notifications are sent appropriately

#### Security Testing
- [ ] Authentication bypass attempts fail
- [ ] SQL injection attempts are blocked
- [ ] XSS attacks are prevented
- [ ] File upload restrictions work
- [ ] Rate limiting prevents abuse
- [ ] Sensitive data is properly encrypted

#### Usability Testing
- [ ] Registration process is intuitive
- [ ] Navigation is clear and consistent
- [ ] Mobile experience is optimized
- [ ] Error messages are helpful
- [ ] Loading states provide feedback
- [ ] Accessibility standards are met

#### Performance Testing
- [ ] Page load times meet targets
- [ ] Database queries are optimized
- [ ] File uploads/downloads work efficiently
- [ ] System handles expected user load
- [ ] Memory usage is within acceptable limits
- [ ] API responses meet SLA requirements

---

## 6. IMPLEMENTATION TIMELINE

### Week 1-2: Foundation Setup
- [x] Project structure and development environment
- [x] Database schema design and implementation
- [x] Authentication system setup
- [x] Basic UI components and design system
- [x] Payment gateway integration (sandbox)

### Week 3-4: Core Features Development
- [x] Member registration and KYC flow
- [x] Savings account management
- [x] Transaction processing system
- [x] Basic dashboard implementation
- [x] WhatsApp notification setup

### Week 5-6: Fit Challenge Module
- [x] Batch management system
- [x] Registration and payment flow
- [x] Progress tracking functionality
- [x] Community features
- [x] Content management system

### Week 7-8: Testing, Optimization & Launch
- [x] Comprehensive testing (unit, integration, e2e)
- [x] Performance optimization
- [x] Security audit and fixes
- [x] Admin dashboard completion
- [x] Production deployment and monitoring setup

---

## 7. DEFINITION OF DONE

### Feature Completion Criteria
- [ ] All user stories have passing acceptance tests
- [ ] Unit test coverage ≥80% for critical components
- [ ] Integration tests pass for all API endpoints
- [ ] End-to-end tests cover complete user journeys
- [ ] Performance tests meet defined SLA requirements
- [ ] Security tests show no critical vulnerabilities
- [ ] Code review completed and approved
- [ ] Documentation updated (API docs, user guides)
- [ ] Stakeholder approval received

### Production Readiness Criteria
- [ ] Environment variables configured for production
- [ ] Database migrations run successfully
- [ ] SSL certificates installed and verified
- [ ] Monitoring and alerting configured
- [ ] Backup and disaster recovery procedures tested
- [ ] User training materials prepared
- [ ] Support documentation created
- [ ] Go-live checklist completed

---

## 8. RISKS & MITIGATION STRATEGIES

### 8.1 Technical Risks

#### Risk: Payment Gateway Integration Issues
- **Impact:** High - Prevents member registration and savings deposits
- **Probability:** Medium
- **Mitigation:**
  - Implement multiple payment gateway options
  - Extensive sandbox testing before production
  - Manual payment recording as backup

#### Risk: Database Performance Under Load
- **Impact:** High - System slowdown affects user experience
- **Probability:** Medium
- **Mitigation:**
  - Database indexing optimization
  - Connection pooling implementation
  - Load testing with realistic data volumes
  - Auto-scaling configuration

#### Risk: WhatsApp API Rate Limiting
- **Impact:** Medium - Notification delivery delays
- **Probability:** Medium
- **Mitigation:**
  - Queue system for message delivery
  - Multiple WhatsApp number rotation
  - Email backup for critical notifications

### 8.2 Business Risks

#### Risk: Low User Adoption
- **Impact:** High - Threatens Phase 1 success metrics
- **Probability:** Medium
- **Mitigation:**
  - Early user feedback integration
  - Simplified onboarding process
  - Incentive programs for early adopters
  - Extensive user education and support

#### Risk: Regulatory Compliance Issues
- **Impact:** High - Could require significant rework
- **Probability:** Low
- **Mitigation:**
  - Legal consultation during development
  - Compliance checkpoints at each milestone
  - Conservative interpretation of regulations
  - Regular compliance audits

---

## 9. SUCCESS METRICS & KPIs

### 9.1 Phase 1 Target Metrics

#### User Metrics
- **Total Registered Members:** 1,000+
- **Monthly Active Users:** 70% of registered members
- **Registration Completion Rate:** 85%+
- **Average Session Duration:** 5+ minutes

#### Financial Metrics
- **Total Simpanan Pokok Collected:** Rp 80 Juta+
- **Monthly Simpanan Wajib Collection Rate:** 90%+
- **Fit Challenge Revenue:** Rp 120 Juta (2 batches)
- **Payment Success Rate:** 95%+

#### Technical Metrics
- **System Uptime:** 99%+
- **Average Page Load Time:** <2 seconds
- **API Response Time:** <500ms
- **Mobile Performance Score:** 90+ (Lighthouse)

#### Engagement Metrics
- **Fit Challenge Completion Rate:** 80%+
- **Daily App Opens:** 50%+ of active members
- **Support Ticket Resolution Time:** <24 hours
- **User Satisfaction Score:** 4.5+/5.0

### 9.2 Monitoring & Reporting

#### Real-time Dashboards
- User registration and activity trends
- Payment processing success rates
- System performance metrics
- Error rates and response times

#### Weekly Reports
- Member growth and engagement analysis
- Financial collection performance
- Fit Challenge participation metrics
- Technical performance summary

#### Monthly Reviews
- Comprehensive KPI assessment
- User feedback analysis
- Technical debt review
- Phase 2 readiness evaluation

---

## 10. PHASE 1 DELIVERABLES

### 10.1 Technical Deliverables
- [x] **SuperApp Web Application** - Complete PWA with all core features
- [x] **Admin Dashboard** - Management interface for operations
- [x] **API Documentation** - Complete REST API documentation
- [x] **Database Schema** - Production-ready database structure
- [x] **Deployment Scripts** - Automated deployment configuration

### 10.2 Documentation Deliverables
- [x] **User Manual** - Complete guide for members and admins
- [x] **API Documentation** - Technical reference for integrations
- [x] **Admin Procedures** - Operational guides for staff
- [x] **Security Guidelines** - Security policies and procedures
- [x] **Disaster Recovery Plan** - Backup and recovery procedures

### 10.3 Training Materials
- [x] **Member Onboarding Guide** - Step-by-step registration tutorial
- [x] **Admin Training Videos** - Dashboard operation tutorials
- [x] **FAQ Database** - Common questions and solutions
- [x] **Support Scripts** - Customer service response templates

---

## CONCLUSION

Phase 1 of the Koperasi Sinoman SuperApp establishes the essential foundation for digital cooperative services, focusing on member onboarding, savings management, and the signature Fit Challenge program. This MVP approach ensures we can validate core assumptions, gather user feedback, and build toward the comprehensive ecosystem outlined in the full PRD.

The success of Phase 1 will be measured not just by technical implementation, but by genuine user adoption and the positive impact on member financial health and wellness. With 1,000 active members and robust core functionality, Phase 1 sets the stage for rapid scaling in subsequent phases.

**Next Phase Preview:** Phase 2 will expand into e-commerce marketplace, Bank Sampah integration, and advanced investment features, building on the solid foundation established in Phase 1.

---

*Document Version: 1.0*
*Last Updated: September 2025*
*Prepared by: Koperasi Sinoman Technology Team*