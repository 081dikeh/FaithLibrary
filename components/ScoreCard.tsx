// components/ScoreCard.tsx
'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Download, Bookmark, BookmarkCheck, Music2 } from 'lucide-react'
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

// Set worker only on client
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

  // Measure card width so PDF fills it exactly
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setCardWidth(Math.floor(entry.contentRect.width))
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const onPdfLoad  = useCallback(() => setPdfReady(true), [])
  const onPdfError = useCallback(() => setPdfError(true), [])

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setBmLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    if (isBookmarked) {
      await supabase.from('bookmarks').delete()
        .match({ user_id: user.id, file_id: file.id })
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

  const date = new Date(file.created_at).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  const delays = ['','delay-50','delay-100','delay-150','delay-200',
                  'delay-250','delay-300','delay-400','delay-500']
  const delay = index < 9 ? delays[index] : ''

  return (
    <article
      className={`group bg-white rounded-xl border border-[#D7CCC8]
                  overflow-hidden flex flex-col
                  transition-all duration-200 ease-out
                  hover:-translate-y-1
                  hover:shadow-[0_8px_28px_rgba(62,39,35,0.14)]
                  animate-fade-up ${delay}`}
      style={{ animationFillMode: 'forwards' }}
    >
      {/* ── PDF Thumbnail ── */}
      <Link href={`/view/${file.id}`} className="block flex-shrink-0">
        <div ref={containerRef} className="w-full">
          {/* A4 aspect ratio */}
          <div className="relative w-full overflow-hidden bg-[#F5F5F5]"
            style={{ paddingBottom: '141.4%' }}>

            {/* Skeleton while loading */}
            {!pdfReady && !pdfError && (
              <div className="absolute inset-0 skeleton" />
            )}

            {/* PDF first page — only when cardWidth is measured */}
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

            {/* Fallback illustration */}
            {pdfError && (
              <div className="absolute inset-0 flex items-center justify-center
                              bg-gradient-to-br from-[#EFE9E7] to-[#D7CCC8]">
                <div className="absolute inset-0 flex flex-col justify-center
                                gap-[14%] px-[15%] opacity-15 pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-px bg-[#5D4037]" />
                  ))}
                </div>
                <Music2 size={28} className="text-[#8D6E63] relative z-10" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-[#3E2723]/0
                            group-hover:bg-[#3E2723]/55
                            transition-all duration-250
                            flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100
                               translate-y-2 group-hover:translate-y-0
                               transition-all duration-250
                               bg-white text-[#3E2723] text-[0.72rem]
                               font-semibold px-3 py-1.5 rounded-full shadow-md">
                View Score
              </span>
            </div>

            {/* Primary tag badge */}
            {file.tags?.[0] && (
              <div className="absolute top-2 left-2 z-10">
                <span className="inline-block px-1.5 py-0.5 rounded-full
                                 text-[0.58rem] font-bold uppercase tracking-wide
                                 bg-white/90 backdrop-blur-sm text-[#5D4037]
                                 border border-white/60 shadow-sm leading-none">
                  {file.tags[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* ── Info ── */}
      <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3">
        <Link href={`/view/${file.id}`}>
          <h3 className="font-display font-semibold text-[#3E2723] text-[0.8125rem]
                         leading-snug line-clamp-2 group-hover:text-[#5D4037]
                         transition-colors mb-1 min-h-[2.4em]">
            {file.title}
          </h3>
        </Link>

        {file.profiles?.full_name && (
          <p className="text-[0.7rem] text-[#8D6E63] truncate mb-0.5"
            style={{ fontFamily: 'var(--font-ui)' }}>
            {file.profiles.full_name}
          </p>
        )}

        {file.composer && (
          <p className="text-[0.7rem] text-[#5D4037] font-medium truncate mb-0.5"
            style={{ fontFamily: 'var(--font-ui)' }}>
            Composer: {file.composer}
          </p>
        )}

        <p className="text-[0.68rem] text-[#8D6E63] mt-auto pt-1 truncate"
          style={{ fontFamily: 'var(--font-ui)' }}>
          {date}
          {file.tags?.[1] && (
            <span className="text-[#D7CCC8]"> · {file.tags[1]}</span>
          )}
        </p>

        <div className="flex items-center justify-between mt-2 pt-2
                        border-t border-[#EFE9E7]">
          <div className="flex items-center gap-0.5">
            <button onClick={handleBookmark} disabled={bmLoading}
              aria-label="Bookmark"
              className={`btn-icon ${
                isBookmarked
                  ? 'text-[#5D4037] bg-[#EFE9E7]'
                  : 'text-[#D7CCC8] hover:text-[#5D4037]'
              }`}
              style={{ padding: '0.3rem', borderRadius: '6px' }}>
              {isBookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
            </button>
            <button onClick={handleDownload} aria-label="Download"
              className="btn-icon text-[#D7CCC8] hover:text-[#5D4037]"
              style={{ padding: '0.3rem', borderRadius: '6px' }}>
              <Download size={13} />
            </button>
          </div>

          {(file.download_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[0.62rem] text-[#D7CCC8]"
              style={{ fontFamily: 'var(--font-ui)' }}>
              <Download size={9} /> {file.download_count}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export function ScoreCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#D7CCC8] overflow-hidden">
      <div className="relative w-full" style={{ paddingBottom: '141.4%' }}>
        <div className="absolute inset-0 skeleton" />
      </div>
      <div className="px-3 pt-2.5 pb-3 space-y-2">
        <div className="h-3.5 skeleton rounded w-4/5" />
        <div className="h-3.5 skeleton rounded w-3/5" />
        <div className="h-3 skeleton rounded w-1/2 mt-1" />
        <div className="h-3 skeleton rounded w-2/3" />
        <div className="flex justify-between items-center pt-2
                        border-t border-[#EFE9E7] mt-2">
          <div className="flex gap-1">
            <div className="w-6 h-6 skeleton rounded" />
            <div className="w-6 h-6 skeleton rounded" />
          </div>
          <div className="h-3 w-8 skeleton rounded" />
        </div>
      </div>
    </div>
  )
}