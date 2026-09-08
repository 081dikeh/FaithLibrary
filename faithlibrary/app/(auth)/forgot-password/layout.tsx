// app/(auth)/forgot-password/layout.tsx
// See app/(auth)/login/layout.tsx for why this trivial layout exists.
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Request a password reset link for your FaithLibrary account.',
  robots: { index: false, follow: true },
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}