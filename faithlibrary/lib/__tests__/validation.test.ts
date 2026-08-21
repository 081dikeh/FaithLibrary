import { describe, it, expect } from 'vitest'
import {
  isPdfFile, FILE_TYPE_ERROR_MESSAGE,
  isMp3File, AUDIO_TYPE_ERROR_MESSAGE, AUDIO_SIZE_ERROR_MESSAGE, MAX_AUDIO_BYTES,
} from '@/lib/validation'

describe('isPdfFile', () => {
  it('accepts a real PDF (matching extension and MIME type)', () => {
    expect(isPdfFile({ name: 'hymn.pdf', type: 'application/pdf' })).toBe(true)
  })

  it('is case-insensitive on the extension', () => {
    expect(isPdfFile({ name: 'Hymn.PDF', type: 'application/pdf' })).toBe(true)
  })

  it('accepts a .pdf file with no reported MIME type', () => {
    expect(isPdfFile({ name: 'hymn.pdf', type: '' })).toBe(true)
  })

  it('rejects a non-pdf extension even with a pdf MIME type', () => {
    expect(isPdfFile({ name: 'hymn.docx', type: 'application/pdf' })).toBe(false)
  })

  it('rejects a .pdf-named file whose real MIME type contradicts it', () => {
    expect(isPdfFile({ name: 'hymn.pdf', type: 'image/png' })).toBe(false)
  })
})

describe('isMp3File', () => {
  it('accepts a real mp3 (matching extension and MIME type)', () => {
    expect(isMp3File({ name: 'recording.mp3', type: 'audio/mpeg' })).toBe(true)
  })

  it('accepts the audio/mp3 MIME type variant some browsers report', () => {
    expect(isMp3File({ name: 'recording.mp3', type: 'audio/mp3' })).toBe(true)
  })

  it('is case-insensitive on the extension', () => {
    expect(isMp3File({ name: 'Recording.MP3', type: 'audio/mpeg' })).toBe(true)
  })

  it('accepts a .mp3 file with no reported MIME type', () => {
    expect(isMp3File({ name: 'recording.mp3', type: '' })).toBe(true)
  })

  it('rejects a non-mp3 extension even with an audio MIME type', () => {
    expect(isMp3File({ name: 'recording.wav', type: 'audio/mpeg' })).toBe(false)
  })

  it('rejects a .mp3-named file whose real MIME type contradicts it', () => {
    expect(isMp3File({ name: 'recording.mp3', type: 'application/pdf' })).toBe(false)
  })
})

describe('validation error messages and constants', () => {
  it('are non-empty, human-readable strings', () => {
    expect(FILE_TYPE_ERROR_MESSAGE.length).toBeGreaterThan(0)
    expect(AUDIO_TYPE_ERROR_MESSAGE.length).toBeGreaterThan(0)
    expect(AUDIO_SIZE_ERROR_MESSAGE.length).toBeGreaterThan(0)
  })

  it('caps audio uploads at a sane size', () => {
    expect(MAX_AUDIO_BYTES).toBe(20 * 1024 * 1024)
  })
})
