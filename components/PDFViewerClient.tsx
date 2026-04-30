// components/PDFViewerClient.tsx
'use client'
import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  RotateCcw, Columns2, AlignJustify
} from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

export function PDFViewerClient({ url }: { url: string }) {
  const [numPages,   setNumPages]   = useState(0)
  const [page,       setPage]       = useState(1)
  const [scale,      setScale]      = useState(1.0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(false)
  const [singlePage, setSinglePage] = useState(false)

  const onLoad = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages); setLoading(false)
  }, [])

  const zoomIn  = () => setScale(s => Math.min(2.5, +(s + 0.15).toFixed(2)))
  const zoomOut = () => setScale(s => Math.max(0.4, +(s - 0.15).toFixed(2)))
  const reset   = () => setScale(1.0)

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 text-[#8D6E63] gap-4">
      <div className="w-16 h-16 rounded-full bg-[#3E2723] flex items-center justify-center text-2xl">
        ⚠
      </div>
      <p className="text-sm" style={{fontFamily:'var(--font-ui)'}}>Could not load this document.</p>
      <a href={url} target="_blank" rel="noreferrer"
        className="btn btn-sm"
        style={{background:'#5D4037', color:'#F5F5F5', borderColor:'#5D4037'}}>
        Open directly ↗
      </a>
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-4">

      {/* ── Controls ── */}
      <div className="sticky top-[112px] z-30 flex items-center gap-1.5 flex-wrap justify-center
                      bg-[#2C2C2C]/95 backdrop-blur-md text-[#F5F5F5]
                      px-3 py-2 rounded-2xl shadow-xl border border-white/10">

        {/* Zoom */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <button onClick={zoomOut} aria-label="Zoom out"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center
                       justify-center transition-colors">
            <ZoomOut size={13} />
          </button>
          <span className="text-xs font-mono w-12 text-center text-white/70">
            {Math.round(scale * 100)}%
          </span>
          <button onClick={zoomIn} aria-label="Zoom in"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center
                       justify-center transition-colors">
            <ZoomIn size={13} />
          </button>
          <button onClick={reset} aria-label="Reset zoom"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center
                       justify-center transition-colors ml-0.5">
            <RotateCcw size={11} />
          </button>
        </div>

        {/* Page nav (only in single-page mode) */}
        {singlePage && (
          <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center
                         justify-center transition-colors disabled:opacity-30">
              <ChevronLeft size={13} />
            </button>
            <span className="text-xs text-white/70 whitespace-nowrap font-mono">
              {page} / {numPages || '…'}
            </span>
            <button onClick={() => setPage(p => Math.min(numPages, p + 1))} disabled={page >= numPages}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center
                         justify-center transition-colors disabled:opacity-30">
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* View mode toggle */}
        <button onClick={() => setSinglePage(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                     bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium">
          {singlePage ? <><AlignJustify size={12} /> Scroll</> : <><Columns2 size={12} /> Single page</>}
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-20 text-[#8D6E63]">
          <div className="w-10 h-10 rounded-full border-2 border-[#5D4037]/30
                          border-t-[#D7CCC8] animate-spin" />
          <p className="text-sm" style={{fontFamily:'var(--font-ui)'}}>Loading score…</p>
        </div>
      )}

      {/* ── Document ── */}
      <div className={`w-full ${loading ? 'invisible h-0' : ''}`}>
        <Document
          file={url}
          onLoadSuccess={onLoad}
          onLoadError={() => { setError(true); setLoading(false) }}
          loading=""
        >
          {singlePage ? (
            <div className="flex justify-center">
              <Page pageNumber={page} scale={scale} loading="" />
            </div>
          ) : (
            Array.from({ length: numPages }, (_, i) => (
              <div key={i + 1} className="flex justify-center mb-4">
                <Page pageNumber={i + 1} scale={scale} loading=""
                  onRenderSuccess={i === 0 ? () => setLoading(false) : undefined} />
              </div>
            ))
          )}
        </Document>
      </div>
    </div>
  )
}