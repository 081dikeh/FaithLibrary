# Deploying FaithLibrary to Vercel

The project is currently deployed at **faith-library.vercel.app**. This is what "deploying properly" means for this stack — use it for the first deploy or to sanity-check the existing one.

## 1. Supabase side (do this first)

- [ ] Production Supabase project exists (separate from any dev/local project, if you have one)
- [ ] Schema applied: `profiles`, `files`, `bookmarks`, `collections`, `collection_files`, `comments`, `notifications`, `recently_viewed`, `requests`, `request_upvotes`, `score_of_week` (see `lib/types.ts` for `files`' exact shape)
- [ ] Storage bucket `faithlibrary-files` created — public read, authenticated write
- [ ] RLS policies enabled on every table (public rows readable by anyone, private rows owner-only, admin tables gated on `profiles.role = 'admin'`)
- [ ] Auth providers configured (email/password and/or Google, matching what `login`/`signup` pages expect)
- [ ] Auth redirect URLs in Supabase (**Authentication → URL Configuration**) include your production domain, e.g. `https://faith-library.vercel.app/auth/callback`

## 2. Vercel project setup

- [ ] Repo connected to a Vercel project (Framework Preset: **Next.js** — should auto-detect)
- [ ] Build command: `next build` (default — don't override to add `--webpack`; that flag is dev-only)
- [ ] Output directory: default (`.next`)
- [ ] Node.js version: 20.x or later, set under **Settings → General → Node.js Version**

## 3. Environment variables (Vercel → Settings → Environment Variables)

| Variable | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon/public key | Production, Preview, Development |

That's the complete list — this app doesn't use a service-role key or any third-party API keys server-side. If you later add email sending, payment, or other integrations, add their keys here as **Production**-only unless you specifically want them available in preview deploys too.

Use **different Supabase projects for Preview vs Production** if you want PR previews to not touch production data — set the Preview environment's vars to point at a staging Supabase project instead.

## 4. next.config.ts / image domains

`next.config.ts` already whitelists the two image hosts the app needs:

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google avatar URLs
  ],
}
```

If your Supabase project uses a custom domain instead of `*.supabase.co`, add it here or `next/image` will refuse to optimize those images.

## 5. Pre-deploy checks (run locally before pushing)

```bash
npm run typecheck   # tsc --noEmit
npm run lint
npm test            # vitest run
npm run build        # full production build — catches anything the above two miss
```

All four currently pass clean on this codebase. Consider wiring these into CI (see below) so a broken build never reaches a preview/production deploy.

## 6. CI (optional but recommended)

There's no CI config in this repo yet. A minimal GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

Vercel will still run its own build on every push/PR regardless of CI — this just fails fast and gives you a green/red check on the PR before Vercel even starts, and catches lint/test failures that a Vercel build alone wouldn't (Vercel's build only runs `next build`, which type-checks but doesn't lint or run tests).

## 7. Post-deploy smoke test

- [ ] Homepage loads and shows scores (`/`)
- [ ] Sign up / log in works, and the Supabase auth redirect lands back on the right domain
- [ ] Upload a test score, confirm it appears in Browse and the PDF thumbnail renders
- [ ] Bookmark a score, refresh, confirm it persists
- [ ] Check `/admin` is inaccessible to a non-admin account
- [ ] Tab through the homepage with a keyboard only — confirm the skip link appears on first Tab and focus is visible throughout (this is the accessibility work from this pass; worth confirming it actually shows up in the deployed build, not just in tests)
