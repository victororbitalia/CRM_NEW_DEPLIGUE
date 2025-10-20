import React from 'react'
import { render, screen, fireEvent } from '../../../__tests__/utils/test-utils'
import Button from '../Button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies default variant and size classes', () => {
    render(<Button>Default Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary-600', 'text-white', 'px-4', 'py-2')
  })

  it('applies custom variant classes', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-secondary-100', 'text-secondary-700')
  })

  it('applies custom size classes', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg')
  })

  it('applies fullWidth class when fullWidth prop is true', () => {
    render(<Button fullWidth>Full Width Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('w-full')
  })

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading Button</Button>)
    const button = screen.getByRole('button')
    const spinner = button.querySelector('svg')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })

  it('disables button when isLoading is true', () => {
    render(<Button isLoading>Loading Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('renders left icon when leftIcon prop is provided', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>
    render(<Button leftIcon={<LeftIcon />}>Button with Icon</Button>)
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
  })

  it('renders right icon when rightIcon prop is provided', () => {
    const RightIcon = () => <span data-testid="right-icon">→</span>
    render(<Button rightIcon={<RightIcon />}>Button with Icon</Button>)
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  it('does not render left icon when isLoading is true', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>
    render(<Button leftIcon={<LeftIcon />} isLoading>Button with Icon</Button>)
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument()
  })

  it('does not render right icon when isLoading is true', () => {
    const RightIcon = () => <span data-testid="right-icon">→</span>
    render(<Button rightIcon={<RightIcon />} isLoading>Button with Icon</Button>)
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Clickable Button</Button>)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick handler when disabled', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('does not call onClick handler when loading', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick} isLoading>Loading Button</Button>)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref Button</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('applies focus ring classes', () => {
    render(<Button>Focus Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2')
  })

  it('applies disabled styles', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
  })

  it('applies transition classes', () => {
    render(<Button>Transition Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('transition-colors', 'duration-200')
  })

  it('renders as submit button when type is submit', () => {
    render(<Button type="submit">Submit Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('renders as reset button when type is reset', () => {
    render(<Button type="reset">Reset Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'reset')
  })

  it('passes through other props', () => {
    render(<Button data-testid="custom-button" aria-label="Custom Label">Custom Button</Button>)
    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('aria-label', 'Custom Label')
  })
})