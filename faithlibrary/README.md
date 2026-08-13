# FaithLibrary

A free, open library for choir and choral sheet music — hymns, Mass parts, and
sacred compositions that choirs can search, read in-browser, print, and share.

**Live:** [th-library.vercel.app](https://th-library.vercel.app) *(swap in your custom domain here once you have one)*

<!--
  Add 2-3 screenshots here once you have them — homepage, browse/search, and
  the PDF viewer are the most useful ones to show. Something like:
  ![Homepage](./docs/screenshots/homepage.png)
-->

## Why

Most choirs have a "library" — it's just scattered across USB sticks,
individual members' phones, and old email attachments. FaithLibrary is a
single, searchable place for it: search by title, composer, or even just a
line of lyrics you half-remember, filter by category/season/voicing, and read
or print straight from the browser.

## Features

- **Search that works the way choir members actually search** — by title,
  composer, or a remembered lyric line, not just exact titles.
- **Browse by category, liturgical season, and voicing** (SATB, SAB, SSA,
  etc.), with sort and pagination.
- **In-browser PDF viewing and a dedicated print view**, tuned to actually
  work on mobile — including on cellular networks that strip HTTP range
  headers (see below).
- **Upload with tagging**, plus a bulk-upload flow for adding many scores at
  once.
- **Collections**, so users can group scores for a season or event.
- **Role-based admin dashboard** (admin / moderator / user) for featuring,
  publishing, and moderating uploads, backed by Postgres Row-Level Security
  — not just hidden buttons.
- **Comments and score requests**, so the community can ask for scores that
  aren't in the library yet.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, React 19, TypeScript)
- [Supabase](https://supabase.com) — Postgres, Auth, Storage, and Row-Level
  Security for all access control
- [Tailwind CSS v4](https://tailwindcss.com)
- [pdfjs-dist](https://mozilla.github.io/pdf.js/) / [react-pdf](https://github.com/wojtekmaj/react-pdf)
  for in-browser rendering and printing
- Hosted on [Vercel](https://vercel.com)

## Some real problems solved along the way

A few specific things worth knowing about if you're reading this as a
reviewer, since they came up as real bugs rather than being designed in from
the start:

- **PDF loading failures on mobile.** PDF.js defaults to loading files via
  chunked HTTP range requests. Mobile carrier networks frequently strip or
  mangle `Range` headers, which silently broke PDF loading on cellular data
  while working fine on wifi/desktop. Fixed by disabling range/streamed
  loading (`disableRange`, `disableStream`, `disableAutoFetch`) so the PDF
  loads as a single request instead.
- **A search-input bug that could break or reshape queries.** Search terms
  were being interpolated directly into a PostgREST `.or()` filter string.
  Since users are explicitly invited to search by remembered lyric lines
  (which are full of commas), unescaped input could break the filter's
  syntax or unintentionally change its logical structure. Fixed by
  sanitizing structural characters and escaping `ILIKE` wildcards before
  building the query.
- **Admin deletes that didn't actually delete.** The delete action updated
  the UI optimistically without checking whether the underlying Supabase
  call succeeded — so a delete blocked by a Row-Level Security policy would
  disappear from the screen and then silently reappear later. Fixed by
  surfacing errors properly and tightening the RLS policy itself so only
  the `admin` role can delete, enforced at the database level rather than
  just hidden in the UI.
- **A Tailwind v3 → v4 migration issue that silently broke almost all
  styling.** `globals.css` was using the old `@tailwind base/components/utilities`
  directive syntax from Tailwind v3, which the v4 engine doesn't process —
  so most utility classes were never actually being generated in the
  shipped CSS. Fixed by switching to the v4 `@import 'tailwindcss';` syntax.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your Supabase project URL + anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### Verifying changes

```bash
npx tsc --noEmit   # type-check
npx eslint .        # lint
npx next build      # full production build
```

## Roadmap

- [ ] Error monitoring (Sentry)
- [ ] Basic analytics
- [ ] Postgres full-text search (current search is `ILIKE`-based, fine at
      today's scale but won't stay fast forever)
- [ ] Automated tests + CI
- [ ] Custom domain



