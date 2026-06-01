// components/DashboardFileCard.tsx
'use client'
import Link from 'next/link'
import { ScoreCard } from '@/components/ScoreCard'
import { Pencil, Globe, Lock } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

interface DashboardFileCardProps {
  file:        FileRecord
  bookmarked?: boolean
  index?:      number
}

export function DashboardFileCard({ file, bookmarked, index }: DashboardFileCardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <ScoreCard file={file} bookmarked={bookmarked} index={index} />

      {/* Below-card meta row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingLeft: 2, paddingRight: 2,
      }}>
        {/* Visibility badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.68rem', fontWeight: 500,
          color: file.is_public ? 'var(--text-muted)' : 'var(--border-strong)',
          fontFamily: 'var(--font-ui)',
        }}>
          {file.is_public
            ? <><Globe size={9} style={{ flexShrink: 0 }} /> Public</>
            : <><Lock size={9} style={{ flexShrink: 0 }} /> Private</>
          }
        </div>

        {/* Edit link */}
        <Link href={`/edit/${file.id}`} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.68rem', fontWeight: 500,
          color: 'var(--text-muted)', textDecoration: 'none',
          padding: '3px 8px', borderRadius: 6,
          background: 'transparent',
          transition: 'all 0.15s',
          fontFamily: 'var(--font-ui)',
        }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'var(--surface-3)'
            el.style.color = 'var(--walnut)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'transparent'
            el.style.color = 'var(--text-muted)'
          }}
        >
          <Pencil size={10} /> Edit
        </Link>
      </div>
    </div>
  )
}