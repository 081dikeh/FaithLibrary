// components/TagDropdown.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'
import { TAG_GROUPS } from '@/lib/categories'

interface TagDropdownProps {
  selected:    string[]
  onChange:    (tags: string[]) => void
  placeholder?: string
}

export function TagDropdown({ selected, onChange, placeholder = 'Select categories & tags…' }: TagDropdownProps) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const containerRef        = useRef<HTMLDivElement>(null)
  const searchRef           = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60)
  }, [open])

  const toggleTag = (tag: string) => {
    onChange(
      selected.includes(tag)
        ? selected.filter(t => t !== tag)
        : [...selected, tag]
    )
  }

  const removeTag = (tag: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    onChange(selected.filter(t => t !== tag))
  }

  const filteredGroups = TAG_GROUPS
    .map(g => ({ ...g, tags: g.tags.filter(t => t.toLowerCase().includes(search.toLowerCase())) }))
    .filter(g => g.tags.length > 0)

  return (
    <div ref={containerRef} className="relative w-full">

      {/* ── Trigger — div acting as button, NO nested buttons inside ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(v => !v) } }}
        className="input text-left flex items-start gap-2 min-h-[44px] h-auto py-2 cursor-pointer select-none"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <div className="flex-1 flex flex-wrap gap-1.5 min-h-[22px]">
          {selected.length === 0 ? (
            <span className="text-[#8D6E63] opacity-65 text-sm self-center">
              {placeholder}
            </span>
          ) : (
            selected.map(tag => (
              /* ── Tag pill — span, not button ── */
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                           bg-[#EFE9E7] border border-[#D7CCC8] text-[#5D4037]
                           text-xs font-medium leading-none"
              >
                {tag}
                {/* ── Remove — span with role=button, NOT a <button> ── */}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${tag}`}
                  onClick={e => removeTag(tag, e)}
                  onKeyDown={e => { if (e.key === 'Enter') removeTag(tag, e) }}
                  className="flex-shrink-0 ml-0.5 cursor-pointer hover:text-red-500 transition-colors"
                >
                  <X size={9} />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={15}
          className={`text-[#8D6E63] flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white
                     border border-[#D7CCC8] rounded-xl
                     shadow-[0_8px_32px_rgba(62,39,35,0.14)]
                     animate-scale-in overflow-hidden"
          style={{ maxHeight: '340px', display: 'flex', flexDirection: 'column' }}
        >
          {/* Search */}
          <div className="px-3 pt-3 pb-2 border-b border-[#EFE9E7] flex-shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8D6E63]" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tags…"
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-[#F5F5F5] border border-[#D7CCC8]
                           rounded-lg focus:outline-none focus:border-[#5D4037] transition-colors
                           text-[#3E2723] placeholder-[#8D6E63]"
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Tag groups — each item is a div, not a button */}
          <div className="overflow-y-auto flex-1 py-1">
            {filteredGroups.length === 0 ? (
              <p className="text-center text-xs text-[#8D6E63] py-6">No tags found</p>
            ) : (
              filteredGroups.map(group => (
                <div key={group.label}>
                  <p className="px-3 pt-3 pb-1 text-[0.65rem] font-bold uppercase
                                tracking-widest text-[#8D6E63]/70">
                    {group.label}
                  </p>
                  {group.tags.map(tag => {
                    const isSelected = selected.includes(tag)
                    return (
                      <div
                        key={tag}
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={0}
                        onClick={() => toggleTag(tag)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTag(tag) } }}
                        className={`px-3 py-2 text-sm flex items-center justify-between gap-2
                                    cursor-pointer transition-colors duration-100 ${
                          isSelected
                            ? 'bg-[#EFE9E7] text-[#5D4037] font-medium'
                            : 'text-[#3E2723] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        <span>{tag}</span>
                        {isSelected && <Check size={13} className="text-[#5D4037] flex-shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2
                            border-t border-[#EFE9E7] flex-shrink-0 bg-[#F5F5F5]">
              <span className="text-xs text-[#8D6E63]">{selected.length} selected</span>
              <span
                role="button"
                tabIndex={0}
                onClick={() => onChange([])}
                onKeyDown={e => { if (e.key === 'Enter') onChange([]) }}
                className="text-xs text-[#8D6E63] hover:text-red-500 font-medium
                           transition-colors cursor-pointer"
              >
                Clear all
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}