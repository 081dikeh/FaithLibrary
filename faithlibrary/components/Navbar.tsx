// components/Navbar.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Upload, LayoutDashboard, LogOut, Menu, X, Settings, Layers, Shield, BookOpen } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function Navbar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()
  const searchRef = useRef<HTMLInputElement>(null)

  const [user,        setUser]        = useState<User | null>(null)
  const [role,        setRole]        = useState<string>('user')
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [scrolled,    setScrolled]    = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
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

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

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
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="page-container h-full flex items-center justify-between">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative w-7 h-8 logo-on-dark opacity-80 group-hover:opacity-100 transition-opacity">
              <Image src="/FaithLibrary_logo.png" alt="FaithLibrary" fill className="object-contain" priority />
            </div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              fontWeight: 600,
              color: '#F7F4F2',
              letterSpacing: '-0.01em',
            }}>
              Faith<span style={{ color: '#C4B5AF', fontStyle: 'italic', fontWeight: 400 }}>Library</span>
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center" style={{ gap: 2 }}>
            {navLinks.map(link => {
              const active = pathname === link.href
              return (
                <Link key={link.href} href={link.href} style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: active ? '#F7F4F2' : '#A08070',
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.target as HTMLElement).style.color = '#F7F4F2'
                      ;(e.target as HTMLElement).style.background = 'rgba(255,255,255,0.07)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.target as HTMLElement).style.color = '#A08070'
                      ;(e.target as HTMLElement).style.background = 'transparent'
                    }
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* ── Desktop right ── */}
          <div className="hidden md:flex items-center" style={{ gap: 6 }}>
            {/* Search trigger */}
            <button
              onClick={() => {
                const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
                window.dispatchEvent(e)
              }}
              aria-label="Search (⌘K)"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#8D6E63', cursor: 'pointer',
                fontSize: '0.8125rem',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(255,255,255,0.1)'
                el.style.color = '#D7CCC8'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(255,255,255,0.06)'
                el.style.color = '#8D6E63'
              }}
            >
              <Search size={14} />
              <span className="hidden lg:block" style={{ color: '#8D6E63' }}>Search…</span>
              <kbd className="hidden lg:flex items-center gap-0.5" style={{
                padding: '2px 5px', borderRadius: 5,
                background: 'rgba(255,255,255,0.08)',
                fontSize: '0.6rem', color: '#7A6055',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>⌘K</kbd>
            </button>

            {user ? (
              <>
                <NotificationBell />

                {isAdmin && (
                  <Link href="/admin" style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 7,
                    background: 'rgba(251,191,36,0.12)',
                    border: '1px solid rgba(251,191,36,0.25)',
                    color: '#FCD34D', fontSize: '0.75rem', fontWeight: 600,
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}>
                    <Shield size={12} />
                    {role === 'admin' ? 'Admin' : 'Mod'}
                  </Link>
                )}

                {/* Upload */}
                <Link href="/upload" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  background: 'var(--walnut)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#F7F4F2', fontSize: '0.8125rem', fontWeight: 500,
                  textDecoration: 'none', transition: 'all 0.18s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--roasted)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--walnut)' }}
                >
                  <Upload size={13} /> Upload
                </Link>

                {/* Bulk */}
                <Link href="/bulk-upload" title="Bulk upload" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 34, height: 34, borderRadius: 9,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#A08070', textDecoration: 'none', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.1)'; el.style.color = '#D7CCC8' }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.06)'; el.style.color = '#A08070' }}
                ><Layers size={15} /></Link>

                {/* Dashboard */}
                <Link href="/dashboard" title="Dashboard" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 34, height: 34, borderRadius: 9,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#A08070', textDecoration: 'none', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.1)'; el.style.color = '#D7CCC8' }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.06)'; el.style.color = '#A08070' }}
                ><LayoutDashboard size={15} /></Link>

                {/* Settings */}
                <Link href="/settings" title="Settings" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 34, height: 34, borderRadius: 9,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#A08070', textDecoration: 'none', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.1)'; el.style.color = '#D7CCC8' }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.06)'; el.style.color = '#A08070' }}
                ><Settings size={15} /></Link>

                {/* Sign out */}
                <button onClick={handleSignOut} title="Sign out" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 34, height: 34, borderRadius: 9,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#A08070', cursor: 'pointer', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.1)'; el.style.color = '#D7CCC8' }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.06)'; el.style.color = '#A08070' }}
                ><LogOut size={15} /></button>
              </>
            ) : (
              <>
                <Link href="/login" style={{
                  fontSize: '0.875rem', fontWeight: 500, color: '#A08070',
                  textDecoration: 'none', padding: '6px 12px', transition: 'color 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F7F4F2' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#A08070' }}
                >Log in</Link>
                <Link href="/signup" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  background: 'var(--walnut)', color: '#F7F4F2',
                  fontSize: '0.8125rem', fontWeight: 500,
                  textDecoration: 'none', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--roasted)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--walnut)' }}
                >Sign up</Link>
              </>
            )}
          </div>

          {/* ── Mobile right ── */}
          <div className="flex md:hidden items-center gap-1">
            <button onClick={() => setSearchOpen(v => !v)} aria-label="Search" style={{
              padding: 7, borderRadius: 8, background: 'transparent',
              border: 'none', color: '#A08070', cursor: 'pointer',
            }}><Search size={18} /></button>
            <button onClick={() => setMenuOpen(v => !v)} aria-label="Menu" style={{
              padding: 7, borderRadius: 8, background: 'transparent',
              border: 'none', color: '#A08070', cursor: 'pointer',
            }}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Inline search bar (mobile) ── */}
        {searchOpen && (
          <div className="animate-slide-down" style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(44,24,16,0.98)',
            padding: '10px 16px 12px',
          }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, maxWidth: 640, margin: '0 auto' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: '#8D6E63',
                }} />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by title, composer, tag…"
                  style={{
                    width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, color: '#F7F4F2',
                    fontSize: '0.875rem', outline: 'none',
                    fontFamily: 'var(--font-ui)',
                  }}
                />
              </div>
              <button type="submit" style={{
                padding: '9px 16px', borderRadius: 10,
                background: 'var(--walnut)', color: '#F7F4F2',
                border: 'none', fontSize: '0.8125rem', fontWeight: 500,
                cursor: 'pointer',
              }}>Go</button>
              <button type="button" onClick={() => setSearchOpen(false)} style={{
                padding: 9, borderRadius: 10,
                background: 'rgba(255,255,255,0.06)', color: '#8D6E63',
                border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
              }}><X size={15} /></button>
            </form>
          </div>
        )}

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className="md:hidden animate-slide-down" style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(44,24,16,0.99)',
            padding: '8px 12px 16px',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {navLinks.map(link => {
              const active = pathname === link.href
              return (
                <Link key={link.href} href={link.href} style={{
                  padding: '11px 16px', borderRadius: 10,
                  fontSize: '0.9rem', fontWeight: 500,
                  color: active ? '#F7F4F2' : '#A08070',
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.15s',
                }}>
                  <BookOpen size={15} style={{ opacity: 0.6 }} />
                  {link.label}
                </Link>
              )
            })}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />

            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" style={{
                    padding: '11px 16px', borderRadius: 10,
                    fontSize: '0.875rem', fontWeight: 600,
                    background: 'rgba(251,191,36,0.1)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    color: '#FCD34D', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <Shield size={15} />
                    {role === 'admin' ? 'Admin Dashboard' : 'Moderator Dashboard'}
                  </Link>
                )}
                {[
                  { href: '/upload',      label: 'Upload Score',  Icon: Upload },
                  { href: '/bulk-upload', label: 'Bulk Upload',   Icon: Layers },
                  { href: '/dashboard',   label: 'Dashboard',     Icon: LayoutDashboard },
                  { href: '/settings',    label: 'Settings',      Icon: Settings },
                ].map(({ href, label, Icon }) => (
                  <Link key={href} href={href} style={{
                    padding: '11px 16px', borderRadius: 10,
                    fontSize: '0.875rem', fontWeight: 500,
                    color: '#A08070', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={15} style={{ opacity: 0.7 }} />
                    {label}
                  </Link>
                ))}
                <button onClick={handleSignOut} style={{
                  padding: '11px 16px', borderRadius: 10,
                  fontSize: '0.875rem', fontWeight: 500,
                  color: '#A08070', background: 'transparent',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  textAlign: 'left', width: '100%', transition: 'all 0.15s',
                }}>
                  <LogOut size={15} style={{ opacity: 0.7 }} />
                  Sign out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                <Link href="/login" style={{
                  padding: '12px 16px', borderRadius: 10, textAlign: 'center',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#D7CCC8', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none',
                }}>Log in</Link>
                <Link href="/signup" style={{
                  padding: '12px 16px', borderRadius: 10, textAlign: 'center',
                  background: 'var(--walnut)', color: '#F7F4F2',
                  fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none',
                }}>Sign up free</Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Spacer */}
      <div className="nav-spacer" />
    </>
  )
}