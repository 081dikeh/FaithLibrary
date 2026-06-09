// components/Navbar.tsx — UI rewrite, all functionality preserved
'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Upload, LayoutDashboard, LogOut, Menu, X, Settings, Layers, Shield, BookOpen, Music2 } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const searchRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string>('user')
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', session.user.id).single()
        setRole(profile?.role ?? 'user')
      }
    }
    load()
    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
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
    }
  }

  const navLinks = [
    { href: '/', label: 'Library', icon: <BookOpen size={13} /> },
    { href: '/browse', label: 'Browse', icon: <Music2 size={13} /> },
    { href: '/requests', label: 'Requests', icon: <Search size={13} /> },
  ]

  const isAdmin = role === 'admin' || role === 'moderator'

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(28,14,10,0.97)' : '#1C0E0A',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        {/* ── Main bar ── */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ height: 58, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>

            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ position: 'relative', width: 28, height: 32, opacity: 0.9 }} className="logo-on-dark">
                <Image src="/FaithLibrary_logo.png" alt="FaithLibrary" fill className="object-contain" priority />
              </div>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '1.15rem',
                fontWeight: 600, color: '#F7F4F2', letterSpacing: '-0.02em',
              }}>
                Faith<span style={{ color: '#A08070', fontWeight: 400, fontStyle: 'italic' }}>Library</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: 2, marginLeft: 8 }}>
              {navLinks.map(link => {
                const active = pathname === link.href
                return (
                  <Link key={link.href} href={link.href} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8,
                    fontSize: '0.8125rem', fontWeight: 500,
                    color: active ? '#F7F4F2' : '#7A6055',
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                    letterSpacing: '-0.01em',
                  }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#D7CCC8'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' } }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#7A6055'; (e.currentTarget as HTMLElement).style.background = 'transparent' } }}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Desktop right */}
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              {/* Search trigger */}
              <button
                onClick={() => { const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }); window.dispatchEvent(e) }}
                aria-label="Search (⌘K)"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#5A4035', cursor: 'pointer', fontSize: '0.8rem',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.08)'; el.style.color = '#A08070' }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = '#5A4035' }}
              >
                <Search size={13} />
                <span style={{ color: 'inherit' }} className="hidden lg:block">Search</span>
                <kbd style={{
                  padding: '2px 6px', borderRadius: 5, fontSize: '0.6rem',
                  background: 'rgba(255,255,255,0.07)', color: '#5A4035',
                  border: '1px solid rgba(255,255,255,0.08)',
                }} className="hidden lg:block">⌘K</kbd>
              </button>

              {user ? (
                <>
                  <NotificationBell />

                  {isAdmin && (
                    <Link href="/admin" style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 7,
                      background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
                      color: '#FCD34D', fontSize: '0.75rem', fontWeight: 600,
                      textDecoration: 'none',
                    }}>
                      <Shield size={11} />
                      {role === 'admin' ? 'Admin' : 'Mod'}
                    </Link>
                  )}

                  {/* Upload — primary CTA */}
                  <Link href="/upload" style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8,
                    background: '#5D4037', color: '#F7F4F2',
                    fontSize: '0.8125rem', fontWeight: 600,
                    textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset',
                    transition: 'background 0.15s',
                    letterSpacing: '-0.01em',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4E342E' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#5D4037' }}
                  >
                    <Upload size={13} /> Upload
                  </Link>

                  {/* Icon buttons */}
                  {[
                    { href: '/bulk-upload', icon: <Layers size={15} />, label: 'Bulk Upload' },
                    { href: '/dashboard', icon: <LayoutDashboard size={15} />, label: 'Dashboard' },
                    { href: '/settings', icon: <Settings size={15} />, label: 'Settings' },
                  ].map(({ href, icon, label }) => (
                    <Link key={href} href={href} aria-label={label} title={label} style={{
                      width: 32, height: 32, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                      color: '#5A4035', textDecoration: 'none', transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.1)'; el.style.color = '#D7CCC8' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = '#5A4035' }}
                    >{icon}</Link>
                  ))}

                  <button onClick={handleSignOut} aria-label="Sign out" title="Sign out" style={{
                    width: 32, height: 32, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                    color: '#5A4035', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.1)'; el.style.color = '#D7CCC8' }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = '#5A4035' }}
                  >
                    <LogOut size={15} />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" style={{
                    padding: '6px 14px', fontSize: '0.8125rem', fontWeight: 500,
                    color: '#7A6055', textDecoration: 'none', borderRadius: 8,
                    transition: 'color 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D7CCC8' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7A6055' }}
                  >Log in</Link>
                  <Link href="/signup" style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', borderRadius: 8,
                    background: '#5D4037', color: '#F7F4F2',
                    fontSize: '0.8125rem', fontWeight: 600,
                    textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4E342E' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#5D4037' }}
                  >Sign up</Link>
                </>
              )}
            </div>

            {/* Mobile right */}
            <div className="flex md:hidden" style={{ alignItems: 'center', gap: 2 }}>
              <button onClick={() => setSearchOpen(v => !v)} aria-label="Search" style={{
                width: 34, height: 34, borderRadius: 8, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', color: '#7A6055', cursor: 'pointer',
              }}><Search size={17} /></button>
              <button onClick={() => setMenuOpen(v => !v)} aria-label="Menu" style={{
                width: 34, height: 34, borderRadius: 8, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: menuOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: '#D7CCC8', cursor: 'pointer',
              }}>
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Search bar ── */}
        {searchOpen && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(28,14,10,0.98)',
            padding: '10px 20px 12px',
          }} className="animate-slide-down">
            <form onSubmit={handleSearch} style={{ maxWidth: 560, margin: '0 auto', display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: '#5A4035', pointerEvents: 'none',
                }} />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by title, composer, tag…"
                  style={{
                    width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 9, color: '#F7F4F2', fontSize: '0.875rem', outline: 'none',
                    fontFamily: 'var(--font-ui)',
                  }}
                />
              </div>
              <button type="submit" style={{
                padding: '9px 16px', borderRadius: 9, background: '#5D4037',
                color: '#F7F4F2', border: 'none', fontSize: '0.8125rem',
                fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-ui)',
              }}>Search</button>
              <button type="button" onClick={() => setSearchOpen(false)} style={{
                width: 36, height: 36, borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)', color: '#7A6055',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}><X size={14} /></button>
            </form>
          </div>
        )}

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className="md:hidden animate-slide-down" style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(28,14,10,0.99)',
            padding: '8px 12px 16px',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {navLinks.map(link => {
              const active = pathname === link.href
              return (
                <Link key={link.href} href={link.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px', borderRadius: 10,
                  fontSize: '0.9rem', fontWeight: 500,
                  color: active ? '#F7F4F2' : '#7A6055',
                  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  textDecoration: 'none',
                }}>
                  {link.icon} {link.label}
                </Link>
              )
            })}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px', borderRadius: 10,
                    background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
                    color: '#FCD34D', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
                  }}>
                    <Shield size={14} />
                    {role === 'admin' ? 'Admin Dashboard' : 'Moderator Dashboard'}
                  </Link>
                )}
                {[
                  { href: '/upload', label: 'Upload Score', icon: <Upload size={14} /> },
                  { href: '/bulk-upload', label: 'Bulk Upload', icon: <Layers size={14} /> },
                  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
                  { href: '/settings', label: 'Settings', icon: <Settings size={14} /> },
                ].map(({ href, label, icon }) => (
                  <Link key={href} href={href} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px', borderRadius: 10,
                    fontSize: '0.875rem', fontWeight: 500,
                    color: '#7A6055', textDecoration: 'none',
                  }}>{icon} {label}</Link>
                ))}
                <button onClick={handleSignOut} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px', borderRadius: 10,
                  fontSize: '0.875rem', fontWeight: 500, color: '#7A6055',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--font-ui)',
                }}>
                  <LogOut size={14} /> Sign out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                <Link href="/login" style={{
                  padding: '12px', borderRadius: 10, textAlign: 'center',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#D7CCC8', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none',
                }}>Log in</Link>
                <Link href="/signup" style={{
                  padding: '12px', borderRadius: 10, textAlign: 'center',
                  background: '#5D4037', color: '#F7F4F2',
                  fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none',
                }}>Sign up free</Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Spacer */}
      <div style={{ height: 58 }} />
    </>
  )
}