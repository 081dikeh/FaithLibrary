// components/ScoreCard.tsx
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Download, Bookmark, BookmarkCheck, Music2, Eye, ArrowDownToLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { FileRecord } from '@/lib/types'

function PdfThumb({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready,  setReady]  = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const w = canvas.parentElement?.clientWidth ?? 240
        const pdf = await pdfjs.getDocument({
          url,
          disableRange: true, disableStream: true,
          disableAutoFetch: true, useWorkerFetch: false,
          isEvalSupported: false,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/cmaps/',
          cMapPacked: true,
        }).promise
        if (cancelled) return
        const page = await pdf.getPage(1)
        if (cancelled) return
        const vp = page.getViewport({ scale: w / page.getViewport({ scale: 1 }).width })
        canvas.width = vp.width; canvas.height = vp.height
        const ctx = canvas.getContext('2d')
        if (!ctx || cancelled) return
        await page.render({ canvasContext: ctx, viewport: vp } as any).promise
        if (!cancelled) setReady(true)
      } catch { if (!cancelled) setFailed(true) }
    })()
    return () => { cancelled = true }
  }, [url])

  if (failed) return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--surface-3)' }}>
      <Music2 size={28} style={{ color: 'var(--border-strong)', opacity: 0.4 }} />
    </div>
  )
  return (
    <>
      {!ready && <div className="absolute inset-0 skeleton" />}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', opacity: ready ? 1 : 0, transition: 'opacity 0.4s ease' }} />
    </>
  )
}

interface ScoreCardProps { file: FileRecord; bookmarked?: boolean; index?: number }

export function ScoreCard({ file, bookmarked = false, index = 0 }: ScoreCardProps) {
  const supabase = createClient()
  const thumbRef = useRef<HTMLDivElement>(null)
  const [isBookmarked, setIsBookmarked] = useState(bookmarked)
  const [bmLoading,    setBmLoading]    = useState(false)
  const [inView,       setInView]       = useState(false)

  useEffect(() => {
    const el = thumbRef.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect() } }, { rootMargin: '400px' })
    io.observe(el); return () => io.disconnect()
  }, [])

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); setBmLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    if (isBookmarked) { await supabase.from('bookmarks').delete().match({ user_id: user.id, file_id: file.id }); setIsBookmarked(false) }
    else { await supabase.from('bookmarks').insert({ user_id: user.id, file_id: file.id }); setIsBookmarked(true) }
    setBmLoading(false)
  }

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    await supabase.rpc('increment_download_count', { file_id: file.id })
    Object.assign(document.createElement('a'), { href: file.file_url, download: file.title, target: '_blank' }).click()
  }, [file.id, file.file_url, file.title])

  const timeAgo = (() => {
    const d = Math.floor((Date.now() - new Date(file.created_at).getTime()) / 86400000)
    if (d === 0) return 'Today'; if (d === 1) return 'Yesterday'
    if (d < 30) return `${d}d ago`
    const m = Math.floor(d / 30); return m < 12 ? `${m}mo ago` : `${Math.floor(m/12)}y ago`
  })()

  return (
    <article className="score-card" style={{ animationDelay: `${(index % 10) * 40}ms`, animationFillMode: 'both' }}>
      <Link href={`/view/${file.id}`} tabIndex={-1} aria-hidden style={{ display: 'block', textDecoration: 'none' }}>
        <div ref={thumbRef} className="score-thumb">
          {inView ? <PdfThumb url={file.file_url} /> : <div className="absolute inset-0 skeleton" />}
          <div className="score-overlay">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.95)', color: 'var(--roasted)', fontSize: '0.72rem', fontWeight: 600, padding: '5px 10px', borderRadius: 99 }}>
                <Eye size={11} /> View Score
              </span>
              <button onClick={handleDownload} aria-label="Quick download" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer' }}>
                <ArrowDownToLine size={11} />
              </button>
            </div>
          </div>
          {file.tags?.[0] && (
            <span style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', color: 'var(--walnut)', lineHeight: 1.6 }}>
              {file.tags[0]}
            </span>
          )}
          <button onClick={handleBookmark} disabled={bmLoading} aria-label="Bookmark"
            className="bookmark-btn"
            style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isBookmarked ? 'var(--walnut)' : 'rgba(255,255,255,0.88)', border: '1px solid ' + (isBookmarked ? 'var(--walnut)' : 'rgba(255,255,255,0.5)'), color: isBookmarked ? 'white' : 'var(--ochre)', cursor: 'pointer', transition: 'all 0.2s', opacity: isBookmarked ? 1 : 0 }}>
            {isBookmarked ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          </button>
        </div>
      </Link>
      <div style={{ padding: '10px 11px 9px', display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
        <Link href={`/view/${file.id}`} style={{ textDecoration: 'none' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.25, color: 'var(--text-primary)', marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.2em' }}>
            {file.title}
          </h3>
        </Link>
        {file.composer && <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.composer}</p>}
        {file.profiles?.full_name && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.profiles.full_name}</p>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 7, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {timeAgo}{(file.download_count ?? 0) > 0 && <><span style={{ opacity: 0.3 }}>·</span><Download size={9} />{file.download_count}</>}
          </span>
          <button onClick={handleDownload} aria-label="Download" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: 'transparent', border: '1px solid transparent', color: 'var(--border-strong)', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='var(--surface-3)'; el.style.borderColor='var(--border)'; el.style.color='var(--walnut)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.borderColor='transparent'; el.style.color='var(--border-strong)'; }}>
            <Download size={13} />
          </button>
        </div>
      </div>
      <style>{`.score-card:hover .bookmark-btn{opacity:1!important}`}</style>
    </article>
  )
}

export function ScoreCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="score-card" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="score-thumb"><div className="absolute inset-0 skeleton" /></div>
      <div style={{ padding: '10px 11px 9px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton" style={{ height: 13, borderRadius: 4, width: '85%' }} />
        <div className="skeleton" style={{ height: 13, borderRadius: 4, width: '60%' }} />
        <div className="skeleton" style={{ height: 11, borderRadius: 4, width: '45%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 7, marginTop: 2, borderTop: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ height: 10, width: 55, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 26, height: 26, borderRadius: 7 }} />
        </div>
      </div>
    </div>
  )
}