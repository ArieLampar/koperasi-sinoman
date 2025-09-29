# @koperasi-sinoman/database

Shared database utilities, types, and migration tools for Koperasi Sinoman Supabase database.

## 🚀 Features

- **Type-Safe Database Operations** - Full TypeScript support with auto-generated types
- **Multiple Client Types** - Client, Server, and Admin clients for different environments
- **Migration Management** - Database schema versioning and migration tools
- **Seeding System** - Environment-specific data seeding
- **Backup & Restore** - Complete database backup and restore utilities
- **Query Builder** - Fluent query builder for complex database operations
- **Validation** - Comprehensive data validation with Indonesian-specific patterns
- **Utilities** - Formatting, pagination, search, and audit utilities

## 📦 Installation

```bash
npm install @koperasi-sinoman/database
```

### Peer Dependencies

```bash
npm install @supabase/supabase-js zod
```

## 🛠️ Setup

### Environment Variables

Create a `.env` file with your Supabase configuration:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id
```

### Database Clients

#### Client-Side (React)

```typescript
import { createClient } from '@koperasi-sinoman/database'

const client = createClient({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
})

// Sign in
const { data, error } = await client.signIn(email, password)

// Query data
const members = await client.query({
  table: 'members',
  select: 'id, full_name, email',
  filters: { membership_status: 'active' },
  limit: 10,
})
```

#### Server-Side (API Routes)

```typescript
import { createServerClient } from '@koperasi-sinoman/database'

const serverClient = createServerClient({
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
})

// Verify user token
const { valid, user } = await serverClient.verifyToken(token)

// Query with auth context
const result = await serverClient.queryWithAuth(token, 'savings_accounts', {
  select: 'id, balance, account_number',
  filters: { member_id: user.id },
})
```

#### Admin Operations

```typescript
import { createAdminClient } from '@koperasi-sinoman/database'

const adminClient = createAdminClient({
  url: process.env.SUPABASE_URL!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})

// Create user with admin privileges
const { data, error } = await adminClient.createUser(
  'admin@example.com',
  'password123',
  { role: 'admin' }
)

// Execute raw SQL
const result = await adminClient.rawQuery(
  'SELECT COUNT(*) FROM members WHERE created_at > $1',
  ['2024-01-01']
)
```

## 🗃️ Migration Management

### Generate Types from Database

```bash
npm run db:generate-types
```

### Migration Commands

```bash
# Create new migration
npm run db:migrate:new -- add_new_table

# Run pending migrations
npm run db:migrate:up

# Rollback last migration
npm run db:migrate:down

# Check migration status
npm run db:migrate -- status

# Reset database (rollback all)
npm run db:migrate:reset
```

### Example Migration File

```sql
-- Migration: Add Member Preferences
-- Created: 2024-09-29T10:00:00.000Z
-- Description: Add preferences column to members table

-- =====================================================
-- UP MIGRATION
-- =====================================================

ALTER TABLE members
ADD COLUMN preferences JSONB DEFAULT '{}';

CREATE INDEX idx_members_preferences ON members USING GIN (preferences);

COMMENT ON COLUMN members.preferences IS 'User preferences stored as JSON';

-- =====================================================
-- DOWN MIGRATION (for rollback)
-- =====================================================

ALTER TABLE members DROP COLUMN IF EXISTS preferences;
```

## 🌱 Data Seeding

### Seed Commands

```bash
# Run seeds for development
npm run db:seed:dev

# Run seeds for production
npm run db:seed:prod

# Create new seed file
npm run db:seed -- create sample_products --env development

# List available seeds
npm run db:seed -- list
```

### Example Seed File

```typescript
/**
 * Seed: Sample Products
 * Environments: development
 * Order: 100
 */

export const config = {
  name: 'Sample Products',
  environments: ['development'],
  order: 100,
}

export async function seed(supabase) {
  const products = [
    {
      name: 'Beras Organik',
      price: 15000,
      category_id: 'uuid-here',
    },
  ]

  const { error } = await supabase
    .from('products')
    .insert(products)

  if (error) throw error
  console.log('✓ Sample products created')
}
```

## 💾 Backup & Restore

### Backup Commands

```bash
# Create backup
npm run db:backup

# Create compressed backup
npm run db:backup -- --compress

# Backup specific tables
npm run db:backup -- --tables members savings_accounts

# List existing backups
npm run db:backup -- list

# Cleanup old backups
npm run db:backup -- cleanup --days 30
```

### Restore Commands

```bash
# Restore from backup
npm run db:restore backup-2024-09-29

# Restore specific tables only
npm run db:restore backup-2024-09-29 --tables members

# Validate backup before restore
npm run db:restore validate backup-2024-09-29
```

## 🔧 Query Builder

```typescript
import { queryBuilder } from '@koperasi-sinoman/database'

const query = queryBuilder('members')
  .select('id, full_name, email, savings_accounts(*)')
  .whereEq('membership_status', 'active')
  .whereGt('created_at', '2024-01-01')
  .whereLike('full_name', '%budi%')
  .orderBy('created_at', 'desc')
  .paginate(1, 20)
  .build()

// Execute query
const result = await client.query(query)
```

## ✅ Validation

```typescript
import {
  validateNIK,
  validatePhone,
  createMemberSchema,
  formatCurrency
} from '@koperasi-sinoman/database'

// Indonesian-specific validation
const isValidNIK = validateNIK('1234567890123456') // true
const isValidPhone = validatePhone('081234567890') // true

// Schema validation
const memberData = {
  full_name: 'Budi Santoso',
  email: 'budi@example.com',
  nik: '1234567890123456',
  // ...
}

const result = createMemberSchema.safeParse(memberData)
if (result.success) {
  // Data is valid
  console.log(result.data)
} else {
  // Validation errors
  console.log(result.error.issues)
}

// Formatting utilities
const formatted = formatCurrency(1500000) // "Rp 1.500.000"
```

## 📊 Utilities

### Pagination

```typescript
import { createPaginatedResponse } from '@koperasi-sinoman/database'

const paginatedData = createPaginatedResponse(
  data,
  totalCount,
  { page: 1, limit: 20 }
)
```

### Search

```typescript
import { buildSearchFilters } from '@koperasi-sinoman/database'

const filters = buildSearchFilters({
  query: 'budi santoso',
  fields: ['full_name', 'email'],
  fuzzy: true,
})
```

### Audit Logging

```typescript
import { createAuditLog } from '@koperasi-sinoman/database'

const auditLog = createAuditLog(
  {
    table: 'members',
    operation: 'update',
    recordId: 'uuid-here',
    oldValues: { name: 'Old Name' },
    newValues: { name: 'New Name' },
  },
  {
    userId: 'user-uuid',
    ipAddress: '192.168.1.1',
  }
)
```

## 📱 Package Exports

```typescript
// Main exports
import { createClient } from '@koperasi-sinoman/database'

// Types only
import type { Member, SavingsAccount } from '@koperasi-sinoman/database/types'

// Client utilities only
import { createServerClient } from '@koperasi-sinoman/database/client'

// Utilities only
import { formatCurrency, validateNIK } from '@koperasi-sinoman/database/utils'

// Validation schemas only
import { createMemberSchema } from '@koperasi-sinoman/database/schemas'
```

## 🔒 Security Features

- **Role-Based Access Control** - Different permission levels for different client types
- **Data Sanitization** - Automatic sanitization of sensitive data in audit logs
- **Input Validation** - Comprehensive validation with Indonesian-specific patterns
- **SQL Injection Protection** - Using Supabase's query builder and parameterized queries
- **Audit Logging** - Complete audit trail for all database operations

## 🌐 Indonesian Localization

- **Phone Number Validation** - Indonesian phone number formats
- **NIK Validation** - Indonesian National ID validation
- **Currency Formatting** - Indonesian Rupiah formatting
- **Address Formatting** - Indonesian address components
- **Error Messages** - Error messages in Bahasa Indonesia

## 🛠️ Development

### Setup

```bash
# Install dependencies
npm install

# Generate types from database
npm run db:generate-types

# Run tests
npm test

# Build package
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📄 License

MIT © Koperasi Sinoman

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions and support, please open an issue on [GitHub](https://github.com/koperasi-sinoman/koperasi-sinoman/issues).