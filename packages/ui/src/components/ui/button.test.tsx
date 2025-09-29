import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'
import { PlusIcon, ArrowRightIcon } from 'lucide-react'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'primary')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'secondary')

    rerender(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'danger')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'lg')
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })

  it('shows loading state correctly', () => {
    render(<Button loading>Loading</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('data-loading', 'true')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows loading text when provided', () => {
    render(
      <Button loading loadingText="Saving...">
        Save
      </Button>
    )

    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('prevents interaction when loading', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(
      <Button loading onClick={handleClick}>
        Loading
      </Button>
    )

    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders with left icon', () => {
    render(
      <Button leftIcon={<PlusIcon data-testid="plus-icon" />}>
        Add Item
      </Button>
    )

    expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    expect(screen.getByText('Add Item')).toBeInTheDocument()
  })

  it('renders with right icon', () => {
    render(
      <Button rightIcon={<ArrowRightIcon data-testid="arrow-icon" />}>
        Continue
      </Button>
    )

    expect(screen.getByTestId('arrow-icon')).toBeInTheDocument()
    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('hides icons when loading', () => {
    render(
      <Button
        loading
        leftIcon={<PlusIcon data-testid="plus-icon" />}
        rightIcon={<ArrowRightIcon data-testid="arrow-icon" />}
      >
        Loading
      </Button>
    )

    expect(screen.queryByTestId('plus-icon')).not.toBeInTheDocument()
    expect(screen.queryByTestId('arrow-icon')).not.toBeInTheDocument()
  })

  it('renders as full width when fullWidth is true', () => {
    render(<Button fullWidth>Full Width</Button>)

    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test')
    expect(link).toHaveTextContent('Link Button')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)

    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Button ref={ref}>Ref Button</Button>)

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement))
  })

  it('sets correct button type', () => {
    const { rerender } = render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')

    rerender(<Button type="reset">Reset</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'reset')

    rerender(<Button>Default</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('applies aria-label when provided', () => {
    render(<Button ariaLabel="Custom aria label">Button</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom aria label')
  })

  it('has proper focus management', async () => {
    const user = userEvent.setup()
    render(<Button>Focusable</Button>)

    const button = screen.getByRole('button')
    await user.tab()

    expect(button).toHaveFocus()
  })

  it('supports keyboard interaction', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Keyboard</Button>)

    const button = screen.getByRole('button')
    button.focus()

    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledTimes(1)

    await user.keyboard(' ')
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('does not trigger click when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button disabled onClick={handleClick}>Disabled</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies active scale animation class', () => {
    render(<Button>Animated</Button>)

    expect(screen.getByRole('button')).toHaveClass('active:scale-[0.98]')
  })

  it('maintains accessibility during loading state', () => {
    render(<Button loading>Loading Button</Button>)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('Loading...')).toHaveClass('sr-only')
  })
})