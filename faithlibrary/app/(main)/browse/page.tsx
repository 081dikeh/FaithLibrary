// app/(main)/browse/page.tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ScoreCard, ScoreCardSkeleton } from '@/components/ScoreCard'
import { BrowseControls } from '@/components/BrowseControls'
import { Pagination } from '@/components/Pagination'
import type { FileRecord } from '@/lib/types'

interface BrowseProps {
  searchParams: Promise<{
    q?:    string
    tag?:  string | string[]
    sort?: string
    page?: string
  }>
}

const PAGE_SIZE = 10 // 5 columns × 2 rows

async function ScoreGrid({
  query, tags, sort, page,
}: {
  query?: string; tags: string[]; sort: string; page: number
}) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let q = supabase
    .from('files')
    .select('*, profiles(full_name)', { count: 'exact' })
    .eq('is_public', true)

  if (query) {
    q = q.or(
      `title.ilike.%${query}%,description.ilike.%${query}%,` +
      `composer.ilike.%${query}%,arranger.ilike.%${query}%`
    )
  }
  if (tags.length > 0) q = q.overlaps('tags', tags)

  switch (sort) {
    case 'downloads': q = q.order('download_count', { ascending: false }); break
    case 'az':        q = q.order('title',           { ascending: true });  break
    case 'za':        q = q.order('title',           { ascending: false }); break
    default:          q = q.order('created_at',      { ascending: false }); break
  }

  q = q.range(from, to)

  const { data: files, error, count } = await q

  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#8D6E63', fontSize: '0.875rem' }}>
      Something went wrong. Please refresh.
    </div>
  )

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  if (!files || files.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '72px 0', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#5D4037', fontWeight: 700 }}>
        No scores found
      </p>
      <p style={{ fontSize: '0.875rem', color: '#9E8070', maxWidth: 280, fontFamily: 'var(--font-ui)' }}>
        Try adjusting your search or clearing filters.
      </p>
    </div>
  )

  // Build query string preserving filters for pagination links
  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    tags.forEach(t => params.append('tag', t))
    if (sort !== 'newest') params.set('sort', sort)
    params.set('page', String(p))
    return `/browse?${params}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Result count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '0.875rem', color: '#8D6E63', fontFamily: 'var(--font-ui)' }}>
          <span style={{ fontWeight: 700, color: '#3E2723' }}>{count ?? 0}</span>{' '}
          score{(count ?? 0) !== 1 ? 's' : ''} found
          {query && (
            <> for <span style={{ color: '#5D4037', fontWeight: 600, fontStyle: 'italic' }}>"{query}"</span></>
          )}
        </p>
        {totalPages > 1 && (
          <p style={{ fontSize: '0.75rem', color: '#B09080', fontFamily: 'var(--font-ui)' }}>
            Page {page} of {totalPages}
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="score-grid">
        {(files as FileRecord[]).map((file, i) => (
          <ScoreCard key={file.id} file={file} index={i} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination current={page} total={totalPages} buildHref={buildHref} />
      )}
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
    <div className="min-h-screen grain" style={{ background: '#F7F4F2' }}>
      <Navbar />

      {/* Page header */}
      <div style={{ background: '#1C0E0A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 280, height: 280, borderRadius: '50%', background: 'rgba(93,64,55,0.25)', filter: 'blur(56px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '36px 24px 40px', position: 'relative' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: '#F7F4F2', lineHeight: 1.1 }}>
            Browse Library
          </h1>
          <p style={{ color: '#7A6055', marginTop: 6, fontSize: '0.875rem', fontFamily: 'var(--font-ui)' }}>
            {PAGE_SIZE} scores per page — filter by category, season, or occasion.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 56px' }}>
        {/* Controls */}
        <div style={{ marginBottom: 28 }}>
          <BrowseControls
            query={query}
            activeTags={tags}
            activeSort={sort}
          />
        </div>

        <Suspense
          key={`${query ?? ''}-${tags.join(',')}-${sort}-${page}`}
          fallback={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="skeleton" style={{ height: 20, width: 130, borderRadius: 6 }} />
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