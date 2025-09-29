# SuperApp - Koperasi Sinoman

Main member-facing application for Koperasi Sinoman cooperative members.

## 📱 Features

### Core Services
- **Dashboard** - Overview of member's financial status
- **Savings Management** - Track simpanan pokok, wajib, and sukarela
- **Loan Services** - Apply and manage loans
- **Payments** - Pay bills and make transfers
- **Transaction History** - Complete financial records
- **Profile Management** - Update member information

### Key Capabilities
- Real-time balance updates
- Loan application workflow
- Payment processing
- Financial reporting
- Mobile-responsive design
- Offline-capable features

## 🏗️ Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── (auth)/            # Auth routes
├── components/            # Shared components
│   ├── ui/               # Basic UI components
│   ├── layout/           # Layout components
│   └── forms/            # Form components
├── features/             # Feature-specific modules
│   ├── dashboard/        # Dashboard components
│   ├── savings/          # Savings management
│   ├── loans/            # Loan services
│   ├── payments/         # Payment processing
│   ├── transactions/     # Transaction history
│   └── profile/          # Profile management
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configs
└── types/                # TypeScript definitions
```

## 🚀 Development

### Prerequisites
- Node.js 18+
- pnpm 8+

### Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp ../../.env.example .env.local
# Edit .env.local with your Supabase credentials
```

3. Start development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript checks
pnpm test         # Run tests
```

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `DATABASE_URL` - Database connection string

### Dependencies
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State**: React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Auth**: Supabase Auth
- **Database**: Supabase with Drizzle ORM
- **UI**: Custom components + Lucide icons
- **Animation**: Framer Motion

## 📊 Member Services

### Savings (Simpanan)
- Simpanan Pokok (Member equity)
- Simpanan Wajib (Mandatory savings)
- Simpanan Sukarela (Voluntary savings)

### Loans (Pinjaman)
- Personal loans
- Business loans
- Emergency loans
- Loan calculators

### Payments
- Bill payments
- Member-to-member transfers
- Loan repayments
- Fee payments

## 🔐 Security

- Authentication via Supabase Auth
- Row Level Security (RLS) policies
- Input validation with Zod schemas
- CSRF protection
- Rate limiting on API routes