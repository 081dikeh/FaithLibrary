// components/ScoreCard.tsx
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Download, Bookmark, BookmarkCheck, Music2, Eye, ArrowDownToLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { FileRecord } from '@/lib/types'

// ── Worker singleton ─────────────────────────────────────────
// Uses pdfjs-dist directly (NOT via react-pdf) for canvas rendering.
// Worker file must match: copy from react-pdf's bundled pdfjs:
//   cp node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
let workerReady = false
let renderQueue = Promise.resolve()
const enqueue = (fn: () => Promise<void>) => { renderQueue = renderQueue.then(fn, fn) }

// ── PDF Thumbnail ────────────────────────────────────────────
function PdfThumb({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready,  setReady]  = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false

    enqueue(async () => {
      if (cancelled) return
      try {
        // Dynamically import pdfjs-dist — safe in browser context
        const pdfjs = await import('pdfjs-dist/build/pdf.mjs' as any)

        if (!workerReady) {
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
          workerReady = true
        }

        // Wait one frame so parent has real clientWidth
        await new Promise<void>(r => requestAnimationFrame(() => r()))
        if (cancelled) return

        const w = canvas.parentElement?.clientWidth || 220

        const pdf = await pdfjs.getDocument({
          url,
          disableRange: true,
          disableStream: true,
          disableAutoFetch: true,
          cMapUrl: '/cmaps/',
          cMapPacked: true,
        }).promise

        if (cancelled) { pdf.destroy(); return }

        const pg = await pdf.getPage(1)
        if (cancelled) { pdf.destroy(); return }

        const vp = pg.getViewport({ scale: w / pg.getViewport({ scale: 1 }).width })
        canvas.width  = vp.width
        canvas.height = vp.height

        const ctx = canvas.getContext('2d')
        if (!ctx || cancelled) { pdf.destroy(); return }

        await pg.render({ canvasContext: ctx, viewport: vp } as any).promise
        pdf.destroy()
        if (!cancelled) setReady(true)
      } catch (e) {
        console.error('PDF thumb error:', e)
        if (!cancelled) setFailed(true)
      }
    })

    return () => { cancelled = true }
  }, [url])

  if (failed) return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#EFE9E7]">
      <Music2 size={28} className="text-[#C4B5AF]" />
    </div>
  )

  return (
    <>
      {!ready && <div className="absolute inset-0 bg-[#EFE9E7] animate-pulse" />}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', opacity: ready ? 1 : 0, transition: 'opacity 0.45s ease' }}
      />
    </>
  )
}

// ── Score Card ───────────────────────────────────────────────
interface ScoreCardProps { file: FileRecord; bookmarked?: boolean; index?: number }

export function ScoreCard({ file, bookmarked = false, index = 0 }: ScoreCardProps) {
  const supabase = createClient()
  const thumbRef = useRef<HTMLDivElement>(null)
  const [isBookmarked, setIsBookmarked] = useState(bookmarked)
  const [bmLoading,    setBmLoading]    = useState(false)
  const [inView,       setInView]       = useState(false)

  useEffect(() => {
    const el = thumbRef.current; if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect() } },
      { rootMargin: '600px' }
    )
    io.observe(el); return () => io.disconnect()
  }, [])

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); setBmLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { window.location.href = '/login'; return }
    const uid = session.user.id
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().match({ user_id: uid, file_id: file.id })
      setIsBookmarked(false)
    } else {
      await supabase.from('bookmarks').insert({ user_id: uid, file_id: file.id })
      setIsBookmarked(true)
    }
    setBmLoading(false)
  }

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    await supabase.rpc('increment_download_count', { file_id: file.id })
    const a = document.createElement('a')
    a.href = file.file_url; a.download = file.title; a.target = '_blank'; a.click()
  }, [file.id, file.file_url, file.title])

  const timeAgo = (() => {
    const d = Math.floor((Date.now() - new Date(file.created_at).getTime()) / 86400000)
    if (d === 0) return 'Today'; if (d === 1) return 'Yesterday'
    if (d < 30) return `${d}d ago`
    const m = Math.floor(d / 30); return m < 12 ? `${m}mo ago` : `${Math.floor(m / 12)}y ago`
  })()

  return (
    <article className="group relative bg-white rounded-xl overflow-hidden flex flex-col border border-[#D7CCC8] hover:shadow-[0_8px_28px_rgba(62,39,35,0.14)] hover:-translate-y-1 transition-all duration-200">
      <Link href={`/view/${file.id}`} className="block flex-shrink-0">
        <div ref={thumbRef} className="relative w-full overflow-hidden bg-[#EFE9E7]"
          style={{ paddingBottom: '141.4%' }}>
          {inView
            ? <PdfThumb url={file.file_url} />
            : <div className="absolute inset-0 bg-[#EFE9E7] animate-pulse" />
          }
          <div className="absolute inset-0 bg-[#3E2723]/0 group-hover:bg-[#3E2723]/55 transition-all duration-200 flex items-end p-2.5 z-10">
            <div className="opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 bg-white/95 text-[#3E2723] text-[0.68rem] font-bold px-2.5 py-1.5 rounded-full">
                <Eye size={10} /> View Score
              </span>
              <button onClick={handleDownload} aria-label="Quick download"
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/20 border border-white/40 text-white hover:bg-white/35 transition-colors">
                <ArrowDownToLine size={10} />
              </button>
            </div>
          </div>
          {file.tags?.[0] && (
            <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full text-[0.58rem] font-bold uppercase tracking-wide"
              style={{ background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(6px)', color: '#5D4037', lineHeight: 1.6 }}>
              {file.tags[0]}
            </span>
          )}
          <button onClick={handleBookmark} disabled={bmLoading} aria-label="Bookmark"
            className={`absolute top-2 right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all
              ${isBookmarked ? 'bg-[#5D4037] text-white opacity-100' : 'bg-white/90 text-[#8D6E63] opacity-0 group-hover:opacity-100'}`}>
            {isBookmarked ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
          </button>
        </div>
      </Link>

      <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3">
        <Link href={`/view/${file.id}`} className="no-underline">
          <h3 className="font-display font-semibold text-[#3E2723] text-[0.8125rem] leading-snug group-hover:text-[#5D4037] transition-colors mb-1"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.4em' }}>
            {file.title}
          </h3>
        </Link>
        {file.composer && <p className="text-[0.7rem] text-[#5D4037] font-medium truncate mb-0.5">{file.composer}</p>}
        {file.profiles?.full_name && <p className="text-[0.7rem] text-[#8D6E63] truncate mb-0.5">{file.profiles.full_name}</p>}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#EFE9E7]">
          <span className="text-[0.68rem] text-[#8D6E63] flex items-center gap-1">
            {timeAgo}
            {(file.download_count ?? 0) > 0 && <><span className="opacity-30">·</span><Download size={8} />{file.download_count}</>}
          </span>
          <button onClick={handleDownload} aria-label="Download"
            className="w-6 h-6 rounded flex items-center justify-center text-[#C4B5AF] hover:bg-[#EFE9E7] hover:text-[#5D4037] transition-all">
            <Download size={12} />
          </button>
        </div>
      </div>
    </article>
  )
}

export function ScoreCardSkeleton({ index }: { index?: number } = {}) {
  return (
    <div className="bg-white rounded-xl border border-[#D7CCC8] overflow-hidden">
      <div className="relative w-full bg-[#EFE9E7] animate-pulse" style={{ paddingBottom: '141.4%' }} />
      <div className="px-3 pt-2.5 pb-3 space-y-1.5">
        <div className="h-3.5 bg-[#EFE9E7] animate-pulse rounded w-4/5" />
        <div className="h-3.5 bg-[#EFE9E7] animate-pulse rounded w-3/5" />
        <div className="h-3   bg-[#EFE9E7] animate-pulse rounded w-1/2" />
        <div className="flex justify-between pt-2 border-t border-[#EFE9E7] mt-1">
          <div className="h-2.5 w-14 bg-[#EFE9E7] animate-pulse rounded" />
          <div className="w-6 h-6 bg-[#EFE9E7] animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}