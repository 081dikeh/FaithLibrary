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
  const router = useRouter()
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
    const next = active.includes(tag) ? active.filter(t => t !== tag) : [...active, tag]
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
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>

      {/* Filter dropdown trigger */}
      <div ref={containerRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 8,
            border: `1.5px solid ${active.length > 0 ? 'var(--walnut)' : 'var(--border)'}`,
            background: active.length > 0 ? 'var(--walnut)' : 'var(--surface)',
            color: active.length > 0 ? 'var(--bone)' : 'var(--text-secondary)',
            fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.18s',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <SlidersHorizontal size={13} />
          Filter
          {active.length > 0 && (
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', color: 'white',
              fontSize: '0.7rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{active.length}</span>
          )}
          <ChevronDown size={12} style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            marginLeft: 2,
          }} />
        </button>

        {open && (
          <div className="animate-scale-in" style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0,
            zIndex: 50, width: 268,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            boxShadow: 'var(--shadow-lift)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            maxHeight: 380,
          }}>
            {/* Search inside dropdown */}
            <div style={{
              padding: '10px 12px 8px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{
                  position: 'absolute', left: 10, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                }} />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search categories…"
                  style={{
                    width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                    fontSize: '0.8125rem', background: 'var(--surface-3)',
                    border: '1px solid var(--border)', borderRadius: 7,
                    color: 'var(--text-primary)', outline: 'none',
                    fontFamily: 'var(--font-ui)',
                  }}
                />
              </div>
            </div>

            {/* Groups list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.map(group => (
                <div key={group.label}>
                  <p style={{
                    padding: '10px 14px 4px',
                    fontSize: '0.62rem', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--text-muted)', opacity: 0.7,
                  }}>{group.label}</p>
                  {group.tags.map(tag => {
                    const on = active.includes(tag)
                    return (
                      <button key={tag} onClick={() => toggleTag(tag)} style={{
                        width: '100%', textAlign: 'left',
                        padding: '7px 14px',
                        fontSize: '0.8125rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                        background: on ? 'var(--surface-3)' : 'transparent',
                        color: on ? 'var(--walnut)' : 'var(--text-primary)',
                        fontWeight: on ? 600 : 400,
                        border: 'none', cursor: 'pointer',
                        transition: 'background 0.12s, color 0.12s',
                        fontFamily: 'var(--font-ui)',
                      }}>
                        <span>{tag}</span>
                        {on && <Check size={12} style={{ color: 'var(--walnut)', flexShrink: 0 }} />}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            {active.length > 0 && (
              <div style={{
                padding: '8px 14px',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {active.length} active
                </span>
                <button onClick={clearAll} style={{
                  fontSize: '0.75rem', color: '#dc2626', fontWeight: 500,
                  background: 'none', border: 'none', cursor: 'pointer',
                  transition: 'color 0.15s',
                }}>Clear all</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active tag pills */}
      {active.map(tag => (
        <button key={tag} onClick={() => toggleTag(tag)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8,
          fontSize: '0.75rem', fontWeight: 500,
          background: 'var(--surface-3)', border: '1.5px solid var(--border)',
          color: 'var(--walnut)', cursor: 'pointer',
          transition: 'all 0.15s',
        }}>
          {tag}
          <X size={10} style={{ opacity: 0.7 }} />
        </button>
      ))}

      {active.length > 1 && (
        <button onClick={clearAll} style={{
          fontSize: '0.75rem', color: 'var(--text-muted)',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px 8px', borderRadius: 8,
          transition: 'color 0.15s',
        }}>Clear all</button>
      )}
    </div>
  )
}