// components/CategoryFilter.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Search, X, Check, SlidersHorizontal } from 'lucide-react'
import { TAG_GROUPS, ALL_TAGS } from '@/lib/categories'

interface CategoryFilterProps {
  active: string[]
  query?: string
}

export function CategoryFilter({ active, query }: CategoryFilterProps) {
  const router       = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleTag = (tag: string) => {
    const next = active.includes(tag)
      ? active.filter(t => t !== tag)
      : [...active, tag]
    pushFilters(next)
  }

  const clearAll = () => pushFilters([])

  const pushFilters = (tags: string[]) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    tags.forEach(t => params.append('tag', t))
    router.push(tags.length || query ? `/?${params}` : '/')
  }

  const filtered = TAG_GROUPS.map(g => ({
    ...g,
    tags: g.tags.filter(t => t.toLowerCase().includes(search.toLowerCase())),
  })).filter(g => g.tags.length > 0)

  return (
    <div className="flex items-start gap-3 flex-wrap">

      {/* ── Filter button + dropdown ── */}
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm
                      font-medium transition-all duration-200 ${
            active.length > 0
              ? 'bg-[#5D4037] text-white border-[#5D4037]'
              : 'bg-white text-[#8D6E63] border-[#D7CCC8] hover:border-[#8D6E63] hover:text-[#5D4037]'
          }`}
        >
          <SlidersHorizontal size={14} />
          Filter
          {active.length > 0 && (
            <span className="ml-0.5 w-5 h-5 rounded-full bg-white/20 text-white
                             text-xs flex items-center justify-center font-semibold">
              {active.length}
            </span>
          )}
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1.5 z-50 w-72
                          bg-white border border-[#D7CCC8] rounded-xl
                          shadow-[0_8px_32px_rgba(62,39,35,0.14)]
                          animate-scale-in overflow-hidden"
            style={{maxHeight:'360px', display:'flex', flexDirection:'column'}}
          >
            {/* Search */}
            <div className="px-3 pt-3 pb-2 border-b border-[#EFE9E7] flex-shrink-0">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8D6E63]" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search categories…"
                  className="w-full pl-7 pr-3 py-1.5 text-xs bg-[#F5F5F5] border border-[#D7CCC8]
                             rounded-lg focus:outline-none focus:border-[#5D4037]
                             text-[#3E2723] placeholder-[#8D6E63]"
                />
              </div>
            </div>

            {/* Groups */}
            <div className="overflow-y-auto flex-1 py-1">
              {filtered.map(group => (
                <div key={group.label}>
                  <p className="px-3 pt-2.5 pb-0.5 text-[0.62rem] font-bold uppercase
                                tracking-widest text-[#8D6E63]/60">
                    {group.label}
                  </p>
                  {group.tags.map(tag => {
                    const on = active.includes(tag)
                    return (
                      <button key={tag} onClick={() => toggleTag(tag)}
                        className={`w-full text-left px-3 py-1.5 text-sm flex items-center
                                    justify-between gap-2 transition-colors ${
                          on ? 'bg-[#EFE9E7] text-[#5D4037] font-medium'
                             : 'text-[#3E2723] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        <span>{tag}</span>
                        {on && <Check size={12} className="text-[#5D4037]" />}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {active.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2
                              border-t border-[#EFE9E7] bg-[#F5F5F5] flex-shrink-0">
                <span className="text-xs text-[#8D6E63]">{active.length} active</span>
                <button onClick={clearAll}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Active tag pills ── */}
      {active.map(tag => (
        <button key={tag} onClick={() => toggleTag(tag)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                     bg-[#EFE9E7] border border-[#D7CCC8] text-[#5D4037]
                     hover:border-red-300 hover:text-red-500 transition-all">
          {tag}
          <X size={10} />
        </button>
      ))}

      {active.length > 1 && (
        <button onClick={clearAll}
          className="text-xs text-[#8D6E63] hover:text-red-500 transition-colors
                     px-2 py-1.5 rounded-xl hover:bg-red-50">
          Clear all
        </button>
      )}
    </div>
  )
}