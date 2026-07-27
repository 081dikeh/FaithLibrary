import { describe, it, expect } from 'vitest'
import { isPdfFile } from '@/lib/validation'

describe('isPdfFile', () => {
  it('accepts a file with a .pdf extension and application/pdf MIME type', () => {
    expect(isPdfFile({ name: 'ave-maria.pdf', type: 'application/pdf' })).toBe(true)
  })

  it('accepts a .pdf file with no reported MIME type (common for drag-and-drop)', () => {
    expect(isPdfFile({ name: 'ave-maria.pdf', type: '' })).toBe(true)
  })

  it('is case-insensitive on the extension', () => {
    expect(isPdfFile({ name: 'Ave-Maria.PDF', type: 'application/pdf' })).toBe(true)
  })

  it('rejects non-PDF extensions', () => {
    expect(isPdfFile({ name: 'score.musicxml', type: '' })).toBe(false)
    expect(isPdfFile({ name: 'score.mxl', type: '' })).toBe(false)
    expect(isPdfFile({ name: 'score.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })).toBe(false)
  })

  it('rejects a .pdf-named file whose MIME type contradicts it (spoofed extension)', () => {
    expect(isPdfFile({ name: 'malicious.pdf', type: 'application/x-msdownload' })).toBe(false)
  })

  it('rejects a file with no extension at all', () => {
    expect(isPdfFile({ name: 'score', type: 'application/pdf' })).toBe(false)
  })
})
