// lib/site.ts
//
// Single source of truth for the app's public base URL. Set
// NEXT_PUBLIC_SITE_URL in Vercel once a custom domain is attached;
// until then this falls back to the actual deployed vercel.app domain
// (confirmed live: faith-library.vercel.app — check your Vercel
// project's Domains tab if this ever needs updating) so canonical
// links, sitemap.xml, robots.txt, and OpenGraph previews all agree.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://faith-library.vercel.app'
