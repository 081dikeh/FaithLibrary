// app/(main)/dashboard/page.tsx — UI rewrite, all logic unchanged
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { ScoreCard } from '@/components/ScoreCard'
import { DashboardFileCard } from '@/components/DashboardFileCard'
import { DashboardTabs } from '@/components/DashboardTabs'
import { RecentlyViewed } from '@/components/RecentlyViewed'
import { CollectionCard } from '@/components/CollectionCard'
import {
  Upload, FileStack, Bookmark, Download,
  TrendingUp, ArrowRight, FolderOpen,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import type { FileRecord } from '@/lib/types'

const PAGE_SIZE = 10

/* ── Pagination ─────────────────────────────────────────────── */
function Pagination({ current, total, tab }: { current: number; total: number; tab: string }) {
  const href = (p: number) => `/dashboard?tab=${tab}&page=${p}`
  const pages: (number | '...')[] =
    total <= 7 ? Array.from({ length: total }, (_, i) => i + 1)
      : current <= 4 ? [1, 2, 3, 4, 5, '...', total]
        : current >= total - 3 ? [1, '...', total - 4, total - 3, total - 2, total - 1, total]
          : [1, '...', current - 1, current, current + 1, '...', total]

  const btnBase: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8125rem', fontWeight: 500,
    textDecoration: 'none', transition: 'all 0.15s',
    fontFamily: 'var(--font-ui)', flexShrink: 0,
    border: '1px solid #E0D8D4',
    background: '#fff', color: '#8D6E63',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 32 }}>
      {current > 1 && (
        <a href={href(current - 1)} style={btnBase}><ChevronLeft size={14} /></a>
      )}
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`d${i}`} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4B5AF', fontSize: '0.875rem' }}>…</span>
          : <a key={p} href={href(p as number)} style={{
            ...btnBase,
            background: p === current ? '#3E2723' : '#fff',
            borderColor: p === current ? '#3E2723' : '#E0D8D4',
            color: p === current ? '#F7F4F2' : '#8D6E63',
            fontWeight: p === current ? 700 : 500,
            boxShadow: p === current ? '0 2px 8px rgba(62,39,35,0.2)' : 'none',
          }}>{p}</a>
      )}
      {current < total && (
        <a href={href(current + 1)} style={btnBase}><ChevronRight size={14} /></a>
      )}
    </div>
  )
}

/* ── Empty state ────────────────────────────────────────────── */
function EmptyState({ icon, title, body, cta, href }: {
  icon: React.ReactNode; title: string; body: string; cta: string; href: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '72px 0', textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: '#F2EDE9',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8D6E63',
      }}>{icon}</div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: '#5D4037' }}>{title}</p>
      <p style={{ fontSize: '0.875rem', color: '#9E8070', maxWidth: 280, lineHeight: 1.65, fontFamily: 'var(--font-ui)' }}>{body}</p>
      <Link href={href} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
        padding: '9px 20px', borderRadius: 10,
        background: '#3E2723', color: '#F7F4F2',
        fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none',
        fontFamily: 'var(--font-ui)',
        boxShadow: '0 2px 8px rgba(62,39,35,0.22)',
        transition: 'background 0.15s',
      }}>
        {cta} <ArrowRight size={13} />
      </Link>
    </div>
  )
}

/* ── Stat card ──────────────────────────────────────────────── */
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div style={{
      borderRadius: 16, padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: 'rgba(141,110,99,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#A08070',
      }}>{icon}</div>
      <div>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.875rem', fontWeight: 700,
          color: '#F7F4F2', lineHeight: 1,
        }}>{value.toLocaleString()}</p>
        <p style={{ fontSize: '0.72rem', color: '#5A4035', marginTop: 3, fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
          {label}
        </p>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */
interface DashboardProps { searchParams: Promise<{ tab?: string; page?: string }> }

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const params = await searchParams
  const tab = params.tab ?? 'uploads'
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: uploads, count: uploadsCount } = await supabase
    .from('files').select('*', { count: 'exact' }).eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(tab === 'uploads' ? from : 0, tab === 'uploads' ? to : PAGE_SIZE - 1)

  const { count: totalUploadsCount } = await supabase
    .from('files').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

  const { data: bookmarkRows, count: bookmarksCount } = await supabase
    .from('bookmarks').select('file_id, files(*)', { count: 'exact' }).eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(tab === 'bookmarks' ? from : 0, tab === 'bookmarks' ? to : PAGE_SIZE - 1)

  const { count: totalBookmarksCount } = await supabase
    .from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

  const { data: collections, count: collectionsCount } = await supabase
    .from('collections').select('*, collection_files(count)', { count: 'exact' }).eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(tab === 'collections' ? from : 0, tab === 'collections' ? to : PAGE_SIZE - 1)

  const { data: allUploads } = await supabase
    .from('files').select('download_count, is_public').eq('user_id', user.id)

  const totalDownloads = (allUploads ?? []).reduce((s, f) => s + (f.download_count ?? 0), 0)
  const publicCount = (allUploads ?? []).filter(f => f.is_public).length
  const myUploads = (uploads ?? []) as FileRecord[]
  const bookmarkedFiles = (bookmarkRows ?? []).map((b: any) => b.files).filter(Boolean) as FileRecord[]
  const bookmarkIds = new Set(bookmarkedFiles.map(f => f.id))
  const myCollections = (collections ?? []) as any[]
  const activeCount = tab === 'bookmarks' ? (bookmarksCount ?? 0) : tab === 'collections' ? (collectionsCount ?? 0) : (uploadsCount ?? 0)
  const totalPages = Math.ceil(activeCount / PAGE_SIZE)
  const gridFiles = tab === 'uploads' ? myUploads : bookmarkedFiles
  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Musician'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4F2' }} className="grain">
      <Navbar />

      {/* ── Hero ── */}
      <div style={{ background: '#1C0E0A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(93,64,55,0.25)', filter: 'blur(64px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -32, width: 240, height: 240, borderRadius: '50%', background: 'rgba(141,110,99,0.12)', filter: 'blur(56px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <div style={{ paddingTop: 36, paddingBottom: 40 }}>
            {/* Top row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Avatar */}
                <div style={{
                  width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                  background: 'rgba(93,64,55,0.55)', border: '2px solid rgba(141,110,99,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: '#D7CCC8',
                }}>{initials}</div>
                <div>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A3028', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>
                    My Dashboard
                  </p>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, color: '#F7F4F2', lineHeight: 1.1 }}>
                    {displayName}
                  </h1>
                  <p style={{ color: '#4A3028', fontSize: '0.8rem', marginTop: 3, fontFamily: 'var(--font-ui)' }}>
                    {user.email}
                  </p>
                </div>
              </div>

              <Link href="/upload" className="dashboard-upload-link" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 11,
                background: '#5D4037', color: '#F7F4F2',
                fontFamily: 'var(--font-ui)', fontSize: '0.875rem', fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                transition: 'background 0.15s',
              }}
              >
                <Upload size={14} /> Upload Score
              </Link>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }} className="dash-stats">
              <StatCard icon={<FileStack size={18} />} label="Total Uploads" value={totalUploadsCount ?? 0} />
              <StatCard icon={<Bookmark size={18} />} label="Bookmarks" value={totalBookmarksCount ?? 0} />
              <StatCard icon={<Download size={18} />} label="Total Downloads" value={totalDownloads} />
              <StatCard icon={<TrendingUp size={18} />} label="Public Scores" value={publicCount} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 56px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          <RecentlyViewed userId={user.id} />

          <div>
            <DashboardTabs active={tab} />

            <div style={{ marginTop: 24 }}>
              {/* Result count */}
              {tab !== 'collections' && gridFiles.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <p style={{ fontSize: '0.875rem', color: '#8D6E63', fontFamily: 'var(--font-ui)' }}>
                    <span style={{ fontWeight: 700, color: '#3E2723' }}>{activeCount}</span>{' '}
                    {tab === 'bookmarks' ? 'bookmarked ' : ''}score{activeCount !== 1 ? 's' : ''}
                  </p>
                  {totalPages > 1 && (
                    <p style={{ fontSize: '0.75rem', color: '#B09080', fontFamily: 'var(--font-ui)' }}>
                      Page {page} of {totalPages}
                    </p>
                  )}
                </div>
              )}

              {/* Collections tab */}
              {tab === 'collections' && (
                myCollections.length === 0
                  ? <EmptyState icon={<FolderOpen size={26} />} title="No collections yet"
                    body="Group your scores into collections for Mass, seasons, or events."
                    cta="Go to Collections" href="/collections" />
                  : <>
                    <div className="score-grid">
                      {myCollections.map((col, i) => <CollectionCard key={col.id} collection={col} index={i} />)}
                    </div>
                    {totalPages > 1 && <Pagination current={page} total={totalPages} tab={tab} />}
                  </>
              )}

              {/* Uploads / Bookmarks */}
              {tab !== 'collections' && (
                gridFiles.length === 0
                  ? <EmptyState
                    icon={tab === 'bookmarks' ? <Bookmark size={26} /> : <FileStack size={26} />}
                    title={tab === 'bookmarks' ? 'No bookmarks yet' : 'No uploads yet'}
                    body={tab === 'bookmarks'
                      ? 'Browse the library and bookmark scores you love.'
                      : 'Upload your first choral score to share with the community.'}
                    cta={tab === 'bookmarks' ? 'Browse Library' : 'Upload Now'}
                    href={tab === 'bookmarks' ? '/' : '/upload'}
                  />
                  : <>
                    <div className="score-grid">
                      {gridFiles.map((file, i) =>
                        tab === 'uploads'
                          ? <DashboardFileCard key={file.id} file={file} index={i} bookmarked={bookmarkIds.has(file.id)} />
                          : <ScoreCard key={file.id} file={file} index={i} bookmarked={bookmarkIds.has(file.id)} />
                      )}
                    </div>
                    {totalPages > 1 && <Pagination current={page} total={totalPages} tab={tab} />}
                  </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <style>{`
        @media(max-width:580px){.dash-stats{grid-template-columns:repeat(2,1fr)!important}}
        .dashboard-upload-link:hover { background: #4E342E; }
      `}</style>
    </div>
  )
}