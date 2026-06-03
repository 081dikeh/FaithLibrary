// lib/pdfWorker.ts
// Initialises PDF.js worker exactly ONCE for the whole app.
// Import this at the top of every component that uses pdfjs-dist.

let initialised = false

export async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist')

  if (!initialised) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    initialised = true
  }

  return pdfjs
}