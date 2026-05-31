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
  query?:     string
  activeTags: string[]
  activeSort: string
}

export function BrowseControls({ query, activeTags, activeSort }: BrowseControlsProps) {
  const router = useRouter()
  const [searchVal,  setSearchVal]  = useState(query ?? '')
  const [sortOpen,   setSortOpen]   = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [tagSearch,  setTagSearch]  = useState('')
  const sortRef   = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current   && !sortRef.current.contains(e.target as Node))   setSortOpen(false)
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const push = (overrides: { q?: string; tags?: string[]; sort?: string }) => {
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
    const next = activeTags.includes(tag) ? activeTags.filter(t => t !== tag) : [...activeTags, tag]
    push({ tags: next })
  }
  const clearTag = (tag: string) => push({ tags: activeTags.filter(t => t !== tag) })
  const filteredGroups = TAG_GROUPS.map(g => ({
    ...g, tags: g.tags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())),
  })).filter(g => g.tags.length > 0)
  const sortLabel = SORT_OPTIONS.find(o => o.value === activeSort)?.label ?? 'Newest first'

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 14, boxShadow: 'var(--shadow-lift)',
    overflow: 'hidden', zIndex: 50,
  }

  const controlBtnStyle = (active = false): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 7,
    height: 38, padding: '0 14px', borderRadius: 8,
    fontSize: '0.8125rem', fontWeight: 500,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.18s',
    border: `1.5px solid ${active ? 'var(--walnut)' : 'var(--border)'}`,
    background: active ? 'var(--walnut)' : 'var(--surface)',
    color: active ? 'var(--bone)' : 'var(--text-secondary)',
    boxShadow: 'var(--shadow-xs)',
    flexShrink: 0,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Row 1 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 8, minWidth: 200 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)',
              }} />
              <input
                type="text"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search titles, composers, descriptions…"
                style={{
                  width: '100%', height: 38,
                  paddingLeft: 36, paddingRight: 12,
                  fontSize: '0.875rem',
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 8, color: 'var(--text-primary)',
                  outline: 'none', fontFamily: 'var(--font-ui)',
                  transition: 'border-color 0.18s, box-shadow 0.18s',
                  boxShadow: 'var(--shadow-xs)',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--walnut)'
                  e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.boxShadow = 'var(--shadow-xs)'
                }}
              />
            </div>
            <button type="submit" style={{
              ...controlBtnStyle(),
              background: 'var(--walnut)', borderColor: 'var(--walnut)',
              color: 'var(--bone)',
            }}>Search</button>
            {query && (
              <button type="button" onClick={() => { setSearchVal(''); push({ q: undefined }) }}
                style={controlBtnStyle()}>
                <X size={13} />
              </button>
            )}
          </form>

          {/* Sort dropdown */}
          <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setSortOpen(v => !v)} style={controlBtnStyle()}>
              {sortLabel}
              <ChevronDown size={12} style={{
                transition: 'transform 0.2s',
                transform: sortOpen ? 'rotate(180deg)' : 'none',
              }} />
            </button>
            {sortOpen && (
              <div className="animate-scale-in" style={{ ...dropdownStyle, width: 192 }}>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => { push({ sort: opt.value }); setSortOpen(false) }}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '9px 14px',
                      fontSize: '0.8125rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: activeSort === opt.value ? 'var(--surface-3)' : 'transparent',
                      color: activeSort === opt.value ? 'var(--walnut)' : 'var(--text-primary)',
                      fontWeight: activeSort === opt.value ? 600 : 400,
                      border: 'none', cursor: 'pointer',
                      transition: 'background 0.12s',
                      fontFamily: 'var(--font-ui)',
                    }}>
                    {opt.label}
                    {activeSort === opt.value && <Check size={12} style={{ color: 'var(--walnut)' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter dropdown */}
          <div ref={filterRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setFilterOpen(v => !v)}
              style={controlBtnStyle(activeTags.length > 0)}>
              <SlidersHorizontal size={13} />
              Filter
              {activeTags.length > 0 && (
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.22)', color: 'white',
                  fontSize: '0.7rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{activeTags.length}</span>
              )}
              <ChevronDown size={12} style={{
                transition: 'transform 0.2s',
                transform: filterOpen ? 'rotate(180deg)' : 'none',
              }} />
            </button>

            {filterOpen && (
              <div className="animate-scale-in" style={{
                ...dropdownStyle, width: 272,
                maxHeight: 400, display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  padding: '10px 12px 8px',
                  borderBottom: '1px solid var(--border)', flexShrink: 0,
                }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={12} style={{
                      position: 'absolute', left: 10, top: '50%',
                      transform: 'translateY(-50%)', color: 'var(--text-muted)',
                    }} />
                    <input
                      autoFocus
                      value={tagSearch}
                      onChange={e => setTagSearch(e.target.value)}
                      placeholder="Search categories…"
                      style={{
                        width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                        fontSize: '0.8rem', background: 'var(--surface-3)',
                        border: '1px solid var(--border)', borderRadius: 7,
                        color: 'var(--text-primary)', outline: 'none',
                        fontFamily: 'var(--font-ui)',
                      }}
                    />
                  </div>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {filteredGroups.map(group => (
                    <div key={group.label}>
                      <p style={{
                        padding: '10px 14px 4px',
                        fontSize: '0.62rem', fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--text-muted)', opacity: 0.7,
                      }}>{group.label}</p>
                      {group.tags.map(tag => {
                        const on = activeTags.includes(tag)
                        return (
                          <button key={tag} onClick={() => toggleTag(tag)} style={{
                            width: '100%', textAlign: 'left',
                            padding: '7px 14px', fontSize: '0.8125rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                            background: on ? 'var(--surface-3)' : 'transparent',
                            color: on ? 'var(--walnut)' : 'var(--text-primary)',
                            fontWeight: on ? 600 : 400,
                            border: 'none', cursor: 'pointer',
                            transition: 'background 0.12s', fontFamily: 'var(--font-ui)',
                          }}>
                            <span>{tag}</span>
                            {on && <Check size={12} style={{ color: 'var(--walnut)', flexShrink: 0 }} />}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
                {activeTags.length > 0 && (
                  <div style={{
                    padding: '8px 14px', borderTop: '1px solid var(--border)',
                    background: 'var(--surface-2)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {activeTags.length} active
                    </span>
                    <button onClick={() => push({ tags: [] })} style={{
                      fontSize: '0.75rem', color: '#dc2626', fontWeight: 500,
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}>Clear all</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: active tag pills */}
      {activeTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 2 }}>Filtered by:</span>
          {activeTags.map(tag => (
            <button key={tag} onClick={() => clearTag(tag)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 7,
              fontSize: '0.75rem', fontWeight: 500,
              background: 'var(--surface-3)', border: '1px solid var(--border)',
              color: 'var(--walnut)', cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              {tag} <X size={10} style={{ opacity: 0.7 }} />
            </button>
          ))}
          {activeTags.length > 1 && (
            <button onClick={() => push({ tags: [] })} style={{
              fontSize: '0.75rem', color: 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '5px 8px', borderRadius: 7, transition: 'color 0.15s',
            }}>Clear all</button>
          )}
        </div>
      )}
    </div>
  )
}