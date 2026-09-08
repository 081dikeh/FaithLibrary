// app/auth/reset-password/layout.tsx
// See app/(auth)/login/layout.tsx for why this trivial layout exists.
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set New Password',
  description: 'Choose a new password for your FaithLibrary account.',
  robots: { index: false, follow: true },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}