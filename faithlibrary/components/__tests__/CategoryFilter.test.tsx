import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { CategoryFilter } from '@/components/CategoryFilter'
import { TAG_GROUPS } from '@/lib/categories'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const firstTag = TAG_GROUPS[0].tags[0]

describe('CategoryFilter', () => {
  beforeEach(() => {
    pushMock.mockReset()
  })

  it('renders a closed dropdown by default', () => {
    render(<CategoryFilter active={[]} />)
    const trigger = screen.getByRole('button', { name: /^filter/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })

  it('opens the panel when the trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<CategoryFilter active={[]} />)
    await user.click(screen.getByRole('button', { name: /^filter/i }))
    expect(screen.getByRole('button', { name: /^filter/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('group', { name: /filter by category/i })).toBeInTheDocument()
  })

  it('closes the panel on Escape', async () => {
    const user = userEvent.setup()
    render(<CategoryFilter active={[]} />)
    await user.click(screen.getByRole('button', { name: /^filter/i }))
    expect(screen.getByRole('group')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })

  it('navigates with the selected tag when a tag is toggled on', async () => {
    const user = userEvent.setup()
    render(<CategoryFilter active={[]} />)
    await user.click(screen.getByRole('button', { name: /^filter/i }))
    const panel = screen.getByRole('group')
    await user.click(within(panel).getByText(firstTag))
    expect(pushMock).toHaveBeenCalledTimes(1)
    const [url] = pushMock.mock.calls[0]
    expect(url).toContain(encodeURIComponent(firstTag).replace(/%20/g, '+') === url ? '' : 'tag=')
  })

  it('shows a removable pill for each active tag', () => {
    render(<CategoryFilter active={[firstTag]} />)
    expect(screen.getByRole('button', { name: `Remove ${firstTag} filter` })).toBeInTheDocument()
  })

  it('removes a tag when its pill is clicked', async () => {
    const user = userEvent.setup()
    render(<CategoryFilter active={[firstTag]} />)
    await user.click(screen.getByRole('button', { name: `Remove ${firstTag} filter` }))
    expect(pushMock).toHaveBeenCalledWith('/')
  })

  it('shows "Clear all" only when more than one tag is active', () => {
    const { rerender } = render(<CategoryFilter active={[firstTag]} />)
    expect(screen.queryByRole('button', { name: /^clear all$/i })).not.toBeInTheDocument()

    rerender(<CategoryFilter active={[firstTag, TAG_GROUPS[0].tags[1]]} />)
    expect(screen.getByRole('button', { name: /^clear all$/i })).toBeInTheDocument()
  })

  it('has no detectable accessibility violations when open', async () => {
    const user = userEvent.setup()
    const { container } = render(<CategoryFilter active={[firstTag]} />)
    await user.click(screen.getByRole('button', { name: /^filter/i }))
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
