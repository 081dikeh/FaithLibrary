// components/Pagination.tsx — shared pagination component for all pages
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  current:  number
  total:    number
  buildHref: (page: number) => string
}

export function Pagination({ current, total, buildHref }: PaginationProps) {
  const pages: (number | '...')[] =
    total <= 7
      ? Array.from({ length: total }, (_, i) => i + 1)
      : current <= 4
        ? [1, 2, 3, 4, 5, '...', total]
        : current >= total - 3
          ? [1, '...', total-4, total-3, total-2, total-1, total]
          : [1, '...', current-1, current, current+1, '...', total]

  const base: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8125rem', fontWeight: 500,
    textDecoration: 'none', transition: 'all 0.15s',
    fontFamily: 'var(--font-ui)',
    border: '1px solid #E0D8D4',
    background: '#fff', color: '#8D6E63',
  }

  const active: React.CSSProperties = {
    ...base,
    background: '#3E2723',
    borderColor: '#3E2723',
    color: '#F7F4F2',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(62,39,35,0.22)',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 5, paddingTop: 32,
    }}>
      {current > 1 && (
        <a href={buildHref(current - 1)} style={base}>
          <ChevronLeft size={14} />
        </a>
      )}

      {pages.map((p, i) =>
        p === '...'
          ? (
            <span key={`d${i}`} style={{
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#C4B5AF', fontSize: '0.875rem',
            }}>…</span>
          ) : (
            <a key={p} href={buildHref(p as number)}
              style={p === current ? active : base}>
              {p}
            </a>
          )
      )}

      {current < total && (
        <a href={buildHref(current + 1)} style={base}>
          <ChevronRight size={14} />
        </a>
      )}
    </div>
  )
}