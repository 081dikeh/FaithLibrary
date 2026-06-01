// components/RecentlyViewed.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Clock, Music2, ArrowRight } from 'lucide-react'

interface RecentlyViewedProps {
  userId: string
}

export async function RecentlyViewed({ userId }: RecentlyViewedProps) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('recently_viewed')
    .select('viewed_at, files(id, title, tags, file_url, download_count)')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(8)

  const files = (data ?? [])
    .map((r: any) => ({ ...r.files, viewed_at: r.viewed_at }))
    .filter(Boolean)

  if (files.length === 0) return null

  const timeAgo = (dateStr: string) => {
    const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (d < 60) return `${d}m ago`
    if (d < 1440) return `${Math.floor(d / 60)}h ago`
    return `${Math.floor(d / 1440)}d ago`
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} style={{ color: 'var(--ochre)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Recently Viewed
          </h2>
        </div>
        <Link href="/browse" style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.75rem', color: 'var(--text-muted)',
          textDecoration: 'none', transition: 'color 0.15s',
        }}>
          Browse all <ArrowRight size={11} />
        </Link>
      </div>

      {/* Grid of items — 4 per row on lg, 2 on sm */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
      }} className="rv-grid">
        {files.map((file: any, i: number) => (
          <Link key={file.id} href={`/view/${file.id}`} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '14px 16px',
            borderRight: i % 4 !== 3 ? '1px solid var(--border)' : 'none',
            borderBottom: i < files.length - 4 ? '1px solid var(--border)' : 'none',
            textDecoration: 'none',
            transition: 'background 0.15s',
            background: 'transparent',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            {/* Icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: 'var(--surface-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ochre)',
            }}>
              <Music2 size={15} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.8125rem', fontWeight: 500,
                color: 'var(--text-primary)', lineHeight: 1.35,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                fontFamily: 'var(--font-ui)',
              }}>{file.title}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                {file.tags?.[0] && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {file.tags[0]}
                  </span>
                )}
                <span style={{ fontSize: '0.68rem', color: 'var(--border-strong)', opacity: 0.6 }}>
                  {timeAgo(file.viewed_at)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) { .rv-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .rv-grid { grid-template-columns: repeat(1, 1fr) !important; } }
      `}</style>
    </div>
  )
}