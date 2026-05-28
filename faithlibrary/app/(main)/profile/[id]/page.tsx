// app/(main)/profile/[id]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { ScoreCard } from '@/components/ScoreCard'
import { FileStack, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

const PAGE_SIZE = 10

function Pagination({ current, total, userId }: { current: number; total: number; userId: string }) {
  const build = (p: number) => `/profile/${userId}?page=${p}`
  const pages: (number | '...')[] =
    total <= 7 ? Array.from({ length: total }, (_, i) => i + 1)
    : current <= 4 ? [1, 2, 3, 4, 5, '...', total]
    : current >= total - 3 ? [1, '...', total - 4, total - 3, total - 2, total - 1, total]
    : [1, '...', current - 1, current, current + 1, '...', total]

  return (
    <div className="flex items-center justify-center gap-1.5 pt-6">
      {current > 1 && (
        <a href={build(current - 1)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-[#D7CCC8] text-[#8D6E63] hover:border-[#5D4037] hover:text-[#5D4037] transition-all"><ChevronLeft size={15} /></a>
      )}
      {pages.map((p, i) =>
        p === '...' ? <span key={`d${i}`} className="w-9 h-9 flex items-center justify-center text-[#D7CCC8] text-sm">…</span>
        : <a key={p} href={build(p as number)} className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${p === current ? 'bg-[#5D4037] text-white shadow-sm' : 'bg-white border border-[#D7CCC8] text-[#8D6E63] hover:border-[#5D4037] hover:text-[#5D4037]'}`}>{p}</a>
      )}
      {current < total && (
        <a href={build(current + 1)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-[#D7CCC8] text-[#8D6E63] hover:border-[#5D4037] hover:text-[#5D4037] transition-all"><ChevronRight size={15} /></a>
      )}
    </div>
  )
}

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
    .from('files')
    .select('*', { count: 'exact' })
    .eq('user_id', id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(from, to)

  // Stats — total counts without pagination
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
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />
      <div className="bg-[#3E2723] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#5D4037]/30 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex-shrink-0 bg-[#5D4037] flex items-center justify-center overflow-hidden border-2 border-[#8D6E63]/40 shadow-xl">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                : <span className="font-display text-2xl font-bold text-[#D7CCC8]">{initials}</span>
              }
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F5]">{displayName}</h1>
              <div className="flex flex-wrap gap-5 mt-4">
                <div className="flex items-center gap-1.5 text-[#D7CCC8] text-sm" style={{fontFamily:'var(--font-ui)'}}>
                  <FileStack size={14} className="text-[#8D6E63]" />
                  <span><strong className="text-[#F5F5F5]">{totalCount ?? 0}</strong> scores</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#D7CCC8] text-sm" style={{fontFamily:'var(--font-ui)'}}>
                  <Download size={14} className="text-[#8D6E63]" />
                  <span><strong className="text-[#F5F5F5]">{totalDownloads}</strong> downloads</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#D7CCC8] text-sm" style={{fontFamily:'var(--font-ui)'}}>
                  <Calendar size={14} className="text-[#8D6E63]" />
                  <span>Joined {joined}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold text-[#3E2723]">Published Scores</h2>
          {totalPages > 1 && (
            <p className="text-xs text-[#8D6E63]" style={{fontFamily:'var(--font-ui)'}}>Page {page} of {totalPages}</p>
          )}
        </div>

        {uploads.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#EFE9E7] flex items-center justify-center"><FileStack size={26} className="text-[#8D6E63]" /></div>
            <p className="font-display text-xl text-[#5D4037]">No public scores yet</p>
            <p className="text-sm text-[#8D6E63]">{displayName} hasn't published any scores to the library.</p>
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
