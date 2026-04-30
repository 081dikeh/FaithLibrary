'use client'
import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = 
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

export function PDFViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.0)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Controls */}
      <div className="sticky top-0 z-10 flex items-center gap-3 
                      bg-roasted text-bone px-4 py-2 rounded-full shadow-lg">
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
          className="w-8 h-8 rounded-full bg-walnut hover:bg-ochre transition-colors">−</button>
        <span className="text-sm font-mono">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(2.5, s + 0.1))}
          className="w-8 h-8 rounded-full bg-walnut hover:bg-ochre transition-colors">+</button>
        <span className="text-xs text-sand ml-2">{numPages} pages</span>
      </div>

      {/* PDF Pages */}
      <Document file={url} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
        {Array.from({ length: numPages }, (_, i) => (
          <Page key={i + 1} pageNumber={i + 1} scale={scale}
            className="shadow-xl mb-4 rounded-lg overflow-hidden" />
        ))}
      </Document>
    </div>
  )
}