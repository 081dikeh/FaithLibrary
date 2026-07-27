import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { ScoreCard } from '@/components/ScoreCard'
import type { FileRecord } from '@/lib/types'

const { getSessionMock, fromMock, rpcMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  fromMock: vi.fn(),
  rpcMock: vi.fn().mockResolvedValue({ data: null, error: null }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getSession: getSessionMock },
    from: fromMock,
    rpc: rpcMock,
  }),
}))

const baseFile: FileRecord = {
  id: 'file-1',
  user_id: 'user-1',
  title: 'Ave Maria',
  composer: 'Schubert',
  is_public: true,
  file_url: 'https://example.com/ave-maria.pdf',
  thumbnail_url: 'https://example.com/ave-maria-thumb.png',
  tags: ['Communion'],
  created_at: new Date().toISOString(),
}

describe('ScoreCard', () => {
  beforeEach(() => {
    getSessionMock.mockReset()
    fromMock.mockReset()
    rpcMock.mockClear()
  })

  it('gives the thumbnail link an accessible name including title and composer', () => {
    render(<ScoreCard file={baseFile} />)
    expect(screen.getByRole('link', { name: 'View Ave Maria by Schubert' })).toBeInTheDocument()
  })

  it('renders bookmark and quick-download buttons as siblings of the link, not nested inside it', () => {
    render(<ScoreCard file={baseFile} />)
    const link = screen.getByRole('link', { name: 'View Ave Maria by Schubert' })
    const bookmarkBtn = screen.getByRole('button', { name: 'Bookmark Ave Maria' })
    // An <a> cannot validly contain a <button> — assert they are siblings, not ancestor/descendant.
    expect(link.contains(bookmarkBtn)).toBe(false)
    expect(bookmarkBtn.contains(link)).toBe(false)
  })

  it('redirects unauthenticated users to /login when bookmarking', async () => {
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: '' },
    })

    getSessionMock.mockResolvedValue({ data: { session: null } })
    const user = userEvent.setup()
    render(<ScoreCard file={baseFile} />)
    await user.click(screen.getByRole('button', { name: 'Bookmark Ave Maria' }))
    expect(window.location.href).toBe('/login')

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('shows "Remove from bookmarks" label and aria-pressed once bookmarked', () => {
    render(<ScoreCard file={baseFile} bookmarked />)
    const btn = screen.getByRole('button', { name: 'Remove Ave Maria from bookmarks' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('has a uniquely labeled download button', () => {
    render(<ScoreCard file={baseFile} />)
    expect(screen.getByRole('button', { name: 'Download Ave Maria' })).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<ScoreCard file={baseFile} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
