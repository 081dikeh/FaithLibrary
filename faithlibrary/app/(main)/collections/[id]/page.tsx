// app/(main)/collections/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ScoreCard } from '@/components/ScoreCard'
import { Pagination } from '@/components/Pagination'
import { ArrowLeft, FolderOpen } from 'lucide-react'

const PAGE_SIZE = 10

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
    <div style={{ minHeight: '100vh', background: '#F7F4F2' }} className="grain">
      <Navbar />

      {/* ── Collection hero ── */}
      <div style={{ background: '#1C0E0A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -64, right: -64, width: 280, height: 280, borderRadius: '50%', background: 'rgba(93,64,55,0.25)', filter: 'blur(56px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 40px', position: 'relative' }}>
          <Link href="/collections" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#A08070', fontSize: '0.8125rem', textDecoration: 'none',
            marginBottom: 20, fontFamily: 'var(--font-ui)',
          }}>
            <ArrowLeft size={13} /> My Collections
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: collection.cover_color ?? '#5D4037',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              <FolderOpen size={24} style={{ color: 'rgba(255,255,255,0.9)' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 700, color: '#F7F4F2', lineHeight: 1.1 }}>
                {collection.title}
              </h1>
              {collection.description && (
                <p style={{ color: '#A08070', fontSize: '0.875rem', marginTop: 4, fontFamily: 'var(--font-ui)' }}>
                  {collection.description}
                </p>
              )}
              <p style={{ color: '#7A6055', fontSize: '0.75rem', marginTop: 6, fontFamily: 'var(--font-ui)' }}>
                {totalFiles} score{totalFiles !== 1 ? 's' : ''}
                {collection.profiles?.full_name && ` · by ${collection.profiles.full_name}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Score grid ── */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 56px' }}>
        {files.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '72px 0', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F2EDE9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8D6E63' }}>
              <FolderOpen size={28} />
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#5D4037', fontWeight: 700 }}>
              No scores in this collection
            </p>
            <p style={{ fontSize: '0.875rem', color: '#9E8070', fontFamily: 'var(--font-ui)' }}>
              Browse the library and add scores to this collection.
            </p>
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
              padding: '9px 20px', borderRadius: 10,
              background: '#3E2723', color: '#F7F4F2',
              fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none',
              fontFamily: 'var(--font-ui)', boxShadow: '0 2px 8px rgba(62,39,35,0.22)',
            }}>
              Browse Library
            </Link>
          </div>
        ) : (
          <>
            <div className="score-grid">
              {files.map((file: any, i: number) => <ScoreCard key={file.id} file={file} index={i} />)}
            </div>
            {totalPages > 1 && (
              <Pagination current={page} total={totalPages} buildHref={p => `/collections/${id}?page=${p}`} />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}