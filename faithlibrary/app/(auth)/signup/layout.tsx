// app/(auth)/signup/layout.tsx
// See app/(auth)/login/layout.tsx for why this trivial layout exists.
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a free FaithLibrary account to upload, bookmark, and share choral scores.',
  robots: { index: false, follow: true },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}