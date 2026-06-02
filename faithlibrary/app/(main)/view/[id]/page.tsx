// app/(main)/view/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { PDFViewerClient } from '@/components/PDFViewerClient'
import { ShareButton, ShareButtonFull } from '@/components/ShareButtons'
import { AddToCollectionButton } from '@/components/AddToCollectionButton'
import { RelatedScores } from '@/components/RelatedScores'
import { ViewTracker } from '@/components/ViewTracker'
import { CommentSection } from '@/components/CommentSection'
import { Download, Calendar, Tag, Music2, ArrowLeft, Globe, Lock, Printer, User } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

const BASE_URL = 'https://faith-library.vercel.app'

interface ViewPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ViewPageProps): Promise<Metadata> {
  const { id }   = await params
  const supabase = await createClient()
  const { data } = await supabase.from('files').select('title, description, composer, tags').eq('id', id).single()
  if (!data) return { title: 'Score Not Found — FaithLibrary' }
  const description = [data.composer ? `By ${data.composer}` : null, data.description, data.tags?.[0]].filter(Boolean).join(' · ') || 'Sacred choral music score on FaithLibrary'
  return {
    title: `${data.title} — FaithLibrary`,
    description,
    openGraph: { title: data.title, description, url: `${BASE_URL}/view/${id}`, siteName: 'FaithLibrary', type: 'article' },
    twitter:   { card: 'summary', title: data.title, description },
  }
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: file, error } = await supabase
    .from('files').select('*, profiles(full_name, avatar_url)').eq('id', id).single()
  if (error || !file) notFound()

  const f    = file as FileRecord & { profiles?: { full_name: string; avatar_url?: string } }
  const date = new Date(f.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  const uploaderInitials = f.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  const metaRow = (icon: React.ReactNode, label: string, value: string) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--ochre)', flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 1 }}>{label}</p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bone)' }} className="grain">
      <Navbar />
      <ViewTracker fileId={f.id} />

      {/* ── Sticky top bar ── */}
      <div style={{
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 'var(--nav-h)', zIndex: 40,
      }}>
        <div className="page-container" style={{ height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--surface-3)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', textDecoration: 'none',
            flexShrink: 0, transition: 'all 0.15s',
          }}>
            <ArrowLeft size={15} />
          </Link>
          <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '0.9375rem',
            fontWeight: 600, color: 'var(--text-primary)',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{f.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <a href={f.file_url} download={f.title} target="_blank" rel="noreferrer"
              className="btn btn-primary btn-sm"
              style={{ display: 'none' }}
            >
              <Download size={13} /> Download
            </a>
            <style>{`@media (min-width: 640px) { .dl-btn-top { display: inline-flex !important; } }`}</style>
            <a href={f.file_url} download={f.title} target="_blank" rel="noreferrer"
              className="btn btn-primary btn-sm dl-btn-top"
              style={{ display: 'none', padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}>
              <Download size={13} /> Download
            </a>
            <Link href={`/print/${f.id}`} target="_blank"
              className="btn btn-secondary btn-sm"
              style={{ display: 'none', padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}>
              <Printer size={13} /> Print
            </Link>
            <style>{`@media (min-width: 768px) { .print-btn-top { display: inline-flex !important; } }`}</style>
            <Link href={`/print/${f.id}`} target="_blank"
              className="btn btn-secondary btn-sm print-btn-top"
              style={{ display: 'none', padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}>
              <Printer size={13} /> Print
            </Link>
            <ShareButton title={f.title} />
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="page-container" style={{
        paddingTop: 24, paddingBottom: 32,
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }} className="view-layout">
          {/* PDF Viewer */}
          <main style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: '#1E1E1E', borderRadius: 16,
              overflow: 'hidden', boxShadow: 'var(--shadow-deep)',
              padding: '20px 16px',
            }}>
              <PDFViewerClient url={f.file_url} />
            </div>
          </main>

          {/* Sidebar */}
          <aside style={{ width: 288, flexShrink: 0 }} className="view-sidebar">

            {/* Uploader card */}
            <div style={{
              background: 'var(--surface)', borderRadius: 14,
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
              overflow: 'hidden', marginBottom: 12,
            }}>
              {/* Header band */}
              <div style={{
                background: 'var(--roasted)', padding: '16px 16px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'var(--walnut)',
                  border: '2px solid rgba(141,110,99,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--sand)', fontWeight: 700, fontSize: '0.875rem',
                  fontFamily: 'var(--font-display)',
                }}>
                  {f.profiles?.avatar_url
                    ? <img src={f.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    : uploaderInitials}
                </div>
                <div>
                  <p style={{ fontSize: '0.68rem', color: 'var(--ochre)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Uploaded by</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--bone)', fontFamily: 'var(--font-ui)' }}>
                    {f.profiles?.full_name ?? 'Anonymous'}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {f.tags && f.tags.length > 0 && (
                <div style={{ padding: '12px 14px 0' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {f.tags.map(tag => (
                      <span key={tag} style={{
                        padding: '3px 9px', borderRadius: 99,
                        fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                        background: 'var(--surface-3)', border: '1px solid var(--border)',
                        color: 'var(--walnut)',
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div style={{ padding: '10px 14px 0' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.125rem',
                  fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25,
                }}>{f.title}</h2>
                {f.description && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.55, fontFamily: 'var(--font-ui)' }}>
                    {f.description}
                  </p>
                )}
              </div>

              {/* Meta rows */}
              <div style={{ padding: '2px 14px 12px' }}>
                {f.composer && metaRow(<Music2 size={13} />, 'Composer', f.composer)}
                {f.arranger && metaRow(<Music2 size={13} />, 'Arranged by', f.arranger)}
                {f.voice_parts && metaRow(<User size={13} />, 'Voice parts', f.voice_parts)}
                {metaRow(<Calendar size={13} />, 'Published', date)}
                {metaRow(f.is_public ? <Globe size={13} /> : <Lock size={13} />, 'Visibility', f.is_public ? 'Public' : 'Private')}
                {(f.download_count ?? 0) > 0 && metaRow(<Download size={13} />, 'Downloads', String(f.download_count))}
              </div>
            </div>

            {/* Actions card */}
            <div style={{
              background: 'var(--surface)', borderRadius: 14,
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
              padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <a href={f.file_url} download={f.title} target="_blank" rel="noreferrer"
                className="btn btn-primary"
                style={{ justifyContent: 'center', padding: '0.7rem' }}>
                <Download size={15} /> Download Score
              </a>
              <ShareButtonFull title={f.title} />
              <Link href={`/print/${f.id}`} target="_blank"
                className="btn btn-secondary"
                style={{ justifyContent: 'center', padding: '0.7rem' }}>
                <Printer size={15} /> Print Score
              </Link>
              <AddToCollectionButton fileId={f.id} />
            </div>
          </aside>
        </div>

        {/* Related scores */}
        {f.tags && f.tags.length > 0 && <RelatedScores fileId={f.id} tags={f.tags} />}

        {/* Comments */}
        <CommentSection fileId={f.id} />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .view-layout { flex-direction: column !important; }
          .view-sidebar { width: 100% !important; }
        }
      `}</style>

      <Footer />
    </div>
  )
}