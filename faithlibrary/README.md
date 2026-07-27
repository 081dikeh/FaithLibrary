# FaithLibrary

FaithLibrary is a free, community-driven library for sharing Catholic and Christian choral music scores — hymns, Mass parts, and sacred compositions — built as a commons for musicians, choir directors, and parishes.

Live: https://faith-library.vercel.app

---

## Stack

| Layer       | Choice |
|-------------|--------|
| Framework   | Next.js 16 (App Router), React 19, TypeScript |
| Styling     | Tailwind CSS v4 + a `.score-grid` utility class in `globals.css` (see [Known issues](#known-issues--tech-debt)) |
| Data        | Supabase — Postgres, Auth, Storage, Realtime |
| PDF preview | `pdfjs-dist`, rendered lazily via `IntersectionObserver` |
| Testing     | Vitest, React Testing Library, `vitest-axe` |
| Deployment  | Vercel |

---

## Getting started

### 1. Prerequisites

- Node.js 20+ (the lockfile was generated against Node 22; anything ≥20 should work)
- A Supabase project (free tier is fine)

### 2. Install

```bash
npm install
```

### 3. Environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Both values are in your Supabase project under **Settings → API**. These are the only two environment variables the app reads (verified by grepping every `process.env` reference in the codebase). The anon key is meant to be public — it's protected by your Row Level Security (RLS) policies, not by secrecy — but `.env.local` is still gitignored by default, and it isn't included in this handoff. **Do not commit real keys to source control.**

> No service-role/secret key is used anywhere in this app. The one Next.js API route (`/api/external-upload`) authenticates by verifying the caller's own Supabase session bearer token and relies on RLS, rather than a privileged server key.

### 4. Supabase schema

There's no migration file checked into the repo, so the schema needs to exist in your Supabase project before the app will work. Based on the tables the app queries, you'll need at minimum:

- `profiles` (linked 1:1 to `auth.users`, with a `role` column used for admin gating)
- `files` (the score records — see `lib/types.ts` for the exact shape: `title`, `composer`, `arranger`, `voice_parts`, `tags`, `is_public`, `file_url`, `thumbnail_url`, `download_count`, etc.)
- `bookmarks`, `collections`, `collection_files`, `comments`, `notifications`, `recently_viewed`, `requests`, `request_upvotes`, `score_of_week`

Plus a **Storage bucket** named `faithlibrary-files` (public read, authenticated write) for the uploaded PDFs/scores and generated thumbnails.

Set RLS policies so that:
- anyone can read rows/files where `is_public = true`
- users can only read/write their own private rows
- only `profiles.role = 'admin'` can access admin-only tables/actions

### 5. Run it

```bash
npm run dev
```

Opens on http://localhost:3000. Development **must** run with Webpack, not Turbopack — this is already wired into the `dev` script (`next dev --webpack`). Turbopack has caused severe lag in this project during development; don't remove that flag.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Webpack, not Turbopack) |
| `npm run build` | Production build (uses Turbopack — this is fine; only *dev* needs Webpack) |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run Vitest with a coverage report |

---

## Testing

Tests live alongside components in `components/__tests__/`, using **Vitest** + **React Testing Library**, with **`vitest-axe`** wired into every suite for automated accessibility regression checks (`expect(results).toHaveNoViolations()`).

Current coverage focuses on the interactive, presentational components that don't require a live Supabase backend to render meaningfully:

- `Pagination` — link generation, `aria-current`, edge cases at first/last page
- `MobileNav` — active-route highlighting, hidden on auth/print routes
- `CategoryFilter` — dropdown open/close, Escape-to-close, tag toggling, pill removal
- `Navbar` — landmark labeling, mobile menu/search toggle states
- `ScoreCard` — accessible naming, bookmark state, and a regression test asserting the quick-action buttons are *siblings* of the thumbnail link rather than nested inside it (see below)

Server components that fetch directly from Supabase (e.g. the homepage's `ScoreGrid`, `HomeStats`) aren't unit-tested here — they'd need either a Supabase test double or integration/e2e tests (e.g. Playwright against a seeded Supabase branch) to test meaningfully. That's a reasonable next investment if the team wants deeper coverage.

To add a new component test, mock `next/navigation` and `@/lib/supabase/client` the way the existing tests do (see `vi.hoisted` + `vi.mock` at the top of any file in `__tests__/`), and run the accessibility check on both the default and any "opened" state (dropdowns, modals) — closed states rarely have violations; open states are where they hide.

---

## Accessibility

An axe-core sweep (via `vitest-axe`, plus a manual pass) found and fixed the following real issues — not just missing ARIA labels, but structural bugs:

1. **Invalid nested interactive elements.** `ScoreCard`'s bookmark and quick-download buttons were rendered *inside* the `<a>` wrapping the thumbnail — invalid HTML, and it silently breaks how assistive tech and even some browsers handle the nested controls. Restructured so those buttons are siblings of the link, positioned absolutely to preserve the original layout.
2. **`role="menu"` misuse.** `CategoryFilter`'s dropdown panel was marked `role="menu"`, but ARIA's `menu` role requires its children to be `menuitem`/`menuitemcheckbox`/`menuitemradio` only — it doesn't allow the plain search `<input>` the panel also contains. Changed to `role="group"` (and tag toggles from `menuitemcheckbox` to standalone `checkbox`).
3. **Redundant `alt` text.** The logo image's `alt="FaithLibrary"` duplicated the adjacent visible "FaithLibrary" wordmark in six places (Navbar, Footer, login, signup, forgot-password, reset-password) — screen readers announced the brand name twice. Fixed to `alt=""` everywhere the wordmark text is present; left as `alt="FaithLibrary"` on the 404 page, where there's no adjacent text and the image needs its own accessible name.
4. **No visible keyboard focus indicator.** Several components (buttons, `.input`, custom dropdowns) set `outline: 'none'` inline with no replacement. Added a global `:focus-visible` rule in `globals.css` that overrides this (deliberately using `!important` to beat the inline styles) so keyboard/switch/voice-control users can always see where focus is.
5. **Unreachable file upload control.** The upload drag-and-drop zone was a plain `<div onClick>` with a `display:none` file input — meaning keyboard users had no way to open the file picker at all. Made the drop zone a proper `role="button"` with `tabIndex` and `Enter`/`Space` handling.
6. **Missing form labels.** Every `<label>` across all 6 forms (Upload, Edit, Settings, Bulk Upload, New Request, Create Collection) was a visual sibling of its input with no `htmlFor`/`id` pairing — the programmatic association didn't exist. Wired up across all of them, including radiogroup semantics (`role="radiogroup"`, `role="radio"`, `aria-checked`) for the Public/Private visibility toggles and the collection color swatches (which also had no accessible names at all before this).
7. **Ambiguous/duplicate `aria-label`s.** Generic labels like `"Bookmark"` or `"Download"` didn't say *which* file, which is confusing when a screen reader user is scanning a grid of 10+ identical-looking buttons. Made these per-item (`"Bookmark {title}"`, `"Download {title}"`), and made the bookmark button announce its toggled state (`aria-pressed`, and the label itself changes to `"Remove {title} from bookmarks"`).
8. **Unlabeled/ambiguous landmarks.** Both `Navbar` and `MobileNav` render `<nav>` elements; without labels, screen reader users seeing "navigation, navigation" have no way to distinguish them. Labeled `"Primary"` and `"Mobile"` respectively. Also added `aria-current="page"` to active links in both, added a skip-to-content link in the root layout, and gave every top-level page's `<main>` a consistent `id="main-content"` as its target.

### Known gaps (not fixed — flagging for the team)

- **Color contrast** was spot-checked (I found and fixed two failing text colors on the dark navbar, `#7A6055` at 3.25:1 and `#5A4035` at 1.99:1, both now ≥5.4:1), but I didn't run a contrast check across *every* color combination in the app — there may be more, especially in less-visited admin/stats pages.
- **axe-core's automated checks only catch ~30–50% of WCAG issues.** Things like meaningful reading order, whether error messages are actually announced to screen readers on form submission, and real keyboard-only walkthroughs of multi-step flows (upload, bulk upload) still benefit from a manual pass or a tool like VoiceOver/NVDA testing.
- Server-rendered pages that fetch data directly from Supabase weren't run through axe in this pass (no live backend in this environment) — worth adding once there's a way to render them with seeded/mock data.

---

## Known issues / tech debt

Carried over from earlier project notes, still true:

- **Tailwind v4's responsive grid utilities have been unreliable in this project.** Score grids use a plain CSS `.score-grid` class in `globals.css` instead of `grid-cols-*` Tailwind utilities — this pattern was reused for the "How it works" section on the homepage rather than fighting Tailwind again.
- **`next dev --webpack` is required**, not Turbopack — Turbopack caused severe dev-mode lag. (Production `next build` uses Turbopack fine; only dev mode is affected.)
- **PDF thumbnails must render lazily** via `IntersectionObserver` (already implemented in `ScoreCard`) — rendering many PDFs simultaneously causes noticeable system lag.
- Pre-existing ESLint warnings (a few `any` types, an unescaped quote, a couple of `useEffect` dependency warnings) exist outside the files touched in this pass — none are new, and none block the build, but worth a cleanup pass.
- There's a stray file named `store` at the project root containing a commented-out JSX fragment — looks like a leftover from a previous editing session, not referenced anywhere. Safe to delete.

---

## Project structure

```
app/
  (main)/            # authenticated + public library pages (home, browse, dashboard, admin, ...)
  (auth)/             # login, signup, forgot-password
  api/external-upload/ # token-authenticated upload endpoint for external integrations
  print/[id]/         # print-friendly score view
components/           # ScoreCard, Navbar, MobileNav, CategoryFilter, upload/edit forms, etc.
  __tests__/          # Vitest + RTL + vitest-axe test suite
lib/
  supabase/           # client.ts (browser) and server.ts (server components/route handlers)
  categories.ts       # MASS_PARTS / TAG_GROUPS taxonomy used by CategoryFilter & TagDropdown
  types.ts            # FileRecord, Profile, Bookmark types
  hooks/useFiles.ts
proxy.ts               # Next.js 16 middleware (this project's middleware file is named proxy.ts, not middleware.ts)
```

---

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full Vercel setup checklist.
