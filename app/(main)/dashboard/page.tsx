// app/(main)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FileCard, FileCardSkeleton } from '@/components/FileCard'
import { DashboardFileCard } from '@/components/DashboardFileCard'
import { DashboardTabs } from '@/components/DashboardTabs'
import { Upload, FileStack, Bookmark, Download, TrendingUp, ArrowRight } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

interface DashboardProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const params   = await searchParams
  const tab      = params.tab ?? 'uploads'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch uploads
  const { data: uploads } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch bookmarks
  const { data: bookmarkRows } = await supabase
    .from('bookmarks')
    .select('file_id, files(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const myUploads       = (uploads ?? []) as FileRecord[]
  const bookmarkedFiles = (bookmarkRows ?? []).map((b: any) => b.files).filter(Boolean) as FileRecord[]
  const bookmarkIds     = new Set(bookmarkedFiles.map(f => f.id))

  const totalDownloads = myUploads.reduce((s, f) => s + (f.download_count ?? 0), 0)
  const publicCount    = myUploads.filter(f => f.is_public).length

  const activeFiles = tab === 'bookmarks' ? bookmarkedFiles : myUploads

  const stats = [
    { icon: <FileStack size={17} />, label: 'Uploads',   value: myUploads.length },
    { icon: <Bookmark size={17} />,  label: 'Bookmarks', value: bookmarkedFiles.length },
    { icon: <Download size={17} />,  label: 'Downloads', value: totalDownloads },
    { icon: <TrendingUp size={17}/>, label: 'Public',    value: publicCount },
  ]

  const displayName = user.user_metadata?.full_name
    ?? user.email?.split('@')[0]
    ?? 'Musician'

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      {/* ── Header ── */}
      <div className="bg-[#3E2723] relative overflow-hidden">
        {/* Blobs */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#5D4037]/35 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#8D6E63]/15 blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div>
              <p className="text-[#8D6E63] text-xs font-medium tracking-widest uppercase mb-1"
                style={{fontFamily:'var(--font-ui)'}}>
                Welcome back
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F5]">
                {displayName}
              </h1>
              <p className="text-[#8D6E63] text-sm mt-1" style={{fontFamily:'var(--font-ui)'}}>
                {user.email}
              </p>
            </div>
            <Link href="/upload"
              className="btn btn-primary self-start sm:self-auto flex-shrink-0"
              style={{background:'#5D4037', borderColor:'#8D6E63', padding:'0.65rem 1.25rem'}}>
              <Upload size={15} /> Upload New Score
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {stats.map(stat => (
              <div key={stat.label}
                className="bg-[#5D4037]/40 border border-[#5D4037]/60 rounded-xl px-4 py-3.5
                           flex items-center gap-3">
                <div className="text-[#8D6E63] flex-shrink-0">{stat.icon}</div>
                <div>
                  <div className="font-display text-2xl font-bold text-[#F5F5F5] leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[#8D6E63] mt-0.5" style={{fontFamily:'var(--font-ui)'}}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <DashboardTabs active={tab} />

        <div className="mt-6">
          {activeFiles.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-[#EFE9E7]
                              flex items-center justify-center text-[#8D6E63]">
                {tab === 'bookmarks' ? <Bookmark size={26} /> : <FileStack size={26} />}
              </div>
              <p className="font-display text-xl text-[#5D4037]">
                {tab === 'bookmarks' ? 'No bookmarks yet' : 'No uploads yet'}
              </p>
              <p className="text-[#8D6E63] text-sm max-w-xs leading-relaxed"
                style={{fontFamily:'var(--font-ui)'}}>
                {tab === 'bookmarks'
                  ? 'Browse the library and bookmark scores to save them here.'
                  : 'Upload your first choral score or hymn to the library.'}
              </p>
              <Link
                href={tab === 'bookmarks' ? '/' : '/upload'}
                className="btn btn-primary btn-sm mt-2"
              >
                {tab === 'bookmarks' ? 'Browse Library' : 'Upload Now'}
                <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {activeFiles.map((file, i) =>
                tab === 'uploads'
                  ? <DashboardFileCard key={file.id} file={file} index={i}
                      bookmarked={bookmarkIds.has(file.id)} />
                  : <FileCard key={file.id} file={file} index={i}
                      bookmarked={bookmarkIds.has(file.id)} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}