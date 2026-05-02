// app/(auth)/forgot-password/page.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-10">
          <div className="relative w-8 h-9">
            <Image src="/FaithLibrary_logo.png" alt="FaithLibrary" fill className="object-contain" />
          </div>
          <span className="font-display text-xl font-semibold text-[#3E2723]">
            Faith<span className="text-[#8D6E63] font-normal italic">Library</span>
          </span>
        </Link>

        <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-8">

          {sent ? (
            /* ── Success state ── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200
                              flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={30} className="text-green-500" />
              </div>
              <h2 className="font-display text-2xl font-bold text-[#3E2723] mb-2">
                Check your email
              </h2>
              <p className="text-[#8D6E63] text-sm leading-relaxed mb-6"
                style={{ fontFamily: 'var(--font-ui)' }}>
                We sent a password reset link to{' '}
                <strong className="text-[#5D4037]">{email}</strong>.
                Click it to set a new password.
              </p>
              <p className="text-xs text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
                Didn't receive it? Check your spam folder or{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-[#5D4037] font-medium hover:underline"
                >
                  try again
                </button>.
              </p>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <Link href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-[#8D6E63]
                           hover:text-[#5D4037] transition-colors mb-6"
                style={{ fontFamily: 'var(--font-ui)' }}>
                <ArrowLeft size={14} /> Back to login
              </Link>

              <h2 className="font-display text-2xl font-bold text-[#3E2723] mb-1">
                Reset password
              </h2>
              <p className="text-[#8D6E63] text-sm mb-6" style={{ fontFamily: 'var(--font-ui)' }}>
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                                bg-red-50 border border-red-200 text-red-700 text-sm mb-4"
                  style={{ fontFamily: 'var(--font-ui)' }}>
                  <AlertCircle size={15} className="flex-shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D6E63]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="input pl-9"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full"
                  style={{ padding: '0.75rem' }}
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
                    : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}