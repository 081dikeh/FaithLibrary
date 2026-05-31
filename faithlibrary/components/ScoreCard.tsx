// components/ScoreCard.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Download, Bookmark, BookmarkCheck, Music2, Eye, ArrowDownToLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { FileRecord } from '@/lib/types'

interface ScoreCardProps {
  file: FileRecord
  bookmarked?: boolean
  index?: number
}

function PdfThumb({ url, width }: { url: string; width: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!canvasRef.current || width === 0) return
    let cancelled = false
    async function render() {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const pdf = await pdfjs.getDocument({ url, disableStream: true, disableAutoFetch: true }).promise
        const pg = await pdf.getPage(1)
        if (cancelled || !canvasRef.current) return
        const viewport = pg.getViewport({ scale: width / pg.getViewport({ scale: 1 }).width })
        const canvas = canvasRef.current
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await pg.render({ canvasContext: ctx, viewport, canvas } as any).promise
        if (!cancelled) setReady(true)
      } catch { if (!cancelled) setError(true) }
    }
    render()
    return () => { cancelled = true }
  }, [url, width])

  if (error) return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Music2 size={28} style={{ color: 'var(--border-strong)', opacity: 0.5 }} />
    </div>
  )
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease', objectFit: 'cover' }}
    />
  )
}

export function ScoreCard({ file, bookmarked = false, index = 0 }: ScoreCardProps) {
  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isBookmarked, setIsBookmarked] = useState(bookmarked)
  const [bmLoading, setBmLoading] = useState(false)
  const [cardWidth, setCardWidth] = useState(0)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => setCardWidth(Math.floor(entries[0].contentRect.width)))
    ro.observe(el)
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect() }
    }, { rootMargin: '250px' })
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
    const d = Math.floor((Date.now() - new Date(file.created_at).getTime()) / 86400000)
    if (d === 0) return 'Today'
    if (d === 1) return 'Yesterday'
    if (d < 30) return `${d}d ago`
    const m = Math.floor(d / 30)
    return m < 12 ? `${m}mo ago` : `${Math.floor(m / 12)}y ago`
  })()

  const delayClass = ['delay-50','delay-100','delay-150','delay-200','delay-250','delay-300'][index % 6]

  return (
    <article
      className={`score-card animate-reveal-card ${delayClass}`}
      style={{ '--card-i': index } as React.CSSProperties}
    >
      {/* ── Thumbnail ── */}
      <Link href={`/view/${file.id}`} className="block" tabIndex={-1} aria-hidden>
        <div ref={containerRef} className="score-thumb">
          {/* Skeleton */}
          {!(inView && cardWidth > 0) && (
            <div className="absolute inset-0 skeleton" />
          )}
          {/* PDF render */}
          {inView && cardWidth > 0 && (
            <PdfThumb url={file.file_url} width={cardWidth} />
          )}

          {/* Hover overlay */}
          <div className="score-overlay">
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.95)', color: 'var(--roasted)',
                fontSize: '0.72rem', fontWeight: 600,
                padding: '5px 10px', borderRadius: 99,
                backdropFilter: 'blur(4px)',
              }}>
                <Eye size={11} /> View Score
              </span>
              <button
                onClick={handleDownload}
                aria-label="Quick download"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white', backdropFilter: 'blur(4px)',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                <ArrowDownToLine size={11} />
              </button>
            </div>
          </div>

          {/* Top-left tag */}
          {file.tags?.[0] && (
            <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 99,
                fontSize: '0.6rem', fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(8px)',
                color: 'var(--walnut)',
                border: '1px solid rgba(255,255,255,0.5)',
                lineHeight: 1.6,
              }}>
                {file.tags[0]}
              </span>
            </div>
          )}

          {/* Bookmark button */}
          <button
            onClick={handleBookmark}
            disabled={bmLoading}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 10,
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isBookmarked ? 'var(--walnut)' : 'rgba(255,255,255,0.88)',
              border: '1px solid ' + (isBookmarked ? 'var(--walnut)' : 'rgba(255,255,255,0.5)'),
              color: isBookmarked ? 'white' : 'var(--ochre)',
              backdropFilter: 'blur(6px)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: isBookmarked ? 1 : undefined,
            }}
            className={isBookmarked ? '' : 'opacity-0 group-hover:opacity-100'}
          >
            {isBookmarked
              ? <BookmarkCheck size={12} />
              : <Bookmark size={12} />}
          </button>
        </div>
      </Link>

      {/* ── Info ── */}
      <div style={{
        padding: '12px 12px 10px',
        display: 'flex', flexDirection: 'column', flex: 1,
        gap: 2,
      }}>
        <Link href={`/view/${file.id}`} style={{ textDecoration: 'none' }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.875rem',
            lineHeight: 1.25,
            color: 'var(--text-primary)',
            transition: 'color 0.15s',
            marginBottom: 3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.2em',
          }}>
            {file.title}
          </h3>
        </Link>

        {file.composer && (
          <p style={{
            fontSize: '0.72rem', color: 'var(--text-secondary)',
            fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {file.composer}
          </p>
        )}

        {file.profiles?.full_name && (
          <p style={{
            fontSize: '0.7rem', color: 'var(--text-muted)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {file.profiles.full_name}
          </p>
        )}

        {/* Footer row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 'auto', paddingTop: 8,
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.68rem', color: 'var(--text-muted)',
          }}>
            <span>{timeAgo}</span>
            {(file.download_count ?? 0) > 0 && (
              <>
                <span style={{ opacity: 0.3 }}>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Download size={9} />
                  {file.download_count}
                </span>
              </>
            )}
          </div>

          <button
            onClick={handleDownload}
            aria-label="Download"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 26, borderRadius: 7,
              background: 'transparent', border: '1px solid transparent',
              color: 'var(--border-strong)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.background = 'var(--surface-3)'
              el.style.borderColor = 'var(--border)'
              el.style.color = 'var(--walnut)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.background = 'transparent'
              el.style.borderColor = 'transparent'
              el.style.color = 'var(--border-strong)'
            }}
          >
            <Download size={13} />
          </button>
        </div>
      </div>
    </article>
  )
}

export function ScoreCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="score-card animate-fade-in"
      style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
    >
      <div className="score-thumb">
        <div className="absolute inset-0 skeleton" />
      </div>
      <div style={{ padding: '12px 12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton" style={{ height: 13, borderRadius: 4, width: '85%' }} />
        <div className="skeleton" style={{ height: 13, borderRadius: 4, width: '65%' }} />
        <div className="skeleton" style={{ height: 11, borderRadius: 4, width: '45%' }} />
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 8, marginTop: 4,
          borderTop: '1px solid var(--border)',
        }}>
          <div className="skeleton" style={{ height: 10, width: 60, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 26, height: 26, borderRadius: 7 }} />
        </div>
      </div>
    </div>
  )
}