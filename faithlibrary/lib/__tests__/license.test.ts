import { describe, it, expect } from 'vitest'
import { getLicenseLabel, isValidLicenseStatus, LICENSE_OPTIONS } from '@/lib/license'

describe('getLicenseLabel', () => {
  it('returns the matching label for a known status', () => {
    expect(getLicenseLabel('public_domain')).toBe('Public Domain')
    expect(getLicenseLabel('permission')).toBe('Copyrighted — Used with Permission')
    expect(getLicenseLabel('original')).toBe('Original Composition')
  })

  it('falls back to "Unknown / Not Sure" for null, undefined, or unrecognized values', () => {
    expect(getLicenseLabel(null)).toBe("Unknown / Not Sure")
    expect(getLicenseLabel(undefined)).toBe("Unknown / Not Sure")
    expect(getLicenseLabel('not-a-real-status')).toBe("Unknown / Not Sure")
    expect(getLicenseLabel('')).toBe("Unknown / Not Sure")
  })
})

describe('isValidLicenseStatus', () => {
  it('accepts every declared option value', () => {
    for (const opt of LICENSE_OPTIONS) {
      expect(isValidLicenseStatus(opt.value)).toBe(true)
    }
  })

  it('rejects unrecognized strings and non-strings', () => {
    expect(isValidLicenseStatus('copyrighted-maybe')).toBe(false)
    expect(isValidLicenseStatus(null)).toBe(false)
    expect(isValidLicenseStatus(undefined)).toBe(false)
    expect(isValidLicenseStatus(42)).toBe(false)
  })
})
