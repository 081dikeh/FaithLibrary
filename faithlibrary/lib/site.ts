// lib/site.ts
//
// Single source of truth for the app's public base URL. Set
// NEXT_PUBLIC_SITE_URL in Vercel once a custom domain is attached;
// until then this falls back to the actual deployed vercel.app domain
// (NOT a guessed one — check your Vercel project settings if this ever
// drifts) so canonical links, sitemap.xml, robots.txt, and OpenGraph
// previews all agree with each other.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://th-library.vercel.app'
