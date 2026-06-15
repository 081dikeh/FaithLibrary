// app/(main)/profile/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { ScoreCard } from '@/components/ScoreCard'
import { FileStack, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

const PAGE_SIZE = 10

function pageBtnStyle(active: boolean): React.CSSProperties {
  return {
    width: 36, height: 36, borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.875rem', fontWeight: active ? 700 : 500,
    textDecoration: 'none', transition: 'all 0.15s',
    border: '1px solid ' + (active ? '#3E2723' : '#E0D8D4'),
    background: active ? '#3E2723' : '#fff',
    color: active ? '#F7F4F2' : '#8D6E63',
    boxShadow: active ? '0 2px 8px rgba(62,39,35,0.2)' : 'none',
    fontFamily: 'var(--font-ui)', flexShrink: 0,
  }
}

function Pagination({ current, total, userId }: { current: number; total: number; userId: string }) {
  const build = (p: number) => `/profile/${userId}?page=${p}`
  const pages: (number | '...')[] =
    total <= 7 ? Array.from({ length: total }, (_, i) => i + 1)
      : current <= 4 ? [1, 2, 3, 4, 5, '...', total]
        : current >= total - 3 ? [1, '...', total - 4, total - 3, total - 2, total - 1, total]
          : [1, '...', current - 1, current, current + 1, '...', total]
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 24 }}>
      {current > 1 && <a href={build(current - 1)} style={pageBtnStyle(false)}><ChevronLeft size={14} /></a>}
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`d${i}`} style={{ width: 36, textAlign: 'center', color: 'var(--text-muted)' }}>…</span>
          : <a key={p} href={build(p as number)} style={pageBtnStyle(p === current)}>{p}</a>
      )}
      {current < total && <a href={build(current + 1)} style={pageBtnStyle(false)}><ChevronRight size={14} /></a>}
    </div>
  )
}

interface ProfilePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { id } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const supabase = await createClient()

  const { data: profile, error: profileErr } = await supabase
    .from('profiles').select('*').eq('id', id).single()
  if (profileErr || !profile) notFound()

  const { data: files, count } = await supabase
    .from('files').select('*', { count: 'exact' })
    .eq('user_id', id).eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(from, to)

  const { count: totalCount } = await supabase
    .from('files').select('*', { count: 'exact', head: true })
    .eq('user_id', id).eq('is_public', true)

  const { data: dlData } = await supabase
    .from('files').select('download_count').eq('user_id', id).eq('is_public', true)

  const uploads = (files ?? []) as FileRecord[]
  const totalDownloads = (dlData ?? []).reduce((s, f) => s + (f.download_count ?? 0), 0)
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const joined = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const displayName = profile.full_name ?? 'Anonymous Musician'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bone)' }} className="grain">
      <Navbar />

      {/* ── Profile hero ── */}
      <div style={{ background: 'var(--roasted)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(93,64,55,0.35)', filter: 'blur(64px)', pointerEvents: 'none' }} />
        <div className="page-container" style={{ position: 'relative', paddingTop: 48, paddingBottom: 48 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
            {/* Avatar */}
            <div style={{
              width: 88, height: 88, borderRadius: 20, flexShrink: 0,
              background: 'var(--walnut)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              border: '2px solid rgba(141,110,99,0.35)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--sand)' }}>{initials}</span>
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--bone)', lineHeight: 1.1 }}>
                {displayName}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 12 }}>
                {[
                  { icon: <FileStack size={13} />, label: `${totalCount ?? 0} scores` },
                  { icon: <Download size={13} />, label: `${totalDownloads.toLocaleString()} downloads` },
                  { icon: <Calendar size={13} />, label: `Joined ${joined}` },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--sand)', fontSize: '0.875rem', fontFamily: 'var(--font-ui)' }}>
                    <span style={{ color: 'var(--ochre)' }}>{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Score grid ── */}
      <main className="page-container" style={{ paddingTop: 32, paddingBottom: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Published Scores
          </h2>
          {totalPages > 1 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
              Page {page} of {totalPages}
            </p>
          )}
        </div>

        {uploads.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '80px 0', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ochre)' }}>
              <FileStack size={28} />
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--walnut)', fontWeight: 600 }}>No public scores yet</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{displayName} hasn't published any scores to the library.</p>
          </div>
        ) : (
          <>
            <div className="score-grid">
              {uploads.map((file, i) => <ScoreCard key={file.id} file={file} index={i} />)}
            </div>
            {totalPages > 1 && <Pagination current={page} total={totalPages} userId={id} />}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}