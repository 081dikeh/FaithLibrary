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
  const build = (p: number) => `/dashboard?tab=${tab}&page=${p}`
  const pages: (number | '...')[] =
    total <= 7
      ? Array.from({ length: total }, (_, i) => i + 1)
      : current <= 4
        ? [1, 2, 3, 4, 5, '...', total]
        : current >= total - 3
          ? [1, '...', total - 4, total - 3, total - 2, total - 1, total]
          : [1, '...', current - 1, current, current + 1, '...', total]

  return (
    <div className="flex items-center justify-center gap-1.5 pt-6">
      {current > 1 && (
        <a href={build(current - 1)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-[#D7CCC8] text-[#8D6E63] hover:border-[#5D4037] hover:text-[#5D4037] transition-all">
          <ChevronLeft size={15} />
        </a>
      )}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`d${i}`} className="w-9 h-9 flex items-center justify-center text-[#D7CCC8] text-sm">…</span>
        ) : (
          <a key={p} href={build(p as number)} className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${p === current ? 'bg-[#5D4037] text-white shadow-sm' : 'bg-white border border-[#D7CCC8] text-[#8D6E63] hover:border-[#5D4037] hover:text-[#5D4037]'}`}>
            {p}
          </a>
        )
      )}
      {current < total && (
        <a href={build(current + 1)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-[#D7CCC8] text-[#8D6E63] hover:border-[#5D4037] hover:text-[#5D4037] transition-all">
          <ChevronRight size={15} />
        </a>
      )}
    </div>
  )
}

interface DashboardProps {
  searchParams: Promise<{ tab?: string; page?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const params   = await searchParams
  const tab      = params.tab ?? 'uploads'
  const page     = Math.max(1, parseInt(params.page ?? '1', 10))
  const from     = (page - 1) * PAGE_SIZE
  const to       = from + PAGE_SIZE - 1
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Uploads — paginated with count
  const { data: uploads, count: uploadsCount } = await supabase
    .from('files')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(tab === 'uploads' ? from : 0, tab === 'uploads' ? to : PAGE_SIZE - 1)

  // Total uploads count for stats (separate lightweight query)
  const { count: totalUploadsCount } = await supabase
    .from('files')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Bookmarks — paginated
  const { data: bookmarkRows, count: bookmarksCount } = await supabase
    .from('bookmarks')
    .select('file_id, files(*)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(tab === 'bookmarks' ? from : 0, tab === 'bookmarks' ? to : PAGE_SIZE - 1)

  // Total bookmarks for stats
  const { count: totalBookmarksCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Collections — paginated
  const { data: collections, count: collectionsCount } = await supabase
    .from('collections')
    .select('*, collection_files(count)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(tab === 'collections' ? from : 0, tab === 'collections' ? to : PAGE_SIZE - 1)

  // Total downloads for stats
  const { data: allUploads } = await supabase
    .from('files')
    .select('download_count, is_public')
    .eq('user_id', user.id)

  const totalDownloads = (allUploads ?? []).reduce((s, f) => s + (f.download_count ?? 0), 0)
  const publicCount    = (allUploads ?? []).filter(f => f.is_public).length

  const myUploads       = (uploads ?? []) as FileRecord[]
  const bookmarkedFiles = (bookmarkRows ?? []).map((b: any) => b.files).filter(Boolean) as FileRecord[]
  const bookmarkIds     = new Set(bookmarkedFiles.map(f => f.id))
  const myCollections   = (collections ?? []) as any[]

  const activeCount =
    tab === 'bookmarks'   ? (bookmarksCount ?? 0)
    : tab === 'collections' ? (collectionsCount ?? 0)
    : (uploadsCount ?? 0)
  const totalPages = Math.ceil(activeCount / PAGE_SIZE)

  const stats = [
    { icon: <FileStack size={17} />, label: 'Uploads',   value: totalUploadsCount ?? 0 },
    { icon: <Bookmark size={17} />,  label: 'Bookmarks', value: totalBookmarksCount ?? 0 },
    { icon: <Download size={17} />,  label: 'Downloads', value: totalDownloads },
    { icon: <TrendingUp size={17}/>, label: 'Public',    value: publicCount },
  ]

  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Musician'

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      <div className="bg-[#3E2723] relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#5D4037]/35 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#8D6E63]/15 blur-2xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div>
              <p className="text-[#8D6E63] text-xs font-medium tracking-widest uppercase mb-1" style={{fontFamily:'var(--font-ui)'}}>Welcome back</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F5]">{displayName}</h1>
              <p className="text-[#8D6E63] text-sm mt-1" style={{fontFamily:'var(--font-ui)'}}>{user.email}</p>
            </div>
            <Link href="/upload" className="btn btn-primary self-start sm:self-auto flex-shrink-0" style={{background:'#5D4037', borderColor:'#8D6E63', padding:'0.65rem 1.25rem'}}>
              <Upload size={15} /> Upload New Score
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {stats.map(stat => (
              <div key={stat.label} className="bg-[#5D4037]/40 border border-[#5D4037]/60 rounded-xl px-4 py-3.5 flex items-center gap-3">
                <div className="text-[#8D6E63] flex-shrink-0">{stat.icon}</div>
                <div>
                  <div className="font-display text-2xl font-bold text-[#F5F5F5] leading-none">{stat.value}</div>
                  <div className="text-xs text-[#8D6E63] mt-0.5" style={{fontFamily:'var(--font-ui)'}}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <RecentlyViewed userId={user.id} />
        <div>
          <DashboardTabs active={tab} />
          <div className="mt-6">
            {tab === 'collections' ? (
              myCollections.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-24 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#EFE9E7] flex items-center justify-center text-[#8D6E63]"><FolderOpen size={26} /></div>
                  <p className="font-display text-xl text-[#5D4037]">No collections yet</p>
                  <p className="text-sm text-[#8D6E63] max-w-xs" style={{fontFamily:'var(--font-ui)'}}>Group scores into collections for Mass, seasons, or events.</p>
                  <Link href="/collections" className="btn btn-primary btn-sm mt-2">Create Collection <ArrowRight size={13} /></Link>
                </div>
              ) : (
                <>
                  <div className="score-grid">
                    {myCollections.map((col, i) => <CollectionCard key={col.id} collection={col} index={i} />)}
                  </div>
                  {totalPages > 1 && <Pagination current={page} total={totalPages} tab={tab} />}
                </>
              )
            ) : (tab === 'uploads' ? myUploads : bookmarkedFiles).length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-[#EFE9E7] flex items-center justify-center text-[#8D6E63]">
                  {tab === 'bookmarks' ? <Bookmark size={26} /> : <FileStack size={26} />}
                </div>
                <p className="font-display text-xl text-[#5D4037]">{tab === 'bookmarks' ? 'No bookmarks yet' : 'No uploads yet'}</p>
                <p className="text-[#8D6E63] text-sm max-w-xs leading-relaxed" style={{fontFamily:'var(--font-ui)'}}>
                  {tab === 'bookmarks' ? 'Browse the library and bookmark scores to save them here.' : 'Upload your first choral score or hymn to the library.'}
                </p>
                <Link href={tab === 'bookmarks' ? '/' : '/upload'} className="btn btn-primary btn-sm mt-2">
                  {tab === 'bookmarks' ? 'Browse Library' : 'Upload Now'} <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <>
                <div className="score-grid">
                  {(tab === 'uploads' ? myUploads : bookmarkedFiles).map((file, i) =>
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
      </main>
      <Footer />
    </div>
  )
}
