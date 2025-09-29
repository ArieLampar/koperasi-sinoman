# UI Components Library

A comprehensive collection of reusable UI components for the Koperasi Sinoman SuperApp, built with React, TypeScript, and Tailwind CSS.

## Components Overview

### Core Components

#### Button
Versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="default">
  Click me
</Button>

// Variants: default, destructive, outline, secondary, ghost, link, success, warning, info
// Sizes: default, sm, lg, xl, icon
```

#### Card
Container component for grouping related content.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
  <CardFooter>
    Card footer
  </CardFooter>
</Card>
```

#### Input
Form input component with validation states.

```tsx
import { Input } from '@/components/ui/input'

<Input
  variant="default"
  size="default"
  placeholder="Enter text..."
/>

// Variants: default, error, success
// Sizes: default, sm, lg
```

#### Label
Accessible label component for form fields.

```tsx
import { Label } from '@/components/ui/label'

<Label htmlFor="email" variant="default">
  Email Address
</Label>

// Variants: default, error, success
```

#### Textarea
Multi-line text input component.

```tsx
import { Textarea } from '@/components/ui/textarea'

<Textarea
  variant="default"
  size="default"
  placeholder="Enter your message..."
  rows={4}
/>
```

### Feedback Components

#### Alert
Alert component for displaying important messages.

```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

<Alert variant="default">
  <AlertTitle>Alert Title</AlertTitle>
  <AlertDescription>
    This is an alert description
  </AlertDescription>
</Alert>

// Variants: default, destructive, success, warning, info
```

#### Badge
Small status indicator component.

```tsx
import { Badge } from '@/components/ui/badge'

<Badge variant="default" size="default">
  New
</Badge>

// Variants: default, secondary, destructive, success, warning, info, outline
// Sizes: default, sm, lg
```

#### Toast
Toast notification system with provider.

```tsx
import { ToastProvider, useToast } from '@/components/ui/toast'

// Wrap your app with ToastProvider
<ToastProvider>
  <App />
</ToastProvider>

// Use in components
const { addToast } = useToast()

addToast({
  title: "Success!",
  description: "Your action was completed.",
  variant: "success",
  duration: 5000
})
```

#### Progress
Progress bar component for showing completion status.

```tsx
import { Progress } from '@/components/ui/progress'

<Progress
  value={60}
  max={100}
  variant="default"
  size="default"
  showValue={true}
/>

// Variants: default, success, warning, error, info
// Sizes: sm, default, lg
```

#### Spinner
Loading spinner components with different variants.

```tsx
import { Spinner, Loading, LoadingOverlay } from '@/components/ui/spinner'

// Basic spinner
<Spinner size="default" variant="default" />

// Loading with text
<Loading size="lg" text="Loading data..." />

// Full page overlay
<LoadingOverlay isLoading={true} text="Please wait..." />
```

### Layout Components

#### Dialog
Modal dialog component.

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>Close</Button>
    </DialogFooter>
    <DialogClose onClose={() => setIsOpen(false)} />
  </DialogContent>
</Dialog>
```

#### Tabs
Tab navigation component.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Content for tab 1
  </TabsContent>
  <TabsContent value="tab2">
    Content for tab 2
  </TabsContent>
</Tabs>
```

#### Separator
Horizontal or vertical separator line.

```tsx
import { Separator } from '@/components/ui/separator'

<Separator orientation="horizontal" />
<Separator orientation="vertical" />
```

### Navigation Components

#### Dropdown Menu
Dropdown menu component with items and separators.

```tsx
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'

<DropdownMenu>
  <DropdownMenuTrigger>
    <Button>Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Media Components

#### Avatar
User avatar component with fallback support.

```tsx
import { Avatar } from '@/components/ui/avatar'

<Avatar
  size="default"
  src="/path/to/image.jpg"
  alt="User Name"
  fallback="UN"
/>

// Sizes: sm, default, lg, xl, 2xl
```

### Skeleton Components

Loading skeleton components for different UI elements.

```tsx
import { Skeleton, MemberCardSkeleton, SavingsCardSkeleton, TransactionItemSkeleton } from '@/components/ui/loading-skeleton'

// Basic skeleton
<Skeleton className="h-4 w-[250px]" />

// Specific skeletons
<MemberCardSkeleton />
<SavingsCardSkeleton />
<TransactionItemSkeleton />
```

## Design System

### Color Variants

The components use a consistent color system:

- **Primary**: Main brand color (blue)
- **Secondary**: Neutral gray colors
- **Success**: Green colors for positive actions
- **Warning**: Orange/yellow colors for caution
- **Error/Destructive**: Red colors for errors
- **Info**: Blue colors for information

### Size Variants

Most components support these size variants:

- **sm**: Small size
- **default**: Standard size
- **lg**: Large size
- **xl**: Extra large size (where applicable)

### Accessibility

All components are built with accessibility in mind:

- Proper ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance

## Usage Patterns

### Form Components

```tsx
import { Card, CardHeader, CardTitle, CardContent, Label, Input, Button, Alert } from '@/components/ui'

<Card>
  <CardHeader>
    <CardTitle>Login Form</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="Enter your email" />
    </div>
    <div>
      <Label htmlFor="password">Password</Label>
      <Input id="password" type="password" placeholder="Enter your password" />
    </div>
    <Alert variant="info">
      <AlertDescription>
        Please enter your credentials to continue.
      </AlertDescription>
    </Alert>
    <Button className="w-full">Sign In</Button>
  </CardContent>
</Card>
```

### Loading States

```tsx
import { Loading, Skeleton } from '@/components/ui'

// Full page loading
<Loading size="lg" text="Loading application..." />

// Skeleton loading
<div className="space-y-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>
```

### Status Indicators

```tsx
import { Badge, Progress, Alert } from '@/components/ui'

// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Failed</Badge>

// Progress indication
<Progress value={75} max={100} variant="success" showValue />

// Status alerts
<Alert variant="success">
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>Your transaction was completed successfully.</AlertDescription>
</Alert>
```

## Customization

### Styling

Components use Tailwind CSS classes and can be customized using the `className` prop:

```tsx
<Button className="bg-purple-600 hover:bg-purple-700">
  Custom Button
</Button>
```

### Variants

Add new variants by extending the component's variant configuration:

```tsx
// In button.tsx
const buttonVariants = cva(
  // base classes...
  {
    variants: {
      variant: {
        // existing variants...
        custom: 'bg-purple-600 text-white hover:bg-purple-700'
      }
    }
  }
)
```

## Best Practices

1. **Consistency**: Use the design system colors and sizes consistently
2. **Accessibility**: Always include proper labels and ARIA attributes
3. **Performance**: Use skeleton loading for better perceived performance
4. **Error Handling**: Provide clear error states and messages
5. **Responsive**: Ensure components work well on all screen sizes
6. **Testing**: Test components with keyboard navigation and screen readers

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- class-variance-authority (cva)
- clsx
- tailwind-merge
- Lucide React (for icons)

## Contributing

When adding new components:

1. Follow the existing pattern and structure
2. Include proper TypeScript types
3. Add accessibility features
4. Support dark mode if applicable
5. Update this documentation
6. Add the component to the index.ts export file