// components/MobileNav.tsx
'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, Upload, LayoutDashboard, BookOpen } from 'lucide-react'

const LINKS = [
  { href: '/',           icon: <Home size={20} />,            label: 'Home' },
  { href: '/browse',     icon: <Search size={20} />,          label: 'Browse' },
  { href: '/upload',     icon: <Upload size={20} />,          label: 'Upload' },
  { href: '/collections',icon: <BookOpen size={20} />,        label: 'Collections' },
  { href: '/dashboard',  icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
]

export function MobileNav() {
  const pathname = usePathname()

  // Don't show on auth pages or print page
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/print')
  ) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden
                    bg-[#3E2723]/98 backdrop-blur-lg border-t border-[#5D4037]/60
                    safe-area-pb"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {LINKS.map(link => {
          const active = pathname === link.href ||
            (link.href !== '/' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5
                          rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                active
                  ? 'text-[#F5F5F5] bg-[#5D4037]'
                  : 'text-[#8D6E63] hover:text-[#D7CCC8]'
              }`}
            >
              {link.icon}
              <span className="text-[0.6rem] font-medium leading-none mt-0.5 truncate">
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}