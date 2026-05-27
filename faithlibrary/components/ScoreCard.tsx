// components/ScoreCard.tsx
'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Download, Bookmark, BookmarkCheck, Music2, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { FileRecord } from '@/lib/types'

// ── Dynamic import prevents react-pdf from running on the server ──────────────
const Document = dynamic(
  () => import('react-pdf').then(m => m.Document),
  { ssr: false, loading: () => null }
)
const Page = dynamic(
  () => import('react-pdf').then(m => m.Page),
  { ssr: false, loading: () => null }
)

if (typeof window !== 'undefined') {
  import('react-pdf').then(({ pdfjs }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  })
}

interface ScoreCardProps {
  file:        FileRecord
  bookmarked?: boolean
  index?:      number
}

export function ScoreCard({ file, bookmarked = false, index = 0 }: ScoreCardProps) {
  const supabase     = createClient()
  const containerRef = useRef<HTMLDivElement>(null)

  const [isBookmarked, setIsBookmarked] = useState(bookmarked)
  const [bmLoading,    setBmLoading]    = useState(false)
  const [pdfReady,     setPdfReady]     = useState(false)
  const [pdfError,     setPdfError]     = useState(false)
  const [cardWidth,    setCardWidth]    = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setCardWidth(Math.floor(entry.contentRect.width))
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const onPdfLoad  = useCallback(() => setPdfReady(true),  [])
  const onPdfError = useCallback(() => setPdfError(true), [])

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setBmLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().match({ user_id: user.id, file_id: file.id })
      setIsBookmarked(false)
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, file_id: file.id })
      setIsBookmarked(true)
    }
    setBmLoading(false)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    await supabase.rpc('increment_download_count', { file_id: file.id })
    const a = document.createElement('a')
    a.href = file.file_url; a.download = file.title; a.target = '_blank'; a.click()
  }

  const timeAgo = (() => {
    const diff = Date.now() - new Date(file.created_at).getTime()
    const d = Math.floor(diff / 86400000)
    if (d === 0) return 'Today'
    if (d === 1) return 'Yesterday'
    if (d < 30)  return `${d}d ago`
    const m = Math.floor(d / 30)
    if (m < 12)  return `${m}mo ago`
    return `${Math.floor(m / 12)}y ago`
  })()

  const delays = ['','delay-50','delay-100','delay-150','delay-200',
                  'delay-250','delay-300','delay-400','delay-500']
  const delay = index < 9 ? delays[index] : ''

  return (
    <article
      className={`group relative bg-white rounded-2xl overflow-hidden flex flex-col
                  border border-[#E8E0DD]
                  shadow-[0_1px_4px_rgba(62,39,35,0.06)]
                  hover:shadow-[0_12px_32px_rgba(62,39,35,0.16)]
                  hover:-translate-y-1.5
                  transition-all duration-250 ease-out
                  animate-fade-up ${delay}`}
      style={{ animationFillMode: 'forwards' }}
    >
      {/* ── PDF Thumbnail ─────────────────────────────────────────────────── */}
      <Link href={`/view/${file.id}`} className="block flex-shrink-0 relative">
        <div ref={containerRef} className="w-full">
          {/* A4 ratio — taller crop for 5-col grid */}
          <div className="relative w-full overflow-hidden bg-[#F0EAE8]"
            style={{ paddingBottom: '133%' }}>

            {/* Shimmer skeleton while PDF loads */}
            {!pdfReady && !pdfError && (
              <div className="absolute inset-0 skeleton" />
            )}

            {/* Live PDF first page */}
            {!pdfError && cardWidth > 0 && (
              <div className={`absolute inset-0 transition-opacity duration-500
                               ${pdfReady ? 'opacity-100' : 'opacity-0'}`}>
                <Document
                  file={file.file_url}
                  onLoadSuccess={onPdfLoad}
                  onLoadError={onPdfError}
                  loading="" error=""
                >
                  <Page
                    pageNumber={1}
                    width={cardWidth}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    loading="" error=""
                    className="score-thumb-page"
                  />
                </Document>
              </div>
            )}

            {/* Fallback — music staff lines */}
            {pdfError && (
              <div className="absolute inset-0 flex items-center justify-center
                              bg-gradient-to-br from-[#EFE9E7] to-[#D7CCC8]">
                <div className="absolute inset-0 flex flex-col justify-center
                                gap-[13%] px-[12%] opacity-10 pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-px bg-[#5D4037]" />
                  ))}
                </div>
                <Music2 size={24} className="text-[#8D6E63] relative z-10 opacity-60" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#3E2723]/80 via-[#3E2723]/20 to-transparent
                            opacity-0 group-hover:opacity-100
                            transition-opacity duration-250
                            flex items-end justify-center pb-4">
              <span className="flex items-center gap-1.5 bg-white text-[#3E2723]
                               text-[0.7rem] font-semibold px-3 py-1.5 rounded-full
                               shadow-lg translate-y-2 group-hover:translate-y-0
                               transition-transform duration-250">
                <Eye size={11} /> View Score
              </span>
            </div>

            {/* Tag pill — top-left */}
            {file.tags?.[0] && (
              <div className="absolute top-2 left-2 z-10">
                <span className="inline-block px-2 py-0.5 rounded-full
                                 text-[0.56rem] font-bold uppercase tracking-wider leading-none
                                 bg-white/90 backdrop-blur-sm text-[#5D4037]
                                 border border-white/50 shadow-sm">
                  {file.tags[0]}
                </span>
              </div>
            )}

            {/* Bookmark pill — top-right */}
            <button
              onClick={handleBookmark}
              disabled={bmLoading}
              aria-label="Bookmark"
              className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center
                          justify-center shadow-sm backdrop-blur-sm
                          transition-all duration-150 opacity-0 group-hover:opacity-100
                          ${isBookmarked
                            ? 'bg-[#5D4037] text-white opacity-100'
                            : 'bg-white/90 text-[#8D6E63] hover:text-[#5D4037]'
                          }`}
            >
              {isBookmarked ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
            </button>
          </div>
        </div>
      </Link>

      {/* ── Info panel ────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-3 pt-2.5 pb-2.5 gap-0.5">

        {/* Title */}
        <Link href={`/view/${file.id}`}>
          <h3 className="font-display font-semibold text-[#3E2723] text-[0.78rem]
                         leading-snug line-clamp-2 group-hover:text-[#5D4037]
                         transition-colors min-h-[2.3em]">
            {file.title}
          </h3>
        </Link>

        {/* Composer */}
        {file.composer && (
          <p className="text-[0.67rem] text-[#5D4037] font-medium truncate"
            style={{ fontFamily: 'var(--font-ui)' }}>
            {file.composer}
          </p>
        )}

        {/* Uploader */}
        {file.profiles?.full_name && (
          <p className="text-[0.65rem] text-[#A1887F] truncate"
            style={{ fontFamily: 'var(--font-ui)' }}>
            by {file.profiles.full_name}
          </p>
        )}

        {/* Footer row — time + download count + download btn */}
        <div className="flex items-center justify-between mt-auto pt-2
                        border-t border-[#F0EAE8]">
          <span className="text-[0.62rem] text-[#C4AFA9]"
            style={{ fontFamily: 'var(--font-ui)' }}>
            {timeAgo}
            {(file.download_count ?? 0) > 0 && (
              <> · <Download size={8} className="inline -mt-0.5" /> {file.download_count}</>
            )}
          </span>

          <button
            onClick={handleDownload}
            aria-label="Download"
            className="w-6 h-6 rounded-lg flex items-center justify-center
                       text-[#C4AFA9] hover:text-[#5D4037] hover:bg-[#EFE9E7]
                       transition-all duration-150"
          >
            <Download size={12} />
          </button>
        </div>
      </div>
    </article>
  )
}

export function ScoreCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E0DD] overflow-hidden
                    shadow-[0_1px_4px_rgba(62,39,35,0.06)]">
      <div className="relative w-full" style={{ paddingBottom: '133%' }}>
        <div className="absolute inset-0 skeleton" />
      </div>
      <div className="px-3 pt-2.5 pb-2.5 space-y-1.5">
        <div className="h-3 skeleton rounded w-5/6" />
        <div className="h-3 skeleton rounded w-4/6" />
        <div className="h-2.5 skeleton rounded w-3/6" />
        <div className="flex justify-between items-center pt-2 border-t border-[#F0EAE8] mt-1">
          <div className="h-2.5 w-12 skeleton rounded" />
          <div className="w-6 h-6 skeleton rounded-lg" />
        </div>
      </div>
    </div>
  )
}