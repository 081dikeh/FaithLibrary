// app/(main)/profile/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { ScoreCard } from '@/components/ScoreCard'
import { Pagination } from '@/components/Pagination'
import { FileStack, Download, Calendar } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

const PAGE_SIZE = 10

interface ProfilePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { id }   = await params
  const sp       = await searchParams
  const page     = Math.max(1, parseInt(sp.page ?? '1', 10))
  const from     = (page - 1) * PAGE_SIZE
  const to       = from + PAGE_SIZE - 1
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

  const uploads        = (files ?? []) as FileRecord[]
  const totalDownloads = (dlData ?? []).reduce((s, f) => s + (f.download_count ?? 0), 0)
  const totalPages     = Math.ceil((count ?? 0) / PAGE_SIZE)
  const joined         = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const displayName    = profile.full_name ?? 'Anonymous Musician'
  const initials       = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4F2' }} className="grain">
      <Navbar />

      {/* ── Profile hero ── */}
      <div style={{ background: '#1C0E0A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(93,64,55,0.25)', filter: 'blur(64px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24, position: 'relative' }}>
            {/* Avatar */}
            <div style={{
              width: 88, height: 88, borderRadius: 20, flexShrink: 0,
              background: 'rgba(93,64,55,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              border: '2px solid rgba(141,110,99,0.3)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: '#D7CCC8' }}>{initials}</span>
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#F7F4F2', lineHeight: 1.1 }}>
                {displayName}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 12 }}>
                {[
                  { icon: <FileStack size={13} />, label: `${totalCount ?? 0} scores` },
                  { icon: <Download size={13} />,  label: `${totalDownloads.toLocaleString()} downloads` },
                  { icon: <Calendar size={13} />,  label: `Joined ${joined}` },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#A08070', fontSize: '0.875rem', fontFamily: 'var(--font-ui)' }}>
                    <span style={{ color: '#8D6E63' }}>{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Score grid ── */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: '#3E2723' }}>
            Published Scores
          </h2>
          {totalPages > 1 && (
            <p style={{ fontSize: '0.75rem', color: '#B09080', fontFamily: 'var(--font-ui)' }}>
              Page {page} of {totalPages}
            </p>
          )}
        </div>

        {uploads.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '72px 0', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F2EDE9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8D6E63' }}>
              <FileStack size={28} />
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#5D4037', fontWeight: 700 }}>No public scores yet</p>
            <p style={{ fontSize: '0.875rem', color: '#9E8070', fontFamily: 'var(--font-ui)' }}>
              {displayName} hasn't published any scores to the library.
            </p>
          </div>
        ) : (
          <>
            <div className="score-grid">
              {uploads.map((file, i) => <ScoreCard key={file.id} file={file} index={i} />)}
            </div>
            {totalPages > 1 && (
              <Pagination current={page} total={totalPages} buildHref={p => `/profile/${id}?page=${p}`} />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}