# WhyGo — Claude Code handoff

Short, practical brief for a fresh Claude Code session (or human) landing on this repo. Read this first, then skim the files listed at the bottom.

## What this is

A bilingual (English/Georgian) boutique travel-agency site with an admin panel. Public site is at **whygo.ge** (and `www.whygo.ge` → 308 → apex).

## Stack

- **Next.js 14 App Router** (React 18, TypeScript)
- **Tailwind CSS**, **Framer Motion**
- **next-intl** — locales `en` and `ka`, routes are `/[locale]/...`
- **Supabase** — Postgres for data, Storage for uploaded images (free tier)
- **Vercel** — single project `whygo-v2` (prj_R6AdrxrZcws3ihQmg1T9GG9P0XG5), auto-deploys `main`

## Environment variables

Local: `.env.local` (git-ignored). Prod: Vercel dashboard, all four set for Production, Preview, and Development.

| Var | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Bootstrap "root" password. Sign in at `/admin/login` with **empty email** + this value. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL, no trailing `/rest/v1`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (legacy JWT or new `sb_secret_…`). Server-only; bypasses RLS. |
| `ADMIN_SESSION_SECRET` | HMAC key for signing the admin session cookie. Falls back to `ADMIN_PASSWORD` if unset. |

## Local dev

```
npm install
npm run dev            # http://localhost:3000
```

Public site at `/en` or `/ka`. Admin at `/admin` (redirects to `/admin/login`).

## Admin panel

Routes (all cookie-protected via `src/middleware.ts` + `requireAdmin()`):

| Route | What it does |
| --- | --- |
| `/admin` | Dashboard with counts |
| `/admin/tours` | CRUD on `tours` table |
| `/admin/content` | Key/value copy (hero/about/footer). ⚠️ Public site does NOT yet read from `site_content`. |
| `/admin/branding` | Colors + font sizes with live preview. ⚠️ Public site does NOT yet read from `site_settings`. |
| `/admin/news` | CRUD on `news` table |
| `/admin/contacts` | Read `contact_submissions`, toggle status (new / replied / archived) |
| `/admin/admins` | CRUD on `admins` table — create/deactivate/reset password/delete |

## Auth model

- Cookie: `whygo_admin_session` = `base64url(adminId:hmac)` signed with `ADMIN_SESSION_SECRET` (or `ADMIN_PASSWORD`).
- `authenticate(email, password)` in `src/lib/adminAuth.ts`:
  - Empty email + matching `ADMIN_PASSWORD` → sentinel admin id `env:root` (bootstrap escape hatch — lets you seed the first real admin).
  - Otherwise looks up `admins.email`, verifies with `crypto.scryptSync` against `password_hash`.
- All admin **pages** call `requireAdmin()` at the top of the RSC.
- All admin **API routes** call `isAdminAuthenticated()` and return 401 if no cookie.

## Public data reads

Server components in `src/app/[locale]/` fetch from Supabase, not from `STATIC_TOURS`:

- `/[locale]/page.tsx` → `listTours()` + `listNews()`
- `/[locale]/tours/page.tsx` → server fetch, hands off to `ToursGridClient` for the tag filter
- `/[locale]/tours/[slug]/page.tsx` → `listTours().find(t => t.slug === slug)`
- `/[locale]/contact/page.tsx` → `listTours()` for the tour picker

All marked `export const dynamic = 'force-dynamic'` — new admin edits appear on next request, no redeploy needed.

Section text (hero copy, about body, footer tagline) is still **hardcoded** in section components. `/admin/content` writes to `site_content` but nothing reads it yet — see Loose ends.

## Data model

Full DDL in `supabase/schema.sql`. Idempotent — `IF NOT EXISTS` + `DROP POLICY IF EXISTS` throughout. Paste into Supabase SQL editor after cloning or when schema changes.

| Table | Purpose |
| --- | --- |
| `tours` | Tour packages (both EN + KA columns) |
| `news` | Blog articles |
| `contact_submissions` | Contact form inbox |
| `site_content` | key / value_en / value_ka pairs — hero/about/footer copy |
| `site_settings` | key / value pairs — colors + font sizes |
| `admins` | id / email / password_hash (scrypt) / is_active / last_login_at |

Storage bucket: `uploads` (public read, writes only via service role). Objects live at `uploads/{folder}/{ts-random}.webp`.

## Image uploads

- Component: `src/app/admin/_components/ImageUploader.tsx`
- Compressor: `src/lib/imageCompress.ts` — pure Canvas, no npm dep
  - Downscales to max **1600 × 1600**, re-encodes as **WebP @ 85%**
  - Phone photos (3–8 MB) come out at ~150–300 KB
- API: `POST /api/admin/upload` — accepts `multipart/form-data` with `file` and optional `folder`, uploads via service-role client, returns `{ url, path, size, mime }`
- Cache-Control on stored objects: 1 year, immutable (safe because filenames are content-addressed with timestamp + random)
- Server cap: 5 MB post-compression (safety net; compressed WebP essentially never trips it)

Wired into `TourForm` (folder `tours`) and `NewsForm` (folder `news`). Both accept pasted URLs too — the URL field is retained.

## Deployment

- Push to `main` → Vercel builds and deploys production automatically.
- Manual: `cd` into repo, `npx -y vercel@latest deploy --prod`.
- Preview URLs: any non-`main` branch push.
- Env vars are per-environment; add via dashboard or `npx vercel env add NAME production` (reads value from stdin).

Only one Vercel project owns the whygo domain (`whygo-v2`). Two older duplicates (`why-go`, `why-go-fgn8`) were deleted — do not recreate them.

## Rotation checklist

Follow-ups noted during setup that should get done:

1. **`ADMIN_PASSWORD`** — the current prod value was set during a manual walkthrough and is guessable. Rotate via Vercel dashboard → redeploy.
2. **`SUPABASE_SERVICE_ROLE_KEY`** — was pasted into a chat session during setup. Rotate via Supabase Dashboard → Project Settings → API → *Roll secret keys*, update the Vercel env var, redeploy.
3. **Bootstrap admin** — email `salome@whygo.test` was created to prove the DB path works end-to-end. Delete it from `/admin/admins`.

## Loose ends (not yet built)

1. Public site doesn't read from `site_content` or `site_settings` — hardcoded strings remain in the section components (`src/components/sections/*`).
2. Tour slug field accepts any string — should auto-generate from title (e.g. `baaakur-i-love-you` instead of `Bakur`).
3. Uploader doesn't delete old images when `cover_image` is replaced — bucket grows over time.
4. No thumbnail variant — public cards use the full 1600 px WebP for both card grid and hero image.

## Files a new session should skim first

Auth + data plumbing:
- `src/lib/adminAuth.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/tours.ts`, `src/lib/news.ts`, `src/lib/admins.ts`, `src/lib/contacts.ts`, `src/lib/siteData.ts`
- `src/middleware.ts`

Admin UI:
- `src/app/admin/layout.tsx`
- `src/app/admin/_components/Sidebar.tsx`, `ToastProvider.tsx`, `ImageUploader.tsx`
- `src/app/admin/{tours,news,admins,content,branding,contacts}/*`

Public site:
- `src/app/[locale]/page.tsx`
- `src/app/[locale]/tours/page.tsx` + `ToursGridClient.tsx`

Config:
- `next.config.mjs` (image `remotePatterns` — `*.supabase.co` is whitelisted)
- `supabase/schema.sql`
- `.env.example`
