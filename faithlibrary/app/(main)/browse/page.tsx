// app/(main)/browse/page.tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ScoreCard, ScoreCardSkeleton } from '@/components/ScoreCard'
import { BrowseControls } from '@/components/BrowseControls'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

interface BrowseProps {
  searchParams: Promise<{ q?: string; tag?: string | string[]; sort?: string; page?: string }>
}

const PAGE_SIZE = 10

function pageBtnStyle(active: boolean): React.CSSProperties {
  return {
    width: 36, height: 36, borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.875rem', fontWeight: active ? 600 : 400,
    textDecoration: 'none', transition: 'all 0.15s',
    border: '1px solid ' + (active ? 'var(--walnut)' : 'var(--border)'),
    background: active ? 'var(--walnut)' : 'var(--surface)',
    color: active ? 'var(--bone)' : 'var(--text-muted)',
    fontFamily: 'var(--font-ui)', flexShrink: 0,
  }
}

function Pagination({ current, total, query, tags, sort }: { current: number; total: number; query?: string; tags: string[]; sort: string }) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    tags.forEach(t => params.append('tag', t))
    if (sort !== 'newest') params.set('sort', sort)
    params.set('page', String(p))
    return `/browse?${params}`
  }
  const getPages = (): (number | '...')[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
    if (current >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total]
    return [1, '...', current-1, current, current+1, '...', total]
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 24, paddingBottom: 8 }}>
      {current > 1 && <a href={buildHref(current - 1)} style={pageBtnStyle(false)}><ChevronLeft size={14} /></a>}
      {getPages().map((p, i) =>
        p === '...'
          ? <span key={`d${i}`} style={{ width: 36, textAlign: 'center', color: 'var(--text-muted)' }}>…</span>
          : <a key={p} href={buildHref(p as number)} style={pageBtnStyle(p === current)}>{p}</a>
      )}
      {current < total && <a href={buildHref(current + 1)} style={pageBtnStyle(false)}><ChevronRight size={14} /></a>}
    </div>
  )
}

async function ScoreGrid({ query, tags, sort, page }: { query?: string; tags: string[]; sort: string; page: number }) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let q = supabase.from('files').select('*, profiles(full_name)', { count: 'exact' }).eq('is_public', true)
  if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%,composer.ilike.%${query}%,arranger.ilike.%${query}%`)
  if (tags.length > 0) q = q.overlaps('tags', tags)
  switch (sort) {
    case 'downloads': q = q.order('download_count', { ascending: false }); break
    case 'az':        q = q.order('title', { ascending: true }); break
    case 'za':        q = q.order('title', { ascending: false }); break
    default:          q = q.order('created_at', { ascending: false }); break
  }
  q = q.range(from, to)

  const { data: files, error, count } = await q
  if (error) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Something went wrong. Please refresh.</div>

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  if (!files || files.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '80px 0', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--walnut)', fontWeight: 600 }}>No scores found</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Try adjusting your search or clearing filters.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{count ?? 0}</span>{' '}
          score{(count ?? 0) !== 1 ? 's' : ''}
          {query && <> for <em style={{ color: 'var(--walnut)' }}>"{query}"</em></>}
        </p>
        {totalPages > 1 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
            Page {page} of {totalPages}
          </p>
        )}
      </div>
      <div className="score-grid">
        {(files as FileRecord[]).map((file, i) => <ScoreCard key={file.id} file={file} index={i} />)}
      </div>
      {totalPages > 1 && <Pagination current={page} total={totalPages} query={query} tags={tags} sort={sort} />}
    </div>
  )
}

export default async function BrowsePage({ searchParams }: BrowseProps) {
  const params  = await searchParams
  const query   = params.q
  const rawTags = params.tag
  const tags    = rawTags ? (Array.isArray(rawTags) ? rawTags : [rawTags]) : []
  const sort    = params.sort ?? 'newest'
  const page    = Math.max(1, parseInt(params.page ?? '1', 10))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bone)' }} className="grain">
      <Navbar />

      {/* Page header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container" style={{ paddingTop: 28, paddingBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            Browse Library
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem', fontFamily: 'var(--font-ui)' }}>
            Filter by category, season, or occasion · {PAGE_SIZE} scores per page
          </p>
        </div>
      </div>

      <main className="page-container" style={{ paddingTop: 28, paddingBottom: 56 }}>
        <div style={{ marginBottom: 28 }}>
          <BrowseControls query={query} activeTags={tags} activeSort={sort} />
        </div>
        <Suspense
          key={`${query ?? ''}-${tags.join(',')}-${sort}-${page}`}
          fallback={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="skeleton" style={{ height: 16, width: 128, borderRadius: 6 }} />
              <div className="score-grid">
                {[...Array(10)].map((_, i) => <ScoreCardSkeleton key={i} index={i} />)}
              </div>
            </div>
          }
        >
          <ScoreGrid query={query} tags={tags} sort={sort} page={page} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}