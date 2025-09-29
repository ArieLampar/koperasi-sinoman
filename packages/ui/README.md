# @koperasi-sinoman/ui

Shared UI component library for Koperasi Sinoman applications.

## Overview

This package provides a comprehensive set of React components, utilities, and styling solutions for building consistent user interfaces across the Koperasi Sinoman platform.

## Features

- 🎨 **Design System**: Consistent design tokens and component library
- 🔧 **TypeScript**: Full TypeScript support with comprehensive type definitions
- 🎯 **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- 📱 **Responsive**: Mobile-first responsive design components
- ♿ **Accessible**: Built with accessibility best practices using Radix UI
- 🧪 **Tested**: Comprehensive test coverage with Vitest and Testing Library
- 📚 **Documented**: Storybook integration for component documentation
- 🚀 **Performance**: Optimized bundle size with tree-shaking support

## Installation

```bash
pnpm add @koperasi-sinoman/ui
```

## Usage

### Basic Setup

Import the global styles in your application:

```tsx
// In your main CSS file or layout component
import '@koperasi-sinoman/ui/styles'
```

### Using Components

```tsx
import { Button, Card, Input } from '@koperasi-sinoman/ui'

function MyComponent() {
  return (
    <Card className="p-6">
      <Input placeholder="Enter your name" />
      <Button className="mt-4">Submit</Button>
    </Card>
  )
}
```

### Tailwind Configuration

Extend your Tailwind config to use the shared design tokens:

```js
// tailwind.config.js
const baseConfig = require('@koperasi-sinoman/ui/tailwind')

module.exports = {
  ...baseConfig,
  content: [
    ...baseConfig.content,
    './src/**/*.{ts,tsx}',
  ],
}
```

## Component Categories

### UI Components
Base components built on Radix UI primitives:
- `Button`, `Input`, `Label`
- `Card`, `Dialog`, `Dropdown`
- `Select`, `Toast`, `Tooltip`
- And more...

### Admin Components
Specialized components for administrative interfaces:
- `AdminButton`, `AdminCard`, `AdminForm`
- `AdminTable`, `MetricCard`, `StatusIndicator`
- `LoadingScreen`, `AccessDenied`

### Superapp Components
Mobile-optimized components for the superapp:
- `SuperappButton`, `SuperappCard`
- `BottomNavigation`, `FloatingActionButton`
- `PullToRefresh`, `NotificationBanner`

### Utilities
Helper functions and hooks:
- `cn()` - Class name utility
- `formatCurrency()`, `formatNumber()`
- `useToast()`, `useLocalStorage()`
- `useDebounce()`, `useMediaQuery()`

## Development

### Building

```bash
pnpm build
```

### Development Mode

```bash
pnpm dev
```

### Testing

```bash
pnpm test
```

### Storybook

```bash
pnpm storybook
```

## Design System

### Colors

The design system uses a carefully crafted color palette:

- **Primary**: Deep blue representing trust and stability
- **Secondary**: Warm green representing growth and prosperity
- **Accent**: Gold representing value and premium
- **Neutral**: Modern grays for text and backgrounds
- **Status**: Success, warning, error, and info variants

### Typography

- **Font Family**: Inter (sans-serif), JetBrains Mono (monospace)
- **Font Sizes**: Responsive scale from xs to 9xl
- **Line Heights**: Optimized for readability

### Spacing

Consistent spacing scale using Tailwind's default spacing with custom additions:
- Base scale: 0.25rem increments
- Extended scale: 18, 88, 112, 128 for larger layouts

### Animations

Smooth, purposeful animations:
- Fade, slide, and zoom transitions
- Accordion and dropdown animations
- Loading and progress indicators

## Best Practices

### Component Usage

1. **Import only what you need** for optimal bundle size
2. **Use semantic HTML** and proper ARIA attributes
3. **Follow the design system** color and spacing conventions
4. **Test components** with different props and states

### Styling

1. **Use Tailwind utilities** for consistent styling
2. **Leverage CSS custom properties** for dynamic theming
3. **Use the `cn()` utility** for conditional classes
4. **Follow mobile-first** responsive design principles

### Accessibility

1. **Use semantic elements** and proper heading hierarchy
2. **Provide focus management** and keyboard navigation
3. **Include ARIA labels** and descriptions where needed
4. **Test with screen readers** and accessibility tools

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new components and features
3. Update Storybook stories for visual documentation
4. Update type definitions for TypeScript support

## License

UNLICENSED - Internal use only for Koperasi Sinoman applications.