// components/BrowseControls.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, X, SlidersHorizontal, Check } from 'lucide-react'
import { TAG_GROUPS } from '@/lib/categories'

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest first' },
  { value: 'downloads', label: 'Most downloaded' },
  { value: 'az',        label: 'A → Z' },
  { value: 'za',        label: 'Z → A' },
]

interface BrowseControlsProps {
  query?:      string
  activeTags:  string[]
  activeSort:  string
}

export function BrowseControls({ query, activeTags, activeSort }: BrowseControlsProps) {
  const router = useRouter()

  const [searchVal,    setSearchVal]    = useState(query ?? '')
  const [sortOpen,     setSortOpen]     = useState(false)
  const [filterOpen,   setFilterOpen]   = useState(false)
  const [tagSearch,    setTagSearch]    = useState('')

  const sortRef   = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const push = (overrides: {
    q?: string; tags?: string[]; sort?: string
  }) => {
    const params = new URLSearchParams()
    const q    = 'q'    in overrides ? overrides.q    : query
    const tags = 'tags' in overrides ? overrides.tags : activeTags
    const sort = 'sort' in overrides ? overrides.sort : activeSort

    if (q) params.set('q', q)
    tags?.forEach(t => params.append('tag', t))
    if (sort && sort !== 'newest') params.set('sort', sort)
    router.push(`/browse${params.toString() ? '?' + params : ''}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    push({ q: searchVal.trim() || undefined })
  }

  const toggleTag = (tag: string) => {
    const next = activeTags.includes(tag)
      ? activeTags.filter(t => t !== tag)
      : [...activeTags, tag]
    push({ tags: next })
  }

  const clearTag = (tag: string) => push({ tags: activeTags.filter(t => t !== tag) })

  const filteredGroups = TAG_GROUPS.map(g => ({
    ...g,
    tags: g.tags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())),
  })).filter(g => g.tags.length > 0)

  const sortLabel = SORT_OPTIONS.find(o => o.value === activeSort)?.label ?? 'Newest first'

  return (
    <div className="space-y-3">
      {/* Row 1: search + sort + filter */}
      <div className="flex flex-col sm:flex-row gap-2.5">

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D6E63]" />
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Search titles, descriptions…"
              className="input pl-9 pr-4 h-10"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm flex-shrink-0">
            Search
          </button>
          {query && (
            <button type="button" onClick={() => { setSearchVal(''); push({ q: undefined }) }}
              className="btn btn-secondary btn-sm flex-shrink-0">
              <X size={13} />
            </button>
          )}
        </form>

        {/* Sort */}
        <div ref={sortRef} className="relative flex-shrink-0">
          <button
            onClick={() => setSortOpen(v => !v)}
            className="btn btn-secondary h-10 gap-1.5 whitespace-nowrap"
            style={{ padding: '0 1rem', fontSize: '0.8125rem' }}
          >
            {sortLabel}
            <ChevronDown size={13} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 z-50
                            bg-white border border-[#D7CCC8] rounded-xl
                            shadow-lift overflow-hidden animate-scale-in">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => { push({ sort: opt.value }); setSortOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center
                              justify-between transition-colors ${
                    activeSort === opt.value
                      ? 'bg-[#EFE9E7] text-[#5D4037] font-medium'
                      : 'text-[#3E2723] hover:bg-[#F5F5F5]'
                  }`}>
                  {opt.label}
                  {activeSort === opt.value && <Check size={13} className="text-[#5D4037]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter */}
        <div ref={filterRef} className="relative flex-shrink-0">
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`btn h-10 gap-1.5 whitespace-nowrap ${
              activeTags.length > 0 ? 'btn-primary' : 'btn-secondary'
            }`}
            style={{ padding: '0 1rem', fontSize: '0.8125rem' }}
          >
            <SlidersHorizontal size={13} />
            Filter
            {activeTags.length > 0 && (
              <span className="ml-0.5 w-5 h-5 rounded-full bg-white/20
                               text-xs flex items-center justify-center font-semibold">
                {activeTags.length}
              </span>
            )}
            <ChevronDown size={13} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 z-50
                            bg-white border border-[#D7CCC8] rounded-xl
                            shadow-lift animate-scale-in overflow-hidden"
              style={{ maxHeight: '380px', display: 'flex', flexDirection: 'column' }}>

              {/* Tag search */}
              <div className="px-3 pt-3 pb-2 border-b border-[#EFE9E7] flex-shrink-0">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8D6E63]" />
                  <input
                    autoFocus
                    value={tagSearch}
                    onChange={e => setTagSearch(e.target.value)}
                    placeholder="Search categories…"
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-[#F5F5F5] border border-[#D7CCC8]
                               rounded-lg focus:outline-none focus:border-[#5D4037] text-[#3E2723]"
                  />
                </div>
              </div>

              {/* Groups */}
              <div className="overflow-y-auto flex-1 py-1">
                {filteredGroups.map(group => (
                  <div key={group.label}>
                    <p className="px-3 pt-2.5 pb-0.5 text-[0.62rem] font-bold uppercase
                                  tracking-widest text-[#8D6E63]/60">
                      {group.label}
                    </p>
                    {group.tags.map(tag => {
                      const on = activeTags.includes(tag)
                      return (
                        <button key={tag} onClick={() => toggleTag(tag)}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center
                                      justify-between gap-2 transition-colors ${
                            on ? 'bg-[#EFE9E7] text-[#5D4037] font-medium'
                               : 'text-[#3E2723] hover:bg-[#F5F5F5]'
                          }`}>
                          <span>{tag}</span>
                          {on && <Check size={12} className="text-[#5D4037] flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Footer */}
              {activeTags.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2
                                border-t border-[#EFE9E7] bg-[#F5F5F5] flex-shrink-0">
                  <span className="text-xs text-[#8D6E63]">{activeTags.length} active</span>
                  <button onClick={() => push({ tags: [] })}
                    className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: active tag pills */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-[#8D6E63] mr-1">Filtered by:</span>
          {activeTags.map(tag => (
            <button key={tag} onClick={() => clearTag(tag)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                         bg-[#EFE9E7] border border-[#D7CCC8] text-[#5D4037]
                         hover:border-red-300 hover:text-red-500 transition-all">
              {tag} <X size={10} />
            </button>
          ))}
          {activeTags.length > 1 && (
            <button onClick={() => push({ tags: [] })}
              className="text-xs text-[#8D6E63] hover:text-red-500 px-2 py-1
                         rounded-lg hover:bg-red-50 transition-all">
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}