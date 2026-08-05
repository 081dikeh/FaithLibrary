// components/HeroSearch.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'

export function HeroSearch() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    router.push(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        background: '#FFFFFF',
        border: `1.5px solid ${focused ? '#5D4037' : '#E4DAD5'}`,
        borderRadius: 16,
        padding: 6,
        boxShadow: focused
          ? '0 10px 34px rgba(62,39,35,0.14), 0 0 0 4px rgba(93,64,55,0.08)'
          : '0 4px 20px rgba(62,39,35,0.07)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      <Search size={17} style={{ color: '#A08070', marginLeft: 10, flexShrink: 0 }} />
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search by title, composer, or category…"
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.9375rem',
          color: '#3E2723',
          padding: '10px 4px',
        }}
      />
      <button
        type="submit"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          background: '#3E2723',
          color: '#F7F4F2',
          border: 'none',
          borderRadius: 11,
          padding: '11px 18px',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#5D4037' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#3E2723' }}
      >
        <span className="hidden sm:inline">Search</span>
        <ArrowRight size={14} />
      </button>
    </form>
  )
}