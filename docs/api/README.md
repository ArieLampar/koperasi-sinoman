# API Documentation

Comprehensive API documentation for the Koperasi Sinoman platform, including REST endpoints, real-time subscriptions, and Edge Functions.

## 📋 API Reference

### 🔧 Core APIs
- **[Authentication API](./authentication.md)** - User authentication and session management
- **[Members API](./members.md)** - Member management and profile operations
- **[Savings API](./savings.md)** - Savings accounts and transaction management
- **[Admin API](./admin.md)** - Administrative operations and system management
- **[QR Code API](./qr-codes.md)** - Digital member card and QR code operations

### 📡 Real-time APIs
- **[Real-time Subscriptions](./realtime.md)** - WebSocket connections and live updates
- **[Notifications](./notifications.md)** - Push notifications and alerts
- **[Live Dashboard](./live-dashboard.md)** - Real-time dashboard updates

### ⚡ Edge Functions
- **[Batch Processing](./edge-functions/batch-processing.md)** - Background job processing
- **[Interest Calculations](./edge-functions/interest-calculations.md)** - Automated financial calculations
- **[Report Generation](./edge-functions/reports.md)** - Automated report generation
- **[External Integrations](./edge-functions/integrations.md)** - Third-party service integrations

## 🚀 Getting Started

### Base URLs
```
Production:  https://api.koperasi-sinoman.com
Staging:     https://staging-api.koperasi-sinoman.com
Development: http://localhost:54321
```

### Authentication
All API requests require authentication using Bearer tokens:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     https://api.koperasi-sinoman.com/rest/v1/members
```

### Rate Limiting
- **Authenticated Users**: 1000 requests per hour
- **Admin Users**: 5000 requests per hour
- **Public Endpoints**: 100 requests per hour

### Response Format
All API responses follow a consistent format:

```typescript
interface APIResponse<T> {
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    timestamp: string
    version: string
  }
}
```

## 📊 Common Operations

### 1. **Member Registration**
```typescript
// POST /rest/v1/members
const response = await fetch('/rest/v1/members', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    phone_number: '+628123456789',
    nik: '3273010101900001',
    membership_type: 'regular',
    referral_code: 'REF123'
  })
})

const member = await response.json()
```

### 2. **Savings Transaction**
```typescript
// POST /rest/v1/savings-transactions
const response = await fetch('/rest/v1/savings-transactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    savings_account_id: 'uuid-here',
    transaction_type: 'deposit',
    amount: 100000,
    description: 'Monthly savings deposit'
  })
})

const transaction = await response.json()
```

### 3. **Real-time Subscription**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Subscribe to savings transactions
const subscription = supabase
  .channel('savings-transactions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'savings_transactions',
    filter: `member_id=eq.${memberId}`
  }, (payload) => {
    console.log('New transaction:', payload.new)
    updateUI(payload.new)
  })
  .subscribe()
```

## 🔐 Security

### API Key Management
```typescript
// Environment Variables
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key        // Public operations
SUPABASE_SERVICE_KEY=your_service_key  // Admin operations only
```

### Row Level Security (RLS)
All database tables have RLS policies that automatically filter data based on user context:

```sql
-- Members can only see their own data
CREATE POLICY "Members can view own profile" ON members
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all data
CREATE POLICY "Admins can view all members" ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
```

### Permission Levels
- **Public** - No authentication required
- **Member** - Authenticated member access
- **Staff** - Staff-level permissions
- **Admin** - Administrative access
- **Super Admin** - Full system access

## 📝 Error Handling

### Common Error Codes
```typescript
interface ErrorCodes {
  // Authentication Errors
  'AUTH_001': 'Invalid or expired token'
  'AUTH_002': 'Insufficient permissions'
  'AUTH_003': 'Account suspended or inactive'

  // Validation Errors
  'VAL_001': 'Invalid input data'
  'VAL_002': 'Missing required fields'
  'VAL_003': 'Invalid Indonesian NIK format'

  // Business Logic Errors
  'BUS_001': 'Insufficient savings balance'
  'BUS_002': 'Member not eligible for service'
  'BUS_003': 'Transaction limit exceeded'

  // System Errors
  'SYS_001': 'Database connection error'
  'SYS_002': 'External service unavailable'
  'SYS_003': 'Rate limit exceeded'
}
```

### Error Response Example
```json
{
  "error": {
    "message": "Invalid Indonesian NIK format",
    "code": "VAL_003",
    "details": {
      "field": "nik",
      "value": "123456789",
      "expected_format": "16 digits"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

## 🇮🇩 Indonesian-Specific APIs

### NIK Validation
```typescript
// GET /rest/v1/validation/nik/{nik}
const response = await fetch(`/rest/v1/validation/nik/${nik}`)
const validation = await response.json()

// Response
{
  "data": {
    "is_valid": true,
    "province": "DKI Jakarta",
    "district": "Jakarta Pusat",
    "birth_date": "1990-01-01",
    "gender": "male"
  }
}
```

### Bank Account Validation
```typescript
// POST /rest/v1/validation/bank-account
const response = await fetch('/rest/v1/validation/bank-account', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bank_code: 'BCA',
    account_number: '1234567890'
  })
})

const validation = await response.json()
```

### Currency Formatting
```typescript
// GET /rest/v1/utils/format-currency?amount=1000000
const response = await fetch('/rest/v1/utils/format-currency?amount=1000000')
const formatted = await response.json()

// Response
{
  "data": {
    "formatted": "Rp 1.000.000",
    "compact": "Rp 1M",
    "words": "satu juta rupiah"
  }
}
```

## 📊 Pagination

### Standard Pagination
```typescript
// GET /rest/v1/members?page=1&limit=20&sort=created_at&order=desc
const response = await fetch('/rest/v1/members?page=1&limit=20')
const data = await response.json()

// Response
{
  "data": [...], // Array of members
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### Cursor-based Pagination
```typescript
// For large datasets
// GET /rest/v1/transactions?cursor=eyJpZCI6MTAwfQ&limit=50
const response = await fetch('/rest/v1/transactions?cursor=eyJpZCI6MTAwfQ&limit=50')
```

## 🔍 Filtering and Search

### Query Parameters
```typescript
// Advanced filtering
const params = new URLSearchParams({
  'membership_type': 'premium',
  'status': 'active',
  'created_at.gte': '2024-01-01',
  'created_at.lt': '2024-02-01',
  'search': 'Budi',
  'sort': 'full_name',
  'order': 'asc'
})

const response = await fetch(`/rest/v1/members?${params}`)
```

### Search Operations
```typescript
// Full-text search
// GET /rest/v1/members?search=Budi Santoso
// POST /rest/v1/search
const response = await fetch('/rest/v1/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Budi Santoso',
    filters: {
      membership_type: 'premium',
      status: 'active'
    },
    limit: 20
  })
})
```

## 📱 Mobile API Considerations

### Offline Support
```typescript
// Optimistic updates for mobile
const optimisticTransaction = {
  id: 'temp-' + Date.now(),
  amount: 50000,
  status: 'pending',
  created_at: new Date().toISOString()
}

// Add to local state immediately
updateLocalState(optimisticTransaction)

// Send to server when online
try {
  const response = await fetch('/rest/v1/savings-transactions', {
    method: 'POST',
    body: JSON.stringify(transaction)
  })

  if (response.ok) {
    const serverTransaction = await response.json()
    replaceLocalTransaction(optimisticTransaction.id, serverTransaction)
  }
} catch (error) {
  // Handle offline scenario
  queueForLaterSync(transaction)
}
```

### Data Synchronization
```typescript
// Sync API for mobile apps
// POST /rest/v1/sync
const response = await fetch('/rest/v1/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    last_sync: '2024-01-15T10:30:00Z',
    device_id: 'device-uuid',
    pending_operations: [
      // Local changes to sync
    ]
  })
})

const syncData = await response.json()
// Apply server changes to local database
```

## 🧪 Testing APIs

### Test Environment
```bash
# Test API Base URL
TEST_API_URL=https://test-api.koperasi-sinoman.com

# Test Authentication
curl -X POST "${TEST_API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'
```

### API Testing Tools
- **Postman Collection** - [Download collection](./postman/koperasi-sinoman.json)
- **OpenAPI Spec** - [View specification](./openapi.yaml)
- **Test Scripts** - Automated API testing suite

### Mock Data
```typescript
// Test member data
const testMember = {
  full_name: 'Test Member',
  email: 'test@example.com',
  phone_number: '+628123456789',
  nik: '3273010101900001',
  membership_type: 'regular'
}

// Test savings account
const testSavingsAccount = {
  member_id: 'test-member-uuid',
  savings_type: 'wajib',
  initial_deposit: 25000
}
```

---

*API documentation is automatically generated from code and updated with each release. For the most current information, refer to the OpenAPI specification.*