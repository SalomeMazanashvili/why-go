# CLAUDE.md — Why Go

Project instructions for Claude Code. Read before any task.

---

## What this is

Website for **Why Go**, a Georgian travel brand run by two founders in Tbilisi.

**Customers are Georgian travellers going abroad.** Not international tourists, not visitors to Georgia. Every decision follows from this.

Two products:
- **Signature tours** — expert-led group departures (Oktoberfest Munich, Whisky Edinburgh)
- **Experience layer** — transfers, day trips, Georgian-speaking guides, food tours, cooking/dance classes, water activities, sold to Georgians who booked their own trip. This is the growth product.

---

## Stack

- Next.js (App Router) + TypeScript strict
- Tailwind CSS
- Custom admin panel at `src/app/admin` — extend it. **Do NOT install Payload or any other CMS.**
- next-intl · Vercel · Resend · Cloudflare Turnstile

---

## Hard rules

### 1. Never invent content
No made-up products, prices, dates, testimonials, statistics, or reviews. Use `TODO:` placeholders.

*This has already caused a live incident:* the original build shipped six fictional tours with prices and a working inquiry form. Don't repeat it.

### 2. Never machine-translate Georgian
Georgian is the primary language. Machine-written Georgian is grammatically plausible but reads wrong to native speakers. Mark strings `TODO: Georgian copy needed` and let the founders write them.

### 3. Georgian is primary
- Georgian at `/` — no locale prefix
- English scaffolded at `/en`, **not published**
- `<html lang="ka">`
- Prices in **GEL**
- Fonts must support Georgian script (Firago / BPG / Noto Sans Georgian). Arial Black and Montserrat do **not** — they fall back silently.
- **All Georgian copy uses `თქვენ` (formal plural) consistently across site, emails and error messages.** Never mix `შენ` and `თქვენ` within the same product surface. When wiring founder-supplied strings, check the verb forms match the existing convention before shipping.

### 4. Security
- Never commit secrets
- Never disable RLS
- `SUPABASE_SERVICE_ROLE_KEY` server-side only — never in a client component or client bundle
- Default-deny RLS on every table; anon reads only `published = true`; anon may only `INSERT` on `inquiries`

### 5. Every page needs SEO
No page merges without: unique Georgian `<title>`, unique meta description, canonical, appropriate JSON-LD.

Programmatic pages (transfer routes, destination × category) need **300+ words of unique Georgian content**. If it can't be written, don't publish that page — thin pages damage the whole domain.

### 6. One issue, one PR
Don't chain Linear issues in a single session. Audit and report before rewriting anything substantial.

### 7. One expert cannot be named
The Oktoberfest tour expert works at a bank and cannot be publicly associated with the company. Sell the credential (`expert_credential_ka`), never the identity. No expert-name field, no photo, no name anywhere in output.

---

## Product model

**Request-to-book, not instant booking.** No payment, no availability calendar. Form → Supabase row + email → manual confirmation. Payment is Phase 3 and gated on inquiry volume.

**Curated catalogue, not marketplace.** Reference: Context Travel. ~30 products total — do not build search infrastructure, faceted filtering, or anything sized for thousands of SKUs.

---

## Content architecture

```
Destination hub (/[destination])  ← the backbone
    ├── Blog posts        (informational intent)
    ├── Service pages     (conversion intent)
    └── Transfer routes   (transactional intent)
```

Every blog post links to ≥2 services. Every service links back to its hub. Every hub links to everything about that destination.

The blog post and the sales page are the same page — editorial content sells the service directly.

---

## Quality gates

**CI, blocking:** TypeScript strict · ESLint · Playwright E2E · axe-core (zero critical) · Lighthouse CI (Performance 90 / SEO 95 / A11y 95)

**Budgets:** LCP < 2.5s · CLS < 0.1 · INP < 200ms, mobile at 4G

**Accessibility:** WCAG 2.1 AA. Keyboard-navigable forms, labelled inputs, screen-reader-announced errors, contrast ≥ 4.5:1.

**Always verify Georgian renders correctly** on Chrome, Safari, Firefox, iOS and Android. Georgian script fails silently when a font lacks glyphs — this is a real recurring risk, not a formality.

Mobile-first. Assume 70%+ phone traffic.
