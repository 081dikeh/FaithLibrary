// app/(auth)/login/layout.tsx
//
// login/page.tsx is a client component, so it can't export `metadata`
// itself — Next only reads that from server components. This trivial
// pass-through layout is the standard workaround: it gives the route its
// own title instead of silently falling back to the homepage's.
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to FaithLibrary to upload, bookmark, and manage your choral scores.',
  robots: { index: false, follow: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}