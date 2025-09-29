# Applications

This directory contains the main applications for the Koperasi Sinoman monorepo.

## Applications

### 🌐 Web (`/web`)
Main web application for Koperasi Sinoman members and general users.
- **Framework**: Next.js 14
- **Port**: 3000 (development)
- **Purpose**: Member portal, loan applications, savings tracking

### 🛠️ Admin (`/admin`)
Administrative dashboard for Koperasi Sinoman management.
- **Framework**: Next.js 14
- **Port**: 3001 (development)
- **Purpose**: Member management, financial oversight, reporting

### 📱 Mobile (`/mobile`)
Mobile application for Koperasi Sinoman members.
- **Framework**: Expo/React Native
- **Platform**: iOS and Android
- **Purpose**: Mobile access to member services

## Development

Each application can be run independently:

```bash
# Run all applications
pnpm dev

# Run specific application
cd apps/web && pnpm dev
cd apps/admin && pnpm dev
cd apps/mobile && pnpm dev
```

## Shared Dependencies

Applications share common packages from the `/packages` directory:
- UI components
- Business logic
- Database schemas
- Utilities