// components/ScoreCard.tsx — UI rewrite, all functionality preserved exactly
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Download, Bookmark, BookmarkCheck, Music2, Eye, ArrowDownToLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { FileRecord } from '@/lib/types'

// ── Worker singleton + serial queue ──────────────────────────
let workerReady = false
let renderQueue = Promise.resolve()
const enqueue = (fn: () => Promise<void>) => { renderQueue = renderQueue.then(fn, fn) }

// ── PDF Thumbnail ─────────────────────────────────────────────
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
        const pdfjs = await import('pdfjs-dist')
        if (!workerReady) {
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
          workerReady = true
        }
        await new Promise<void>(r => requestAnimationFrame(() => r()))
        if (cancelled) return
        const w = canvas.parentElement?.clientWidth || 220
        const pdf = await pdfjs.getDocument({
          url, cMapUrl: '/cmaps/', cMapPacked: true,
          disableRange: true, disableStream: true, disableAutoFetch: true,
        }).promise
        if (cancelled) { pdf.destroy(); return }
        const pg = await pdf.getPage(1)
        if (cancelled) { pdf.destroy(); return }
        const vp = pg.getViewport({ scale: w / pg.getViewport({ scale: 1 }).width })
        canvas.width = vp.width; canvas.height = vp.height
        const ctx = canvas.getContext('2d')
        if (!ctx || cancelled) { pdf.destroy(); return }
        await pg.render({ canvasContext: ctx, viewport: vp } as any).promise
        pdf.destroy()
        if (!cancelled) setReady(true)
      } catch { if (!cancelled) setFailed(true) }
    })
    return () => { cancelled = true }
  }, [url])

  if (failed) return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#F2EDE9' }}>
      <Music2 size={24} style={{ color: '#C4B5AF' }} />
    </div>
  )
  return (
    <>
      {!ready && (
        <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(135deg, #F2EDE9 0%, #EAE4E0 100%)' }} />
      )}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }} />
    </>
  )
}

// ── Score Card ────────────────────────────────────────────────
interface ScoreCardProps { file: FileRecord; bookmarked?: boolean; index?: number }

export function ScoreCard({ file, bookmarked = false, index = 0 }: ScoreCardProps) {
  const supabase = createClient()
  const thumbRef = useRef<HTMLDivElement>(null)
  const [isBookmarked, setIsBookmarked] = useState(bookmarked)
  const [bmLoading,    setBmLoading]    = useState(false)
  const [inView,       setInView]       = useState(false)
  const [hovered,      setHovered]      = useState(false)

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
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: `1px solid ${hovered ? '#C4B5AF' : '#E8E0DC'}`,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 40px rgba(62,39,35,0.13), 0 2px 8px rgba(62,39,35,0.06)'
          : '0 1px 3px rgba(62,39,35,0.05), 0 1px 6px rgba(62,39,35,0.04)',
        transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease, border-color 0.2s',
        position: 'relative',
      }}
    >
      {/* ── Thumbnail ── */}
      <Link href={`/view/${file.id}`} className="block flex-shrink-0" style={{ textDecoration: 'none' }}>
        <div ref={thumbRef} style={{ position: 'relative', width: '100%', paddingBottom: '141.4%', overflow: 'hidden', background: '#F2EDE9' }}>

          {inView
            ? <PdfThumb url={file.file_url} />
            : <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(135deg, #F2EDE9 0%, #EAE4E0 100%)' }} />
          }

          {/* Overlay */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 5,
            background: hovered ? 'linear-gradient(to bottom, rgba(28,14,10,0) 40%, rgba(28,14,10,0.68) 100%)' : 'transparent',
            transition: 'background 0.25s ease',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 10,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(4px)',
              transition: 'all 0.2s ease',
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,0.95)', color: '#3E2723',
                fontSize: '0.68rem', fontWeight: 700,
                padding: '4px 10px', borderRadius: 99,
                backdropFilter: 'blur(4px)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              }}>
                <Eye size={9} /> View Score
              </span>
              <button onClick={handleDownload} aria-label="Quick download" style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)',
                color: 'white', cursor: 'pointer',
              }}>
                <ArrowDownToLine size={10} />
              </button>
            </div>
          </div>

          {/* Tag */}
          {file.tags?.[0] && (
            <span style={{
              position: 'absolute', top: 8, left: 8, zIndex: 10,
              padding: '2px 7px', borderRadius: 99,
              fontSize: '0.57rem', fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', lineHeight: 1.6,
              background: 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(6px)',
              color: '#5D4037',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              {file.tags[0]}
            </span>
          )}

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            disabled={bmLoading}
            aria-label="Bookmark"
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 10,
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isBookmarked ? '#5D4037' : 'rgba(255,255,255,0.92)',
              border: `1px solid ${isBookmarked ? '#5D4037' : 'rgba(255,255,255,0.5)'}`,
              color: isBookmarked ? 'white' : '#8D6E63',
              cursor: 'pointer', transition: 'all 0.2s',
              opacity: isBookmarked || hovered ? 1 : 0,
              backdropFilter: 'blur(4px)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            }}
          >
            {isBookmarked ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
          </button>
        </div>
      </Link>

      {/* ── Info ── */}
      <div style={{ padding: '11px 12px 10px', display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
        <Link href={`/view/${file.id}`} style={{ textDecoration: 'none' }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontWeight: 600,
            fontSize: '0.8125rem', lineHeight: 1.3, color: '#3E2723',
            marginBottom: 3, transition: 'color 0.15s',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            minHeight: '2.3em',
            ...(hovered ? { color: '#5D4037' } : {}),
          }}>
            {file.title}
          </h3>
        </Link>

        {file.composer && (
          <p style={{
            fontSize: '0.69rem', color: '#5D4037', fontWeight: 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontFamily: 'var(--font-ui)',
          }}>
            {file.composer}
          </p>
        )}

        {file.profiles?.full_name && (
          <p style={{
            fontSize: '0.67rem', color: '#9E8070',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontFamily: 'var(--font-ui)',
          }}>
            {file.profiles.full_name}
          </p>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 'auto', paddingTop: 8,
          borderTop: '1px solid #F0EAE6',
        }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.65rem', color: '#B09080',
            fontFamily: 'var(--font-ui)',
          }}>
            {timeAgo}
            {(file.download_count ?? 0) > 0 && (
              <>
                <span style={{ opacity: 0.3 }}>·</span>
                <Download size={8} />
                {file.download_count}
              </>
            )}
          </span>

          <button
            onClick={handleDownload}
            aria-label="Download"
            style={{
              width: 26, height: 26, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: hovered ? '#F2EDE9' : 'transparent',
              border: `1px solid ${hovered ? '#D7CCC8' : 'transparent'}`,
              color: hovered ? '#5D4037' : '#C4B5AF',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Download size={12} />
          </button>
        </div>
      </div>
    </article>
  )
}

// ── Skeleton ──────────────────────────────────────────────────
export function ScoreCardSkeleton({ index }: { index?: number } = {}) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 14,
      border: '1px solid #E8E0DC', overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(62,39,35,0.05)',
    }}>
      <div style={{ position: 'relative', width: '100%', paddingBottom: '141.4%' }}>
        <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(135deg, #F2EDE9 0%, #EAE4E0 100%)' }} />
      </div>
      <div style={{ padding: '11px 12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="animate-pulse" style={{ height: 12, borderRadius: 4, width: '80%', background: '#EDE7E3' }} />
        <div className="animate-pulse" style={{ height: 12, borderRadius: 4, width: '80%', background: '#EDE7E3' }} />
        <div className="animate-pulse" style={{ height: 10, borderRadius: 4, width: '55%', background: '#EDE7E3' }} />
        <div className="animate-pulse" style={{ height: 10, borderRadius: 4, width: '40%', background: '#EDE7E3' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginTop: 2, borderTop: '1px solid #F0EAE6' }}>
          <div className="animate-pulse" style={{ height: 9, width: 50, borderRadius: 4, background: '#EDE7E3' }} />
          <div className="animate-pulse" style={{ width: 26, height: 26, borderRadius: 7, background: '#EDE7E3' }} />
        </div>
      </div>
    </div>
  )
}