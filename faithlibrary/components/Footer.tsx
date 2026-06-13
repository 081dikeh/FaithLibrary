// components/Footer.tsx — UI rewrite, all logic unchanged
import Link from 'next/link'
import Image from 'next/image'
import { Music2 } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()

  const links = [
    { href: '/',            label: 'Library'     },
    { href: '/browse',      label: 'Browse'      },
    { href: '/requests',    label: 'Requests'    },
    { href: '/stats',       label: 'Stats'       },
    { href: '/collections', label: 'Collections' },
  ]

  return (
    <footer style={{
      background: '#1C0E0A',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      marginTop: 48,
      paddingBottom: 'calc(64px + env(safe-area-inset-bottom))',
    }} className="md:pb-0">
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 24px 32px' }}>

        {/* Top row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 32, marginBottom: 36,
        }}>
          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              textDecoration: 'none', marginBottom: 12,
            }}>
              <div style={{ position: 'relative', width: 26, height: 30, opacity: 0.85 }} className="logo-on-dark">
                <Image src="/FaithLibrary_logo.png" alt="FaithLibrary" fill className="object-contain" />
              </div>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '1.1rem',
                fontWeight: 600, color: '#F7F4F2', letterSpacing: '-0.02em',
              }}>
                Faith<span style={{ color: '#5A4035', fontStyle: 'italic', fontWeight: 400 }}>Library</span>
              </span>
            </Link>
            <p style={{
              fontSize: '0.8rem', color: '#4A3028', lineHeight: 1.7,
              fontFamily: 'var(--font-ui)',
            }}>
              A free commons of sacred choral music — hymns, Mass parts,
              and liturgical scores shared by musicians worldwide.
            </p>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
            {links.map(link => (
              <Link key={link.href} href={link.href} style={{
                fontSize: '0.8125rem', color: '#4A3028', fontWeight: 500,
                textDecoration: 'none', fontFamily: 'var(--font-ui)',
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D7CCC8' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4A3028' }}
              >{link.label}</Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 24 }} />

        {/* Bottom row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Music2 size={12} style={{ color: '#3A2018', flexShrink: 0 }} />
            <p style={{ fontSize: '0.75rem', color: '#3A2018', fontFamily: 'var(--font-ui)' }}>
              © {year} FaithLibrary — Sacred music commons
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {[
              { href: '/terms',   label: 'Terms'   },
              { href: '/privacy', label: 'Privacy' },
              { href: '/admin',   label: 'Admin'   },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{
                fontSize: '0.75rem', color: '#3A2018',
                textDecoration: 'none', fontFamily: 'var(--font-ui)',
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#8D6E63' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3A2018' }}
              >{label}</Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav safe area */}
      <style>{`@media(min-width:768px){footer{padding-bottom:32px!important}}`}</style>
    </footer>
  )
}