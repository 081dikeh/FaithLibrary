// app/robots.ts
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/dashboard',
        '/settings',
        '/upload',
        '/bulk-upload',
        '/edit/',
        '/login',
        '/signup',
        '/forgot-password',
        '/auth/',
        '/api/',
        '/print/', // printable score view — not a page worth indexing separately from /view/[id]
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
