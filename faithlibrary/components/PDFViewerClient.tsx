// components/PDFViewerClient.tsx
// Pure canvas renderer — no react-pdf dependency, uses same pdfjs as ScoreCard
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  RotateCcw, ExternalLink, Loader2,
} from 'lucide-react'

interface RenderedPage {
  pageNum: number
  canvas: HTMLCanvasElement
}

export function PDFViewerClient({ url }: { url: string }) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const [numPages,    setNumPages]    = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale,       setScale]       = useState(1.2)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [singleMode,  setSingleMode]  = useState(false)
  const [pdfDoc,      setPdfDoc]      = useState<any>(null)
  const [containerW,  setContainerW]  = useState(0)
  const renderingRef  = useRef(false)

  // Track container width
  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setContainerW(containerRef.current.clientWidth - 32)
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Load PDF document once
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const doc = await pdfjs.getDocument({
          url,
          cMapUrl: '/cmaps/',
          cMapPacked: true,
        }).promise
        if (cancelled) { doc.destroy(); return }
        setPdfDoc(doc)
        setNumPages(doc.numPages)
        setLoading(false)
      } catch (e: any) {
        if (!cancelled) {
          console.error('PDF load error:', e)
          setError('Could not load this document.')
          setLoading(false)
        }
      }
    })()
    return () => { cancelled = true }
  }, [url])

  // Render a single page into a canvas element
  const renderPage = useCallback(async (
    doc: any,
    pageNum: number,
    canvasEl: HTMLCanvasElement,
    scaleVal: number,
    maxWidth: number,
  ) => {
    try {
      const page     = await doc.getPage(pageNum)
      const baseVp   = page.getViewport({ scale: 1 })
      const fitScale = maxWidth > 0 ? (maxWidth / baseVp.width) * scaleVal : scaleVal
      const vp       = page.getViewport({ scale: fitScale })

      canvasEl.width  = vp.width
      canvasEl.height = vp.height

      const ctx = canvasEl.getContext('2d')
      if (!ctx) return

      await page.render({ canvasContext: ctx, viewport: vp }).promise
    } catch (e) {
      console.error(`Page ${pageNum} render error:`, e)
    }
  }, [])

  // Scroll-mode: render all pages
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!pdfDoc || singleMode || containerW === 0 || renderingRef.current) return
    renderingRef.current = true
    ;(async () => {
      const container = scrollContainerRef.current
      if (!container) { renderingRef.current = false; return }
      container.innerHTML = ''
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const wrap  = document.createElement('div')
        wrap.className = 'flex justify-center mb-4'
        const canvas = document.createElement('canvas')
        canvas.className = 'rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.28)] max-w-full'
        wrap.appendChild(canvas)
        container.appendChild(wrap)
        await renderPage(pdfDoc, i, canvas, scale, containerW)
      }
      renderingRef.current = false
    })()
  }, [pdfDoc, singleMode, containerW, scale, renderPage])

  // Single-page mode: render one page into a canvas ref
  const singleCanvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!pdfDoc || !singleMode || containerW === 0) return
    const canvas = singleCanvasRef.current
    if (!canvas) return
    renderPage(pdfDoc, currentPage, canvas, scale, containerW)
  }, [pdfDoc, singleMode, currentPage, scale, containerW, renderPage])

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-full bg-[#3E2723] flex items-center justify-center text-white text-2xl">⚠</div>
      <p className="text-sm text-[#8D6E63]">{error}</p>
      <a href={url} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5D4037] text-white text-sm font-medium hover:bg-[#3E2723] transition-colors">
        <ExternalLink size={14} /> Open file directly
      </a>
    </div>
  )

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4 w-full">

      {/* Toolbar */}
      <div className="sticky top-[112px] z-30 flex items-center gap-1.5 flex-wrap justify-center
                      bg-[#2C2C2C]/95 backdrop-blur-md text-white px-3 py-2
                      rounded-2xl shadow-xl border border-white/10">

        {/* Zoom controls */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <button
            onClick={() => setScale(s => Math.max(0.4, +(s - 0.2).toFixed(1)))}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ZoomOut size={13} />
          </button>
          <span className="text-xs font-mono w-12 text-center text-white/70">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(3.0, +(s + 0.2).toFixed(1)))}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => setScale(1.2)}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center ml-0.5 transition-colors"
            title="Reset zoom">
            <RotateCcw size={11} />
          </button>
        </div>

        {/* Page navigation — single mode only */}
        {singleMode && numPages > 0 && (
          <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30 transition-colors">
              <ChevronLeft size={13} />
            </button>
            <span className="text-xs text-white/70 font-mono px-1">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30 transition-colors">
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* Mode toggle */}
        <button
          onClick={() => { setSingleMode(v => !v); setCurrentPage(1) }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors">
          {singleMode ? 'Scroll mode' : 'Single page'}
        </button>

        {!singleMode && numPages > 0 && (
          <span className="text-xs text-white/40">{numPages} pages</span>
        )}

        {/* Open directly */}
        <a href={url} target="_blank" rel="noreferrer"
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center ml-1 transition-colors"
          title="Open file directly">
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-20 text-[#8D6E63]">
          <Loader2 size={28} className="animate-spin text-[#D7CCC8]" />
          <p className="text-sm">Loading score…</p>
        </div>
      )}

      {/* Scroll mode — all pages */}
      {!loading && !singleMode && (
        <div ref={scrollContainerRef} className="w-full" />
      )}

      {/* Single page mode */}
      {!loading && singleMode && (
        <div className="flex justify-center w-full">
          <canvas
            ref={singleCanvasRef}
            className="rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.28)] max-w-full"
          />
        </div>
      )}

    </div>
  )
}