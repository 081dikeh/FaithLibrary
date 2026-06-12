// components/TagDropdown.tsx — UI only, all logic unchanged
'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'
import { TAG_GROUPS } from '@/lib/categories'

interface TagDropdownProps {
  selected:     string[]
  onChange:     (tags: string[]) => void
  placeholder?: string
}

export function TagDropdown({ selected, onChange, placeholder = 'Select categories & tags…' }: TagDropdownProps) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const containerRef        = useRef<HTMLDivElement>(null)
  const searchRef           = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60)
  }, [open])

  const toggleTag = (tag: string) =>
    onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag])

  const removeTag = (tag: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    onChange(selected.filter(t => t !== tag))
  }

  const filteredGroups = TAG_GROUPS
    .map(g => ({ ...g, tags: g.tags.filter(t => t.toLowerCase().includes(search.toLowerCase())) }))
    .filter(g => g.tags.length > 0)

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>

      {/* Trigger */}
      <div
        role="button" tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(v => !v) } }}
        aria-expanded={open} aria-haspopup="listbox"
        style={{
          minHeight: 46, padding: '8px 12px 8px 14px',
          background: '#fff',
          border: `1.5px solid ${open ? '#5D4037' : '#D7CCC8'}`,
          borderRadius: 11,
          cursor: 'pointer', userSelect: 'none',
          display: 'flex', alignItems: 'flex-start', gap: 8,
          boxShadow: open ? '0 0 0 3px rgba(93,64,55,0.1)' : '0 1px 2px rgba(62,39,35,0.04)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 24 }}>
          {selected.length === 0 ? (
            <span style={{ fontSize: '0.875rem', color: '#B09080', alignSelf: 'center' }}>
              {placeholder}
            </span>
          ) : selected.map(tag => (
            <span key={tag} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 6px 3px 10px', borderRadius: 99,
              background: 'linear-gradient(135deg, #F7F2EF 0%, #EFE9E6 100%)',
              border: '1px solid #D7CCC8',
              color: '#5D4037', fontSize: '0.775rem', fontWeight: 600,
              letterSpacing: '0.01em',
              boxShadow: '0 1px 2px rgba(93,64,55,0.08)',
            }}>
              {tag}
              <span
                role="button" tabIndex={0} aria-label={`Remove ${tag}`}
                onClick={e => removeTag(tag, e)}
                onKeyDown={e => { if (e.key === 'Enter') removeTag(tag, e) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'rgba(93,64,55,0.1)',
                  cursor: 'pointer', color: '#8D6E63', transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#dc2626'; el.style.color = 'white' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(93,64,55,0.1)'; el.style.color = '#8D6E63' }}
              >
                <X size={9} />
              </span>
            </span>
          ))}
        </div>
        <ChevronDown size={15} style={{
          color: open ? '#5D4037' : '#8D6E63', flexShrink: 0, marginTop: 3,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s ease, color 0.15s',
        }} />
      </div>

      {/* Panel */}
      {open && (
        <div
          role="listbox" aria-multiselectable="true"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
            background: '#fff',
            border: '1.5px solid #E0D8D4',
            borderRadius: 14,
            boxShadow: '0 4px 8px rgba(62,39,35,0.06), 0 16px 40px rgba(62,39,35,0.14)',
            maxHeight: 360, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Search */}
          <div style={{
            padding: '10px 10px 8px',
            borderBottom: '1px solid #F0EAE6',
            background: '#FAFAF9',
            flexShrink: 0,
          }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                color: '#A09080', pointerEvents: 'none',
              }} />
              <input
                ref={searchRef}
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search categories…"
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
                  fontSize: '0.8125rem', background: '#FFFFFF',
                  border: '1.5px solid #E0D8D4', borderRadius: 8,
                  color: '#3E2723', outline: 'none', fontFamily: 'var(--font-ui)',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#8D6E63'; e.target.style.boxShadow = '0 0 0 3px rgba(141,110,99,0.12)' }}
                onBlur={e => { e.target.style.borderColor = '#E0D8D4'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Groups */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }} className="scrollbar-thin">
            {filteredGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#B09080', fontSize: '0.8125rem' }}>
                No tags match "{search}"
              </div>
            ) : filteredGroups.map(group => (
              <div key={group.label}>
                <p style={{
                  padding: '10px 14px 3px',
                  fontSize: '0.6rem', fontWeight: 800,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: '#C4B5AF',
                }}>{group.label}</p>
                {group.tags.map(tag => {
                  const on = selected.includes(tag)
                  return (
                    <div
                      key={tag} role="option" aria-selected={on} tabIndex={0}
                      onClick={() => toggleTag(tag)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTag(tag) } }}
                      style={{
                        padding: '8px 14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                        fontSize: '0.8125rem', cursor: 'pointer',
                        background: on ? '#F2EDE9' : 'transparent',
                        color: on ? '#5D4037' : '#3E2723',
                        fontWeight: on ? 600 : 400,
                        transition: 'background 0.1s',
                        fontFamily: 'var(--font-ui)',
                      }}
                      onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background = '#FAF7F5' }}
                      onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <span>{tag}</span>
                      {on && (
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: '#5D4037',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Check size={10} color="white" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          {selected.length > 0 && (
            <div style={{
              padding: '8px 14px', borderTop: '1px solid #F0EAE6',
              background: '#FAFAF9', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.75rem', color: '#8D6E63', fontFamily: 'var(--font-ui)' }}>
                <strong style={{ color: '#5D4037' }}>{selected.length}</strong> selected
              </span>
              <span
                role="button" tabIndex={0}
                onClick={() => onChange([])}
                onKeyDown={e => { if (e.key === 'Enter') onChange([]) }}
                style={{
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  color: '#B09080', transition: 'color 0.15s',
                  fontFamily: 'var(--font-ui)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#dc2626' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#B09080' }}
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