// components/CommandSearch.tsx
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Music2, ArrowRight, X, Clock, Hash } from 'lucide-react'
import { ALL_TAGS } from '@/lib/categories'
import Link from 'next/link'

interface Result {
  id:       string
  title:    string
  composer: string | null
  tags:     string[]
}

export function CommandSearch() {
  const router   = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setSelected(0)
    }
  }, [open])

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('files')
        .select('id, title, composer, tags')
        .eq('is_public', true)
        .or(`title.ilike.%${query}%,composer.ilike.%${query}%,arranger.ilike.%${query}%`)
        .limit(6)
      setResults(data ?? [])
      setLoading(false)
    }, 220)
    return () => clearTimeout(timer)
  }, [query])

  // Tag suggestions
  const tagSuggestions = query.length > 1
    ? ALL_TAGS.filter(t => t.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : []

  const totalItems = results.length + tagSuggestions.length
  const allItems = [...results.map(r => ({ type: 'score' as const, data: r })),
                    ...tagSuggestions.map(t => ({ type: 'tag' as const, data: t }))]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, totalItems - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (allItems[selected]) {
        const item = allItems[selected]
        if (item.type === 'score') {
          router.push(`/view/${(item.data as Result).id}`)
        } else {
          router.push(`/?tag=${encodeURIComponent(item.data as string)}`)
        }
        setOpen(false)
      } else if (query.trim()) {
        router.push(`/?q=${encodeURIComponent(query.trim())}`)
        setOpen(false)
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#3E2723]/60 backdrop-blur-sm"
        onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl
                      border border-[#D7CCC8] overflow-hidden animate-scale-in">

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#EFE9E7]">
          <Search size={17} className="text-[#8D6E63] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search scores, composers, categories…"
            className="flex-1 text-sm text-[#3E2723] bg-transparent outline-none
                       placeholder-[#8D6E63]/60"
            style={{ fontFamily: 'var(--font-ui)' }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="btn-icon text-[#D7CCC8]" style={{ padding: '0.2rem' }}>
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
                          bg-[#EFE9E7] text-[#8D6E63] text-xs border border-[#D7CCC8]">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {/* Empty / initial state */}
          {!query && (
            <div className="px-4 py-6 text-center">
              <Search size={24} className="text-[#D7CCC8] mx-auto mb-2" />
              <p className="text-sm text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
                Type to search scores, composers, or categories
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="px-4 py-4">
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 skeleton rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 skeleton w-2/3" />
                      <div className="h-2.5 skeleton w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score results */}
          {!loading && results.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[0.65rem] font-bold uppercase
                            tracking-widest text-[#8D6E63]/60">
                Scores
              </p>
              {results.map((file, i) => (
                <Link key={file.id} href={`/view/${file.id}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    selected === i ? 'bg-[#EFE9E7]' : 'hover:bg-[#F5F5F5]'
                  }`}
                  onMouseEnter={() => setSelected(i)}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#EFE9E7] flex items-center
                                  justify-center text-[#5D4037] flex-shrink-0">
                    <Music2 size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#3E2723] truncate"
                      style={{ fontFamily: 'var(--font-ui)' }}>
                      {file.title}
                    </p>
                    <p className="text-xs text-[#8D6E63] truncate">
                      {[file.composer, file.tags?.[0]].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <ArrowRight size={13} className="text-[#D7CCC8] flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}

          {/* Tag suggestions */}
          {!loading && tagSuggestions.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[0.65rem] font-bold uppercase
                            tracking-widest text-[#8D6E63]/60">
                Categories
              </p>
              {tagSuggestions.map((tag, i) => {
                const idx = results.length + i
                return (
                  <Link key={tag}
                    href={`/?tag=${encodeURIComponent(tag)}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      selected === idx ? 'bg-[#EFE9E7]' : 'hover:bg-[#F5F5F5]'
                    }`}
                    onMouseEnter={() => setSelected(idx)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#EFE9E7] flex items-center
                                    justify-center text-[#8D6E63] flex-shrink-0">
                      <Hash size={14} />
                    </div>
                    <span className="text-sm text-[#3E2723]"
                      style={{ fontFamily: 'var(--font-ui)' }}>
                      {tag}
                    </span>
                    <ArrowRight size={13} className="text-[#D7CCC8] flex-shrink-0 ml-auto" />
                  </Link>
                )
              })}
            </div>
          )}

          {/* No results */}
          {!loading && query && results.length === 0 && tagSuggestions.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
                No results for <strong className="text-[#5D4037]">"{query}"</strong>
              </p>
              <button
                onClick={() => {
                  router.push(`/?q=${encodeURIComponent(query)}`)
                  setOpen(false)
                }}
                className="btn btn-secondary btn-sm mt-3"
              >
                Search all scores <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-[#EFE9E7] bg-[#F5F5F5]
                        flex items-center gap-4 text-xs text-[#D7CCC8]"
          style={{ fontFamily: 'var(--font-ui)' }}>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-white border border-[#D7CCC8] text-[#8D6E63]">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-white border border-[#D7CCC8] text-[#8D6E63]">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-white border border-[#D7CCC8] text-[#8D6E63]">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  )
}