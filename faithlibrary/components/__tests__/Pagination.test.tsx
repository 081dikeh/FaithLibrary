import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { Pagination } from '@/components/Pagination'

const buildHref = (page: number) => `/?page=${page}`

describe('Pagination', () => {
  it('does not render a "previous" link on the first page', () => {
    render(<Pagination current={1} total={5} buildHref={buildHref} />)
    expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Next page')).toBeInTheDocument()
  })

  it('does not render a "next" link on the last page', () => {
    render(<Pagination current={5} total={5} buildHref={buildHref} />)
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument()
    expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument()
  })

  it('renders every page number when the total is small', () => {
    render(<Pagination current={2} total={4} buildHref={buildHref} />)
    for (const p of [1, 2, 3, 4]) {
      expect(screen.getByLabelText(`Page ${p}`)).toBeInTheDocument()
    }
  })

  it('collapses long page ranges with an ellipsis', () => {
    render(<Pagination current={1} total={20} buildHref={buildHref} />)
    expect(screen.getByText('…')).toBeInTheDocument()
    expect(screen.getByLabelText('Page 20')).toBeInTheDocument()
  })

  it('marks the current page with aria-current="page"', () => {
    render(<Pagination current={3} total={10} buildHref={buildHref} />)
    const current = screen.getByLabelText('Page 3')
    expect(current).toHaveAttribute('aria-current', 'page')
    const other = screen.getByLabelText('Page 4')
    expect(other).not.toHaveAttribute('aria-current')
  })

  it('builds hrefs using the supplied buildHref function', () => {
    const spy = vi.fn((p: number) => `/browse?page=${p}`)
    render(<Pagination current={2} total={5} buildHref={spy} />)
    expect(screen.getByLabelText('Next page')).toHaveAttribute('href', '/browse?page=3')
    expect(spy).toHaveBeenCalled()
  })

  it('is wrapped in a labeled navigation landmark', () => {
    render(<Pagination current={1} total={3} buildHref={buildHref} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<Pagination current={4} total={9} buildHref={buildHref} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
