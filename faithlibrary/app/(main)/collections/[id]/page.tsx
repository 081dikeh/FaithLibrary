// app/(main)/collections/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { ScoreCard } from '@/components/ScoreCard'
import { ArrowLeft, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 10

function Pagination({ current, total, id }: { current: number; total: number; id: string }) {
  const build = (p: number) => `/collections/${id}?page=${p}`
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

interface CollectionPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const { id } = await params
  const sp     = await searchParams
  const page   = Math.max(1, parseInt(sp.page ?? '1', 10))
  const from   = (page - 1) * PAGE_SIZE
  const to     = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const { data: collection, error } = await supabase
    .from('collections').select('*, profiles(full_name)').eq('id', id).single()
  if (error || !collection) notFound()

  const { data: items, count } = await supabase
    .from('collection_files')
    .select('position, files(*)', { count: 'exact' })
    .eq('collection_id', id)
    .order('position', { ascending: true })
    .range(from, to)

  const files      = (items ?? []).map((i: any) => i.files).filter(Boolean)
  const totalFiles = count ?? 0
  const totalPages = Math.ceil(totalFiles / PAGE_SIZE)

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />
      <div className="bg-[#3E2723] relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#5D4037]/30 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <Link href="/collections" className="inline-flex items-center gap-1.5 text-[#8D6E63] text-sm mb-5 hover:text-[#D7CCC8] transition-colors">
            <ArrowLeft size={14} /> My Collections
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-2xl shadow-lg" style={{background: collection.cover_color ?? '#5D4037'}}>
              <FolderOpen size={26} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-[#F5F5F5]">{collection.title}</h1>
              {collection.description && (
                <p className="text-[#8D6E63] text-sm mt-1" style={{fontFamily:'var(--font-ui)'}}>{collection.description}</p>
              )}
              <p className="text-[#8D6E63] text-xs mt-2" style={{fontFamily:'var(--font-ui)'}}>
                {totalFiles} score{totalFiles !== 1 ? 's' : ''}
                {collection.profiles?.full_name && ` · by ${collection.profiles.full_name}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {files.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="font-display text-xl text-[#5D4037]">No scores in this collection</p>
            <p className="text-sm text-[#8D6E63]" style={{fontFamily:'var(--font-ui)'}}>Browse the library and add scores to this collection.</p>
            <Link href="/" className="btn btn-primary btn-sm">Browse Library</Link>
          </div>
        ) : (
          <>
            <div className="score-grid">
              {files.map((file: any, i: number) => <ScoreCard key={file.id} file={file} index={i} />)}
            </div>
            {totalPages > 1 && <Pagination current={page} total={totalPages} id={id} />}
          </>
        )}
      </main>
    </div>
  )
}
