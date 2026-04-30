// components/TagDropdown.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'
import { TAG_GROUPS } from '@/lib/categories'

interface TagDropdownProps {
  selected: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxSelect?: number
}

export function TagDropdown({
  selected,
  onChange,
  placeholder = 'Select categories & tags…',
  maxSelect,
}: TagDropdownProps) {
  const [open, setOpen]         = useState(false)
  const [search, setSearch]     = useState('')
  const containerRef            = useRef<HTMLDivElement>(null)
  const searchRef               = useRef<HTMLInputElement>(null)

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
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag))
    } else {
      if (maxSelect && selected.length >= maxSelect) return
      onChange([...selected, tag])
    }
  }

  const removeTag = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter(t => t !== tag))
  }

  const filteredGroups = TAG_GROUPS.map(group => ({
    ...group,
    tags: group.tags.filter(t =>
      t.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(g => g.tags.length > 0)

  return (
    <div ref={containerRef} className="relative w-full">

      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="input text-left flex items-start gap-2 min-h-[42px] h-auto py-2"
        style={{cursor:'pointer'}}
      >
        <div className="flex-1 flex flex-wrap gap-1.5 min-h-[22px]">
          {selected.length === 0 ? (
            <span className="text-[#8D6E63] opacity-65 text-sm self-center">{placeholder}</span>
          ) : (
            selected.map(tag => (
              <span key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                           bg-[#EFE9E7] border border-[#D7CCC8] text-[#5D4037]
                           text-xs font-medium leading-none"
              >
                {tag}
                <button
                  type="button"
                  onClick={e => removeTag(tag, e)}
                  className="hover:text-red-500 transition-colors flex-shrink-0 ml-0.5"
                >
                  <X size={9} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={15}
          className={`text-[#8D6E63] flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50
                        bg-white border border-[#D7CCC8] rounded-xl
                        shadow-[0_8px_32px_rgba(62,39,35,0.14)]
                        animate-scale-in overflow-hidden"
          style={{maxHeight:'340px', display:'flex', flexDirection:'column'}}
        >
          {/* Search inside dropdown */}
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
              />
            </div>
          </div>

          {/* Tag groups */}
          <div className="overflow-y-auto flex-1 py-1">
            {filteredGroups.length === 0 ? (
              <p className="text-center text-xs text-[#8D6E63] py-6">No tags found</p>
            ) : (
              filteredGroups.map(group => (
                <div key={group.label}>
                  {/* Group header */}
                  <p className="px-3 pt-3 pb-1 text-[0.65rem] font-bold uppercase
                                tracking-widest text-[#8D6E63]/70">
                    {group.label}
                  </p>
                  {group.tags.map(tag => {
                    const isSelected = selected.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center
                                    justify-between gap-2 transition-colors duration-100 ${
                          isSelected
                            ? 'bg-[#EFE9E7] text-[#5D4037] font-medium'
                            : 'text-[#3E2723] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        <span>{tag}</span>
                        {isSelected && (
                          <Check size={13} className="text-[#5D4037] flex-shrink-0" />
                        )}
                      </button>
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
              <span className="text-xs text-[#8D6E63]">
                {selected.length} selected
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-[#8D6E63] hover:text-red-500 font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}