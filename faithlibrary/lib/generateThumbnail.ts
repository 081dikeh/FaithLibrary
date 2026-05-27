// lib/generateThumbnail.ts
// Generates a JPEG thumbnail from the first page of a PDF
// Call on the client side after upload

export async function generatePdfThumbnail(
  pdfUrl: string,
  width = 400
): Promise<Blob | null> {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

    const pdf  = await pdfjsLib.getDocument({ url: pdfUrl }).promise
    const page = await pdf.getPage(1)

    const viewport = page.getViewport({ scale: 1 })
    const scale    = width / viewport.width
    const scaled   = page.getViewport({ scale })

    const canvas  = document.createElement('canvas')
    canvas.width  = scaled.width
    canvas.height = scaled.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    await page.render({ canvasContext: ctx, viewport: scaled }).promise

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85)
    })
  } catch {
    return null
  }
}