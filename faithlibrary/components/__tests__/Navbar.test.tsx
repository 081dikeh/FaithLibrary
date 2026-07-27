import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { Navbar } from '@/components/Navbar'

const { usePathnameMock, useRouterMock, pushMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(() => '/'),
  useRouterMock: vi.fn(),
  pushMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: usePathnameMock,
  useRouter: () => ({ push: pushMock, ...useRouterMock() }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }),
  }),
}))

vi.mock('@/components/NotificationBell', () => ({
  NotificationBell: () => null,
}))

describe('Navbar', () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue('/')
    pushMock.mockReset()
  })

  it('renders a labeled primary navigation landmark', () => {
    render(<Navbar />)
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
  })

  it('toggles aria-expanded on the mobile menu button when clicked', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    const menuButton = screen.getByRole('button', { name: 'Menu' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await user.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('toggles aria-expanded on the mobile search button when clicked', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    const searchButton = screen.getByRole('button', { name: 'Search' })
    expect(searchButton).toHaveAttribute('aria-expanded', 'false')
    await user.click(searchButton)
    expect(searchButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Search by title, composer, or tag')).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<Navbar />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
