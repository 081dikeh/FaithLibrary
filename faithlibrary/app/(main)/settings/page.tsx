// app/(main)/settings/page.tsx — UI rewrite, all logic unchanged
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SettingsForm } from '@/components/SettingsForm'
import { User, Lock, Trash2, Settings } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const initials = (profile?.full_name ?? user.email ?? '?')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4F2' }} className="grain">
      <Navbar />

      {/* ── Dark hero ── */}
      <div style={{ background: '#1C0E0A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'rgba(93,64,55,0.25)', filter: 'blur(56px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px 40px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Avatar */}
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: 'rgba(93,64,55,0.6)', border: '2px solid rgba(141,110,99,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: '1.25rem',
              fontWeight: 700, color: '#D7CCC8',
            }}>{initials}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Settings size={12} style={{ color: '#5A4035' }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A4035', fontFamily: 'var(--font-ui)' }}>
                  Account Settings
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 700, color: '#F7F4F2', lineHeight: 1.1 }}>
                {profile?.full_name ?? 'Your Account'}
              </h1>
              <p style={{ color: '#5A4035', fontSize: '0.8rem', marginTop: 3, fontFamily: 'var(--font-ui)' }}>
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 64px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Profile card */}
        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid #E8E0DC',
          boxShadow: '0 1px 3px rgba(62,39,35,0.05), 0 6px 20px rgba(62,39,35,0.07)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #F0EAE6',
            background: '#FAFAF9',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'rgba(93,64,55,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#5D4037',
            }}><User size={14} /></div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#3E2723' }}>
              Profile
            </h2>
          </div>
          <div style={{ padding: '24px' }}>
            <SettingsForm
              userId={user.id}
              email={user.email ?? ''}
              currentName={profile?.full_name ?? ''}
            />
          </div>
        </div>

        {/* Password card */}
        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid #E8E0DC',
          boxShadow: '0 1px 3px rgba(62,39,35,0.05), 0 6px 20px rgba(62,39,35,0.07)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 24px', borderBottom: '1px solid #F0EAE6',
            background: '#FAFAF9', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'rgba(93,64,55,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#5D4037',
            }}><Lock size={14} /></div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#3E2723' }}>
              Password
            </h2>
          </div>
          <div style={{ padding: '24px' }}>
            <p style={{ fontSize: '0.875rem', color: '#8D6E63', marginBottom: 16, lineHeight: 1.6, fontFamily: 'var(--font-ui)' }}>
              To change your password, we'll send a reset link to{' '}
              <strong style={{ color: '#5D4037' }}>{user.email}</strong>.
            </p>
            <a href="/forgot-password" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 10,
              background: '#FAFAF9', border: '1.5px solid #E0D8D4',
              color: '#5D4037', fontSize: '0.8125rem', fontWeight: 600,
              textDecoration: 'none', fontFamily: 'var(--font-ui)',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#5D4037'; el.style.background = 'rgba(93,64,55,0.05)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E0D8D4'; el.style.background = '#FAFAF9' }}
            >
              Send reset link
            </a>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid #FCA5A5',
          boxShadow: '0 1px 3px rgba(220,38,38,0.04), 0 6px 20px rgba(220,38,38,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 24px', borderBottom: '1px solid #FEE2E2',
            background: '#FFF5F5', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'rgba(220,38,38,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#DC2626',
            }}><Trash2 size={14} /></div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#991B1B' }}>
              Danger Zone
            </h2>
          </div>
          <div style={{
            padding: '24px', display: 'flex',
            flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3E2723', marginBottom: 4, fontFamily: 'var(--font-ui)' }}>
                Delete account
              </p>
              <p style={{ fontSize: '0.8rem', color: '#9E8070', fontFamily: 'var(--font-ui)', lineHeight: 1.5 }}>
                Permanently removes your account and all your uploads. This cannot be undone.
              </p>
            </div>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 10, flexShrink: 0,
              background: 'transparent', border: '1.5px solid #FCA5A5',
              color: '#DC2626', fontSize: '0.8125rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-ui)',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#FEF2F2'; el.style.borderColor = '#DC2626' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = '#FCA5A5' }}
            >
              <Trash2 size={13} /> Delete account
            </button>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  )
}