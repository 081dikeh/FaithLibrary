import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs/config'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  // Suppresses the Sentry CLI's build-time source map upload logs — set to
  // `false` temporarily if a deploy's source maps aren't showing up and you
  // need to see what the CLI is doing.
  silent: true,

  // These three are needed to upload source maps so stack traces in Sentry
  // show your actual code instead of minified bundles. Only matters once
  // org/project are set — without them, Sentry.init() above still reports
  // errors fine, they just won't have de-minified stack traces.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Routes Sentry's client-side error/replay traffic through your own
  // domain (/monitoring) instead of directly to sentry.io, so ad-blockers
  // don't silently drop it.
  tunnelRoute: '/monitoring',

  // Next.js 16 defaults to Turbopack, which doesn't yet support the
  // webpack-only knobs (disableLogger, reactComponentAnnotation) — leaving
  // them out entirely rather than setting them under a `webpack:` key that
  // Turbopack builds would just ignore anyway.
})