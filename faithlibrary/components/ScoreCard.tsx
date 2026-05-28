// components/ScoreCard.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Download, Bookmark, BookmarkCheck, Music2, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { FileRecord } from '@/lib/types'

interface ScoreCardProps {
  file:        FileRecord
  bookmarked?: boolean
  index?:      number
}

// Renders the first page of a PDF onto a canvas using pdfjs-dist directly.
// This avoids react-pdf entirely and sidesteps the worker race condition.
function PdfThumb({ url, width }: { url: string; width: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready,  setReady]  = useState(false)
  const [error,  setError]  = useState(false)

  useEffect(() => {
    if (!canvasRef.current || width === 0) return
    let cancelled = false

    async function render() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

        const pdf  = await pdfjsLib.getDocument({ url, disableStream: true, disableAutoFetch: true }).promise
        const pg   = await pdf.getPage(1)

        if (cancelled || !canvasRef.current) return

        const baseViewport = pg.getViewport({ scale: 1 })
        const scale        = width / baseViewport.width
        const viewport     = pg.getViewport({ scale })

        const canvas = canvasRef.current
        canvas.width  = viewport.width
        canvas.height = viewport.height

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // pdfjs-dist v5 requires the `canvas` property in RenderParameters
        await pg.render({
          canvasContext: ctx,
          viewport,
          canvas,
        } as Parameters<typeof pg.render>[0]).promise

        if (!cancelled) setReady(true)
      } catch {
        if (!cancelled) setError(true)
      }
    }

    render()
    return () => { cancelled = true }
  }, [url, width])

  if (error) return null
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-cover"
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.4s' }}
    />
  )
}

export function ScoreCard({ file, bookmarked = false, index = 0 }: ScoreCardProps) {
  const supabase     = createClient()
  const containerRef = useRef<HTMLDivElement>(null)

  const [isBookmarked, setIsBookmarked] = useState(bookmarked)
  const [bmLoading,    setBmLoading]    = useState(false)
  const [cardWidth,    setCardWidth]    = useState(0)
  const [inView,       setInView]       = useState(false)
  const [thumbError,   setThumbError]   = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Track card width
    const ro = new ResizeObserver(entries => {
      setCardWidth(Math.floor(entries[0].contentRect.width))
    })
    ro.observe(el)

    // Only load PDF when card scrolls into view
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); io.disconnect() } },
      { rootMargin: '200px' }
    )
    io.observe(el)

    return () => { ro.disconnect(); io.disconnect() }
  }, [])

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
    return m < 12 ? `${m}mo ago` : `${Math.floor(m / 12)}y ago`
  })()

  const showPdf = inView && cardWidth > 0 && !thumbError

  return (
    <article className="group relative bg-white rounded-2xl overflow-hidden flex flex-col border border-[#E8E0DD] shadow-[0_1px_4px_rgba(62,39,35,0.06)] hover:shadow-[0_12px_32px_rgba(62,39,35,0.16)] hover:-translate-y-1 transition-all duration-200">

      <Link href={`/view/${file.id}`} className="block flex-shrink-0">
        <div ref={containerRef} className="w-full">
          <div className="relative w-full overflow-hidden bg-[#F0EAE8]" style={{ paddingBottom: '133%' }}>

            {/* Skeleton shown until PDF paints */}
            {!showPdf && !thumbError && (
              <div className="absolute inset-0 skeleton" />
            )}

            {/* PDF canvas — only mounted when in viewport */}
            {showPdf && (
              <div className="absolute inset-0">
                <PdfThumb url={file.file_url} width={cardWidth} />
              </div>
            )}

            {/* Fallback music staff */}
            {thumbError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#EFE9E7] to-[#D7CCC8]">
                <div className="absolute inset-0 flex flex-col justify-center gap-[13%] px-[12%] opacity-10 pointer-events-none">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-px bg-[#5D4037]" />)}
                </div>
                <Music2 size={24} className="text-[#8D6E63] relative z-10 opacity-60" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#3E2723]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4">
              <span className="flex items-center gap-1.5 bg-white text-[#3E2723] text-[0.7rem] font-semibold px-3 py-1.5 rounded-full shadow-lg">
                <Eye size={11} /> View Score
              </span>
            </div>

            {/* Tag pill */}
            {file.tags?.[0] && (
              <div className="absolute top-2 left-2 z-10">
                <span className="inline-block px-2 py-0.5 rounded-full text-[0.56rem] font-bold uppercase tracking-wider bg-white/90 text-[#5D4037] border border-white/50 shadow-sm">
                  {file.tags[0]}
                </span>
              </div>
            )}

            {/* Bookmark button */}
            <button onClick={handleBookmark} disabled={bmLoading} aria-label="Bookmark"
              className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-all duration-150 opacity-0 group-hover:opacity-100 ${isBookmarked ? 'bg-[#5D4037] text-white !opacity-100' : 'bg-white/90 text-[#8D6E63] hover:text-[#5D4037]'}`}>
              {isBookmarked ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
            </button>
          </div>
        </div>
      </Link>

      <div className="flex flex-col flex-1 px-3 pt-2.5 pb-2.5 gap-0.5">
        <Link href={`/view/${file.id}`}>
          <h3 className="font-display font-semibold text-[#3E2723] text-[0.78rem] leading-snug line-clamp-2 group-hover:text-[#5D4037] transition-colors min-h-[2.3em]">
            {file.title}
          </h3>
        </Link>

        {file.composer && (
          <p className="text-[0.67rem] text-[#5D4037] font-medium truncate" style={{fontFamily:'var(--font-ui)'}}>
            {file.composer}
          </p>
        )}

        {file.profiles?.full_name && (
          <p className="text-[0.65rem] text-[#A1887F] truncate" style={{fontFamily:'var(--font-ui)'}}>
            by {file.profiles.full_name}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#F0EAE8]">
          <span className="text-[0.62rem] text-[#C4AFA9]" style={{fontFamily:'var(--font-ui)'}}>
            {timeAgo}
            {(file.download_count ?? 0) > 0 && (
              <> · <Download size={8} className="inline -mt-0.5" /> {file.download_count}</>
            )}
          </span>
          <button onClick={handleDownload} aria-label="Download"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[#C4AFA9] hover:text-[#5D4037] hover:bg-[#EFE9E7] transition-all duration-150">
            <Download size={12} />
          </button>
        </div>
      </div>
    </article>
  )
}

export function ScoreCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E0DD] overflow-hidden shadow-[0_1px_4px_rgba(62,39,35,0.06)]">
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
