// app/(main)/dashboard/page.tsx
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
import { Upload, FileStack, Bookmark, Download, TrendingUp, ArrowRight, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

const PAGE_SIZE = 10

function Pagination({ current, total, tab }: { current: number; total: number; tab: string }) {
  const href = (p: number) => `/dashboard?tab=${tab}&page=${p}`
  const pages: (number | '...')[] =
    total <= 7 ? Array.from({ length: total }, (_, i) => i + 1)
    : current <= 4 ? [1, 2, 3, 4, 5, '...', total]
    : current >= total - 3 ? [1, '...', total-4, total-3, total-2, total-1, total]
    : [1, '...', current-1, current, current+1, '...', total]
  const btn = (active: boolean): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.875rem', fontWeight: active ? 600 : 400,
    textDecoration: 'none', transition: 'all 0.15s',
    border: '1px solid ' + (active ? 'var(--walnut)' : 'var(--border)'),
    background: active ? 'var(--walnut)' : 'var(--surface)',
    color: active ? 'var(--bone)' : 'var(--text-muted)',
    fontFamily: 'var(--font-ui)',
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 28 }}>
      {current > 1 && <a href={href(current-1)} style={btn(false)}><ChevronLeft size={14} /></a>}
      {pages.map((p, i) => p === '...'
        ? <span key={`d${i}`} style={{ width: 36, textAlign: 'center', color: 'var(--text-muted)' }}>…</span>
        : <a key={p} href={href(p as number)} style={btn(p === current)}>{p}</a>
      )}
      {current < total && <a href={href(current+1)} style={btn(false)}><ChevronRight size={14} /></a>}
    </div>
  )
}

function EmptyState({ icon, title, body, cta, href }: { icon: React.ReactNode; title: string; body: string; cta: string; href: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '80px 0', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ochre)' }}>{icon}</div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--walnut)' }}>{title}</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: 300, lineHeight: 1.6, fontFamily: 'var(--font-ui)' }}>{body}</p>
      <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '9px 18px', borderRadius: 9, background: 'var(--walnut)', color: 'var(--bone)', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none' }}>
        {cta} <ArrowRight size={13} />
      </Link>
    </div>
  )
}

interface DashboardProps { searchParams: Promise<{ tab?: string; page?: string }> }

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const params = await searchParams
  const tab    = params.tab ?? 'uploads'
  const page   = Math.max(1, parseInt(params.page ?? '1', 10))
  const from   = (page - 1) * PAGE_SIZE
  const to     = from + PAGE_SIZE - 1
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: uploads, count: uploadsCount } = await supabase.from('files').select('*', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).range(tab==='uploads'?from:0, tab==='uploads'?to:PAGE_SIZE-1)
  const { count: totalUploadsCount } = await supabase.from('files').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  const { data: bookmarkRows, count: bookmarksCount } = await supabase.from('bookmarks').select('file_id, files(*)', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).range(tab==='bookmarks'?from:0, tab==='bookmarks'?to:PAGE_SIZE-1)
  const { count: totalBookmarksCount } = await supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  const { data: collections, count: collectionsCount } = await supabase.from('collections').select('*, collection_files(count)', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).range(tab==='collections'?from:0, tab==='collections'?to:PAGE_SIZE-1)
  const { data: allUploads } = await supabase.from('files').select('download_count, is_public').eq('user_id', user.id)

  const totalDownloads = (allUploads??[]).reduce((s,f)=>s+(f.download_count??0),0)
  const publicCount    = (allUploads??[]).filter(f=>f.is_public).length
  const myUploads       = (uploads??[]) as FileRecord[]
  const bookmarkedFiles = (bookmarkRows??[]).map((b:any)=>b.files).filter(Boolean) as FileRecord[]
  const bookmarkIds     = new Set(bookmarkedFiles.map(f=>f.id))
  const myCollections   = (collections??[]) as any[]
  const activeCount     = tab==='bookmarks'?(bookmarksCount??0):tab==='collections'?(collectionsCount??0):(uploadsCount??0)
  const totalPages      = Math.ceil(activeCount/PAGE_SIZE)
  const gridFiles       = tab==='uploads'?myUploads:bookmarkedFiles
  const displayName     = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Musician'

  const stats = [
    { icon: <FileStack size={18} />, label: 'Uploads',   value: totalUploadsCount ?? 0 },
    { icon: <Bookmark size={18} />,  label: 'Bookmarks', value: totalBookmarksCount ?? 0 },
    { icon: <Download size={18} />,  label: 'Downloads', value: totalDownloads },
    { icon: <TrendingUp size={18}/>, label: 'Public',    value: publicCount },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bone)' }} className="grain">
      <Navbar />
      <div style={{ background: 'var(--roasted)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -64, right: -64, width: 280, height: 280, borderRadius: '50%', background: 'rgba(93,64,55,0.4)', filter: 'blur(56px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -32, left: -24, width: 200, height: 200, borderRadius: '50%', background: 'rgba(141,110,99,0.15)', filter: 'blur(48px)', pointerEvents: 'none' }} />
        <div className="page-container" style={{ position: 'relative', paddingTop: 40, paddingBottom: 40 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
            <div>
              <p className="section-eyebrow" style={{ color: 'var(--ochre)', marginBottom: 6 }}>Welcome back</p>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 700, color: 'var(--bone)', lineHeight: 1.1 }}>{displayName}</h1>
              <p style={{ color: 'var(--ochre)', fontSize: '0.875rem', marginTop: 4, fontFamily: 'var(--font-ui)' }}>{user.email}</p>
            </div>
            <Link href="/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'var(--walnut)', color: 'var(--bone)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              <Upload size={15} /> Upload New Score
            </Link>
          </div>
          <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {stats.map(stat => (
              <div key={stat.label} style={{ background: 'rgba(93,64,55,0.35)', border: '1px solid rgba(141,110,99,0.22)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ color: 'var(--ochre)', flexShrink: 0 }}>{stat.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--bone)', lineHeight: 1 }}>{stat.value.toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ochre)', marginTop: 2, fontFamily: 'var(--font-ui)' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="page-container" style={{ paddingTop: 32, paddingBottom: 56 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <RecentlyViewed userId={user.id} />
          <div>
            <DashboardTabs active={tab} />
            <div style={{ marginTop: 24 }}>
              {tab === 'collections' ? (
                myCollections.length === 0
                  ? <EmptyState icon={<FolderOpen size={28}/>} title="No collections yet" body="Group your scores into collections for Mass, seasons, or events." cta="Go to Collections" href="/collections" />
                  : <><div className="score-grid">{myCollections.map((col,i)=><CollectionCard key={col.id} collection={col} index={i}/>)}</div>{totalPages>1&&<Pagination current={page} total={totalPages} tab={tab}/>}</>
              ) : gridFiles.length === 0
                ? <EmptyState icon={tab==='bookmarks'?<Bookmark size={28}/>:<FileStack size={28}/>} title={tab==='bookmarks'?'No bookmarks yet':'No uploads yet'} body={tab==='bookmarks'?'Browse the library and bookmark scores you love.':'Upload your first choral score to share with the community.'} cta={tab==='bookmarks'?'Browse Library':'Upload Now'} href={tab==='bookmarks'?'/':'/upload'} />
                : <><div className="score-grid">{gridFiles.map((file,i)=>tab==='uploads'?<DashboardFileCard key={file.id} file={file} index={i} bookmarked={bookmarkIds.has(file.id)}/>:<ScoreCard key={file.id} file={file} index={i} bookmarked={bookmarkIds.has(file.id)}/>)}</div>{totalPages>1&&<Pagination current={page} total={totalPages} tab={tab}/>}</>
              }
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <style>{`@media(max-width:580px){.dash-stats{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </div>
  )
}