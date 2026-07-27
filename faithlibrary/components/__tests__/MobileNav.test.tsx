import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { MobileNav } from '@/components/MobileNav'

const { usePathnameMock } = vi.hoisted(() => ({ usePathnameMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  usePathname: usePathnameMock,
}))

describe('MobileNav', () => {
  beforeEach(() => {
    usePathnameMock.mockReset()
  })

  it('renders the tab bar with a labeled navigation landmark', () => {
    usePathnameMock.mockReturnValue('/')
    render(<MobileNav />)
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /browse/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /upload/i })).toBeInTheDocument()
  })

  it('marks the active tab with aria-current="page"', () => {
    usePathnameMock.mockReturnValue('/browse')
    render(<MobileNav />)
    expect(screen.getByRole('link', { name: /browse/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /home/i })).not.toHaveAttribute('aria-current')
  })

  it('does not render on auth routes', () => {
    usePathnameMock.mockReturnValue('/login')
    const { container } = render(<MobileNav />)
    expect(container).toBeEmptyDOMElement()
  })

  it('does not render on the print route', () => {
    usePathnameMock.mockReturnValue('/print/abc123')
    const { container } = render(<MobileNav />)
    expect(container).toBeEmptyDOMElement()
  })

  it('has no detectable accessibility violations', async () => {
    usePathnameMock.mockReturnValue('/')
    const { container } = render(<MobileNav />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
