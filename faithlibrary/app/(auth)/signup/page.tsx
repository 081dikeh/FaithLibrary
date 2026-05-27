// app/(auth)/signup/page.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  // Password strength
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const strengthScore = strength.filter(Boolean).length
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore]
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][strengthScore]

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (strengthScore < 2) {
      setError('Please choose a stronger password.')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const handleGoogle = async () => {
    setGoogleLoad(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const inputClass = `w-full border rounded-xl px-4 py-3 text-sm text-[#3E2723]
                      bg-white placeholder-[#8D6E63]/60 transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20
                      focus:border-[#5D4037] border-[#D7CCC8]`

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 border border-green-200
                          flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={36} className="text-green-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#3E2723] mb-2">
            Check your email
          </h2>
          <p className="text-[#8D6E63] text-sm leading-relaxed mb-6">
            We sent a confirmation link to <strong className="text-[#5D4037]">{email}</strong>.
            Click it to activate your account and start exploring the library.
          </p>
          <Link href="/login"
            className="inline-block px-6 py-2.5 rounded-xl bg-[#5D4037] text-[#F5F5F5]
                       text-sm font-semibold hover:bg-[#3E2723] transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#3E2723] flex-col items-center
                      justify-center px-16 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#5D4037]/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#8D6E63]/20 blur-3xl" />
        <div className="absolute inset-0 flex flex-col justify-center gap-8 px-16 opacity-5 pointer-events-none">
          {[...Array(5)].map((_, i) => <div key={i} className="h-px bg-white w-full" />)}
        </div>

        <div className="relative flex flex-col items-center text-center gap-6">
          <div className="relative w-24 h-24 brightness-0 invert opacity-90">
            <Image src="/FaithLibrary_logo.png" alt="FaithLibrary" fill className="object-contain" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold text-[#F5F5F5]">
              Join the<br />
              <span className="font-normal italic text-[#D7CCC8]">community</span>
            </h1>
            <p className="text-[#8D6E63] mt-3 text-base max-w-xs leading-relaxed">
              Upload your compositions, bookmark scores, and connect with fellow musicians.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3 text-left mt-2">
            {[
              'Upload unlimited scores',
              'Bookmark and save music',
              'Share with the world',
              'Connect your notation app',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5 text-[#D7CCC8] text-sm">
                <div className="w-5 h-5 rounded-full bg-[#5D4037] flex items-center
                                justify-center text-[#D7CCC8] flex-shrink-0">
                  <CheckCircle2 size={12} />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="relative w-9 h-9">
            <Image src="/FaithLibrary_logo.png" alt="FaithLibrary" fill className="object-contain" />
          </div>
          <span className="font-display text-xl font-semibold text-[#3E2723]">
            Faith<span className="text-[#8D6E63] font-normal italic">Library</span>
          </span>
        </div>

        <div className="w-full max-w-md">
          <h2 className="font-display text-3xl font-bold text-[#3E2723] mb-1">
            Create account
          </h2>
          <p className="text-[#8D6E63] text-sm mb-8">
            Free forever. No credit card needed.
          </p>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={googleLoad}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                       border border-[#D7CCC8] bg-white hover:bg-[#F5F5F5] hover:border-[#8D6E63]
                       text-[#3E2723] text-sm font-medium transition-all duration-200
                       disabled:opacity-60 mb-5 shadow-sm"
          >
            {googleLoad ? (
              <Loader2 size={16} className="animate-spin text-[#8D6E63]" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#D7CCC8]" />
            <span className="text-xs text-[#8D6E63] font-medium">or sign up with email</span>
            <div className="flex-1 h-px bg-[#D7CCC8]" />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                            bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              <AlertCircle size={15} className="flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-xs font-semibold text-[#5D4037] mb-1.5 uppercase tracking-wider">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#5D4037] mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#5D4037] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-[#8D6E63] hover:text-[#5D4037] transition-colors"
                >
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
                          i < strengthScore ? strengthColor : 'bg-[#D7CCC8]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[#8D6E63]">
                    Strength: <span className="font-medium text-[#5D4037]">{strengthLabel}</span>
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2
                         bg-[#5D4037] hover:bg-[#3E2723] text-[#F5F5F5]
                         font-semibold py-3 rounded-xl transition-colors duration-200
                         disabled:opacity-50 text-sm mt-2"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Creating account…</>
                : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#8D6E63] mt-6">
            Already have an account?{' '}
            <Link href="/login"
              className="text-[#5D4037] font-semibold hover:text-[#3E2723] transition-colors">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-[#8D6E63]/70 mt-4">
            By signing up you agree to our{' '}
            <Link href="/terms" className="underline hover:text-[#5D4037]">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-[#5D4037]">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}