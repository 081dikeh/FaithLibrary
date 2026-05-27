// app/auth/reset-password/page.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  // Password strength
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = strength.filter(Boolean).length
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][score]
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][score]

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (score < 2) {
      setError('Please choose a stronger password.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
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
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200
                              flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={30} className="text-green-500" />
              </div>
              <h2 className="font-display text-2xl font-bold text-[#3E2723] mb-2">
                Password updated
              </h2>
              <p className="text-[#8D6E63] text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
                Redirecting you to your dashboard…
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-[#3E2723] mb-1">
                Set new password
              </h2>
              <p className="text-[#8D6E63] text-sm mb-6" style={{ fontFamily: 'var(--font-ui)' }}>
                Choose a strong password for your account.
              </p>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                                bg-red-50 border border-red-200 text-red-700 text-sm mb-4"
                  style={{ fontFamily: 'var(--font-ui)' }}>
                  <AlertCircle size={15} className="flex-shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="label">New password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      className="input pr-11"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-[#8D6E63] hover:text-[#5D4037] transition-colors">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i < score ? strengthColor : 'bg-[#D7CCC8]'
                            }`} />
                        ))}
                      </div>
                      <p className="text-xs text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
                        Strength: <span className="font-medium text-[#5D4037]">{strengthLabel}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label className="label">Confirm password</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    className={`input ${
                      confirm && confirm !== password
                        ? 'border-red-300 focus:border-red-400'
                        : ''
                    }`}
                  />
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
                      Passwords don't match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="btn btn-primary w-full"
                  style={{ padding: '0.75rem' }}
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Updating…</>
                    : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}