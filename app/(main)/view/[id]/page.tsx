// app/(main)/view/[id]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { PDFViewerClient } from '@/components/PDFViewerClient'
import { ShareButton, ShareButtonFull } from '@/components/ShareButtons'
import { Download, Calendar, Tag, Eye, Music2, ArrowLeft, Globe, Lock } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

interface ViewPageProps {
  params: Promise<{ id: string }>
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: file, error } = await supabase
    .from('files')
    .select('*, profiles(full_name, avatar_url)')
    .eq('id', id)
    .single()

  if (error || !file) notFound()

  const f    = file as FileRecord & { profiles?: { full_name: string } }
  const date = new Date(f.created_at).toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-[#D7CCC8] sticky top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="btn-icon text-[#8D6E63] flex-shrink-0" style={{padding:'0.35rem'}}>
            <ArrowLeft size={17} />
          </Link>
          <div className="h-5 w-px bg-[#D7CCC8] flex-shrink-0" />
          <h1 className="font-display text-sm font-semibold text-[#3E2723] truncate flex-1">
            {f.title}
          </h1>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a href={f.file_url} download={f.title} target="_blank" rel="noreferrer"
              className="btn btn-sm btn-primary hidden sm:flex"
              style={{padding:'0.4rem 0.875rem', fontSize:'0.8rem'}}>
              <Download size={13} /> Download
            </a>
            <ShareButton title={f.title} />
          </div>
        </div>
      </div>

      {/* ── Layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8
                      flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* ── PDF Viewer ── */}
        <main className="flex-1 min-w-0">
          <div className="bg-[#242424] rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-6">
            <PDFViewerClient url={f.file_url} />
          </div>
        </main>

        {/* ── Sidebar ── */}
        <aside className="lg:w-72 xl:w-80 flex-shrink-0 space-y-4">

          {/* Info card */}
          <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
            {/* Cover */}
            <div className="h-40 bg-gradient-to-br from-[#EFE9E7] to-[#D7CCC8]
                            flex items-center justify-center">
              {f.thumbnail_url ? (
                <img src={f.thumbnail_url} alt={f.title}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#5D4037]/10
                                flex items-center justify-center text-[#5D4037]">
                  <Music2 size={24} />
                </div>
              )}
            </div>

            <div className="p-5">
              {/* Tags */}
              {f.tags && f.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {f.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="badge badge-walnut">{tag}</span>
                  ))}
                  {f.tags.length > 3 && (
                    <span className="badge badge-sand">+{f.tags.length - 3}</span>
                  )}
                </div>
              )}

              <h2 className="font-display text-lg font-semibold text-[#3E2723]
                             leading-snug mb-2">
                {f.title}
              </h2>

              {f.description && (
                <p className="text-sm text-[#8D6E63] leading-relaxed mb-4"
                  style={{fontFamily:'var(--font-ui)'}}>
                  {f.description}
                </p>
              )}

              {/* Meta */}
              <div className="space-y-2 text-sm text-[#8D6E63]" style={{fontFamily:'var(--font-ui)'}}>
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="flex-shrink-0 text-[#D7CCC8]" />
                  <span>{date}</span>
                </div>
                {f.profiles?.full_name && (
                  <div className="flex items-center gap-2">
                    <Eye size={13} className="flex-shrink-0 text-[#D7CCC8]" />
                    <span>By {f.profiles.full_name}</span>
                  </div>
                )}
                {(f.download_count ?? 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <Download size={13} className="flex-shrink-0 text-[#D7CCC8]" />
                    <span>{f.download_count} downloads</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {f.is_public
                    ? <><Globe size={13} className="flex-shrink-0 text-[#D7CCC8]" /><span>Public</span></>
                    : <><Lock size={13} className="flex-shrink-0 text-[#D7CCC8]" /><span>Private</span></>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* All tags */}
          {f.tags && f.tags.length > 3 && (
            <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-5">
              <div className="flex items-center gap-1.5 text-[#5D4037] font-semibold text-sm mb-3">
                <Tag size={13} /> All Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {f.tags.map(tag => (
                  <span key={tag} className="badge badge-sand">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-5 space-y-2.5">
            <a
              href={f.file_url} download={f.title} target="_blank" rel="noreferrer"
              className="btn btn-primary w-full"
              style={{padding:'0.7rem', justifyContent:'center'}}
            >
              <Download size={15} /> Download Score
            </a>
            <ShareButtonFull title={f.title} />
          </div>
        </aside>
      </div>
    </div>
  )
}