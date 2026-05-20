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
  searchParams: Promise<{
    q?:    string
    tag?:  string | string[]
    sort?: string
    page?: string
  }>
}

const PAGE_SIZE = 20 // 5 columns × 4 rows

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
    <div className="col-span-5 text-center py-20 text-[#8D6E63] text-sm">
      Something went wrong. Please refresh.
    </div>
  )

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  if (!files || files.length === 0) return (
    <div className="col-span-5 flex flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-xl text-[#5D4037]">No scores found</p>
      <p className="text-sm text-[#8D6E63] max-w-xs" style={{ fontFamily: 'var(--font-ui)' }}>
        Try adjusting your search or clearing filters.
      </p>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
          <span className="font-semibold text-[#3E2723]">{count ?? 0}</span>{' '}
          score{(count ?? 0) !== 1 ? 's' : ''} found
          {query && (
            <> for <span className="text-[#5D4037] font-medium italic">"{query}"</span></>
          )}
        </p>
        {totalPages > 1 && (
          <p className="text-xs text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
            Page {page} of {totalPages}
          </p>
        )}
      </div>

      {/* 5-column grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {(files as FileRecord[]).map((file, i) => (
          <ScoreCard key={file.id} file={file} index={i} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          current={page}
          total={totalPages}
          query={query}
          tags={tags}
          sort={sort}
        />
      )}
    </div>
  )
}

function Pagination({
  current, total, query, tags, sort,
}: {
  current: number; total: number
  query?: string; tags: string[]; sort: string
}) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    tags.forEach(t => params.append('tag', t))
    if (sort !== 'newest') params.set('sort', sort)
    params.set('page', String(p))
    return `/browse?${params}`
  }

  // Show max 7 page buttons
  const getPages = () => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
    if (current >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total]
    return [1, '...', current-1, current, current+1, '...', total]
  }

  const pages = getPages()

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4 pb-2">
      {/* Prev */}
      {current > 1 && (
        <a href={buildHref(current - 1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center
                     bg-white border border-[#D7CCC8] text-[#8D6E63]
                     hover:border-[#5D4037] hover:text-[#5D4037] transition-all">
          <ChevronLeft size={15} />
        </a>
      )}

      {/* Pages */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`}
            className="w-9 h-9 flex items-center justify-center text-[#D7CCC8] text-sm">
            …
          </span>
        ) : (
          <a key={p} href={buildHref(p as number)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm
                        font-medium transition-all duration-150 ${
              p === current
                ? 'bg-[#5D4037] text-white shadow-sm'
                : 'bg-white border border-[#D7CCC8] text-[#8D6E63] hover:border-[#5D4037] hover:text-[#5D4037]'
            }`}>
            {p}
          </a>
        )
      )}

      {/* Next */}
      {current < total && (
        <a href={buildHref(current + 1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center
                     bg-white border border-[#D7CCC8] text-[#8D6E63]
                     hover:border-[#5D4037] hover:text-[#5D4037] transition-all">
          <ChevronRight size={15} />
        </a>
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
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-[#D7CCC8]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-7 sm:py-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2723]">
            Browse Library
          </h1>
          <p className="text-[#8D6E63] mt-1 text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
            {PAGE_SIZE} scores per page — filter by category, season, or occasion.
          </p>
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Controls */}
        <div className="mb-8">
          <BrowseControls
            query={query}
            activeTags={tags}
            activeSort={sort}
          />
        </div>

        <Suspense fallback={
          <div className="space-y-8">
            <div className="h-5 skeleton w-32 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(20)].map((_, i) => <ScoreCardSkeleton key={i} />)}
            </div>
          </div>
        }>
          <ScoreGrid query={query} tags={tags} sort={sort} page={page} />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}