// components/Navbar.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Upload, LayoutDashboard, LogOut, Menu, X, Settings, Layers, Shield } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function Navbar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()
  const searchRef = useRef<HTMLInputElement>(null)

  const [user,       setUser]       = useState<User | null>(null)
  const [role,       setRole]       = useState<string>('user')
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setRole(profile?.role ?? 'user')
      }
    }
    load()

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setRole('user')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 80)
  }, [searchOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
      setMenuOpen(false)
    }
  }

  const navLinks = [
    { href: '/',         label: 'Library' },
    { href: '/browse',   label: 'Browse' },
    { href: '/requests', label: 'Requests' },
  ]

  const isAdmin = role === 'admin' || role === 'moderator'

  return (
    <>
      <nav className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled
          ? 'bg-[#3E2723]/96 backdrop-blur-lg shadow-[0_2px_20px_rgba(62,39,35,0.25)]'
          : 'bg-[#3E2723]'}
      `}>
        {/* Main bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between" style={{ height: '60px' }}>

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative w-7 h-8 sm:w-8 sm:h-9 logo-on-dark opacity-85
                              group-hover:opacity-100 transition-opacity duration-200">
                <Image src="/FaithLibrary_logo.png" alt="FaithLibrary" fill
                  className="object-contain" priority />
              </div>
              <span className="font-display text-lg sm:text-xl font-semibold
                               text-[#F5F5F5] tracking-tight">
                Faith<span className="text-[#D7CCC8] font-normal italic">Library</span>
              </span>
            </Link>

            {/* ── Desktop nav links ── */}
            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium
                              transition-all duration-150 ${
                    pathname === link.href
                      ? 'bg-[#5D4037] text-[#F5F5F5]'
                      : 'text-[#D7CCC8] hover:text-[#F5F5F5] hover:bg-[#5D4037]/50'
                  }`}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* ── Desktop right ── */}
            <div className="hidden md:flex items-center gap-1.5">
              {/* Search — triggers CommandSearch via keyboard shortcut */}
              <button
                onClick={() => {
                  const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
                  window.dispatchEvent(e)
                }}
                aria-label="Search (⌘K)"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg
                           text-[#8D6E63] hover:text-[#D7CCC8] hover:bg-[#5D4037]/40
                           border border-[#5D4037]/40 transition-all text-xs"
                style={{ fontFamily: 'var(--font-ui)' }}
              >
                <Search size={14} />
                <span className="hidden lg:block">Search…</span>
                <kbd className="hidden lg:flex items-center gap-0.5 px-1 py-0.5 rounded
                                bg-[#5D4037]/40 text-[0.6rem] leading-none">
                  ⌘K
                </kbd>
              </button>
              {/* Mobile search icon */}
              <button onClick={() => setSearchOpen(v => !v)} aria-label="Search"
                className="sm:hidden btn-icon text-[#D7CCC8] hover:text-white hover:bg-[#5D4037]/60"
                style={{ borderRadius: '10px', padding: '0.45rem' }}>
                <Search size={17} />
              </button>

              {user ? (
                <>
                  {/* Notifications */}
                  <NotificationBell />
                  {/* Admin badge */}
                  {isAdmin && (
                    <Link href="/admin"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                                 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/30
                                 text-amber-300 text-xs font-semibold transition-all"
                      title="Admin Dashboard">
                      <Shield size={12} />
                      {role === 'admin' ? 'Admin' : 'Mod'}
                    </Link>
                  )}

                  {/* Upload */}
                  <Link href="/upload" className="btn btn-sm ml-0.5"
                    style={{ background: '#5D4037', color: '#F5F5F5', borderColor: '#5D4037',
                             padding: '0.45rem 1rem', fontSize: '0.8125rem' }}>
                    <Upload size={13} /> Upload
                  </Link>

                  {/* Bulk */}
                  <Link href="/bulk-upload" className="btn btn-sm"
                    style={{ background: 'transparent', color: '#D7CCC8',
                             borderColor: 'rgba(141,110,99,0.4)',
                             padding: '0.45rem 0.875rem', fontSize: '0.8125rem' }}>
                    <Layers size={13} /> Bulk
                  </Link>

                  {/* Dashboard */}
                  <Link href="/dashboard" aria-label="Dashboard"
                    className="btn-icon text-[#D7CCC8] hover:text-white hover:bg-[#5D4037]/60"
                    style={{ borderRadius: '10px', padding: '0.45rem' }}>
                    <LayoutDashboard size={17} />
                  </Link>

                  {/* Settings */}
                  <Link href="/settings" aria-label="Settings"
                    className="btn-icon text-[#D7CCC8] hover:text-white hover:bg-[#5D4037]/60"
                    style={{ borderRadius: '10px', padding: '0.45rem' }}>
                    <Settings size={17} />
                  </Link>

                  {/* Sign out */}
                  <button onClick={handleSignOut} aria-label="Sign out"
                    className="btn-icon text-[#D7CCC8] hover:text-white hover:bg-[#5D4037]/60"
                    style={{ borderRadius: '10px', padding: '0.45rem' }}>
                    <LogOut size={17} />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login"
                    className="text-sm font-medium text-[#D7CCC8] hover:text-white
                               transition-colors px-3 py-1.5">
                    Log in
                  </Link>
                  <Link href="/signup" className="btn btn-sm"
                    style={{ background: '#5D4037', color: '#F5F5F5', borderColor: '#5D4037',
                             padding: '0.45rem 1rem', fontSize: '0.8125rem' }}>
                    Sign up
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile right ── */}
            <div className="flex md:hidden items-center gap-1">
              <button onClick={() => setSearchOpen(v => !v)}
                className="btn-icon text-[#D7CCC8]" style={{ padding: '0.4rem' }}>
                <Search size={17} />
              </button>
              <button onClick={() => setMenuOpen(v => !v)}
                className="btn-icon text-[#D7CCC8]" style={{ padding: '0.4rem' }}>
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Search bar ── */}
        {searchOpen && (
          <div className="border-t border-[#5D4037]/60 bg-[#3E2723] px-4 py-3 animate-slide-down">
            <form onSubmit={handleSearch}
              className="max-w-2xl mx-auto flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D6E63]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by title, composer, tag…"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#5D4037]/50 border border-[#5D4037]
                             rounded-xl text-[#F5F5F5] placeholder-[#8D6E63] text-sm
                             focus:outline-none focus:border-[#8D6E63] transition-colors"
                />
              </div>
              <button type="submit" className="btn btn-sm"
                style={{ background: '#5D4037', color: '#F5F5F5', borderColor: '#8D6E63',
                         padding: '0.5rem 1rem' }}>
                Search
              </button>
              <button type="button" onClick={() => setSearchOpen(false)}
                className="btn-icon text-[#8D6E63] hover:text-white" style={{ padding: '0.4rem' }}>
                <X size={16} />
              </button>
            </form>
          </div>
        )}

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#5D4037]/50 bg-[#3E2723]
                          px-4 py-3 flex flex-col gap-1 animate-slide-down">

            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-[#5D4037] text-[#F5F5F5]'
                    : 'text-[#D7CCC8] hover:bg-[#5D4037]/60 hover:text-[#F5F5F5]'
                }`}>
                {link.label}
              </Link>
            ))}

            <div className="h-px bg-[#5D4037]/50 my-1" />

            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold
                               bg-amber-400/20 text-amber-300 border border-amber-400/20
                               flex items-center gap-2">
                    <Shield size={14} />
                    {role === 'admin' ? 'Admin Dashboard' : 'Moderator Dashboard'}
                  </Link>
                )}
                <Link href="/upload" onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#D7CCC8]
                             hover:bg-[#5D4037]/60 hover:text-[#F5F5F5] transition-colors
                             flex items-center gap-2">
                  <Upload size={14} /> Upload
                </Link>
                <Link href="/bulk-upload" onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#D7CCC8]
                             hover:bg-[#5D4037]/60 hover:text-[#F5F5F5] transition-colors
                             flex items-center gap-2">
                  <Layers size={14} /> Bulk Upload
                </Link>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#D7CCC8]
                             hover:bg-[#5D4037]/60 hover:text-[#F5F5F5] transition-colors
                             flex items-center gap-2">
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
                <Link href="/settings" onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#D7CCC8]
                             hover:bg-[#5D4037]/60 hover:text-[#F5F5F5] transition-colors
                             flex items-center gap-2">
                  <Settings size={14} /> Settings
                </Link>
                <button onClick={handleSignOut}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#D7CCC8]
                             hover:bg-[#5D4037]/60 hover:text-[#F5F5F5] transition-colors
                             flex items-center gap-2 text-left">
                  <LogOut size={14} /> Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                  Log in
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)}
                  className="btn btn-primary" style={{ justifyContent: 'center' }}>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Spacer */}
      <div style={{ height: '60px' }} />
    </>
  )
}