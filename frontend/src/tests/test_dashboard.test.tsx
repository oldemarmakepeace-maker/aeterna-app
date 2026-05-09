import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DashboardPage from '@/app/page'

// Mocking dependencies to isolate the DashboardPage
vi.mock('@/components/layout/Header', () => ({
  default: () => <div data-testid="mock-header" />
}))

vi.mock('@/components/dashboard/MagicInputBar', () => ({
  default: () => <div data-testid="mock-magic-input" />
}))

vi.mock('@/components/dashboard/ProductivityRadar', () => ({
  default: () => <div data-testid="mock-radar" />
}))

vi.mock('@/components/dashboard/XpProgressBar', () => ({
  default: () => <div data-testid="mock-xp-progress" />
}))

vi.mock('@/components/dashboard/CalendarWidget', () => ({
  default: () => <div data-testid="mock-calendar" />
}))

vi.mock('@/components/dashboard/TaskList', () => ({
  default: () => <div data-testid="mock-task-list" />
}))

vi.mock('@/components/layout/BottomNav', () => ({
  default: () => <div data-testid="mock-bottom-nav" />
}))

describe('DashboardPage', () => {
  it('renders all main widgets successfully', () => {
    render(<DashboardPage />)
    
    // Header
    expect(screen.getByTestId('mock-header')).toBeInTheDocument()
    
    // Left column
    expect(screen.getByTestId('mock-magic-input')).toBeInTheDocument()
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument()
    expect(screen.getByTestId('mock-task-list')).toBeInTheDocument()
    
    // Right column
    expect(screen.getByText('Баланс')).toBeInTheDocument()
    expect(screen.getByTestId('mock-radar')).toBeInTheDocument()
    expect(screen.getByTestId('mock-xp-progress')).toBeInTheDocument()
    
    // Bottom Nav
    expect(screen.getByTestId('mock-bottom-nav')).toBeInTheDocument()
  })
})
