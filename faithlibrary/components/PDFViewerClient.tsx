// components/PDFViewerClient.tsx
'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw, Columns2, AlignJustify } from 'lucide-react'
import { getPdfJs } from '@/lib/pdfWorker'

export function PDFViewerClient({ url }: { url: string }) {
  const [numPages,   setNumPages]   = useState(0)
  const [page,       setPage]       = useState(1)
  const [scale,      setScale]      = useState(1.0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(false)
  const [singlePage, setSinglePage] = useState(false)
  const [width,      setWidth]      = useState<number | undefined>(undefined)
  const [DocComp,    setDocComp]    = useState<React.ComponentType<any> | null>(null)
  const [PageComp,   setPageComp]   = useState<React.ComponentType<any> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        // Use singleton — worker is set once, not re-set
        await getPdfJs()
        const mod = await import('react-pdf')
        setDocComp(() => mod.Document)
        setPageComp(() => mod.Page)
      } catch {
        setError(true)
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setWidth(Math.floor(containerRef.current.clientWidth) - 32)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const onLoad = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }, [])

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-[#8D6E63]">
      <div className="w-16 h-16 rounded-full bg-[#3E2723] flex items-center justify-center text-white text-2xl">⚠</div>
      <p className="text-sm">Could not load this document.</p>
      <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Open directly ↗</a>
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-4" ref={containerRef}>
      {/* Toolbar */}
      <div className="sticky top-[112px] z-30 flex items-center gap-1.5 flex-wrap justify-center bg-[#2C2C2C]/95 backdrop-blur-md text-[#F5F5F5] px-3 py-2 rounded-2xl shadow-xl border border-white/10">
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <button onClick={() => setScale(s => Math.max(0.4, +(s - 0.15).toFixed(2)))} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"><ZoomOut size={13} /></button>
          <span className="text-xs font-mono w-12 text-center text-white/70">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(2.5, +(s + 0.15).toFixed(2)))} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"><ZoomIn size={13} /></button>
          <button onClick={() => setScale(1.0)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center ml-0.5"><RotateCcw size={11} /></button>
        </div>
        {singlePage && numPages > 0 && (
          <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30"><ChevronLeft size={13} /></button>
            <span className="text-xs text-white/70 font-mono">{page}/{numPages}</span>
            <button onClick={() => setPage(p => Math.min(numPages, p + 1))} disabled={page >= numPages} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30"><ChevronRight size={13} /></button>
          </div>
        )}
        <button onClick={() => { setSinglePage(v => !v); setPage(1) }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium">
          {singlePage ? <><AlignJustify size={12} /> Scroll</> : <><Columns2 size={12} /> Single page</>}
        </button>
        {!singlePage && numPages > 0 && <span className="text-xs text-white/40 pl-1">{numPages} pages</span>}
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-20 text-[#8D6E63]">
          <div className="w-10 h-10 rounded-full border-2 border-[#5D4037]/30 border-t-[#D7CCC8] animate-spin" />
          <p className="text-sm">Loading score…</p>
        </div>
      )}

      {/* Document */}
      {DocComp && PageComp && (
        <div className={`w-full transition-opacity duration-300 ${loading ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
          <DocComp
            file={url}
            onLoadSuccess={onLoad}
            onLoadError={() => { setError(true); setLoading(false) }}
            loading=""
            error=""
          >
            {singlePage ? (
              <div className="flex justify-center">
                <PageComp pageNumber={page} scale={scale} width={width} loading="" renderAnnotationLayer renderTextLayer />
              </div>
            ) : (
              numPages > 0 && Array.from({ length: numPages }, (_, i) => (
                <div key={i + 1} className="flex justify-center mb-4">
                  <PageComp
                    pageNumber={i + 1}
                    scale={scale}
                    width={width}
                    loading=""
                    renderAnnotationLayer={i === 0}
                    renderTextLayer={i === 0}
                    onRenderSuccess={i === 0 ? () => setLoading(false) : undefined}
                  />
                </div>
              ))
            )}
          </DocComp>
        </div>
      )}
    </div>
  )
}