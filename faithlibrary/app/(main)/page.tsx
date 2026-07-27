// app/(main)/page.tsx
import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { ScoreCard, ScoreCardSkeleton } from '@/components/ScoreCard'
import { CategoryFilter } from '@/components/CategoryFilter'
import { FeaturedScores } from '@/components/FeaturedScores'
import { HomeStats } from '@/components/HomeStats'
import { ScoreOfWeek } from '@/components/ScoreOfWeek'
import { Footer } from '@/components/Footer'
import { Pagination } from '@/components/Pagination'
import { ArrowRight, Upload, Search, BookOpen } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

const PAGE_SIZE = 10

interface HomeProps {
  searchParams: Promise<{ q?: string; tag?: string | string[]; page?: string }>
}

async function ScoreGrid({ query, tags, page }: { query?: string; tags: string[]; page: number }) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let q = supabase
    .from('files')
    .select('*, profiles(full_name)', { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%,composer.ilike.%${query}%,arranger.ilike.%${query}%`)
  if (tags.length > 0) q = q.overlaps('tags', tags)
  q = q.range(from, to)

  const { data: files, error, count } = await q

  if (error) return (
    <p style={{ textAlign: 'center', padding: '80px 0', color: '#8D6E63', fontSize: '0.875rem' }}>
      Something went wrong. Please refresh.
    </p>
  )

  if (!files || files.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '96px 0', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: '#EFE9E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Search size={26} style={{ color: '#8D6E63' }} />
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#5D4037', fontWeight: 700 }}>No scores found</p>
      <p style={{ color: '#9E8070', fontSize: '0.875rem', maxWidth: 280, lineHeight: 1.6, fontFamily: 'var(--font-ui)' }}>
        {query ? `No results for "${query}". Try different keywords or clear filters.` : 'No scores yet. Be the first to upload.'}
      </p>
      <Link href="/upload" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4,
        padding: '9px 18px', borderRadius: 10,
        background: '#3E2723', color: '#F7F4F2',
        fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none',
        fontFamily: 'var(--font-ui)', boxShadow: '0 2px 8px rgba(62,39,35,0.22)',
      }}>
        Upload a score <ArrowRight size={13} />
      </Link>
    </div>
  )

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const buildHref = (p: number) => {
    const ps = new URLSearchParams()
    if (query) ps.set('q', query)
    tags.forEach(t => ps.append('tag', t))
    ps.set('page', String(p))
    return `/?${ps}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '0.875rem', color: '#8D6E63', fontFamily: 'var(--font-ui)' }}>
          <span style={{ fontWeight: 700, color: '#3E2723' }}>{count ?? 0}</span> score{(count ?? 0) !== 1 ? 's' : ''}
        </p>
        {totalPages > 1 && (
          <p style={{ fontSize: '0.75rem', color: '#B09080', fontFamily: 'var(--font-ui)' }}>
            Page {page} of {totalPages}
          </p>
        )}
      </div>

      <div className="score-grid">
        {(files as FileRecord[]).map((file, i) => <ScoreCard key={file.id} file={file} index={i} />)}
      </div>

      {totalPages > 1 && (
        <Pagination current={page} total={totalPages} buildHref={buildHref} />
      )}
    </div>
  )
}

export default async function HomePage({ searchParams }: HomeProps) {
  const params   = await searchParams
  const query    = params.q
  const rawTags  = params.tag
  const tags     = rawTags ? (Array.isArray(rawTags) ? rawTags : [rawTags]) : []
  const page     = Math.max(1, parseInt(params.page ?? '1', 10))
  const showHero = !query && tags.length === 0 && page === 1

  return (
    <div className="min-h-screen grain">
      <Navbar />

      {showHero && (
        <section className="relative overflow-hidden bg-[#3E2723] pt-20 pb-24 px-4 sm:px-6">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#5D4037]/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-[#8D6E63]/15 blur-3xl pointer-events-none" />

          {/* signature: faint staff lines, like an open hymnal */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-40 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage: 'repeating-linear-gradient(to bottom, #F5F5F5 0px, #F5F5F5 1px, transparent 1px, transparent 22px)',
            }}
          />

          <div className="relative max-w-4xl mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-4 rounded-full bg-[#5D4037]/60 border border-[#8D6E63]/30 text-[#D7CCC8] text-xs font-medium mb-6 animate-fade-in"
              style={{ fontFamily: 'var(--font-ui)', letterSpacing: '0.02em' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8D6E63] animate-pulse" />
              Sacred music commons — free forever
            </div>

            <div className="flex justify-center mb-7 animate-fade-up">
              <div
                className="logo-on-dark opacity-70"
                style={{ position: 'relative', width: 64, height: 80 }}
              >
                <Image src="/FaithLibrary_logo.png" alt="" fill sizes="64px" className="object-contain" />
              </div>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F5F5F5] leading-[1.1] mb-5 animate-fade-up delay-100">
              Discover & Share
              <span className="block text-[#D7CCC8] font-normal italic mt-2">Choral Music</span>
            </h1>

            <div className="flex items-center justify-center gap-3 mb-6 animate-fade-up delay-100">
              <span className="h-px w-10 bg-[#8D6E63]/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8D6E63]/60" />
              <span className="h-px w-10 bg-[#8D6E63]/40" />
            </div>

            <p className="text-[#8D6E63] text-sm sm:text-base max-w-lg mx-auto mb-9 leading-relaxed animate-fade-up delay-150" style={{ fontFamily: 'var(--font-ui)' }}>
              A growing commons of hymns, choral scores, and sacred compositions — free to explore, upload, and share with the world.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-up delay-200">
              <Link href="/browse" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.75rem 1.75rem' }}>
                <BookOpen size={16} /> Browse Library
              </Link>
              <Link href="/signup" className="btn" style={{ background: 'transparent', color: '#D7CCC8', borderColor: 'rgba(141,110,99,0.5)', fontSize: '0.9rem', padding: '0.75rem 1.75rem' }}>
                <Upload size={16} /> Upload a Score
              </Link>
            </div>

            <Suspense fallback={<div className="flex justify-center gap-10 animate-pulse">{[...Array(3)].map((_, i) => (<div key={i} className="text-center"><div className="h-6 w-12 bg-[#5D4037]/40 rounded mx-auto mb-1" /><div className="h-3 w-16 bg-[#5D4037]/20 rounded mx-auto" /></div>))}</div>}>
              <HomeStats />
            </Suspense>
          </div>
        </section>
      )}

      {showHero && (
        <section className="bg-white border-b border-[#D7CCC8]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="text-center mb-12">
              <p
                className="text-xs font-semibold uppercase mb-3"
                style={{ fontFamily: 'var(--font-ui)', letterSpacing: '0.15em', color: '#8D6E63' }}
              >
                How it works
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2723]">
                Three steps to sacred sound
              </h2>
            </div>

            <div
              className="rounded-2xl border border-[#EFE9E7] overflow-hidden"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              {[
                { numeral: 'I', icon: '🔍', title: 'Discover', desc: 'Browse hundreds of Mass parts, hymns, and choral scores organised by category and season.' },
                { numeral: 'II', icon: '📄', title: 'View & Print', desc: 'Read scores in-browser with our PDF viewer. Print or download in one click.' },
                { numeral: 'III', icon: '🎵', title: 'Share', desc: 'Upload your own compositions or arrangements and share them with the global community.' },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className="group text-center px-8 py-10 transition-colors duration-300 hover:bg-[#FBF8F6]"
                  style={{ borderLeft: i > 0 ? '1px solid #EFE9E7' : 'none' }}
                >
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full mb-5 text-xs font-bold"
                    style={{ fontFamily: 'var(--font-display)', color: '#8D6E63', border: '1px solid #D7CCC8' }}
                  >
                    {item.numeral}
                  </span>
                  <div className="text-3xl mb-4 transition-transform duration-300 group-hover:scale-110">{item.icon}</div>
                  <h3 className="font-display text-lg font-semibold text-[#3E2723] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#8D6E63] leading-relaxed" style={{ fontFamily: 'var(--font-ui)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {showHero && <Suspense fallback={null}><FeaturedScores /></Suspense>}
      {showHero && <Suspense fallback={null}><ScoreOfWeek /></Suspense>}

      {query && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
          <p className="text-sm text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>Showing results for</p>
          <h2 className="font-display text-2xl text-[#3E2723]">"{query}"</h2>
        </div>
      )}

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <CategoryFilter active={tags} query={query} />
          {!query && tags.length === 0 && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <h2 className="font-display text-lg font-semibold text-[#3E2723] hidden sm:block">Latest Additions</h2>
              <Link href="/browse" className="btn btn-secondary btn-sm">View all <ArrowRight size={13} /></Link>
            </div>
          )}
        </div>

        <Suspense
          key={`${query ?? ''}-${tags.join(',')}-${page}`}
          fallback={
            <div className="score-grid">
              {[...Array(10)].map((_, i) => <ScoreCardSkeleton key={i} index={i} />)}
            </div>
          }
        >
          <ScoreGrid query={query} tags={tags} page={page} />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}