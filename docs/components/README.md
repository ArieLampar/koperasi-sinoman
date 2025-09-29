# Component Library Documentation

Comprehensive documentation for the Koperasi Sinoman UI component library, including design system, usage examples, and best practices.

## 📦 Component Library Overview

The `@koperasi-sinoman/ui` package provides a comprehensive set of reusable React components designed specifically for Indonesian cooperative management applications.

### 🎨 Design System
- **[Design Tokens](./design-tokens.md)** - Colors, typography, spacing, and other design primitives
- **[Theme System](./theme-system.md)** - Theming capabilities and customization options
- **[Accessibility](./accessibility.md)** - WCAG 2.1 AA compliance and inclusive design
- **[Indonesian Localization](./localization.md)** - Indonesian-specific design patterns

### 🧩 Component Categories
- **[Base Components](./base/)** - Fundamental building blocks (Button, Input, Typography)
- **[Form Components](./forms/)** - Form elements with validation and Indonesian formatting
- **[Layout Components](./layout/)** - Page structure and navigation components
- **[Admin Components](./admin/)** - Administrative interface components
- **[Mobile Components](./mobile/)** - Mobile-optimized components for the superapp

### 🔧 Development Tools
- **[Storybook](http://localhost:6006)** - Interactive component playground
- **[Testing](./testing.md)** - Component testing strategies and examples
- **[Development Workflow](./development.md)** - Component development best practices

## 🚀 Quick Start

### Installation
```bash
# Install the component library
pnpm add @koperasi-sinoman/ui

# Install peer dependencies
pnpm add react react-dom @radix-ui/react-* tailwindcss
```

### Basic Usage
```typescript
import { Button, Input, Card } from '@koperasi-sinoman/ui'

export default function MyComponent() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Member Registration</h2>
      <div className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Enter full name"
          required
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+62 812 3456 7890"
          format="indonesian-phone"
        />
        <Button type="submit" className="w-full">
          Register Member
        </Button>
      </div>
    </Card>
  )
}
```

### Tailwind Configuration
```typescript
// tailwind.config.js
module.exports = {
  presets: [require('@koperasi-sinoman/ui/tailwind')],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@koperasi-sinoman/ui/**/*.{js,ts,jsx,tsx}'
  ]
}
```

## 🎨 Design System

### Color Palette
```typescript
// Indonesian-inspired color system
const colors = {
  // Primary - Indonesian Flag Red
  primary: {
    50: '#fef2f2',
    500: '#dc2626',  // Indonesian red
    900: '#7f1d1d'
  },

  // Secondary - Indonesian Gold
  secondary: {
    50: '#fffbeb',
    500: '#f59e0b',  // Indonesian gold
    900: '#78350f'
  },

  // Cooperative Green
  cooperative: {
    50: '#f0fdf4',
    500: '#22c55e',  // Cooperative movement
    900: '#14532d'
  }
}
```

### Typography Scale
```typescript
const typography = {
  // Indonesian-optimized font stack
  fontFamily: {
    sans: ['Inter', 'Noto Sans', 'system-ui', 'sans-serif'],
    indonesian: ['Noto Sans', 'Inter', 'system-ui']
  },

  // Readable sizes for Indonesian text
  fontSize: {
    xs: ['12px', { lineHeight: '16px' }],
    sm: ['14px', { lineHeight: '20px' }],
    base: ['16px', { lineHeight: '24px' }],
    lg: ['18px', { lineHeight: '28px' }],
    xl: ['20px', { lineHeight: '32px' }]
  }
}
```

### Spacing System
```typescript
const spacing = {
  // Based on 4px grid system
  1: '4px',   // 0.25rem
  2: '8px',   // 0.5rem
  3: '12px',  // 0.75rem
  4: '16px',  // 1rem
  6: '24px',  // 1.5rem
  8: '32px',  // 2rem
  12: '48px', // 3rem
  16: '64px', // 4rem
}
```

## 🧩 Core Components

### Button Component
```typescript
import { Button } from '@koperasi-sinoman/ui'

// Basic button
<Button>Click Me</Button>

// Variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="danger">Delete Member</Button>
<Button variant="ghost">Cancel</Button>

// Sizes
<Button size="sm">Small Button</Button>
<Button size="md">Medium Button</Button>
<Button size="lg">Large Button</Button>

// States
<Button loading>Processing...</Button>
<Button disabled>Disabled</Button>

// With icons
<Button>
  <PlusIcon className="w-4 h-4 mr-2" />
  Add Member
</Button>
```

### Input Component
```typescript
import { Input } from '@koperasi-sinoman/ui'

// Basic input
<Input
  label="Member Name"
  placeholder="Enter member name"
  required
/>

// Indonesian-specific formatting
<Input
  label="Phone Number"
  type="tel"
  format="indonesian-phone"
  placeholder="+62 812 3456 7890"
/>

<Input
  label="NIK (Indonesian ID)"
  format="nik"
  placeholder="3273010101900001"
  maxLength={16}
/>

<Input
  label="Currency Amount"
  type="number"
  format="indonesian-currency"
  placeholder="Rp 1.000.000"
/>

// With validation
<Input
  label="Email Address"
  type="email"
  error="Please enter a valid email address"
  required
/>
```

### Form Component
```typescript
import { Form, FormField, FormSubmit } from '@koperasi-sinoman/ui'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const memberSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  nik: z.string().length(16, 'NIK must be 16 digits'),
  phoneNumber: z.string().regex(/^\+62\d{10,13}$/, 'Invalid Indonesian phone number'),
  email: z.string().email('Invalid email address')
})

export function MemberForm() {
  const form = useForm({
    resolver: zodResolver(memberSchema)
  })

  return (
    <Form form={form} onSubmit={handleSubmit}>
      <FormField
        name="fullName"
        label="Full Name"
        placeholder="Enter full name"
        required
      />

      <FormField
        name="nik"
        label="NIK (Indonesian ID)"
        format="nik"
        placeholder="3273010101900001"
        required
      />

      <FormField
        name="phoneNumber"
        label="Phone Number"
        type="tel"
        format="indonesian-phone"
        placeholder="+62 812 3456 7890"
        required
      />

      <FormField
        name="email"
        label="Email Address"
        type="email"
        placeholder="member@email.com"
      />

      <FormSubmit>Register Member</FormSubmit>
    </Form>
  )
}
```

### Card Component
```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@koperasi-sinoman/ui'

<Card>
  <CardHeader>
    <CardTitle>Member Savings Summary</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-gray-600">Mandatory Savings</p>
        <p className="text-2xl font-bold">Rp 2.500.000</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Voluntary Savings</p>
        <p className="text-2xl font-bold">Rp 5.750.000</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### Data Table Component
```typescript
import { DataTable, DataTableColumn } from '@koperasi-sinoman/ui'

const columns: DataTableColumn[] = [
  {
    key: 'memberNumber',
    title: 'Member Number',
    sortable: true
  },
  {
    key: 'fullName',
    title: 'Full Name',
    sortable: true
  },
  {
    key: 'membershipType',
    title: 'Type',
    render: (value) => (
      <Badge variant={value === 'premium' ? 'primary' : 'secondary'}>
        {value === 'premium' ? 'Premium' : 'Regular'}
      </Badge>
    )
  },
  {
    key: 'totalSavings',
    title: 'Total Savings',
    render: (value) => formatIDR(value),
    align: 'right'
  }
]

<DataTable
  data={members}
  columns={columns}
  pagination
  searchable
  exportable
  onRowClick={(member) => navigate(`/members/${member.id}`)}
/>
```

## 🇮🇩 Indonesian-Specific Components

### NIK Input Component
```typescript
import { NIKInput } from '@koperasi-sinoman/ui'

<NIKInput
  label="NIK (Nomor Induk Kependudukan)"
  placeholder="3273010101900001"
  onValidation={(isValid, details) => {
    if (isValid) {
      console.log('Birth date:', details.birthDate)
      console.log('Province:', details.province)
      console.log('Gender:', details.gender)
    }
  }}
  required
/>
```

### Currency Input Component
```typescript
import { CurrencyInput } from '@koperasi-sinoman/ui'

<CurrencyInput
  label="Savings Amount"
  placeholder="Rp 0"
  min={25000}
  max={50000000}
  onValueChange={(amount) => {
    console.log('Amount in rupiah:', amount)
  }}
/>
```

### Phone Number Input Component
```typescript
import { PhoneInput } from '@koperasi-sinoman/ui'

<PhoneInput
  label="Phone Number"
  placeholder="+62 812 3456 7890"
  defaultCountry="ID"
  onValidation={(isValid, formattedNumber) => {
    if (isValid) {
      console.log('Formatted:', formattedNumber)
    }
  }}
/>
```

### Member Card Component
```typescript
import { MemberCard, QRCode } from '@koperasi-sinoman/ui'

<MemberCard
  member={{
    memberNumber: '12345',
    fullName: 'Budi Santoso',
    membershipType: 'premium',
    joinDate: new Date('2020-01-15'),
    photoUrl: '/photos/member-12345.jpg'
  }}
  showQR
  onQRClick={() => openQRModal()}
/>
```

## 📱 Mobile Components

### Mobile Navigation
```typescript
import { MobileNav, MobileNavItem } from '@koperasi-sinoman/ui'

<MobileNav>
  <MobileNavItem
    icon={HomeIcon}
    label="Beranda"
    href="/dashboard"
    active
  />
  <MobileNavItem
    icon={WalletIcon}
    label="Simpanan"
    href="/savings"
  />
  <MobileNavItem
    icon={CreditCardIcon}
    label="Pinjaman"
    href="/loans"
  />
  <MobileNavItem
    icon={QrCodeIcon}
    label="QR Code"
    href="/qr"
  />
  <MobileNavItem
    icon={UserIcon}
    label="Profil"
    href="/profile"
  />
</MobileNav>
```

### Touch-Optimized Components
```typescript
import { TouchButton, SwipeCard, PullToRefresh } from '@koperasi-sinoman/ui'

// Touch-optimized button with haptic feedback
<TouchButton
  onPress={handlePress}
  haptic="medium"
  className="min-h-[44px]" // iOS minimum touch target
>
  Transfer Funds
</TouchButton>

// Swipeable card for mobile actions
<SwipeCard
  onSwipeLeft={() => markAsRead()}
  onSwipeRight={() => delete()}
  leftAction={{ icon: CheckIcon, color: 'green' }}
  rightAction={{ icon: TrashIcon, color: 'red' }}
>
  <TransactionItem transaction={transaction} />
</SwipeCard>

// Pull to refresh for mobile lists
<PullToRefresh onRefresh={refreshData}>
  <TransactionList transactions={transactions} />
</PullToRefresh>
```

## 🧪 Testing Components

### Unit Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@koperasi-sinoman/ui'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<Button loading>Processing</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })
})
```

### Visual Testing with Storybook
```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
}

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: (
      <>
        <PlusIcon className="w-4 h-4 mr-2" />
        Add Member
      </>
    ),
  },
}

export const Indonesian: Story = {
  args: {
    variant: 'primary',
    children: 'Daftar Anggota Baru',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with Indonesian text for localized interfaces.',
      },
    },
  },
}
```

## 📚 Best Practices

### Component Development
1. **Follow Indonesian UX patterns** - Design for local user expectations
2. **Mobile-first approach** - Start with mobile design, enhance for desktop
3. **Accessibility compliance** - WCAG 2.1 AA standards for inclusive design
4. **Performance optimization** - Lazy loading and code splitting
5. **Comprehensive testing** - Unit tests, visual tests, and accessibility tests

### API Design
```typescript
// Good: Clear, typed props with sensible defaults
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
}

// Good: Forwarded refs for flexibility
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', ...props }, ref) => {
    return <button ref={ref} {...props} />
  }
)
```

### Documentation Standards
- **Live examples** - Every component has working code examples
- **Indonesian context** - Examples use Indonesian business scenarios
- **Accessibility notes** - Document keyboard navigation and screen reader support
- **Mobile considerations** - Note mobile-specific behavior and optimizations

---

*Component documentation is automatically generated from TypeScript definitions and Storybook stories. For interactive examples, visit [our Storybook instance](http://localhost:6006).*