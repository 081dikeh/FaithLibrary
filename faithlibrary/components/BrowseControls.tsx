// components/BrowseControls.tsx
import Link from 'next/link'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { TAG_GROUPS, LITURGICAL_SEASONS } from '@/lib/categories'

const VOICING_OPTIONS = ['SATB', 'SATB divisi', 'SAB', 'SSA', 'SSAA', 'TTBB', 'TB', 'Unison', 'Descant']

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest first' },
  { value: 'downloads', label: 'Most downloaded' },
  { value: 'az',        label: 'Title A → Z' },
  { value: 'za',        label: 'Title Z → A' },
]

// Category groups, minus Liturgical Seasons — that gets its own dropdown
const CATEGORY_GROUPS = TAG_GROUPS.filter(g => g.label !== 'Liturgical Seasons')

interface BrowseControlsProps {
  query?:      string
  category?:   string
  season?:     string
  voicing?:    string
  activeSort:  string
}

const selectClass =
  'w-full h-11 pl-3 pr-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] ' +
  'text-sm text-[var(--text-primary)] outline-none appearance-none cursor-pointer ' +
  'focus:border-[var(--walnut)] transition-colors'

const selectWrapClass = 'relative'

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]"
    >
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BrowseControls({ query, category, season, voicing, activeSort }: BrowseControlsProps) {
  const hasActiveFilter = !!(category || season || voicing)

  return (
    <div className="flex flex-col gap-4">
      {/* Search row — its own card, its own submit */}
      <form action="/browse" method="GET">
        {/* preserve current filters when searching */}
        {category && <input type="hidden" name="category" value={category} />}
        {season   && <input type="hidden" name="season"   value={season} />}
        {voicing  && <input type="hidden" name="voice"     value={voicing} />}
        {activeSort !== 'newest' && <input type="hidden" name="sort" value={activeSort} />}

        <div
          className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-full p-1.5 pl-5 shadow-[var(--shadow-card)] focus-within:border-[var(--walnut)] transition-colors"
        >
          <Search size={16} className="text-[var(--ochre)] shrink-0" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by title, composer, or lyrics…"
            className="flex-1 min-w-0 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none py-2.5"
            style={{ fontFamily: 'var(--font-ui)' }}
          />
          <button
            type="submit"
            className="shrink-0 bg-[var(--walnut)] hover:bg-[var(--roasted)] text-[var(--bone)] text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Filter bar — its own card, its own submit */}
      <form
        action="/browse"
        method="GET"
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-card)]"
      >
        {query && <input type="hidden" name="q" value={query} />}

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label htmlFor="category" className="block text-[0.68rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Category
            </label>
            <div className={selectWrapClass}>
              <select id="category" name="category" defaultValue={category ?? ''} className={selectClass}>
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
            <label htmlFor="season" className="block text-[0.68rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Season
            </label>
            <div className={selectWrapClass}>
              <select id="season" name="season" defaultValue={season ?? ''} className={selectClass}>
                <option value="">All Seasons</option>
                {LITURGICAL_SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDownIcon />
            </div>
          </div>

          <div>
            <label htmlFor="voice" className="block text-[0.68rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Voicing
            </label>
            <div className={selectWrapClass}>
              <select id="voice" name="voice" defaultValue={voicing ?? ''} className={selectClass}>
                <option value="">All Voicings</option>
                {VOICING_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <ChevronDownIcon />
            </div>
          </div>

          <div>
            <label htmlFor="sort" className="block text-[0.68rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Sort By
            </label>
            <div className={selectWrapClass}>
              <select id="sort" name="sort" defaultValue={activeSort} className={selectClass}>
                {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <ChevronDownIcon />
            </div>
          </div>

          <button
            type="submit"
            className="h-11 flex items-center justify-center gap-2 bg-[var(--roasted)] hover:bg-[var(--walnut)] text-[var(--bone)] text-sm font-semibold rounded-lg transition-colors col-span-2 sm:col-span-4 lg:col-span-1"
          >
            <SlidersHorizontal size={15} /> Apply
          </button>
        </div>

        {hasActiveFilter && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--text-muted)]">Filtered by:</span>
            {category && <FilterPill label={category} clearHref={buildClearHref({ query, season, voicing, sort: activeSort })} />}
            {season   && <FilterPill label={season}   clearHref={buildClearHref({ query, category, voicing, sort: activeSort })} />}
            {voicing  && <FilterPill label={voicing}  clearHref={buildClearHref({ query, category, season, sort: activeSort })} />}
            <Link href="/browse" className="text-xs text-[var(--ochre)] hover:text-[var(--walnut)] font-medium ml-1">
              Clear all
            </Link>
          </div>
        )}
      </form>
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
  return `/browse${params.toString() ? '?' + params : ''}`
}

function FilterPill({ label, clearHref }: { label: string; clearHref: string }) {
  return (
    <Link
      href={clearHref}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-3)] border border-[var(--border)] text-xs font-medium text-[var(--walnut)] hover:border-[var(--walnut)] transition-colors"
    >
      {label} <X size={10} className="opacity-70" />
    </Link>
  )
}