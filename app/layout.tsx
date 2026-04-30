// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FaithLibrary — Choral Music & Sheet Music Library',
  description: 'Discover, upload, and share choral music, hymns, and sacred scores.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain min-h-screen bg-[#F5F5F5]">
        {children}
      </body>
    </html>
  )
}