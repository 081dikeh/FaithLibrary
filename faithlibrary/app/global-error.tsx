// app/global-error.tsx
//
// A normal error.tsx boundary can't catch errors thrown by the root
// layout itself (it renders above where error.tsx attaches). This file is
// Next's dedicated hook for that one gap, and it's also where
// @sentry/nextjs's docs specifically say to report those errors — without
// it, a crash in app/layout.tsx would go completely unseen by Sentry.
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: '0 24px', background: '#F5F5F5', fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3E2723', marginBottom: 12 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#8D6E63', fontSize: '0.9rem', maxWidth: 360, marginBottom: 24, lineHeight: 1.5 }}>
            This has been reported automatically. Try reloading the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '10px 20px', borderRadius: 12, border: 'none',
              background: '#5D4037', color: '#F5F5F5',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}