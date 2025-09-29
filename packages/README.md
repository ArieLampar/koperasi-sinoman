# Packages

This directory contains shared libraries and utilities for the Koperasi Sinoman monorepo.

## Packages

### 🎨 UI (`/ui`)
Shared React components and design system.
- **Purpose**: Reusable UI components, buttons, forms, layouts
- **Dependencies**: React, Tailwind CSS, clsx
- **Usage**: `import { Button } from '@koperasi-sinoman/ui'`

### 🗄️ Database (`/database`)
Database schemas, migrations, and ORM utilities.
- **Purpose**: Drizzle ORM schemas, migrations, database client
- **Dependencies**: Drizzle ORM, Supabase client, PostgreSQL
- **Usage**: `import { db } from '@koperasi-sinoman/database'`

### 🔐 Auth (`/auth`)
Authentication utilities and middleware.
- **Purpose**: Auth helpers, middleware, session management
- **Dependencies**: Supabase Auth, JWT, bcryptjs
- **Usage**: `import { requireAuth } from '@koperasi-sinoman/auth'`

### 🛠️ Utils (`/utils`)
Common utility functions and helpers.
- **Purpose**: Date formatting, validation, string manipulation
- **Dependencies**: date-fns, zod, nanoid
- **Usage**: `import { formatCurrency } from '@koperasi-sinoman/utils'`

### 📝 Types (`/types`)
Shared TypeScript types and interfaces.
- **Purpose**: Type definitions, API schemas, domain models
- **Dependencies**: Zod for runtime validation
- **Usage**: `import type { Member } from '@koperasi-sinoman/types'`

### ⚙️ Config (`/config`)
Shared configuration files and constants.
- **Purpose**: ESLint, Tailwind, TypeScript configs
- **Dependencies**: Configuration tools
- **Usage**: `extends: ['@koperasi-sinoman/config/eslint']`

## Development

Build all packages:
```bash
pnpm build
```

Build specific package:
```bash
cd packages/ui && pnpm build
```

Watch mode for development:
```bash
cd packages/ui && pnpm dev
```

## Package Dependencies

Applications in `/apps` can import from these packages:
```json
{
  "dependencies": {
    "@koperasi-sinoman/ui": "workspace:*",
    "@koperasi-sinoman/database": "workspace:*",
    "@koperasi-sinoman/auth": "workspace:*",
    "@koperasi-sinoman/utils": "workspace:*",
    "@koperasi-sinoman/types": "workspace:*",
    "@koperasi-sinoman/config": "workspace:*"
  }
}
```