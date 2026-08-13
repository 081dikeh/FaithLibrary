// app/(main)/browse/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ScoreCard, ScoreCardSkeleton } from '@/components/ScoreCard'
import { BrowseControls } from '@/components/BrowseControls'
import { Pagination } from '@/components/Pagination'
import { Home, Sparkles } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

interface BrowseProps {
  searchParams: Promise<{
    q?:        string
    category?: string
    season?:   string
    voice?:    string
    sort?:     string
    page?:     string
  }>
}

const PAGE_SIZE = 10

async function ScoreGrid({
  query, category, season, voicing, sort, page,
}: {
  query?: string; category?: string; season?: string; voicing?: string; sort: string; page: number
}) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let q = supabase
    .from('files')
    .select('*, profiles(full_name)', { count: 'exact' })
    .eq('is_public', true)

  if (query) {
    // Raw user input is interpolated into a PostgREST filter string below.
    // Commas/parens are structural in .or() syntax, and % / _ are ILIKE
    // wildcards — all need escaping so search terms containing them (very
    // likely here, since users are invited to paste lyric lines) can't
    // break or reshape the query.
    const safe = query.replace(/[,()]/g, ' ').replace(/[%_\\]/g, '\\$&').trim()
    q = q.or(
      `title.ilike.%${safe}%,description.ilike.%${safe}%,` +
      `composer.ilike.%${safe}%,arranger.ilike.%${safe}%`
    )
  }
  if (category) q = q.contains('tags', [category])
  if (season)   q = q.contains('tags', [season])
  if (voicing)  q = q.ilike('voice_parts', `%${voicing}%`)

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

  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    if (query)    params.set('q', query)
    if (category) params.set('category', category)
    if (season)   params.set('season', season)
    if (voicing)  params.set('voice', voicing)
    if (sort !== 'newest') params.set('sort', sort)
    params.set('page', String(p))
    return `/browse?${params}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p className="text-sm" style={{ color: '#8D6E63', fontFamily: 'var(--font-ui)' }}>
        <span style={{ fontWeight: 700, color: '#3E2723' }}>{count ?? 0}</span>{' '}
        script{(count ?? 0) !== 1 ? 's' : ''}
        {totalPages > 1 && <span style={{ color: '#B09080' }}> — page {page} of {totalPages}</span>}
      </p>

      <div className="score-grid">
        {(files as FileRecord[]).map((file, i) => (
          <ScoreCard key={file.id} file={file} index={i} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination current={page} total={totalPages} buildHref={buildHref} />
      )}
    </div>
  )
}

export default async function BrowsePage({ searchParams }: BrowseProps) {
  const params   = await searchParams
  const query    = params.q
  const category = params.category
  const season   = params.season
  const voicing  = params.voice
  const sort     = params.sort ?? 'newest'
  const page     = Math.max(1, parseInt(params.page ?? '1', 10))

  return (
    <div className="min-h-screen grain" style={{ background: '#F7F4F2' }}>
      <Navbar />

      {/* Hero header — light, editorial, matches the library's front-of-book feel */}
      <div className="bg-[#FBF8F6] border-b border-[#EFE9E7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-[#B09080] mb-6" style={{ fontFamily: 'var(--font-ui)' }}>
            <Link href="/" className="flex items-center gap-1 hover:text-[#5D4037] transition-colors">
              <Home size={12} /> Home
            </Link>
            <span>/</span>
            <span className="text-[#5D4037] font-medium">Browse</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2723] mb-3">
            The Choral Library
          </h1>
          <p className="text-sm sm:text-base text-[#8D6E63] max-w-xl leading-relaxed mb-4" style={{ fontFamily: 'var(--font-ui)' }}>
            Browse the full collection — every hymn, Mass part, and sacred score, free to view, print, and share.
          </p>

          <p
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#5D4037] bg-[#F0E4DA] border border-[#D7CCC8]/60 rounded-full px-3.5 py-1.5 mb-8"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            <Sparkles size={13} className="text-[#B8860B] shrink-0" />
            Can&apos;t recall the title? Search any words you remember from the lyrics.
          </p>

          <BrowseControls
            query={query}
            category={category}
            season={season}
            voicing={voicing}
            activeSort={sort}
          />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <Suspense
          key={`${query ?? ''}-${category ?? ''}-${season ?? ''}-${voicing ?? ''}-${sort}-${page}`}
          fallback={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="skeleton" style={{ height: 20, width: 130, borderRadius: 6 }} />
              <div className="score-grid">
                {[...Array(10)].map((_, i) => <ScoreCardSkeleton key={i} index={i} />)}
              </div>
            </div>
          }
        >
          <ScoreGrid query={query} category={category} season={season} voicing={voicing} sort={sort} page={page} />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}