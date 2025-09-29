# Koperasi Sinoman - Digital Cooperative Management System

A comprehensive digital platform for Indonesian cooperative (koperasi) management, built with modern web technologies and Indonesian business compliance in mind.

## 🏢 Project Overview

Koperasi Sinoman is a full-stack monorepo application designed to digitize and modernize Indonesian cooperative operations. The platform provides member management, savings administration, loan processing, and business analytics with full Indonesian localization and compliance features.

### 🎯 Mission
To empower Indonesian cooperatives with modern digital tools that enhance member experience, streamline operations, and ensure regulatory compliance while preserving cooperative values and principles.

### 🌟 Key Features

- **👥 Member Management** - Complete member lifecycle with KYC, digital cards, and verification
- **💰 Savings Administration** - Multiple savings types (Wajib, Sukarela, Berjangka, Pokok)
- **🏦 Loan Processing** - Digital loan applications, approvals, and payment tracking
- **📊 Financial Analytics** - SHU distribution, interest calculations, and reporting
- **📱 Digital Member Cards** - QR code-based member identification and verification
- **🔐 Role-Based Access** - Granular permissions for different user types
- **🇮🇩 Indonesian Compliance** - NIK validation, Indonesian banking integration, regulatory reporting

## 🏗️ Architecture

### Monorepo Structure

```
koperasi-sinoman/
├── apps/
│   ├── admin/                 # Admin dashboard (Next.js)
│   ├── member/               # Member portal (Next.js)
│   └── superapp/            # Mobile-first member app (Next.js)
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── utils/               # Utility functions & helpers
│   ├── database/            # Database schemas & utilities
│   └── config/              # Shared configurations
├── supabase/                # Database migrations & functions
├── docs/                    # Documentation
└── tools/                   # Development tools & scripts
```

### Technology Stack

#### **Frontend**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom theming
- **State Management**: React Server Components + Zustand
- **Forms**: React Hook Form with Zod validation
- **Testing**: Vitest + React Testing Library

#### **Backend**
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth with Row Level Security
- **API**: Next.js API Routes + Supabase Edge Functions
- **File Storage**: Supabase Storage for documents and images
- **Real-time**: Supabase Realtime for live updates

#### **Development Tools**
- **Monorepo**: Turborepo for build optimization
- **Package Manager**: pnpm with workspace support
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Testing**: Vitest for unit/integration tests
- **Database**: Drizzle ORM with type-safe queries
- **Documentation**: TypeDoc + Storybook for components

#### **Infrastructure**
- **Hosting**: Vercel for frontend applications
- **Database**: Supabase cloud infrastructure
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics + Supabase Metrics
- **CI/CD**: GitHub Actions with Vercel integration

## 🎯 Phase 1 Scope

### Core Features (Phase 1)

#### **Member Management**
- [x] Member registration with KYC validation
- [x] Digital member cards with QR codes
- [x] Member profile management
- [x] Referral system implementation
- [x] Member status tracking (active/inactive/suspended)

#### **Savings Management**
- [x] Savings account creation and management
- [x] Multiple savings types:
  - **Simpanan Pokok** - Initial membership deposit
  - **Simpanan Wajib** - Monthly mandatory savings
  - **Simpanan Sukarela** - Voluntary savings
  - **Simpanan Berjangka** - Term deposits
- [x] Interest calculation and compounding
- [x] Savings transaction history

#### **Administrative Features**
- [x] Admin dashboard with comprehensive analytics
- [x] Member oversight and management tools
- [x] Savings administration and bulk processing
- [x] Transaction monitoring and approval workflows
- [x] Financial reporting and audit trails

#### **Security & Compliance**
- [x] Role-based access control (RBAC)
- [x] Indonesian ID (NIK) validation
- [x] Audit logging for all transactions
- [x] Data encryption and secure storage
- [x] Regulatory compliance frameworks

### Phase 1 Deliverables

- ✅ **Database Schema** - Complete PostgreSQL schema with RLS policies
- ✅ **Admin Application** - Full-featured admin dashboard
- ✅ **Shared Components** - Reusable UI component library
- ✅ **Utility Libraries** - Indonesian-specific utilities and helpers
- ✅ **QR Code System** - Digital member card generation and verification
- ✅ **Authentication** - Secure auth with role-based permissions
- 🚧 **Member Portal** - Member-facing application (upcoming)
- 🚧 **Mobile App** - Progressive Web App for members (upcoming)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Git** for version control
- **Supabase CLI** for database management

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/koperasi-sinoman/koperasi-sinoman.git
   cd koperasi-sinoman
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment templates
   cp apps/admin/.env.example apps/admin/.env.local
   cp apps/member/.env.example apps/member/.env.local
   cp apps/superapp/.env.example apps/superapp/.env.local
   ```

4. **Configure Supabase**
   ```bash
   # Initialize Supabase (if not already done)
   supabase init

   # Start local Supabase
   supabase start

   # Apply database migrations
   supabase db reset
   ```

5. **Start development servers**
   ```bash
   # Start all applications
   pnpm dev

   # Or start specific applications
   pnpm dev --filter=admin
   pnpm dev --filter=member
   pnpm dev --filter=superapp
   ```

6. **Access the applications**
   - **Admin Dashboard**: http://localhost:3000
   - **Member Portal**: http://localhost:3001
   - **Superapp**: http://localhost:3002
   - **Supabase Studio**: http://localhost:54323

### Environment Configuration

#### Required Environment Variables

Create `.env.local` files in each app directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Koperasi Sinoman"

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Optional: Analytics and Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### Database Setup

#### Using Supabase Local Development

1. **Start Supabase locally**
   ```bash
   supabase start
   ```

2. **Apply migrations**
   ```bash
   supabase db reset
   ```

3. **Generate TypeScript types**
   ```bash
   pnpm db:generate-types
   ```

#### Using Supabase Cloud

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

2. **Link your project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Push migrations to cloud**
   ```bash
   supabase db push
   ```

## 🛠️ Development Workflow

### Available Scripts

#### Root Level Commands
```bash
# Install all dependencies
pnpm install

# Build all packages and applications
pnpm build

# Start all development servers
pnpm dev

# Run tests across all packages
pnpm test

# Lint all code
pnpm lint

# Format all code
pnpm format

# Clean all build artifacts
pnpm clean
```

#### Package-Specific Commands
```bash
# Work with specific packages
pnpm --filter=admin dev
pnpm --filter=ui build
pnpm --filter=utils test

# Build dependencies first
pnpm build --filter=ui
pnpm build --filter=utils
pnpm build --filter=database
```

#### Database Commands
```bash
# Generate database types
pnpm db:generate-types

# Create new migration
pnpm db:migration "migration_name"

# Reset database with fresh data
pnpm db:reset

# Seed database with sample data
pnpm db:seed
```

### Development Guidelines

#### Code Standards
- **TypeScript**: Use strict mode with no implicit any
- **ESLint**: Follow the configured ESLint rules
- **Prettier**: Auto-format code on save
- **Naming**: Use descriptive names following TypeScript conventions
- **Comments**: Document complex business logic and Indonesian-specific features

#### Component Development
```typescript
// Use this pattern for new components
import { forwardRef } from 'react'
import { cn } from '@koperasi-sinoman/utils'

interface ComponentProps {
  // Define props with JSDoc comments
  /** Description of the prop */
  prop: string
}

export const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ prop, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('base-styles', className)}
        {...props}
      >
        {/* Component content */}
      </div>
    )
  }
)

Component.displayName = 'Component'
```

#### Database Schema Changes
1. Create migration file: `pnpm db:migration "add_new_table"`
2. Write SQL in the migration file
3. Test migration locally: `supabase db reset`
4. Update TypeScript types: `pnpm db:generate-types`
5. Commit changes and create PR

#### Adding New Features
1. **Plan**: Document the feature in GitHub Issues
2. **Design**: Create UI mockups if needed
3. **Database**: Plan schema changes
4. **Implement**: Write code following conventions
5. **Test**: Add unit and integration tests
6. **Document**: Update relevant documentation
7. **Review**: Create PR for code review

### Testing Strategy

#### Unit Tests
```bash
# Run tests for all packages
pnpm test

# Run tests for specific package
pnpm --filter=utils test

# Run tests in watch mode
pnpm --filter=ui test:watch

# Generate coverage report
pnpm test:coverage
```

#### Integration Tests
```bash
# Run integration tests
pnpm test:integration

# Test against local Supabase
pnpm test:db
```

#### E2E Tests
```bash
# Run end-to-end tests
pnpm test:e2e

# Run E2E tests in headed mode
pnpm test:e2e:headed
```

## 📁 Project Structure

### Applications (`/apps`)

#### Admin Dashboard (`/apps/admin`)
```
apps/admin/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Authentication layouts
│   │   ├── dashboard/      # Main dashboard routes
│   │   ├── members/        # Member management
│   │   ├── savings/        # Savings administration
│   │   └── layout.tsx      # Root layout
│   ├── components/         # App-specific components
│   ├── lib/               # Utilities and configurations
│   └── utils/             # Helper functions
├── public/                # Static assets
├── next.config.js         # Next.js configuration
└── tailwind.config.js     # Tailwind configuration
```

#### Member Portal (`/apps/member`)
```
apps/member/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (dashboard)/    # Member dashboard
│   │   ├── savings/        # Savings management
│   │   ├── profile/        # Profile management
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Member-specific components
│   └── lib/               # Member app utilities
```

#### Superapp (`/apps/superapp`)
```
apps/superapp/
├── src/
│   ├── app/                # Mobile-optimized routes
│   │   ├── (tabs)/         # Tab navigation
│   │   ├── qr/            # QR code features
│   │   └── layout.tsx      # Mobile layout
│   ├── components/         # Mobile components
│   └── lib/               # Mobile utilities
```

### Packages (`/packages`)

#### UI Components (`/packages/ui`)
```
packages/ui/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── base/          # Basic components (Button, Input)
│   │   ├── forms/         # Form components
│   │   ├── layout/        # Layout components
│   │   └── admin/         # Admin-specific components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # UI utilities
│   └── index.ts           # Main exports
├── stories/               # Storybook stories
└── package.json
```

#### Utilities (`/packages/utils`)
```
packages/utils/
├── src/
│   ├── validation/         # Indonesian validation (NIK, phone)
│   ├── formatting/         # Date, currency formatting
│   ├── currency/           # Indonesian Rupiah utilities
│   ├── qr-code/           # QR code generation
│   ├── crypto/            # Security utilities
│   └── constants/         # Indonesian business constants
```

#### Database (`/packages/database`)
```
packages/database/
├── src/
│   ├── types/             # Database TypeScript types
│   ├── schemas/           # Table schemas
│   ├── migrations/        # Database migrations
│   └── seeds/             # Sample data
```

### Database Structure (`/supabase`)

#### Schema Overview
```sql
-- Core Tables
members              -- Member profiles and KYC data
savings_accounts     -- Member savings accounts
savings_transactions -- All savings-related transactions
admins              -- Administrative users
referrals           -- Member referral tracking

-- Authentication & Security
auth.users          -- Supabase authentication
user_roles          -- Role-based access control
audit_logs          -- Comprehensive audit trail

-- Configuration
app_settings        -- Application configuration
interest_rates      -- Savings interest rates
```

#### Key Features
- **Row Level Security (RLS)** - Secure data access patterns
- **Real-time Subscriptions** - Live updates for transactions
- **Audit Logging** - Complete transaction history
- **Data Validation** - Database-level business rules
- **Backup & Recovery** - Automated data protection

## 🔐 Security & Authentication

### Authentication Flow
1. **User Registration** - Email/password with verification
2. **Role Assignment** - Automatic role-based permissions
3. **Session Management** - Secure JWT tokens with refresh
4. **MFA Support** - Optional two-factor authentication

### Role-Based Access Control

#### User Roles
- **Super Admin** - Full system access and configuration
- **Admin** - Member and savings management
- **Staff** - Limited administrative functions
- **Member** - Personal account access only

#### Permission Matrix
| Feature | Super Admin | Admin | Staff | Member |
|---------|-------------|-------|-------|--------|
| Member Management | ✅ | ✅ | 👁️ | ❌ |
| Savings Admin | ✅ | ✅ | ✅ | ❌ |
| Financial Reports | ✅ | ✅ | 👁️ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ |
| Personal Data | ✅ | ✅ | ✅ | ✅ |

*✅ Full Access | 👁️ Read Only | ❌ No Access*

### Data Protection
- **Encryption at Rest** - AES-256 encryption for sensitive data
- **Encryption in Transit** - TLS 1.3 for all communications
- **PII Protection** - Encrypted storage of personal information
- **Audit Trails** - Complete logging of data access and changes
- **Data Retention** - Configurable retention policies

## 🇮🇩 Indonesian Compliance

### Regulatory Features
- **NIK Validation** - Indonesian National ID verification
- **KYC Compliance** - Know Your Customer procedures
- **Financial Reporting** - Indonesian cooperative reporting standards
- **Tax Integration** - NPWp validation and tax calculations
- **Banking Integration** - Indonesian bank account validation

### Localization
- **Language** - Full Indonesian language support
- **Currency** - Indonesian Rupiah with proper formatting
- **Date Formats** - Indonesian date and time formats
- **Business Rules** - Indonesian cooperative regulations
- **Cultural Adaptation** - Local business practices and traditions

### Data Sovereignty
- **Local Hosting** - Data hosted within Indonesian jurisdiction
- **Privacy Compliance** - Indonesian privacy law adherence
- **Cross-Border** - Controlled cross-border data transfer
- **Government Reporting** - Automated regulatory reporting

## 📊 Analytics & Monitoring

### Application Monitoring
- **Performance Metrics** - Page load times and user interactions
- **Error Tracking** - Automated error detection and reporting
- **User Analytics** - Member behavior and feature usage
- **Business Metrics** - KPIs and cooperative performance indicators

### Database Monitoring
- **Query Performance** - Slow query detection and optimization
- **Connection Monitoring** - Database connection health
- **Storage Usage** - Database size and growth tracking
- **Backup Verification** - Automated backup testing

### Security Monitoring
- **Access Logs** - Complete access audit trails
- **Failed Attempts** - Brute force and suspicious activity detection
- **Data Changes** - Comprehensive change tracking
- **Compliance Reports** - Automated compliance monitoring

## 🚀 Deployment

### Production Deployment

#### Prerequisites
- Vercel account with team access
- Supabase production project
- Domain configuration
- SSL certificates

#### Deployment Steps
1. **Prepare Environment**
   ```bash
   # Set production environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Deploy Applications**
   ```bash
   # Deploy all applications
   vercel --prod

   # Deploy specific application
   vercel --prod apps/admin
   ```

3. **Database Migration**
   ```bash
   # Push schema to production
   supabase db push --linked

   # Verify migration
   supabase db diff --linked
   ```

4. **Post-Deployment Verification**
   - Test all critical user flows
   - Verify database connections
   - Check real-time functionality
   - Validate security configurations

### Staging Environment
```bash
# Deploy to staging
vercel --target staging

# Run integration tests against staging
pnpm test:staging
```

### Environment Management
- **Development** - Local development with Supabase local
- **Staging** - Pre-production testing environment
- **Production** - Live production environment

## 🤝 Contributing

### Getting Started with Contributions

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/koperasi-sinoman.git
   cd koperasi-sinoman
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow coding standards
   - Add tests for new features
   - Update documentation

4. **Test Your Changes**
   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```

5. **Submit Pull Request**
   - Clear description of changes
   - Reference related issues
   - Include screenshots for UI changes

### Contribution Guidelines

#### Code Review Process
1. **Automated Checks** - All CI checks must pass
2. **Code Review** - At least two approvals required
3. **Testing** - Manual testing of critical paths
4. **Documentation** - Update relevant documentation

#### Commit Message Convention
```
type(scope): description

feat(admin): add member bulk import functionality
fix(ui): resolve mobile navigation overlay issue
docs(readme): update deployment instructions
test(utils): add currency calculation test cases
```

#### Pull Request Template
- **Description** - What does this PR do?
- **Testing** - How was this tested?
- **Screenshots** - For UI changes
- **Breaking Changes** - Any breaking changes?
- **Related Issues** - Links to related issues

## 📚 Documentation

### Available Documentation
- **[API Documentation](./docs/api.md)** - Complete API reference
- **[Database Schema](./docs/database.md)** - Database design and relationships
- **[Component Library](./docs/components.md)** - UI component documentation
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions
- **[Security Guide](./docs/security.md)** - Security best practices
- **[Indonesian Features](./docs/indonesian.md)** - Indonesia-specific features

### Generating Documentation
```bash
# Generate TypeScript documentation
pnpm docs:generate

# Start documentation server
pnpm docs:dev

# Build documentation for production
pnpm docs:build
```

## 🆘 Support & Help

### Getting Help

#### Community Support
- **GitHub Discussions** - Community Q&A and feature requests
- **GitHub Issues** - Bug reports and feature requests
- **Discord Community** - Real-time chat and support

#### Documentation Resources
- **README** - This comprehensive guide
- **Code Comments** - Inline documentation in codebase
- **Storybook** - Interactive component documentation
- **API Docs** - Complete API reference

#### Common Issues & Solutions

**Issue: pnpm install fails**
```bash
# Clear pnpm cache and retry
pnpm store prune
rm -rf node_modules
pnpm install
```

**Issue: Supabase connection errors**
```bash
# Check Supabase status
supabase status

# Restart Supabase services
supabase stop
supabase start
```

**Issue: TypeScript errors after database changes**
```bash
# Regenerate database types
pnpm db:generate-types

# Clear TypeScript cache
rm -rf .next
pnpm build
```

**Issue: Hot reload not working**
```bash
# Clear Next.js cache
rm -rf .next
pnpm dev
```

### Reporting Issues

When reporting issues, please include:
- **Environment** - OS, Node.js version, pnpm version
- **Steps to Reproduce** - Clear steps to reproduce the issue
- **Expected Behavior** - What should happen
- **Actual Behavior** - What actually happens
- **Screenshots** - If applicable
- **Error Messages** - Complete error messages and stack traces

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Indonesian Cooperative Movement** - For inspiring this digital transformation
- **Open Source Community** - For the amazing tools and libraries
- **Supabase Team** - For the excellent backend-as-a-service platform
- **Vercel Team** - For the outstanding deployment platform
- **Contributors** - Everyone who has contributed to this project

---

**Built with ❤️ for Indonesian Cooperatives**

*Empowering communities through technology and cooperative values*

For more information, visit our [website](https://koperasi-sinoman.com) or contact us at [dev@koperasi-sinoman.com](mailto:dev@koperasi-sinoman.com).