// app/error.tsx
'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100
                        flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={28} className="text-red-400" />
        </div>

        <h1 className="font-display text-2xl font-bold text-[#3E2723] mb-2">
          Something went wrong
        </h1>
        <p className="text-[#8D6E63] text-sm leading-relaxed mb-8"
          style={{ fontFamily: 'var(--font-ui)' }}>
          An unexpected error occurred. You can try again or return to the library.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <RotateCcw size={14} /> Try again
          </button>
          <Link href="/" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem' }}>
            Go to Library
          </Link>
        </div>

        {error.digest && (
          <p className="text-xs text-[#D7CCC8] mt-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}