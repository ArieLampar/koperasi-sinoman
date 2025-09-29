# API Documentation - Phase 1

**KOPERASI SINOMAN SUPERAPP**

*REST API Reference for Core Platform MVP*

---

## 1. OVERVIEW

### 1.1 API Information
- **Base URL:** `https://api.sinoman.id` (Production) / `http://localhost:3000/api` (Development)
- **API Version:** v1
- **Protocol:** HTTPS only (HTTP in development)
- **Content Type:** `application/json`
- **Character Encoding:** UTF-8

### 1.2 Technology Stack
- **Framework:** Next.js 14 API Routes with App Router
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth + JWT
- **File Storage:** Cloudinary
- **Payment Gateway:** Midtrans Core API
- **Notifications:** Fonnte WhatsApp API

### 1.3 Rate Limiting
- **Authenticated Users:** 1000 requests/hour
- **Public Endpoints:** 100 requests/hour
- **Admin Users:** 5000 requests/hour
- **File Upload:** 10 uploads/hour per user

---

## 2. AUTHENTICATION

### 2.1 Authentication Overview
The API uses JWT tokens provided by Supabase Auth. Include the token in the Authorization header for all authenticated requests.

```http
Authorization: Bearer <jwt_token>
```

### 2.2 Authentication Endpoints

#### 2.2.1 Register Member
Create a new member account with KYC information.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "phone": "081234567890",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "nik": "1234567890123456",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  "address": "Jl. Contoh No. 123, Ponorogo",
  "village": "Desa Contoh",
  "district": "Kecamatan Ponorogo",
  "postal_code": "63411",
  "occupation": "Software Engineer",
  "referral_code": "ABC12345"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Member registered successfully. Please verify your email.",
  "data": {
    "member": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "member_number": "SIN-2024-000001",
      "email": "john.doe@example.com",
      "full_name": "John Doe",
      "phone": "081234567890",
      "membership_status": "pending",
      "kyc_status": "pending",
      "created_at": "2024-09-29T10:00:00Z"
    },
    "savings_accounts": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "account_number": "SA-2024-000001",
        "savings_type": "SP",
        "balance": 0,
        "virtual_account_number": "8801234567890001"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440002",
        "account_number": "SA-2024-000002",
        "savings_type": "SW",
        "balance": 0,
        "virtual_account_number": "8801234567890002"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440003",
        "account_number": "SA-2024-000003",
        "savings_type": "SS",
        "balance": 0,
        "virtual_account_number": "8801234567890003"
      }
    ]
  }
}
```

#### 2.2.2 Login
Authenticate member with email/phone and password.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "identifier": "john.doe@example.com", // email or phone
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "member": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "member_number": "SIN-2024-000001",
      "email": "john.doe@example.com",
      "full_name": "John Doe",
      "membership_status": "active",
      "kyc_status": "verified"
    }
  }
}
```

#### 2.2.3 OTP Request
Request OTP for phone verification or password reset.

**Endpoint:** `POST /api/auth/otp/request`

**Request Body:**
```json
{
  "phone": "081234567890",
  "type": "verification" // "verification" | "reset_password"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otp_id": "otp_550e8400-e29b-41d4-a716-446655440000",
    "expires_at": "2024-09-29T10:05:00Z",
    "phone": "081234567890"
  }
}
```

#### 2.2.4 OTP Verification
Verify OTP code sent to phone.

**Endpoint:** `POST /api/auth/otp/verify`

**Request Body:**
```json
{
  "otp_id": "otp_550e8400-e29b-41d4-a716-446655440000",
  "otp_code": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "verified": true,
    "phone_verified_at": "2024-09-29T10:05:00Z"
  }
}
```

#### 2.2.5 Refresh Token
Refresh access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

#### 2.2.6 Logout
Invalidate current session and tokens.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 3. MEMBER MANAGEMENT

### 3.1 Member Profile

#### 3.1.1 Get Member Profile
Retrieve current member's profile information.

**Endpoint:** `GET /api/members/profile`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "member_number": "SIN-2024-000001",
      "email": "john.doe@example.com",
      "phone": "081234567890",
      "full_name": "John Doe",
      "nik": "1234567890123456",
      "date_of_birth": "1990-01-01",
      "gender": "male",
      "address": "Jl. Contoh No. 123, Ponorogo",
      "village": "Desa Contoh",
      "district": "Kecamatan Ponorogo",
      "city": "Ponorogo",
      "province": "Jawa Timur",
      "postal_code": "63411",
      "occupation": "Software Engineer",
      "membership_type": "regular",
      "membership_status": "active",
      "join_date": "2024-09-29T10:00:00Z",
      "kyc_status": "verified",
      "kyc_verified_at": "2024-09-29T11:00:00Z",
      "profile_picture_url": "https://res.cloudinary.com/sinoman/image/upload/v1/profiles/member_001.jpg",
      "referral_code": "ABC12345",
      "created_at": "2024-09-29T10:00:00Z",
      "updated_at": "2024-09-29T11:00:00Z"
    }
  }
}
```

#### 3.1.2 Update Member Profile
Update member profile information.

**Endpoint:** `PUT /api/members/profile`

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "full_name": "John Smith Doe",
  "phone": "081234567891",
  "address": "Jl. Baru No. 456, Ponorogo",
  "village": "Desa Baru",
  "district": "Kecamatan Ponorogo",
  "postal_code": "63412",
  "occupation": "Senior Software Engineer",
  "bio": "Passionate developer and cooperative member"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "member": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Smith Doe",
      "phone": "081234567891",
      "address": "Jl. Baru No. 456, Ponorogo",
      "bio": "Passionate developer and cooperative member",
      "updated_at": "2024-09-29T12:00:00Z"
    }
  }
}
```

#### 3.1.3 Upload Profile Picture
Upload or update member profile picture.

**Endpoint:** `POST /api/members/profile/picture`

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
Form Data:
- file: <image_file> (JPEG, PNG, max 5MB)
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profile_picture_url": "https://res.cloudinary.com/sinoman/image/upload/v1/profiles/member_001_updated.jpg",
    "uploaded_at": "2024-09-29T12:00:00Z"
  }
}
```

### 3.2 KYC Documents

#### 3.2.1 Upload KYC Document
Upload KYC verification documents.

**Endpoint:** `POST /api/members/kyc/documents`

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
Form Data:
- document_type: "ktp" | "selfie" | "kk" | "npwp" | "bank_statement"
- file: <document_file> (JPEG, PNG, PDF, max 10MB)
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "document": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "document_type": "ktp",
      "document_url": "https://res.cloudinary.com/sinoman/image/upload/v1/kyc/ktp_001.jpg",
      "verification_status": "pending",
      "file_size_bytes": 2048000,
      "mime_type": "image/jpeg",
      "created_at": "2024-09-29T12:00:00Z"
    }
  }
}
```

#### 3.2.2 Get KYC Documents
Retrieve member's KYC documents and verification status.

**Endpoint:** `GET /api/members/kyc/documents`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "document_type": "ktp",
        "document_url": "https://res.cloudinary.com/sinoman/image/upload/v1/kyc/ktp_001.jpg",
        "verification_status": "approved",
        "verified_at": "2024-09-29T11:00:00Z",
        "created_at": "2024-09-29T10:30:00Z"
      },
      {
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "document_type": "selfie",
        "document_url": "https://res.cloudinary.com/sinoman/image/upload/v1/kyc/selfie_001.jpg",
        "verification_status": "approved",
        "verified_at": "2024-09-29T11:00:00Z",
        "created_at": "2024-09-29T10:35:00Z"
      }
    ],
    "kyc_status": "verified",
    "kyc_verified_at": "2024-09-29T11:00:00Z"
  }
}
```

### 3.3 Referral System

#### 3.3.1 Get Referral Information
Get member's referral code and referral statistics.

**Endpoint:** `GET /api/members/referrals`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "referral_code": "ABC12345",
    "total_referrals": 5,
    "successful_referrals": 3,
    "pending_referrals": 2,
    "total_bonus_earned": 150000,
    "pending_bonus": 100000,
    "referrals": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "referred_member": {
          "member_number": "SIN-2024-000005",
          "full_name": "Jane Doe",
          "join_date": "2024-09-28T10:00:00Z"
        },
        "referral_bonus": 50000,
        "status": "paid",
        "created_at": "2024-09-28T10:00:00Z",
        "paid_at": "2024-09-29T10:00:00Z"
      }
    ]
  }
}
```

---

## 4. SAVINGS MANAGEMENT

### 4.1 Savings Accounts

#### 4.1.1 Get Savings Accounts
Retrieve member's savings accounts and balances.

**Endpoint:** `GET /api/savings/accounts`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "account_number": "SA-2024-000001",
        "savings_type": {
          "id": "990e8400-e29b-41d4-a716-446655440001",
          "name": "Simpanan Pokok",
          "code": "SP",
          "description": "Simpanan wajib sekali seumur hidup saat pendaftaran",
          "minimum_amount": 80000,
          "is_withdrawable": false,
          "is_mandatory": true
        },
        "balance": 80000,
        "virtual_account_number": "8801234567890001",
        "status": "active",
        "opened_date": "2024-09-29T10:00:00Z",
        "last_transaction_date": "2024-09-29T10:00:00Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440002",
        "account_number": "SA-2024-000002",
        "savings_type": {
          "id": "990e8400-e29b-41d4-a716-446655440002",
          "name": "Simpanan Wajib",
          "code": "SW",
          "description": "Simpanan wajib bulanan untuk anggota aktif",
          "minimum_amount": 10000,
          "is_withdrawable": false,
          "is_mandatory": true
        },
        "balance": 120000,
        "virtual_account_number": "8801234567890002",
        "status": "active",
        "opened_date": "2024-09-29T10:00:00Z",
        "last_transaction_date": "2024-09-29T10:00:00Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440003",
        "account_number": "SA-2024-000003",
        "savings_type": {
          "id": "990e8400-e29b-41d4-a716-446655440003",
          "name": "Simpanan Sukarela",
          "code": "SS",
          "description": "Simpanan sukarela yang dapat ditarik sewaktu-waktu",
          "minimum_amount": 10000,
          "is_withdrawable": true,
          "is_mandatory": false
        },
        "balance": 500000,
        "virtual_account_number": "8801234567890003",
        "status": "active",
        "opened_date": "2024-09-29T10:00:00Z",
        "last_transaction_date": "2024-09-29T15:00:00Z"
      }
    ],
    "total_balance": 700000,
    "summary": {
      "mandatory_savings": 200000,
      "voluntary_savings": 500000,
      "withdrawable_balance": 500000
    }
  }
}
```

#### 4.1.2 Get Single Savings Account
Retrieve details of a specific savings account.

**Endpoint:** `GET /api/savings/accounts/{account_id}`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "account": {
      "id": "660e8400-e29b-41d4-a716-446655440003",
      "account_number": "SA-2024-000003",
      "savings_type": {
        "id": "990e8400-e29b-41d4-a716-446655440003",
        "name": "Simpanan Sukarela",
        "code": "SS",
        "description": "Simpanan sukarela yang dapat ditarik sewaktu-waktu",
        "minimum_amount": 10000,
        "is_withdrawable": true,
        "is_mandatory": false,
        "interest_rate": 0.06
      },
      "balance": 500000,
      "virtual_account_number": "8801234567890003",
      "status": "active",
      "opened_date": "2024-09-29T10:00:00Z",
      "last_interest_calculated_at": "2024-09-01T00:00:00Z",
      "total_interest_earned": 25000,
      "created_at": "2024-09-29T10:00:00Z",
      "updated_at": "2024-09-29T15:00:00Z"
    }
  }
}
```

### 4.2 Transactions

#### 4.2.1 Create Deposit Transaction
Create a new deposit transaction.

**Endpoint:** `POST /api/savings/transactions`

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "savings_account_id": "660e8400-e29b-41d4-a716-446655440003",
  "transaction_type": "SS_DEPOSIT",
  "amount": 100000,
  "description": "Setoran simpanan sukarela",
  "payment_method": "bank_transfer"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "transaction": {
      "id": "aa0e8400-e29b-41d4-a716-446655440000",
      "transaction_number": "TXN-2024-000001",
      "savings_account_id": "660e8400-e29b-41d4-a716-446655440003",
      "transaction_type": {
        "id": "bb0e8400-e29b-41d4-a716-446655440001",
        "name": "Setoran Simpanan Sukarela",
        "code": "SS_DEPOSIT",
        "category": "deposit"
      },
      "amount": 100000,
      "description": "Setoran simpanan sukarela",
      "balance_before": 500000,
      "balance_after": 600000,
      "payment_method": "bank_transfer",
      "payment_reference": "PAY-2024-000001",
      "status": "pending",
      "created_at": "2024-09-29T15:00:00Z",
      "payment_instructions": {
        "bank_name": "Bank BCA",
        "account_number": "8801234567890003",
        "account_name": "Koperasi Sinoman",
        "amount": 100000,
        "unique_code": "001",
        "total_amount": 100001,
        "payment_deadline": "2024-09-30T15:00:00Z"
      }
    }
  }
}
```

#### 4.2.2 Create Withdrawal Transaction
Create a withdrawal transaction (voluntary savings only).

**Endpoint:** `POST /api/savings/withdrawals`

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "savings_account_id": "660e8400-e29b-41d4-a716-446655440003",
  "amount": 50000,
  "description": "Penarikan untuk keperluan darurat",
  "bank_account": {
    "bank_name": "Bank BCA",
    "account_number": "1234567890",
    "account_name": "John Doe"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Withdrawal request created successfully",
  "data": {
    "transaction": {
      "id": "aa0e8400-e29b-41d4-a716-446655440001",
      "transaction_number": "TXN-2024-000002",
      "savings_account_id": "660e8400-e29b-41d4-a716-446655440003",
      "amount": 50000,
      "description": "Penarikan untuk keperluan darurat",
      "balance_before": 600000,
      "balance_after": 550000,
      "status": "pending",
      "created_at": "2024-09-29T16:00:00Z",
      "processing_time": "24 hours",
      "withdrawal_info": {
        "bank_name": "Bank BCA",
        "account_number": "1234567890",
        "account_name": "John Doe",
        "estimated_completion": "2024-09-30T16:00:00Z"
      }
    }
  }
}
```

#### 4.2.3 Get Transaction History
Retrieve transaction history for member's savings accounts.

**Endpoint:** `GET /api/savings/transactions`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `account_id` (optional): Filter by specific savings account
- `type` (optional): Filter by transaction type (deposit, withdrawal)
- `status` (optional): Filter by status (pending, completed, failed)
- `start_date` (optional): Filter from date (YYYY-MM-DD)
- `end_date` (optional): Filter to date (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example:** `GET /api/savings/transactions?account_id=660e8400-e29b-41d4-a716-446655440003&page=1&limit=10`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440000",
        "transaction_number": "TXN-2024-000001",
        "savings_account": {
          "id": "660e8400-e29b-41d4-a716-446655440003",
          "account_number": "SA-2024-000003",
          "savings_type": "Simpanan Sukarela"
        },
        "transaction_type": {
          "name": "Setoran Simpanan Sukarela",
          "code": "SS_DEPOSIT",
          "category": "deposit"
        },
        "amount": 100000,
        "description": "Setoran simpanan sukarela",
        "balance_before": 500000,
        "balance_after": 600000,
        "payment_method": "bank_transfer",
        "payment_reference": "PAY-2024-000001",
        "status": "completed",
        "processed_at": "2024-09-29T15:30:00Z",
        "created_at": "2024-09-29T15:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 45,
      "items_per_page": 10,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

#### 4.2.4 Get Transaction Details
Get detailed information about a specific transaction.

**Endpoint:** `GET /api/savings/transactions/{transaction_id}`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "aa0e8400-e29b-41d4-a716-446655440000",
      "transaction_number": "TXN-2024-000001",
      "member": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "member_number": "SIN-2024-000001",
        "full_name": "John Doe"
      },
      "savings_account": {
        "id": "660e8400-e29b-41d4-a716-446655440003",
        "account_number": "SA-2024-000003",
        "savings_type": {
          "name": "Simpanan Sukarela",
          "code": "SS"
        }
      },
      "transaction_type": {
        "id": "bb0e8400-e29b-41d4-a716-446655440001",
        "name": "Setoran Simpanan Sukarela",
        "code": "SS_DEPOSIT",
        "category": "deposit"
      },
      "amount": 100000,
      "description": "Setoran simpanan sukarela",
      "balance_before": 500000,
      "balance_after": 600000,
      "payment_method": "bank_transfer",
      "payment_reference": "PAY-2024-000001",
      "payment_gateway_response": {
        "transaction_id": "midtrans_12345",
        "payment_type": "bank_transfer",
        "transaction_time": "2024-09-29T15:30:00Z",
        "transaction_status": "settlement",
        "settlement_time": "2024-09-29T15:30:00Z"
      },
      "status": "completed",
      "processed_at": "2024-09-29T15:30:00Z",
      "processed_by": {
        "id": "cc0e8400-e29b-41d4-a716-446655440000",
        "name": "System Auto-Process"
      },
      "notes": "Transaction completed automatically via payment gateway",
      "created_at": "2024-09-29T15:00:00Z",
      "updated_at": "2024-09-29T15:30:00Z"
    }
  }
}
```

### 4.3 Savings Reports

#### 4.3.1 Get Savings Summary
Get summary of member's savings performance.

**Endpoint:** `GET /api/savings/summary`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `period` (optional): Summary period (month, quarter, year, all) - default: month

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_balance": 700000,
      "mandatory_savings": 200000,
      "voluntary_savings": 500000,
      "monthly_deposit": 120000,
      "total_deposits": 820000,
      "total_withdrawals": 120000,
      "net_savings": 700000,
      "interest_earned": 25000,
      "shu_projection": 35000,
      "growth_rate": 15.5,
      "savings_goal": {
        "target_amount": 1000000,
        "current_progress": 70.0,
        "months_to_target": 3
      }
    },
    "monthly_breakdown": [
      {
        "month": "2024-09",
        "deposits": 200000,
        "withdrawals": 0,
        "interest": 8500,
        "ending_balance": 700000
      },
      {
        "month": "2024-08",
        "deposits": 120000,
        "withdrawals": 50000,
        "interest": 8200,
        "ending_balance": 500000
      }
    ],
    "account_breakdown": [
      {
        "savings_type": "Simpanan Pokok",
        "balance": 80000,
        "percentage": 11.4
      },
      {
        "savings_type": "Simpanan Wajib",
        "balance": 120000,
        "percentage": 17.1
      },
      {
        "savings_type": "Simpanan Sukarela",
        "balance": 500000,
        "percentage": 71.5
      }
    ]
  }
}
```

---

## 5. FIT CHALLENGE PROGRAM

### 5.1 Batch Management

#### 5.1.1 Get Available Batches
Retrieve list of available Fit Challenge batches.

**Endpoint:** `GET /api/fit-challenge/batches`

**Query Parameters:**
- `status` (optional): Filter by status (open, active, completed)
- `upcoming` (optional): Show only upcoming batches (true/false)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "id": "dd0e8400-e29b-41d4-a716-446655440000",
        "name": "Fit Challenge Batch 3",
        "description": "8-week fitness transformation program",
        "batch_number": "FC-2024-003",
        "start_date": "2024-10-15",
        "end_date": "2024-12-10",
        "registration_start_date": "2024-09-20",
        "registration_end_date": "2024-10-10",
        "max_participants": 100,
        "current_participants": 45,
        "available_slots": 55,
        "program_fee": 600000,
        "early_bird_fee": 500000,
        "early_bird_deadline": "2024-10-01",
        "venue_name": "Sinoman Fitness Center",
        "venue_address": "Jl. Sudirman No. 123, Ponorogo",
        "trainer_names": ["Budi Santoso", "Sari Wijaya"],
        "status": "open",
        "created_at": "2024-09-15T10:00:00Z"
      }
    ]
  }
}
```

#### 5.1.2 Get Batch Details
Get detailed information about a specific batch.

**Endpoint:** `GET /api/fit-challenge/batches/{batch_id}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "batch": {
      "id": "dd0e8400-e29b-41d4-a716-446655440000",
      "name": "Fit Challenge Batch 3",
      "description": "8-week fitness transformation program with professional trainers",
      "batch_number": "FC-2024-003",
      "start_date": "2024-10-15",
      "end_date": "2024-12-10",
      "registration_start_date": "2024-09-20",
      "registration_end_date": "2024-10-10",
      "max_participants": 100,
      "current_participants": 45,
      "available_slots": 55,
      "waitlist_count": 5,
      "program_fee": 600000,
      "early_bird_fee": 500000,
      "early_bird_deadline": "2024-10-01",
      "venue_name": "Sinoman Fitness Center",
      "venue_address": "Jl. Sudirman No. 123, Ponorogo",
      "trainer_names": ["Budi Santoso", "Sari Wijaya"],
      "program_details": {
        "duration_weeks": 8,
        "sessions_per_week": 3,
        "session_duration_minutes": 90,
        "includes": [
          "Initial fitness assessment",
          "Personalized workout plan",
          "Nutrition guidance",
          "Weekly progress tracking",
          "Group fitness classes",
          "Final assessment",
          "Completion certificate"
        ]
      },
      "status": "open",
      "created_at": "2024-09-15T10:00:00Z"
    }
  }
}
```

### 5.2 Registration

#### 5.2.1 Register for Fit Challenge
Register member for a Fit Challenge batch.

**Endpoint:** `POST /api/fit-challenge/register`

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "batch_id": "dd0e8400-e29b-41d4-a716-446655440000",
  "initial_weight": 75.5,
  "initial_height": 170.0,
  "target_weight": 70.0,
  "personal_goals": "Lose weight and build muscle",
  "medical_conditions": "None",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "081234567891"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "registration": {
      "id": "ee0e8400-e29b-41d4-a716-446655440000",
      "participant_number": "FCP-2024-000046",
      "member": {
        "member_number": "SIN-2024-000001",
        "full_name": "John Doe"
      },
      "batch": {
        "id": "dd0e8400-e29b-41d4-a716-446655440000",
        "name": "Fit Challenge Batch 3",
        "start_date": "2024-10-15"
      },
      "registration_date": "2024-09-29T16:00:00Z",
      "payment_status": "pending",
      "amount_due": 500000,
      "payment_deadline": "2024-10-06T23:59:59Z",
      "participation_status": "active",
      "initial_assessment": {
        "weight": 75.5,
        "height": 170.0,
        "target_weight": 70.0,
        "personal_goals": "Lose weight and build muscle"
      },
      "emergency_contact": {
        "name": "Jane Doe",
        "phone": "081234567891"
      },
      "payment_instructions": {
        "amount": 500000,
        "virtual_account": "8801234567890046",
        "payment_methods": ["bank_transfer", "gopay", "ovo", "dana"],
        "deadline": "2024-10-06T23:59:59Z"
      }
    }
  }
}
```

#### 5.2.2 Get Registration Status
Check registration status for current member.

**Endpoint:** `GET /api/fit-challenge/registration`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "registrations": [
      {
        "id": "ee0e8400-e29b-41d4-a716-446655440000",
        "participant_number": "FCP-2024-000046",
        "batch": {
          "id": "dd0e8400-e29b-41d4-a716-446655440000",
          "name": "Fit Challenge Batch 3",
          "start_date": "2024-10-15",
          "end_date": "2024-12-10",
          "status": "open"
        },
        "registration_date": "2024-09-29T16:00:00Z",
        "payment_status": "completed",
        "amount_paid": 500000,
        "participation_status": "active",
        "completion_percentage": 0,
        "current_week": 0,
        "next_checkin_date": "2024-10-22"
      }
    ]
  }
}
```

### 5.3 Progress Tracking

#### 5.3.1 Submit Weekly Progress
Submit weekly progress check-in.

**Endpoint:** `POST /api/fit-challenge/progress`

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
Form Data:
- participant_id: "ee0e8400-e29b-41d4-a716-446655440000"
- week_number: 3
- weight: 73.2
- body_fat_percentage: 18.5
- chest_circumference: 95.0
- waist_circumference: 85.0
- hip_circumference: 98.0
- workouts_completed: 8
- total_workouts_planned: 9
- nutrition_adherence_score: 8
- participant_notes: "Feeling stronger and more energetic"
- progress_photo_front: <image_file>
- progress_photo_side: <image_file>
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Progress submitted successfully",
  "data": {
    "progress": {
      "id": "ff0e8400-e29b-41d4-a716-446655440000",
      "participant_id": "ee0e8400-e29b-41d4-a716-446655440000",
      "week_number": 3,
      "check_in_date": "2024-11-05",
      "measurements": {
        "weight": 73.2,
        "body_fat_percentage": 18.5,
        "chest_circumference": 95.0,
        "waist_circumference": 85.0,
        "hip_circumference": 98.0
      },
      "workout_progress": {
        "workouts_completed": 8,
        "total_workouts_planned": 9,
        "completion_rate": 88.9
      },
      "nutrition_adherence_score": 8,
      "participant_notes": "Feeling stronger and more energetic",
      "progress_photos": {
        "front": "https://res.cloudinary.com/sinoman/image/upload/v1/progress/week3_front.jpg",
        "side": "https://res.cloudinary.com/sinoman/image/upload/v1/progress/week3_side.jpg"
      },
      "created_at": "2024-11-05T10:00:00Z"
    }
  }
}
```

#### 5.3.2 Get Progress History
Retrieve progress tracking history for participant.

**Endpoint:** `GET /api/fit-challenge/progress/{participant_id}`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "participant": {
      "id": "ee0e8400-e29b-41d4-a716-446655440000",
      "participant_number": "FCP-2024-000046",
      "batch_name": "Fit Challenge Batch 3",
      "start_date": "2024-10-15",
      "current_week": 3,
      "completion_percentage": 37.5
    },
    "initial_assessment": {
      "weight": 75.5,
      "height": 170.0,
      "target_weight": 70.0,
      "bmi": 26.1
    },
    "current_status": {
      "weight": 73.2,
      "weight_loss": 2.3,
      "bmi": 25.3,
      "progress_to_goal": 41.8
    },
    "progress_history": [
      {
        "week_number": 1,
        "check_in_date": "2024-10-22",
        "weight": 74.8,
        "body_fat_percentage": 20.0,
        "workouts_completed": 9,
        "total_workouts_planned": 9,
        "nutrition_adherence_score": 7
      },
      {
        "week_number": 2,
        "check_in_date": "2024-10-29",
        "weight": 74.0,
        "body_fat_percentage": 19.2,
        "workouts_completed": 8,
        "total_workouts_planned": 9,
        "nutrition_adherence_score": 8
      },
      {
        "week_number": 3,
        "check_in_date": "2024-11-05",
        "weight": 73.2,
        "body_fat_percentage": 18.5,
        "workouts_completed": 8,
        "total_workouts_planned": 9,
        "nutrition_adherence_score": 8
      }
    ],
    "achievements": [
      "First week completed",
      "5% body fat reduction",
      "Consistent workout attendance"
    ]
  }
}
```

---

## 6. ADMIN FUNCTIONS

### 6.1 Member Management

#### 6.1.1 Get All Members (Admin)
Retrieve list of all members with filtering options.

**Endpoint:** `GET /api/admin/members`

**Headers:**
```http
Authorization: Bearer <jwt_token>
X-Admin-Role: admin
```

**Query Parameters:**
- `status` (optional): Filter by membership status
- `kyc_status` (optional): Filter by KYC status
- `search` (optional): Search by name, email, or member number
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort_by` (optional): Sort field (created_at, full_name, member_number)
- `sort_order` (optional): Sort order (asc, desc)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "member_number": "SIN-2024-000001",
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "081234567890",
        "membership_status": "active",
        "kyc_status": "verified",
        "join_date": "2024-09-29T10:00:00Z",
        "total_savings": 700000,
        "last_activity": "2024-09-29T16:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 50,
      "total_items": 1000,
      "items_per_page": 20,
      "has_next": true,
      "has_prev": false
    },
    "summary": {
      "total_members": 1000,
      "active_members": 950,
      "pending_verification": 30,
      "suspended_members": 20
    }
  }
}
```

#### 6.1.2 Update Member Status (Admin)
Update member's status or KYC verification.

**Endpoint:** `PUT /api/admin/members/{member_id}/status`

**Headers:**
```http
Authorization: Bearer <jwt_token>
X-Admin-Role: admin
Content-Type: application/json
```

**Request Body:**
```json
{
  "membership_status": "active",
  "kyc_status": "verified",
  "notes": "All documents verified successfully"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Member status updated successfully",
  "data": {
    "member": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "member_number": "SIN-2024-000001",
      "membership_status": "active",
      "kyc_status": "verified",
      "kyc_verified_at": "2024-09-29T17:00:00Z",
      "updated_at": "2024-09-29T17:00:00Z"
    }
  }
}
```

### 6.2 Financial Management

#### 6.2.1 Get Financial Dashboard (Admin)
Retrieve financial overview and key metrics.

**Endpoint:** `GET /api/admin/financial/dashboard`

**Headers:**
```http
Authorization: Bearer <jwt_token>
X-Admin-Role: admin
```

**Query Parameters:**
- `period` (optional): Time period (today, week, month, quarter, year)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_savings": 50000000,
      "total_deposits_today": 2500000,
      "total_withdrawals_today": 500000,
      "net_flow_today": 2000000,
      "active_members": 950,
      "pending_transactions": 25
    },
    "savings_breakdown": {
      "simpanan_pokok": 76000000,
      "simpanan_wajib": 114000000,
      "simpanan_sukarela": 310000000,
      "total": 500000000
    },
    "monthly_trends": [
      {
        "month": "2024-09",
        "deposits": 15000000,
        "withdrawals": 3000000,
        "net_savings": 12000000,
        "new_members": 150
      },
      {
        "month": "2024-08",
        "deposits": 12000000,
        "withdrawals": 2500000,
        "net_savings": 9500000,
        "new_members": 120
      }
    ],
    "top_savers": [
      {
        "member_number": "SIN-2024-000001",
        "full_name": "John Doe",
        "total_savings": 2500000
      }
    ]
  }
}
```

#### 6.2.2 Get Transaction Report (Admin)
Generate detailed transaction reports.

**Endpoint:** `GET /api/admin/financial/transactions`

**Headers:**
```http
Authorization: Bearer <jwt_token>
X-Admin-Role: admin
```

**Query Parameters:**
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `transaction_type` (optional): Filter by transaction type
- `status` (optional): Filter by status
- `export_format` (optional): Export format (json, csv, pdf)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transaction_number": "TXN-2024-000001",
        "member_number": "SIN-2024-000001",
        "member_name": "John Doe",
        "transaction_type": "SS_DEPOSIT",
        "amount": 100000,
        "status": "completed",
        "created_at": "2024-09-29T15:00:00Z",
        "processed_at": "2024-09-29T15:30:00Z"
      }
    ],
    "summary": {
      "total_transactions": 1250,
      "total_amount": 125000000,
      "successful_transactions": 1200,
      "failed_transactions": 25,
      "pending_transactions": 25,
      "success_rate": 96.0
    },
    "export_url": "https://api.sinoman.id/admin/reports/transactions/export/txn_report_20240929.csv"
  }
}
```

### 6.3 Fit Challenge Management

#### 6.3.1 Create Fit Challenge Batch (Admin)
Create a new Fit Challenge batch.

**Endpoint:** `POST /api/admin/fit-challenge/batches`

**Headers:**
```http
Authorization: Bearer <jwt_token>
X-Admin-Role: admin
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Fit Challenge Batch 4",
  "description": "8-week fitness transformation program",
  "start_date": "2024-12-01",
  "end_date": "2025-01-26",
  "registration_start_date": "2024-11-01",
  "registration_end_date": "2024-11-25",
  "max_participants": 100,
  "program_fee": 600000,
  "early_bird_fee": 500000,
  "early_bird_deadline": "2024-11-15",
  "venue_name": "Sinoman Fitness Center",
  "venue_address": "Jl. Sudirman No. 123, Ponorogo",
  "trainer_names": ["Budi Santoso", "Sari Wijaya", "Ahmad Rahman"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Fit Challenge batch created successfully",
  "data": {
    "batch": {
      "id": "dd0e8400-e29b-41d4-a716-446655440001",
      "name": "Fit Challenge Batch 4",
      "batch_number": "FC-2024-004",
      "start_date": "2024-12-01",
      "end_date": "2025-01-26",
      "max_participants": 100,
      "current_participants": 0,
      "status": "draft",
      "created_at": "2024-09-29T17:00:00Z"
    }
  }
}
```

#### 6.3.2 Get Fit Challenge Analytics (Admin)
Get analytics and performance data for Fit Challenge programs.

**Endpoint:** `GET /api/admin/fit-challenge/analytics`

**Headers:**
```http
Authorization: Bearer <jwt_token>
X-Admin-Role: admin
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_batches": 3,
      "active_batches": 1,
      "total_participants": 245,
      "completion_rate": 85.5,
      "average_weight_loss": 3.2,
      "total_revenue": 147000000
    },
    "batch_performance": [
      {
        "batch_number": "FC-2024-001",
        "participants": 95,
        "completed": 85,
        "completion_rate": 89.5,
        "average_weight_loss": 3.8,
        "satisfaction_score": 4.6
      },
      {
        "batch_number": "FC-2024-002",
        "participants": 100,
        "completed": 81,
        "completion_rate": 81.0,
        "average_weight_loss": 2.9,
        "satisfaction_score": 4.4
      }
    ],
    "monthly_registrations": [
      {
        "month": "2024-09",
        "registrations": 50,
        "revenue": 25000000
      }
    ]
  }
}
```

---

## 7. ERROR HANDLING

### 7.1 Error Response Format
All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details",
    "field": "field_name", // For validation errors
    "timestamp": "2024-09-29T17:00:00Z",
    "request_id": "req_550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 7.2 HTTP Status Codes

| Status Code | Description | Usage |
|-------------|-------------|-------|
| 200 | OK | Successful GET, PUT, DELETE requests |
| 201 | Created | Successful POST requests that create resources |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Requested resource does not exist |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side errors |
| 503 | Service Unavailable | Maintenance or overload |

### 7.3 Common Error Codes

#### Authentication Errors
- `AUTH_TOKEN_MISSING` - Authorization header missing
- `AUTH_TOKEN_INVALID` - Invalid or expired token
- `AUTH_TOKEN_EXPIRED` - Token has expired
- `AUTH_INSUFFICIENT_PERMISSIONS` - User lacks required permissions

#### Validation Errors
- `VALIDATION_FAILED` - General validation error
- `FIELD_REQUIRED` - Required field missing
- `FIELD_INVALID` - Field value is invalid
- `FIELD_TOO_LONG` - Field value exceeds maximum length
- `FIELD_TOO_SHORT` - Field value below minimum length

#### Business Logic Errors
- `MEMBER_NOT_FOUND` - Member does not exist
- `ACCOUNT_NOT_FOUND` - Savings account not found
- `INSUFFICIENT_BALANCE` - Not enough balance for withdrawal
- `BATCH_FULL` - Fit Challenge batch is full
- `REGISTRATION_CLOSED` - Registration period has ended
- `KYC_NOT_VERIFIED` - KYC verification required
- `DUPLICATE_REGISTRATION` - Already registered for batch

#### Payment Errors
- `PAYMENT_FAILED` - Payment processing failed
- `PAYMENT_TIMEOUT` - Payment processing timeout
- `INVALID_AMOUNT` - Invalid payment amount
- `PAYMENT_METHOD_UNAVAILABLE` - Payment method not available

### 7.4 Error Examples

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_MISSING",
    "message": "Authorization token is required",
    "details": "Please include 'Authorization: Bearer <token>' header",
    "timestamp": "2024-09-29T17:00:00Z",
    "request_id": "req_550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### 422 Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed for the request",
    "details": {
      "email": ["Email format is invalid"],
      "phone": ["Phone number is required"],
      "amount": ["Amount must be greater than 10000"]
    },
    "timestamp": "2024-09-29T17:00:00Z",
    "request_id": "req_550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### 400 Business Logic Error
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance for withdrawal",
    "details": "Current balance: Rp 50,000, Requested: Rp 100,000",
    "field": "amount",
    "timestamp": "2024-09-29T17:00:00Z",
    "request_id": "req_550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## 8. WEBHOOKS

### 8.1 Payment Gateway Webhooks
Handle payment status updates from Midtrans.

**Endpoint:** `POST /api/webhooks/midtrans`

**Request Headers (from Midtrans):**
```http
Content-Type: application/json
X-Callback-Token: <webhook_secret>
```

**Request Body (from Midtrans):**
```json
{
  "transaction_time": "2024-09-29 15:30:00",
  "transaction_status": "settlement",
  "transaction_id": "TXN-2024-000001",
  "status_message": "midtrans payment notification",
  "status_code": "200",
  "signature_key": "abc123...",
  "settlement_time": "2024-09-29 15:30:00",
  "payment_type": "bank_transfer",
  "order_id": "TXN-2024-000001",
  "merchant_id": "G123456789",
  "gross_amount": "100000.00",
  "fraud_status": "accept",
  "currency": "IDR"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### 8.2 WhatsApp Status Webhooks
Handle WhatsApp message delivery status from Fonnte.

**Endpoint:** `POST /api/webhooks/whatsapp`

**Request Headers (from Fonnte):**
```http
Content-Type: application/json
X-API-KEY: <api_key>
```

**Request Body (from Fonnte):**
```json
{
  "device": "device_id",
  "sender": "6281234567890",
  "message": "Your payment has been confirmed",
  "status": "sent",
  "timestamp": "2024-09-29T15:30:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

---

## 9. DEVELOPMENT GUIDELINES

### 9.1 Request/Response Standards

#### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
X-API-Version: v1
X-Request-ID: <unique_request_id>
```

#### Response Headers
```http
Content-Type: application/json; charset=utf-8
X-API-Version: v1
X-Request-ID: <unique_request_id>
X-Response-Time: <response_time_ms>
Cache-Control: no-cache, no-store, must-revalidate
```

### 9.2 API Versioning
- Version included in base URL: `/api/v1/`
- Backward compatibility maintained for minor versions
- Breaking changes require new major version

### 9.3 Security Best Practices
- HTTPS only in production
- Rate limiting implemented
- Input validation on all endpoints
- SQL injection prevention
- CORS properly configured
- Sensitive data excluded from logs

### 9.4 Testing
- Unit tests for all business logic
- Integration tests for API endpoints
- Mock external services in tests
- Test coverage minimum 80%

---

## 10. APPENDICES

### 10.1 Status Code Reference

#### Member Status Values
- `pending` - Awaiting verification
- `active` - Active member
- `suspended` - Temporarily suspended
- `inactive` - Deactivated member

#### KYC Status Values
- `pending` - Documents under review
- `verified` - KYC approved
- `rejected` - KYC rejected

#### Transaction Status Values
- `pending` - Waiting for payment
- `processing` - Payment being processed
- `completed` - Transaction successful
- `failed` - Transaction failed
- `cancelled` - Transaction cancelled

#### Fit Challenge Status Values
- `waitlist` - On waiting list
- `active` - Participating
- `completed` - Successfully completed
- `dropped_out` - Withdrew from program
- `disqualified` - Removed from program

### 10.2 Currency and Number Formats
- Currency: Indonesian Rupiah (IDR)
- Amount format: Integer (no decimals for IDR)
- Decimal places: 2 for measurements (weight, body fat, etc.)
- Date format: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)

### 10.3 File Upload Specifications

#### Profile Pictures
- Formats: JPEG, PNG
- Maximum size: 5MB
- Dimensions: 400x400px minimum
- Aspect ratio: 1:1 (square)

#### KYC Documents
- Formats: JPEG, PNG, PDF
- Maximum size: 10MB
- Minimum resolution: 1024x768px

#### Progress Photos
- Formats: JPEG, PNG
- Maximum size: 5MB
- Dimensions: 800x600px minimum

---

*Document Version: 1.0*
*Last Updated: September 2025*
*Prepared by: Koperasi Sinoman Technology Team*