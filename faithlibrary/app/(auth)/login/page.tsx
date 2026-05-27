// app/(auth)/login/page.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : error.message
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
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
                      focus:border-[#5D4037]`

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex text-center">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#3E2723] flex-col items-center
                      justify-center px-16 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#5D4037]/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#8D6E63]/20 blur-3xl" />
        {/* Staff lines */}
        <div className="absolute inset-0 flex flex-col justify-center gap-8 px-16 opacity-5 pointer-events-none">
          {[...Array(5)].map((_, i) => <div key={i} className="h-px bg-white w-full" />)}
        </div>

        <div className="relative flex flex-col items-center text-center gap-6">
          <div className="relative w-24 h-24 brightness-0 invert opacity-90">
            <Image src="/FaithLibrary_logo.png" alt="FaithLibrary" fill className="object-contain" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold text-[#F5F5F5]">
              Faith<span className="font-normal italic text-[#D7CCC8]">Library</span>
            </h1>
            <p className="text-[#8D6E63] mt-3 text-base max-w-xs leading-relaxed">
              A growing sacred music commons — discover, share, and preserve choral heritage.
            </p>
          </div>

          {/* Testimonial-style quote */}
          <div className="mt-6 border border-[#5D4037] rounded-2xl p-5 max-w-sm text-left">
            <p className="text-[#D7CCC8] text-sm italic leading-relaxed">
              "Music is the shorthand of emotion. Sacred music is its language."
            </p>
            <p className="text-[#8D6E63] text-xs mt-2">— The FaithLibrary vision</p>
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
            Welcome back
          </h2>
          <p className="text-[#8D6E63] text-sm mb-8">
            Sign in to your library account
          </p>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={googleLoad}
            className="w-full flex items-center justify-center gap-3 px-4 py-6 rounded-xl
                       border border-[#D7CCC8] bg-white hover:bg-[#F5F5F5] hover:border-[#8D6E63]
                       text-[#3E2723] text-sm font-medium transition-all duration-200
                       disabled:opacity-60 mb-5 shadow-sm lg:w-1/3 lg:mx-auto lg:py-8 lg:text-base"
          >
            {googleLoad ? (
              <Loader2 size={16} className="animate-spin text-[#8D6E63]" />
            ) : (
              /* Google G icon */
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
            <span className="text-xs text-[#8D6E63] font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-[#D7CCC8]" />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                            bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              <AlertCircle size={15} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
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
                className={`${inputClass} border-[#D7CCC8]`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
                  Password
                </label>
                <Link href="/forgot-password"
                  className="text-xs text-[#8D6E63] hover:text-[#5D4037] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`${inputClass} border-[#D7CCC8] pr-11`}
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
                ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-[#8D6E63] mt-6">
            Don't have an account?{' '}
            <Link href="/signup"
              className="text-[#5D4037] font-semibold hover:text-[#3E2723] transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}