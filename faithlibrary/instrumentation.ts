// instrumentation.ts
//
// Next.js calls register() once when a new server instance starts, before
// it accepts any requests — the standard hook point for wiring up Sentry's
// server/edge SDKs. See instrumentation-client.ts for the browser side.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Sentry's automatic instrumentation catches errors thrown directly in a
// route's page.tsx, but errors thrown inside a *nested* Server Component
// (a component rendered by the page, not the page itself) are otherwise
// swallowed by Next's error boundary before Sentry ever sees them. This
// hook is Next's own mechanism for surfacing those.
export async function onRequestError(...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>) {
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(...args)
}