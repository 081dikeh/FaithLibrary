import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit'

function buildMockSupabase(rpcResult: { data: unknown; error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(rpcResult)
  return { rpc }
}

type MockSupabase = ReturnType<typeof buildMockSupabase>
function asSupabaseClient(mock: MockSupabase) {
  return mock as unknown as import('@supabase/supabase-js').SupabaseClient
}

describe('checkRateLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows the request when the RPC reports true', async () => {
    const supabase = buildMockSupabase({ data: true, error: null })
    const result = await checkRateLimit(asSupabaseClient(supabase), 'user-1', RATE_LIMITS.EXTERNAL_UPLOAD)
    expect(result).toEqual({ allowed: true, errored: false })
  })

  it('blocks the request when the RPC reports false', async () => {
    const supabase = buildMockSupabase({ data: false, error: null })
    const result = await checkRateLimit(asSupabaseClient(supabase), 'user-1', RATE_LIMITS.EXTERNAL_UPLOAD)
    expect(result).toEqual({ allowed: false, errored: false })
  })

  it('calls the RPC with the identifier, action, and limits from the config', async () => {
    const supabase = buildMockSupabase({ data: true, error: null })
    await checkRateLimit(asSupabaseClient(supabase), 'user-42', RATE_LIMITS.OCR_LYRICS)
    expect(supabase.rpc).toHaveBeenCalledWith('check_rate_limit', {
      p_identifier: 'user-42',
      p_action: 'ocr-lyrics',
      p_max_requests: RATE_LIMITS.OCR_LYRICS.maxRequests,
      p_window_seconds: RATE_LIMITS.OCR_LYRICS.windowSeconds,
    })
  })

  it('fails open and flags errored when the RPC call itself errors', async () => {
    const supabase = buildMockSupabase({ data: null, error: { message: 'connection reset' } })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await checkRateLimit(asSupabaseClient(supabase), 'user-1', RATE_LIMITS.EXTERNAL_UPLOAD)

    expect(result).toEqual({ allowed: true, errored: true })
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('coerces a non-boolean truthy/falsy RPC result to a real boolean', async () => {
    const supabaseTruthy = buildMockSupabase({ data: 1, error: null })
    expect((await checkRateLimit(asSupabaseClient(supabaseTruthy), 'u', RATE_LIMITS.EXTERNAL_UPLOAD)).allowed).toBe(true)

    const supabaseFalsy = buildMockSupabase({ data: 0, error: null })
    expect((await checkRateLimit(asSupabaseClient(supabaseFalsy), 'u', RATE_LIMITS.EXTERNAL_UPLOAD)).allowed).toBe(false)
  })
})

describe('RATE_LIMITS presets', () => {
  it('gives external-upload and ocr-lyrics distinct action names', () => {
    expect(RATE_LIMITS.EXTERNAL_UPLOAD.action).not.toBe(RATE_LIMITS.OCR_LYRICS.action)
  })

  it('defines sane positive limits and windows', () => {
    for (const config of Object.values(RATE_LIMITS)) {
      expect(config.maxRequests).toBeGreaterThan(0)
      expect(config.windowSeconds).toBeGreaterThan(0)
    }
  })
})