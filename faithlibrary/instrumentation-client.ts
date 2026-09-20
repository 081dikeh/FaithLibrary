// instrumentation-client.ts
//
// Next.js runs this once, early, in the browser — the standard place for
// @sentry/nextjs's client-side init (see instrumentation.ts for the
// server/edge side). No DSN configured yet: set NEXT_PUBLIC_SENTRY_DSN in
// Vercel's environment variables once you've created a Sentry project, and
// this starts reporting automatically. Until then Sentry.init() with an
// undefined dsn is a safe no-op — nothing breaks, it just doesn't send.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Percentage of transactions sent for performance monitoring. 1.0 = every
  // pageload/navigation while traffic is low; turn this down (e.g. 0.1) once
  // there's enough real traffic that 100% starts eating into your Sentry quota.
  tracesSampleRate: 1.0,

  // Session Replay: records a lightweight DOM reconstruction (not a video,
  // no PDF/audio content) so you can watch what led up to an error.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],

  // Quiet by default; flip on temporarily if Sentry itself seems to be
  // misbehaving (e.g. events aren't showing up).
  debug: false,
})

// Required by @sentry/nextjs for App Router: reports navigation timing so
// route changes show up as their own transactions instead of being lumped
// into the initial pageload.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart