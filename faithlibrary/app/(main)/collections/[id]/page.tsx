// app/(main)/collections/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ScoreCard } from '@/components/ScoreCard'
import { ArrowLeft, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react'

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

function Pagination({ current, total, id }: { current: number; total: number; id: string }) {
  const build = (p: number) => `/collections/${id}?page=${p}`
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

interface CollectionPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const { id } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
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

  const files = (items ?? []).map((i: any) => i.files).filter(Boolean)
  const totalFiles = count ?? 0
  const totalPages = Math.ceil(totalFiles / PAGE_SIZE)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bone)' }} className="grain">
      <Navbar />

      {/* ── Collection hero ── */}
      <div style={{ background: 'var(--roasted)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -64, right: -64, width: 280, height: 280, borderRadius: '50%', background: 'rgba(93,64,55,0.35)', filter: 'blur(56px)', pointerEvents: 'none' }} />
        <div className="page-container" style={{ position: 'relative', paddingTop: 32, paddingBottom: 40 }}>
          <Link href="/collections" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--ochre)', fontSize: '0.8125rem', textDecoration: 'none',
            marginBottom: 20, transition: 'color 0.15s',
          }}>
            <ArrowLeft size={13} /> My Collections
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: collection.cover_color ?? 'var(--walnut)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              <FolderOpen size={24} style={{ color: 'rgba(255,255,255,0.9)' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 700, color: 'var(--bone)', lineHeight: 1.1 }}>
                {collection.title}
              </h1>
              {collection.description && (
                <p style={{ color: 'var(--ochre)', fontSize: '0.875rem', marginTop: 4, fontFamily: 'var(--font-ui)' }}>
                  {collection.description}
                </p>
              )}
              <p style={{ color: 'var(--ochre)', fontSize: '0.75rem', marginTop: 6, fontFamily: 'var(--font-ui)', opacity: 0.8 }}>
                {totalFiles} score{totalFiles !== 1 ? 's' : ''}
                {collection.profiles?.full_name && ` · by ${collection.profiles.full_name}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Score grid ── */}
      <main className="page-container" style={{ paddingTop: 32, paddingBottom: 56 }}>
        {files.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '80px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--walnut)', fontWeight: 600 }}>No scores in this collection</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Browse the library and add scores to this collection.</p>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '9px 18px', borderRadius: 9, background: 'var(--walnut)', color: 'var(--bone)', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none' }}>
              Browse Library
            </Link>
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
      <Footer />
    </div>
  )
}