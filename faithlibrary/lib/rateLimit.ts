// lib/rateLimit.ts
//
// Thin wrapper around the `check_rate_limit` Postgres function (see
// supabase-migrations/003_add_rate_limiting.sql). Counting happens inside a
// SECURITY DEFINER function so a client can never read or reset its own
// counter — the `rate_limits` table itself has no policies granting it any
// direct access at all.
//
// Usage: rate-limit a caller by whatever identifier makes sense for the
// route (typically the authenticated user's id) plus an action name that
// scopes the counter to that specific limiter.

import type { SupabaseClient } from '@supabase/supabase-js'

export interface RateLimitConfig {
  /** Scopes this limiter's counters — e.g. 'external-upload', 'ocr-lyrics'. */
  action: string
  /** Max requests allowed within the window. */
  maxRequests: number
  /** Window length in seconds. */
  windowSeconds: number
}

export interface RateLimitResult {
  /** Whether the request should be allowed to proceed. */
  allowed: boolean
  /** True if the check itself failed (e.g. DB error) rather than genuinely being over the limit. */
  errored: boolean
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_action: config.action,
    p_max_requests: config.maxRequests,
    p_window_seconds: config.windowSeconds,
  })

  if (error) {
    // Fail OPEN: an outage in the rate limiter itself shouldn't take the
    // upload/OCR path down with it. Logged so a spike here is still
    // visible, but callers get `allowed: true` alongside `errored: true`
    // rather than a hard block.
    console.error(`Rate limit check failed for action "${config.action}":`, error.message)
    return { allowed: true, errored: true }
  }

  return { allowed: Boolean(data), errored: false }
}

/** Named presets so call sites don't hardcode limits inline. Numbers are a starting point — adjust once there's real traffic to look at. */
export const RATE_LIMITS = {
  EXTERNAL_UPLOAD: { action: 'external-upload', maxRequests: 10, windowSeconds: 3600 },
  OCR_LYRICS: { action: 'ocr-lyrics', maxRequests: 30, windowSeconds: 3600 },
} as const satisfies Record<string, RateLimitConfig>