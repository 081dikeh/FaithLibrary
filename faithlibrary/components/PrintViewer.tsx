// components/PrintViewer.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const Document = dynamic(() => import('react-pdf').then(m => m.Document), { ssr: false, loading: () => null })
const Page     = dynamic(() => import('react-pdf').then(m => m.Page),     { ssr: false, loading: () => null })

if (typeof window !== 'undefined') {
  import('react-pdf').then(({ pdfjs }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  })
}

interface PrintViewerProps {
  file: { id: string; title: string; composer?: string | null; arranger?: string | null; voice_parts?: string | null; file_url: string }
}

export function PrintViewer({ file }: PrintViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [ready,    setReady]    = useState(false)

  const onLoad = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages); setReady(true)
  }, [])

  useEffect(() => {
    if (ready && numPages > 0) {
      const t = setTimeout(() => window.print(), 800)
      return () => clearTimeout(t)
    }
  }, [ready, numPages])

  return (
    <>
      <div className="print:hidden fixed top-0 left-0 right-0 z-50
                      bg-[#3E2723] px-4 py-3 flex items-center justify-between gap-4">
        <Link href={`/view/${file.id}`}
          className="flex items-center gap-1.5 text-[#D7CCC8] text-sm hover:text-white transition-colors">
          <ArrowLeft size={15} /> Back
        </Link>
        <p className="font-display text-sm font-semibold text-[#F5F5F5] truncate flex-1 text-center">
          {file.title}
        </p>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     bg-[#5D4037] hover:bg-[#8D6E63] text-[#F5F5F5]
                     text-sm font-medium transition-colors flex-shrink-0">
          <Printer size={14} /> Print
        </button>
      </div>

      <div className="hidden print:block mb-4 pb-3 border-b border-gray-300">
        <h1 className="text-xl font-bold">{file.title}</h1>
        <div className="flex gap-3 text-sm text-gray-600 mt-1 flex-wrap">
          {file.composer    && <span>Composer: {file.composer}</span>}
          {file.arranger    && <span>Arr. {file.arranger}</span>}
          {file.voice_parts && <span>{file.voice_parts}</span>}
        </div>
      </div>

      <div className="pt-16 print:pt-0 pb-8 print:pb-0 px-4 print:px-0">
        {!ready && (
          <div className="flex items-center justify-center py-20 print:hidden">
            <div className="w-8 h-8 rounded-full border-2 border-[#D7CCC8] border-t-[#5D4037] animate-spin" />
          </div>
        )}
        <Document file={file.file_url} onLoadSuccess={onLoad} loading="" error="">
          {numPages > 0 && Array.from({ length: numPages }, (_, i) => (
            <div key={i + 1} className="flex justify-center mb-4 print:mb-0">
              <Page pageNumber={i + 1} scale={1.0} loading=""
                renderAnnotationLayer={false} renderTextLayer={false} />
            </div>
          ))}
        </Document>
      </div>

      <style>{`
        @media print {
          @page { margin: 0.5in; }
          body { background: white !important; }
          .react-pdf__Page__canvas { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
        }
      `}</style>
    </>
  )
}