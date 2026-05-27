// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { MobileNav } from '@/components/MobileNav'
import { CommandSearch } from '@/components/CommandSearch'

const BASE_URL = 'https://faith-library.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:  'FaithLibrary — Sacred Music & Choral Score Library',
    template: '%s — FaithLibrary',
  },
  description:
    'Discover, upload and share choral music, hymns, and sacred scores. ' +
    'A free library for Catholic liturgical music.',
  keywords: [
    'choral music', 'sacred music', 'hymns', 'choir scores', 'SATB',
    'Catholic music', 'liturgical music', 'sheet music', 'Mass music',
    'Sanctus', 'Gloria', 'Kyrie',
  ],
  authors: [{ name: 'FaithLibrary' }],
  openGraph: {
    type:      'website',
    siteName:  'FaithLibrary',
    title:     'FaithLibrary — Sacred Music & Choral Score Library',
    description: 'A free library for choral music, hymns, and sacred scores.',
    url:       BASE_URL,
  },
  twitter: {
    card:  'summary_large_image',
    title: 'FaithLibrary — Sacred Music Library',
    description: 'Discover and share choral music, hymns, and sacred scores.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain min-h-screen bg-[#F5F5F5]">
        {children}
        <MobileNav />
        <CommandSearch />
      </body>
    </html>
  )
}