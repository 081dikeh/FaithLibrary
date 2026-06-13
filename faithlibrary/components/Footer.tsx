// components/Footer.tsx — server component, no event handlers
import Link from 'next/link'
import Image from 'next/image'
import { Music2 } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()

  const navLinks = [
    { href: '/',            label: 'Library'     },
    { href: '/browse',      label: 'Browse'      },
    { href: '/requests',    label: 'Requests'    },
    { href: '/stats',       label: 'Stats'       },
    { href: '/collections', label: 'Collections' },
  ]

  const legalLinks = [
    { href: '/terms',   label: 'Terms'   },
    { href: '/privacy', label: 'Privacy' },
    { href: '/admin',   label: 'Admin'   },
  ]

  return (
    <footer style={{
      background: '#1C0E0A',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      marginTop: 48,
    }}>
      {/* Mobile safe area handled via Tailwind */}
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
              display: 'inline-flex', alignItems: 'center', gap: 10,
              textDecoration: 'none', marginBottom: 12,
            }}>
              <div style={{ position: 'relative', width: 26, height: 30, opacity: 0.85 }}
                className="logo-on-dark">
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

          {/* Nav links — hover via CSS class */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="footer-link"
                style={{
                  fontSize: '0.8125rem', color: '#4A3028', fontWeight: 500,
                  textDecoration: 'none', fontFamily: 'var(--font-ui)',
                  transition: 'color 0.15s',
                }}>
                {link.label}
              </Link>
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
            {legalLinks.map(({ href, label }) => (
              <Link key={href} href={href}
                className="footer-link"
                style={{
                  fontSize: '0.75rem', color: '#3A2018',
                  textDecoration: 'none', fontFamily: 'var(--font-ui)',
                  transition: 'color 0.15s',
                }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Hover styles injected via globals — no event handlers needed */}
      <style>{`
        .footer-link:hover { color: #8D6E63 !important; }
        @media (max-width: 767px) {
          footer { padding-bottom: calc(64px + env(safe-area-inset-bottom)); }
        }
      `}</style>
    </footer>
  )
}