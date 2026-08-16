// app/(main)/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { ScoreCard, ScoreCardSkeleton } from '@/components/ScoreCard'
import { FeaturedScores } from '@/components/FeaturedScores'
import { ScoreOfWeek } from '@/components/ScoreOfWeek'
import { Footer } from '@/components/Footer'
import { Pagination } from '@/components/Pagination'
import { TAG_GROUPS, LITURGICAL_SEASONS } from '@/lib/categories'
import {
  ArrowRight, Upload, Search, BookOpen, SlidersHorizontal, Sparkles,
  DoorOpen, Gift, Coffee, ArrowRightCircle, Heart, Music2, Church,
} from 'lucide-react'
import type { FileRecord } from '@/lib/types'

const PAGE_SIZE = 10
const VOICING_OPTIONS = ['SATB', 'SATB divisi', 'SAB', 'SSA', 'SSAA', 'TTBB', 'TB', 'Unison', 'Descant']
const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest first' },
  { value: 'downloads', label: 'Most downloaded' },
  { value: 'az',        label: 'Title A → Z' },
  { value: 'za',        label: 'Title Z → A' },
]
const CATEGORY_GROUPS = TAG_GROUPS.filter(g => g.label !== 'Liturgical Seasons')

interface HomeProps {
  searchParams: Promise<{
    q?: string; category?: string; season?: string; voice?: string; sort?: string; page?: string
  }>
}

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
    const safe = query.replace(/[,()]/g, ' ').replace(/[%_\\]/g, '\\$&').trim()
    q = q.or(`title.ilike.%${safe}%,description.ilike.%${safe}%,composer.ilike.%${safe}%,arranger.ilike.%${safe}%,lyrics.ilike.%${safe}%`)
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
    if (query)    ps.set('q', query)
    if (category) ps.set('category', category)
    if (season)   ps.set('season', season)
    if (voicing)  ps.set('voice', voicing)
    if (sort !== 'newest') ps.set('sort', sort)
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

const CATEGORY_SHOWCASE = [
  { tag: 'Entrance',          label: 'Entrance Hymns',   icon: DoorOpen },
  { tag: 'Offertory',         label: 'Offertory Hymns',  icon: Gift },
  { tag: 'Communion',         label: 'Communion Hymns',  icon: Coffee },
  { tag: 'Recessional',       label: 'Recessional',      icon: ArrowRightCircle },
  { tag: 'Marian Hymns',      label: 'Marian Hymns',     icon: Heart },
  { tag: 'Praise & Worship',  label: 'Praise & Worship', icon: Music2 },
  { tag: 'Wedding',           label: 'Weddings',         icon: Sparkles },
  { tag: 'Funeral / Requiem', label: 'Requiem',          icon: Church },
]

async function CategoryShowcase() {
  const supabase = await createClient()

  const counts = await Promise.all(
    CATEGORY_SHOWCASE.map(c =>
      supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true)
        .contains('tags', [c.tag])
    )
  )

  const items = CATEGORY_SHOWCASE.map((c, i) => ({ ...c, count: counts[i].count ?? 0 }))
  if (items.every(i => i.count === 0)) return null

  return (
    <section className="bg-white border-b border-[#D7CCC8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2723]">Explore by Category</h2>
            <p className="text-sm text-[#8D6E63] mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
              Find music by where and how it&apos;s sung.
            </p>
          </div>
          <Link href="/browse" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#5D4037] hover:text-[#3E2723] transition-colors flex-shrink-0" style={{ fontFamily: 'var(--font-ui)' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {items.map(({ tag, label, icon: Icon, count }) => (
            <Link
              key={tag}
              href={`/?category=${encodeURIComponent(tag)}`}
              className="group flex items-center gap-3 p-4 rounded-xl border border-[#EFE9E7] hover:border-[#D7CCC8] hover:shadow-[var(--shadow-card)] transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#FBF8F6] flex items-center justify-center text-[#8D6E63] group-hover:bg-[#3E2723] group-hover:text-[#F5F5F5] transition-colors shrink-0">
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#3E2723] truncate" style={{ fontFamily: 'var(--font-ui)' }}>{label}</p>
                <p className="text-xs text-[#B09080]" style={{ fontFamily: 'var(--font-ui)' }}>{count} score{count !== 1 ? 's' : ''}</p>
              </div>
            </Link>
          ))}
        </div>

        <Link href="/browse" className="sm:hidden mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#5D4037]" style={{ fontFamily: 'var(--font-ui)' }}>
          View all categories <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  )
}

const selectClass =
  'w-full h-11 pl-3 pr-8 rounded-lg border border-[#EFE9E7] bg-[#FBF8F6] ' +
  'text-sm text-[#3E2723] outline-none appearance-none cursor-pointer ' +
  'focus:border-[#8D6E63] transition-colors'

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B09080]">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Signature hero visual — a spinning vinyl record with a resting tonearm
// and category tags gently rising around it, like notes lifting off the
// grooves. Pure CSS/decoration: no DB dependency, no empty-state to worry
// about, and it can't overflow into the search bar the way real content
// tiles could.
const VINYL_TAGS: { label: string; left: string; top: string; dx: string; delay: string; dur: string }[] = [
  { label: 'Hymns',      left: '60%', top: '4%',  dx: '18px',  delay: '-1s',  dur: '12s' },
  { label: 'SATB',       left: '6%',  top: '10%', dx: '-20px', delay: '-3.5s', dur: '12.5s' },
  { label: 'Mass Parts', left: '72%', top: '45%', dx: '26px',  delay: '-8s',  dur: '13s' },
  { label: 'Requiem',    left: '-2%', top: '63%', dx: '-18px', delay: '-10s', dur: '13.5s' },
  { label: 'Worship',    left: '66%', top: '72%', dx: '20px',  delay: '-6s',  dur: '12s' },
]

function VinylPlayer() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
      <div className="relative aspect-square rounded-[34px] bg-[#FBF8F6] border border-[#EFE9E7] shadow-[var(--shadow-lift)] p-[8.5%] flex items-center">
        {/* record */}
        <div
          className="relative w-[80%] aspect-square rounded-full overflow-hidden"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(62,39,35,0.12), var(--shadow-lift)' }}
        >
          <div
            className="vinyl-spin absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              background: 'repeating-radial-gradient(circle at 50% 50%, #2A2019 0 1px, #1C140F 1px 3.5px)',
              animation: 'vinylSpin 9s linear infinite',
            }}
          >
            <div
              className="w-[35%] aspect-square rounded-full flex flex-col items-center justify-center gap-1"
              style={{ background: 'linear-gradient(145deg, #8D6E63, #5D4037)', boxShadow: 'inset 0 0 0 1px rgba(245,245,245,0.22)' }}
            >
              <span className="text-[11px] font-semibold text-[#F5F5F5]" style={{ fontFamily: 'var(--font-display)' }}>
                Faith<em className="font-normal not-italic opacity-70">Library</em>
              </span>
              <span className="text-[7.5px] tracking-[0.16em] text-[#F5F5F5]/60">33 ⅓</span>
            </div>
          </div>
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: 'linear-gradient(118deg, rgba(255,255,255,0.10) 0 20%, rgba(255,255,255,0.02) 34%, transparent 46%)' }}
          />
          <div className="absolute top-1/2 left-1/2 w-[7px] h-[7px] -mt-[3.5px] -ml-[3.5px] rounded-full bg-[#FBF8F6]" />
        </div>

        {/* power indicator */}
        <div className="absolute top-[11%] right-[9%] w-[34px] h-[34px] rounded-full bg-white border border-[#EFE9E7] shadow-[var(--shadow-card)] flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-[#8D6E63]" />
        </div>

        {/* tonearm */}
        <div
          className="vinyl-arm absolute"
          style={{
            top: 'calc(11% + 14px)', right: 'calc(9% + 17px)', width: '52%', height: 6,
            transformOrigin: '100% 50%', animation: 'vinylArm 16s ease-in-out infinite',
          }}
        >
          <div className="absolute inset-0 rounded-full bg-[#D7CCC8] shadow-[var(--shadow-card)]" />
          <div className="absolute -left-1.5 -top-1.5 w-[30px] h-[18px] rounded-md bg-[#5D4037]" />
          <div className="absolute -left-0.5 top-3 w-[2px] h-[7px] rounded-full bg-[#5D4037]" />
        </div>

        {/* eq / volume controls */}
        <div className="absolute right-[9%] bottom-[11%] flex flex-col items-center gap-3">
          <div className="w-[30px] h-[30px] rounded-full bg-white border border-[#EFE9E7] shadow-[var(--shadow-card)] flex items-start justify-center pt-1">
            <span className="w-[2px] h-[9px] rounded-full bg-[#8D6E63]" />
          </div>
          <div className="w-[30px] h-3 rounded-full bg-[#F0E4DA] border border-[#EFE9E7] flex items-center px-0.5">
            <span className="w-2 h-2 rounded-full bg-[#D7CCC8]" />
          </div>
        </div>
      </div>

      {/* rising category tags */}
      {VINYL_TAGS.map(tag => {
        const style = {
          left: tag.left, top: tag.top,
          animation: `vinylRise ${tag.dur} ease-in-out infinite`,
          animationDelay: tag.delay,
          '--dx': tag.dx,
        } as CSSProperties
        return (
          <span
            key={tag.label}
            className="vinyl-rise absolute whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-[#EFE9E7] shadow-[var(--shadow-card)] text-[11px] tracking-wide text-[#5D4037]"
            style={style}
          >
            {tag.label}
          </span>
        )
      })}
    </div>
  )
}

export default async function HomePage({ searchParams }: HomeProps) {
  const params   = await searchParams
  const query    = params.q
  const category = params.category
  const season   = params.season
  const voicing  = params.voice
  const sort     = params.sort ?? 'newest'
  const page     = Math.max(1, parseInt(params.page ?? '1', 10))
  const showHero = !query && !category && !season && !voicing && page === 1

  return (
    <div className="min-h-screen grain">
      <Navbar />

      {showHero && (
        <section
          className="relative pt-[86px] pb-14 lg:min-h-screen lg:flex lg:items-center lg:pt-[58px] lg:pb-10 px-4 sm:px-6"
          style={{ background: '#FBF8F6' }}
        >
          <div className="max-w-6xl mx-auto lg:flex lg:items-center lg:gap-10 w-full">
            <div className="max-w-xl">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0E4DA] border border-[#D7CCC8]/70 text-[#5D4037] font-medium mb-6 animate-fade-in max-w-full"
                style={{ fontFamily: 'var(--font-ui)', letterSpacing: '0.01em', fontSize: '13px' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#8D6E63] animate-pulse shrink-0" />
                <span className="truncate sm:whitespace-normal">Sacred music commons — free forever</span>
              </div>

              <h1 className="font-display font-bold text-[#3E2723] mb-4 animate-fade-up delay-100">
                <span
                  className="block"
                  style={{ fontSize: 'clamp(32px, 3.6vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}
                >
                  Every choir has a library.
                </span>
                <span
                  className="block text-[#8D6E63] mt-1"
                  style={{ fontSize: 'clamp(24px, 2.7vw, 38px)', lineHeight: 1.15, letterSpacing: '-0.015em', fontWeight: 400 }}
                >
                  Most just can&apos;t find it.
                </span>
              </h1>

              <p
                className="text-[#6B5A52] max-w-xl mb-3 animate-fade-up delay-150"
                style={{ fontFamily: 'var(--font-ui)', fontSize: 'clamp(15px, 1.25vw, 17.5px)', lineHeight: 1.62 }}
              >
                Search thousands of hymns, Mass parts, and choral scores by title, composer, or the words your choir already sings.
              </p>

              {/* Search — its own card, with the "remembered lyrics" tip
                  folded in underneath rather than floating separately. */}
              <form action="/" method="GET" className="w-full mt-6 animate-fade-up delay-200">
                <div className="bg-white border border-[#D7CCC8] rounded-3xl shadow-[var(--shadow-card)] p-2 focus-within:border-[#5D4037] transition-colors">
                  <div className="flex items-center gap-2 pl-3">
                    <Search size={16} className="text-[#8D6E63] shrink-0" />
                    <input
                      type="text"
                      name="q"
                      placeholder="Search a title, composer, or words you remember…"
                      className="flex-1 min-w-0 bg-transparent text-[#3E2723] placeholder:text-[#B09080] outline-none py-3"
                      style={{ fontFamily: 'var(--font-ui)', fontSize: '16.5px' }}
                    />
                    <button
                      type="submit"
                      className="shrink-0 bg-[#3E2723] hover:bg-[#5D4037] text-[#F5F5F5] font-semibold px-5 py-2.5 rounded-2xl transition-colors"
                      style={{ fontFamily: 'var(--font-ui)', fontSize: '15px' }}
                    >
                      Search
                    </button>
                  </div>
                  <div
                    className="flex items-center gap-2 mt-1.5 px-3.5 py-2.5 rounded-2xl bg-[#F0E4DA] text-[#8A6224] font-medium"
                    style={{ fontSize: '13.5px' }}
                  >
                    <Sparkles size={13} className="shrink-0" />
                    Can&apos;t recall the title? Type any words you remember from the lyrics.
                  </div>
                </div>
              </form>
            </div>

            {/* Signature visual — a spinning record, standing in for the
                library itself: every choir's music, always on and ready. */}
            <div className="hidden lg:block flex-1 min-w-0">
              <VinylPlayer />
            </div>
          </div>
        </section>
      )}

      {showHero && (
        <section className="relative px-4 sm:px-6 py-10" style={{ background: '#FBF8F6' }}>
          <div className="max-w-6xl mx-auto animate-fade-up delay-200">
            <form action="/" method="GET" className="bg-white border border-[#EFE9E7] rounded-2xl p-5 shadow-[var(--shadow-card)]">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                  <div>
                    <label htmlFor="h-category" className="block text-[0.68rem] font-bold uppercase tracking-wider text-[#B09080] mb-1.5">Category</label>
                    <div className="relative">
                      <select id="h-category" name="category" defaultValue="" className={selectClass}>
                        <option value="">All Categories</option>
                        {CATEGORY_GROUPS.map(group => (
                          <optgroup key={group.label} label={group.label}>
                            {group.tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      <ChevronDownIcon />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="h-season" className="block text-[0.68rem] font-bold uppercase tracking-wider text-[#B09080] mb-1.5">Season</label>
                    <div className="relative">
                      <select id="h-season" name="season" defaultValue="" className={selectClass}>
                        <option value="">All Seasons</option>
                        {LITURGICAL_SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDownIcon />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="h-voice" className="block text-[0.68rem] font-bold uppercase tracking-wider text-[#B09080] mb-1.5">Voicing</label>
                    <div className="relative">
                      <select id="h-voice" name="voice" defaultValue="" className={selectClass}>
                        <option value="">All Voicings</option>
                        {VOICING_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <ChevronDownIcon />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="h-sort" className="block text-[0.68rem] font-bold uppercase tracking-wider text-[#B09080] mb-1.5">Sort By</label>
                    <div className="relative">
                      <select id="h-sort" name="sort" defaultValue="newest" className={selectClass}>
                        {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <ChevronDownIcon />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="h-11 flex items-center justify-center gap-2 bg-[#3E2723] hover:bg-[#5D4037] text-[#F5F5F5] text-sm font-semibold rounded-lg transition-colors col-span-2 sm:col-span-4 lg:col-span-1"
                  >
                    <SlidersHorizontal size={15} /> Apply
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-[#EFE9E7]">
                  <Suspense fallback={<div className="h-4 w-24 bg-[#EFE9E7] rounded animate-pulse" />}>
                    <LibraryCount />
                  </Suspense>
                  <div className="flex items-center gap-4">
                    <Link href="/browse" className="text-xs sm:text-sm font-semibold text-[#5D4037] hover:text-[#3E2723] transition-colors flex items-center gap-1">
                      <BookOpen size={13} /> Browse all
                    </Link>
                    <Link href="/signup" className="text-xs sm:text-sm font-semibold text-[#5D4037] hover:text-[#3E2723] transition-colors flex items-center gap-1">
                      <Upload size={13} /> Upload a score
                    </Link>
                  </div>
                </div>
              </form>
          </div>
        </section>
      )}

      {showHero && <Suspense fallback={null}><CategoryShowcase /></Suspense>}

      {/* how-it-works removed */}

      {showHero && <Suspense fallback={null}><FeaturedScores /></Suspense>}
      {showHero && <Suspense fallback={null}><ScoreOfWeek /></Suspense>}

      {!showHero && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
          {query ? (
            <>
              <p className="text-sm text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>Showing results for</p>
              <h2 className="font-display text-2xl text-[#3E2723] mb-1">&quot;{query}&quot;</h2>
            </>
          ) : (
            <h2 className="font-display text-2xl text-[#3E2723] mb-1">Filtered Results</h2>
          )}

          {(category || season || voicing) && (
            <div className="flex flex-wrap items-center gap-2 mt-2 mb-1">
              {category && <ActiveFilterChip label={category} clearHref={buildClearHref({ query, season, voicing, sort })} />}
              {season   && <ActiveFilterChip label={season}   clearHref={buildClearHref({ query, category, voicing, sort })} />}
              {voicing  && <ActiveFilterChip label={voicing}  clearHref={buildClearHref({ query, category, season, sort })} />}
            </div>
          )}

          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#8D6E63] hover:text-[#5D4037] transition-colors mt-2" style={{ fontFamily: 'var(--font-ui)' }}>
            ← Back to home
          </Link>
        </div>
      )}

      <main id="library" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {showHero && (
          <div className="flex items-center justify-between gap-4 mb-8">
            <h2 className="font-display text-lg font-semibold text-[#3E2723]">Latest Additions</h2>
            <Link href="/browse" className="btn btn-secondary btn-sm">View all <ArrowRight size={13} /></Link>
          </div>
        )}

        <Suspense
          key={`${query ?? ''}-${category ?? ''}-${season ?? ''}-${voicing ?? ''}-${sort}-${page}`}
          fallback={
            <div className="score-grid">
              {[...Array(10)].map((_, i) => <ScoreCardSkeleton key={i} index={i} />)}
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

function buildClearHref(kept: { query?: string; category?: string; season?: string; voicing?: string; sort: string }) {
  const params = new URLSearchParams()
  if (kept.query)    params.set('q', kept.query)
  if (kept.category) params.set('category', kept.category)
  if (kept.season)   params.set('season', kept.season)
  if (kept.voicing)  params.set('voice', kept.voicing)
  if (kept.sort !== 'newest') params.set('sort', kept.sort)
  return `/${params.toString() ? '?' + params : ''}`
}

function ActiveFilterChip({ label, clearHref }: { label: string; clearHref: string }) {
  return (
    <Link
      href={clearHref}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0E4DA] border border-[#D7CCC8] text-xs font-medium text-[#5D4037] hover:border-[#8D6E63] transition-colors"
    >
      {label} <span className="opacity-60">✕</span>
    </Link>
  )
}

async function LibraryCount() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('files')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true)

  return (
    <p className="text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
      <span className="font-bold text-[#3E2723]">{count ?? 0}+</span>{' '}
      <span className="text-[#8D6E63]">scores in the library</span>
    </p>
  )
}