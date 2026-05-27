// components/Footer.tsx
import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-[#D7CCC8] mt-12 py-8 bg-white/60
                       mb-16 md:mb-0"> {/* mb-16 for mobile bottom nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-6 h-7 logo-on-light group-hover:opacity-80
                            transition-opacity">
              <Image src="/FaithLibrary_logo.png" alt="FaithLibrary" fill
                className="object-contain" />
            </div>
            <span className="font-display font-semibold text-[#5D4037]">FaithLibrary</span>
          </Link>

          {/* Nav links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { href: '/',           label: 'Library' },
              { href: '/browse',     label: 'Browse' },
              { href: '/requests',   label: 'Requests' },
              { href: '/stats',      label: 'Stats' },
              { href: '/collections',label: 'Collections' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className="text-xs text-[#8D6E63] hover:text-[#5D4037]
                           transition-colors font-medium">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#D7CCC8]/60 mb-5" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
            © {new Date().getFullYear()} FaithLibrary — A sacred music commons
          </p>
          <div className="flex items-center gap-5">
            <Link href="/terms"
              className="text-xs text-[#8D6E63] hover:text-[#5D4037] transition-colors">
              Terms
            </Link>
            <Link href="/privacy"
              className="text-xs text-[#8D6E63] hover:text-[#5D4037] transition-colors">
              Privacy
            </Link>
            <Link href="/admin"
              className="text-xs text-[#D7CCC8] hover:text-[#8D6E63] transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}