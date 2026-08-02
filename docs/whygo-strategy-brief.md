# Why Go — Claude Code Handoff Brief

Everything needed to continue the website work in a fresh session. Read this first.

---

## 1. The business

**Why Go** — Georgian travel brand, based in Tbilisi, run by two founders (husband and wife).

**Customers: Georgian travellers going abroad.** Not international tourists. Not visitors to Georgia. This single fact drives every decision below.

### Two products

**A — Signature tours.** Expert-led group departures. Currently: Oktoberfest (Munich), Whisky (Edinburgh). Low volume, high margin, seasonal.

**B — The experience layer.** Sold to Georgians *who booked their own trip*: transfers, day trips (e.g. Barcelona → Costa Brava), Georgian-speaking guides, food tours with locals, cooking and dance classes, paddleboard and water activities. Guides in multiple countries.

**Product B is the growth engine.** Bigger addressable market (every Georgian travelling anywhere), cheaper first purchase, repeat business, and it avoids competing on flight/hotel margin.

### Positioning

> Why Go is the Georgian-speaking layer between a Georgian traveller and a foreign country.

The emotional core: **you're not alone out there.** A Georgian in a country whose language they don't speak, who doesn't know what's worth their one free day.

The existing site's "Experience + Development" line is good and should be kept — but it currently describes only Product A. Product B is absent from the website entirely. **Filling that gap is the main body of work.**

### A hard constraint

One tour expert (Oktoberfest) **cannot be publicly named or shown** — he works at a bank and it's forbidden. The data model must support selling a credential without an identity (`expert_credential_ka`, e.g. "whisky collector, 15 years' experience"). Do not add an expert-name field and do not surface his name anywhere.

---

## 2. Current site state — audited 2 Aug 2026

`whygo.ge` — Next.js / React, originally built by Claude Code.

### What's there
- Root redirects to `/en`. **English is the default.**
- Nav: Tours, About, Tips, Contact. A `ქარ` language toggle exists.
- Six tours listed: Madrid Spanish, Tokyo Japanese, Peru Inca, Tuscany Culinary, England Whisky, Six Nations Rugby
- Prices in €, ¥, $, £ — **no GEL**
- Blog ("Tips") with 4 English articles
- Contact form with an "Interested In" dropdown

### What's wrong
1. **The six tours are not real products.** Placeholder content from the original scaffold that went live. Priced, and inquiry-able. Urgent.
2. **English-first is backwards.** Customers are Georgian. English travel SEO is unwinnable, and "Georgian-speaking guide in Barcelona" means nothing to an English speaker.
3. **The whisky tour is labelled "England." Edinburgh is in Scotland.** Credibility error with the exact audience most likely to buy.
4. **Oktoberfest — a real tour — is missing from the site.**
5. **No services layer.** No transfers, day trips, guides, or classes anywhere.
6. One blog post is titled "10 Things Every Georgian Traveller Should Know" — **written in English.** Aimed at nobody. Symptom of the audience confusion.

---

## 3. Decisions already made — do not re-open

| Decision | Choice |
|---|---|
| Primary language | **Georgian at root.** English scaffolded at `/en` but **not published at launch** |
| CMS | **Payload CMS 3 on Supabase Postgres.** Not Sanity. Not anything else. |
| Booking model | **Request-to-book.** No payment, no availability calendar in v1. Form → Supabase row + email → manual confirmation. |
| Catalogue model | **Curated (Context Travel).** NOT marketplace (GetYourGuide / Airbnb). ~30 products — do not build search infrastructure. |
| Currency | **GEL** |
| Build approach | **Extend the existing repo.** Not a greenfield rebuild. |

---

## 4. Strategy — why the architecture looks like this

**Georgian-language SEO is the entire opportunity.** Queries like `ბარსელონადან ერთდღიანი ექსკურსია`, `ქართველი გიდი რომში`, `ბარსელონას აეროპორტიდან ცენტრში` have almost no optimised competition. English equivalents are among the most competitive SERPs on the internet. Architecture serves Georgian SEO first.

**The blog post and the sales page are the same page.** "6 things worth doing near Barcelona in one day" is a saveable editorial listicle *and* it sells the Costa Brava day trip — because Why Go **is** the Costa Brava day trip. No separate offer funnel needed.

**Transfers are the wedge.** Absent from GetYourGuide, Airbnb and Context Travel. Fixed intent, low competition, high commercial value, easily templated. Highest-ROI programmatic SEO asset available.

**One destination per month**, aligned with the Instagram content calendar. Blog posts, service pages, transfer routes and social content for the same destination ship together — one research effort, four channels.

---

## 5. Page architecture

| Route | Purpose | Render |
|---|---|---|
| `/` | Positioning, categories, featured destinations, signature tours | Static |
| `/[destination]` | **Destination hub** — the backbone. Build first. | ISR |
| `/[destination]/[service]` | Service detail + inquiry form | ISR |
| `/services/[category]` | Category browse, light filters | ISR |
| `/transfers/[route]` | Programmatic route pages | ISR |
| `/tours` · `/tours/[slug]` | Signature tours | ISR |
| `/blog` · `/blog/[slug]` | Editorial engine | ISR |
| `/guides` · `/guides/[slug]` | Guide profiles — trust layer | ISR |
| `/about` | The two founders | Static |
| `/contact` · `/faq` | | Static |
| `/terms` · `/privacy` · `/cookies` | Legal | Static |

### Destination hub — the most important template

`/barcelona` contains: hero, intro (200–300 words Georgian), services grouped by category, transfer routes, related blog posts, the guide there, practical info (airport, transport, money, tipping), FAQ, inquiry CTA.

Every service and post links back to it. It links out to all of them. This internal linking is what makes the cluster rank.

**Must render correctly with zero services and zero posts** — don't ship a template that breaks on a new destination.

---

## 6. Data model

```
destinations       slug, name_ka, country, hero, intro_ka, practical_info_ka,
                   lat, lng, published, seo_title, seo_description

service_categories slug, name_ka, icon, description_ka

services           slug, destination_id, category_id, title_ka, summary_ka,
                   body_ka, duration_minutes, price_from, currency, group_max,
                   includes_ka[], excludes_ka[], meeting_point, images[],
                   guide_id, published, featured, seo_*

transfer_routes    slug, destination_id, from_name_ka, to_name_ka,
                   distance_km, duration_minutes, vehicle_options[],
                   price_from, body_ka, published

tours              slug, title_ka, expert_credential_ka, body_ka, itinerary[],
                   departure_date, return_date, price, capacity, spots_left,
                   images[], published

posts              slug, title_ka, excerpt_ka, body_ka, hero, published_at,
                   destination_id, related_service_ids[], author, seo_*

guides             slug, name_ka, destination_id, photo, bio_ka,
                   languages[], published

inquiries          name, email, phone, service_type, service_id, travel_date,
                   people, message, source_page, status, created_at
```

### RLS — non-negotiable
- Default **deny** on every table
- Anon `SELECT` only where `published = true`
- Anon `INSERT` only on `inquiries` — no select, no update, no delete
- Service role key server-side only, never in the client bundle

---

## 7. SEO requirements

Every indexable page must have: unique Georgian `<title>`, unique meta description, canonical tag, appropriate JSON-LD. No exceptions, no templated duplicates.

**Global:** `<html lang="ka">`, `sitemap.xml`, `robots.txt`, `hreflang` (implement now even while monolingual), dynamic OG images via `next/og`.

**JSON-LD by template:**

| Page | Schema |
|---|---|
| Global | `Organization`, `WebSite` |
| Service | `Product` + `Offer` |
| Tour | `TouristTrip` + `Offer` |
| Transfer | `Service` + `Offer` |
| Blog | `Article`, `BreadcrumbList` |
| FAQ blocks | `FAQPage` |
| Guides | `Person` |

**Core Web Vitals budget:** LCP < 2.5s · CLS < 0.1 · INP < 200ms, on mobile at 4G throttling.

⚠️ **Programmatic pages need 300+ words of unique Georgian content each.** Thin templated pages get filtered from the index and can damage the whole domain. If unique content can't be written for a route, don't publish that route.

---

## 8. Linear issues

Team: **Whygo**. Run in this order.

| ID | Title | Priority |
|---|---|---|
| **WHY-72** | Remove fake tours from the live site | **Urgent — do first** |
| **WHY-62** | Audit existing repo + invert locale to Georgian | Urgent |
| **WHY-63** | Supabase + Payload CMS + RLS | Urgent |
| **WHY-64** | Design system (extract, don't redesign) | High |
| **WHY-65** | Destination hub template | Urgent |
| **WHY-66** | Service detail + inquiry flow | Urgent |
| **WHY-67** | Blog + homepage | High |
| **WHY-68** | Transfer route pages | High |
| **WHY-69** | Technical SEO baseline | High |
| **WHY-70** | QA, accessibility, security | High |
| **WHY-71** | Booking, payment, English (Phase 3) | Low — don't start early |

**WHY-62 starts with an audit, not a rewrite.** Report on: Next.js version, App Router vs Pages, current i18n implementation, where content lives, dependencies, CI/deploy setup, what the contact form does with submissions. Review that before changing code.

---

## 9. QA & security gates

**Automated, blocking CI:** Playwright E2E (inquiry submission, navigation, 404, locale), axe-core zero critical violations, Lighthouse CI (fail under Performance 90 / SEO 95 / A11y 95), TypeScript strict.

**Manual per release:** keyboard-only inquiry flow, screen reader on hub/service/form, 200% zoom, contrast ≥ 4.5:1, and **Georgian font rendering on Chrome, Safari, Firefox, iOS, Android on real devices** — Georgian script fails silently when a font lacks glyphs.

Target **WCAG 2.1 AA**.

**Security:** automated test proving anon can't read unpublished rows or the inquiries table; `SUPABASE_SERVICE_ROLE_KEY` grep-verified absent from client bundle; rate limiting on form endpoints; Turnstile; Supabase Pro before real customer data (free-tier backup retention is limited); Sentry; CSP/HSTS headers.

---

## 10. Still open — ask before assuming

1. **Georgian font.** Firago recommended (free, Georgian + Latin drawn to match, multiple weights). Alternatives: BPG family, Noto Sans Georgian. **Needed for WHY-62 acceptance.**
2. **Which destinations first.** Should match wherever guides already exist. Don't build a content calendar around a guide network that doesn't exist yet.
3. **Customer profile.** Age, budget, first-time vs experienced travellers. Affects voice and price framing.
4. **Confirm the whisky tour is Edinburgh/Scotland** before correcting the label.

---

## 11. Rules for this codebase

1. **Never invent products, prices, testimonials, or statistics.** Use `TODO` placeholders. The current fake-tours problem came from exactly this.
2. **Never machine-translate Georgian.** Flag strings for the founders to write.
3. **Never disable RLS.** Never commit secrets. Service role key server-side only.
4. **One Linear issue, one PR.** Don't chain multiple issues in a session.
5. **Audit before rewriting.** Report findings, wait for review.
6. **No page ships without metadata and JSON-LD.**
7. **Georgian is the primary language.** English is scaffolding, not a deliverable.
