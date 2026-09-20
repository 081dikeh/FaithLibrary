// sentry.server.config.ts
//
// Loaded by instrumentation.ts when the runtime is Node (as opposed to
// Edge — see sentry.edge.config.ts). Same DSN as the client; it's meant to
// be public and only identifies which Sentry project events go to.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
})