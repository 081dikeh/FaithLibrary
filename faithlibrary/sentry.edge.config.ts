// sentry.edge.config.ts
//
// Loaded by instrumentation.ts when the runtime is Edge (middleware, and
// any route explicitly opted into the edge runtime — FaithLibrary's
// proxy.ts middleware runs on edge, so this covers it). Kept separate from
// sentry.server.config.ts because the Edge runtime doesn't support every
// Node API the full server SDK might reach for.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
})