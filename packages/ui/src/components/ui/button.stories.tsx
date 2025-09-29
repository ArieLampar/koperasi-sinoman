import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import {
  ArrowRightIcon,
  DownloadIcon,
  TrashIcon,
  PlusIcon,
  HeartIcon,
  ShareIcon
} from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A reusable button component with multiple variants, sizes, and states. Built with accessibility in mind and includes loading states, icons, and proper ARIA attributes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'success', 'warning', 'outline', 'ghost', 'link', 'gradient'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg'],
      description: 'Size of the button',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner and disable interaction',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width',
    },
    asChild: {
      control: 'boolean',
      description: 'Render as a different element (using Radix Slot)',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Basic button variants
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
}

export const Danger: Story = {
  args: {
    children: 'Delete Item',
    variant: 'danger',
  },
}

export const Success: Story = {
  args: {
    children: 'Save Changes',
    variant: 'success',
  },
}

export const Warning: Story = {
  args: {
    children: 'Proceed with Caution',
    variant: 'warning',
  },
}

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
}

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
}

export const Link: Story = {
  args: {
    children: 'Link Button',
    variant: 'link',
  },
}

export const Gradient: Story = {
  args: {
    children: 'Premium Action',
    variant: 'gradient',
  },
}

// Size variants
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
}

// Icon buttons
export const IconButtons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="icon-sm" variant="outline">
        <PlusIcon />
      </Button>
      <Button size="icon" variant="outline">
        <HeartIcon />
      </Button>
      <Button size="icon-lg" variant="outline">
        <ShareIcon />
      </Button>
    </div>
  ),
}

// Buttons with icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button leftIcon={<DownloadIcon />}>
          Download File
        </Button>
        <Button rightIcon={<ArrowRightIcon />} variant="outline">
          Continue
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <Button leftIcon={<PlusIcon />} variant="success">
          Add Item
        </Button>
        <Button leftIcon={<TrashIcon />} variant="danger">
          Delete
        </Button>
      </div>
    </div>
  ),
}

// Loading states
export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button loading>
          Loading...
        </Button>
        <Button loading loadingText="Saving..." variant="success">
          Save
        </Button>
        <Button loading variant="outline">
          Processing
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <Button loading leftIcon={<DownloadIcon />}>
          Download
        </Button>
        <Button loading size="sm" variant="secondary">
          Small Loading
        </Button>
        <Button loading size="lg" variant="gradient">
          Large Loading
        </Button>
      </div>
    </div>
  ),
}

// Disabled states
export const DisabledStates: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button disabled>
        Disabled Primary
      </Button>
      <Button disabled variant="secondary">
        Disabled Secondary
      </Button>
      <Button disabled variant="outline">
        Disabled Outline
      </Button>
      <Button disabled variant="danger">
        Disabled Danger
      </Button>
    </div>
  ),
}

// Full width buttons
export const FullWidth: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <Button fullWidth>
        Full Width Primary
      </Button>
      <Button fullWidth variant="outline">
        Full Width Outline
      </Button>
      <Button fullWidth variant="secondary" leftIcon={<PlusIcon />}>
        Full Width with Icon
      </Button>
    </div>
  ),
}

// As child (polymorphic)
export const AsChild: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button asChild>
        <a href="https://example.com" target="_blank" rel="noopener noreferrer">
          Link Button
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href="#section" onClick={(e) => e.preventDefault()}>
          Anchor Link
        </a>
      </Button>
    </div>
  ),
}

// Interactive examples
export const Interactive: Story = {
  render: () => {
    const [loading, setLoading] = React.useState(false)
    const [count, setCount] = React.useState(0)

    const handleAsyncAction = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setLoading(false)
      setCount(prev => prev + 1)
    }

    return (
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Click count: {count}
          </p>
          <Button
            onClick={handleAsyncAction}
            loading={loading}
            loadingText="Processing..."
            leftIcon={<PlusIcon />}
          >
            Async Action
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => setCount(prev => prev + 1)}
            size="sm"
            variant="outline"
          >
            Increment
          </Button>
          <Button
            onClick={() => setCount(0)}
            size="sm"
            variant="ghost"
          >
            Reset
          </Button>
        </div>
      </div>
    )
  },
}

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="gradient">Gradient</Button>
    </div>
  ),
}