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
import {
  Upload, FileStack, Bookmark, Download,
  TrendingUp, ArrowRight, FolderOpen,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import type { FileRecord } from '@/lib/types'

const PAGE_SIZE = 10

function Pagination({ current, total, tab }: { current: number; total: number; tab: string }) {
  const href = (p: number) => `/dashboard?tab=${tab}&page=${p}`
  const pages: (number | '...')[] =
    total <= 7 ? Array.from({ length: total }, (_, i) => i + 1)
    : current <= 4 ? [1, 2, 3, 4, 5, '...', total]
    : current >= total - 3 ? [1, '...', total-4, total-3, total-2, total-1, total]
    : [1, '...', current-1, current, current+1, '...', total]
  return (
    <div className="flex items-center justify-center gap-1.5 pt-8">
      {current > 1 && (
        <a href={href(current-1)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-[#D7CCC8] text-[#8D6E63] hover:border-[#5D4037] hover:text-[#5D4037] transition-all">
          <ChevronLeft size={15} />
        </a>
      )}
      {pages.map((p, i) => p === '...'
        ? <span key={`d${i}`} className="w-9 h-9 flex items-center justify-center text-[#D7CCC8] text-sm">…</span>
        : <a key={p} href={href(p as number)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${p === current ? 'bg-[#5D4037] text-white' : 'bg-white border border-[#D7CCC8] text-[#8D6E63] hover:border-[#5D4037] hover:text-[#5D4037]'}`}>
            {p}
          </a>
      )}
      {current < total && (
        <a href={href(current+1)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-[#D7CCC8] text-[#8D6E63] hover:border-[#5D4037] hover:text-[#5D4037] transition-all">
          <ChevronRight size={15} />
        </a>
      )}
    </div>
  )
}

function EmptyState({ icon, title, body, cta, href }: { icon: React.ReactNode; title: string; body: string; cta: string; href: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#EFE9E7] flex items-center justify-center text-[#8D6E63]">{icon}</div>
      <p className="font-display text-xl font-semibold text-[#5D4037]">{title}</p>
      <p className="text-sm text-[#8D6E63] max-w-xs leading-relaxed">{body}</p>
      <Link href={href} className="inline-flex items-center gap-1.5 mt-2 px-5 py-2.5 rounded-xl bg-[#5D4037] text-white text-sm font-semibold hover:bg-[#3E2723] transition-colors">
        {cta} <ArrowRight size={13} />
      </Link>
    </div>
  )
}

interface DashboardProps { searchParams: Promise<{ tab?: string; page?: string }> }

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const params   = await searchParams
  const tab      = params.tab ?? 'uploads'
  const page     = Math.max(1, parseInt(params.page ?? '1', 10))
  const from     = (page - 1) * PAGE_SIZE
  const to       = from + PAGE_SIZE - 1
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

  const totalDownloads  = (allUploads ?? []).reduce((s, f) => s + (f.download_count ?? 0), 0)
  const publicCount     = (allUploads ?? []).filter(f => f.is_public).length
  const myUploads       = (uploads ?? []) as FileRecord[]
  const bookmarkedFiles = (bookmarkRows ?? []).map((b: any) => b.files).filter(Boolean) as FileRecord[]
  const bookmarkIds     = new Set(bookmarkedFiles.map(f => f.id))
  const myCollections   = (collections ?? []) as any[]
  const activeCount     = tab === 'bookmarks' ? (bookmarksCount ?? 0) : tab === 'collections' ? (collectionsCount ?? 0) : (uploadsCount ?? 0)
  const totalPages      = Math.ceil(activeCount / PAGE_SIZE)
  const gridFiles       = tab === 'uploads' ? myUploads : bookmarkedFiles
  const displayName     = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Musician'
  const initials        = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const stats = [
    { icon: <FileStack size={18} />, label: 'Uploads',   value: totalUploadsCount ?? 0 },
    { icon: <Bookmark size={18} />,  label: 'Bookmarks', value: totalBookmarksCount ?? 0 },
    { icon: <Download size={18} />,  label: 'Downloads', value: totalDownloads },
    { icon: <TrendingUp size={18}/>, label: 'Public',    value: publicCount },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F5] grain">
      <Navbar />

      {/* ── Hero — same dark bg as homepage ── */}
      <section className="relative overflow-hidden bg-[#3E2723] pt-10 pb-12 px-4 sm:px-6">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#5D4037]/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-[#8D6E63]/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          {/* Name + upload button */}
          <div className="flex flex-wrap items-center justify-between gap-5 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center
                              font-display font-bold text-xl text-[#D7CCC8] select-none"
                style={{ background: 'rgba(93,64,55,0.6)', border: '2px solid rgba(141,110,99,0.35)' }}>
                {initials}
              </div>
              <div>
                <p className="text-[#8D6E63] text-xs font-semibold tracking-widest uppercase mb-1">
                  My Dashboard
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F5] leading-tight">
                  {displayName}
                </h1>
                <p className="text-[#8D6E63] text-sm mt-0.5">{user.email}</p>
              </div>
            </div>
            <Link href="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-[#5D4037] text-white text-sm font-semibold
                         hover:bg-[#4E342E] transition-colors shadow-lg border border-[#8D6E63]/30">
              <Upload size={14} /> Upload Score
            </Link>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(stat => (
              <div key={stat.label} className="rounded-xl px-4 py-4 flex items-center gap-3"
                style={{ background: 'rgba(93,64,55,0.32)', border: '1px solid rgba(141,110,99,0.22)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[#D7CCC8]"
                  style={{ background: 'rgba(141,110,99,0.2)' }}>
                  {stat.icon}
                </div>
                <div>
                  <p className="font-display text-3xl font-bold text-white leading-none">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-[#8D6E63] text-xs mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col gap-8">

          <RecentlyViewed userId={user.id} />

          <div>
            <DashboardTabs active={tab} />
            <div className="mt-6">

              {/* Result count */}
              {tab !== 'collections' && gridFiles.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[#8D6E63]">
                    <span className="font-semibold text-[#3E2723]">{activeCount}</span>{' '}
                    {tab === 'bookmarks' ? 'bookmarked' : ''} score{activeCount !== 1 ? 's' : ''}
                  </p>
                  {totalPages > 1 && (
                    <p className="text-xs text-[#8D6E63]">Page {page} of {totalPages}</p>
                  )}
                </div>
              )}

              {/* Collections */}
              {tab === 'collections' && (
                myCollections.length === 0
                  ? <EmptyState icon={<FolderOpen size={26}/>} title="No collections yet"
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
                      icon={tab === 'bookmarks' ? <Bookmark size={26}/> : <FileStack size={26}/>}
                      title={tab === 'bookmarks' ? 'No bookmarks yet' : 'No uploads yet'}
                      body={tab === 'bookmarks'
                        ? 'Browse the library and bookmark scores you love.'
                        : 'Upload your first choral score to share with the community.'}
                      cta={tab === 'bookmarks' ? 'Browse Library' : 'Upload Now'}
                      href={tab === 'bookmarks' ? '/' : '/upload'} />
                  : <>
                      <div className="score-grid">
                        {gridFiles.map((file, i) =>
                          tab === 'uploads'
                            ? <DashboardFileCard key={file.id} file={file} index={i} bookmarked={bookmarkIds.has(file.id)} />
                            : <ScoreCard        key={file.id} file={file} index={i} bookmarked={bookmarkIds.has(file.id)} />
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
    </div>
  )
}