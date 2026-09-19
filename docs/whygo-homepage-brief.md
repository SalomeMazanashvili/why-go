# WHYGO — Homepage rebuild brief

Source: founders' structure doc, 9 Sep 2026. Supersedes §4 of `whygo-site-structure.md`.

---

## Navigation

```
ტურები · ტრანსფერები · გამოცდილება · გიდები · ბლოგი
```

Flat. No dropdowns. Each goes straight to its page. About and contact live in the footer.

### ⚠️ Routing decision needed before WHY-83 PR B

`გამოცდილება` groups day trips, tickets, museums, workshops, dance, language courses, yoga — filtered by city.

WHY-83 is currently building `/day-trips` as a standalone section. Resolve before PR B:

**Recommended:** nav points at `/experiences`. `/day-trips` still exists as a filtered view with its own URL and metadata, because `ბარსელონადან ერთდღიანი ექსკურსია` is a distinct search intent from "things to do in Barcelona". Simpler menu, keeps the search traffic.

The `service_type` column works either way — this is routing, not schema.

---

## ⚠️ The constraint that shapes everything

**Most of this data doesn't exist yet.** No published tours, no services, no guides, no blog posts, few destinations.

Built today, six of seven sections render empty.

**Therefore: every section must render nothing at all when its data source is empty** — not a broken grid, not a placeholder, not an empty-state message. The section simply doesn't appear, and the sections around it close up.

This is not optional polish. It's what makes the page reviewable before content exists, and what stops a half-populated homepage looking abandoned during the contractor launch.

---

## Sections, in order

### 1. Hero

Currently `min-h-screen`. **Reduce so the next section is partially visible** — roughly 75–80vh. The peek is a deliberate cue to scroll.

- Georgian headline (see WHY-79 — currently reads "WAY BEYOND", which is English on a Georgian-first site)
- One short supporting line
- One primary CTA

### 2. ტურები

Four cards from `tours` where `is_published = true`, ordered by featured then sort order.

Each card: image · title · city · number of days · price from · one-line description.

**Must look right at 1, 2 or 3 tours**, not just 4. A four-column grid holding one card looks broken. Use a layout that reflows.

Link through to `/tours`.

### 3. ქალაქები

Grid of `destinations` where published. Image, name.

**This is where destination hubs get their internal links** — the main reason the section exists, beyond navigation.

⚠️ **Dependency:** destination hub pages (`/[destination]`, WHY-65) don't exist yet. Until they do, link cities to `/experiences?destination=<slug>`. Switch to hub URLs when WHY-65 lands.

### 4. ტრანსფერების ბანერი

Full-width banner, image, short headline, button to `/transfers`.

Single block, not a grid. Visually distinct from the card sections around it.

### 5. გამოცდილებები

Cards from `services` where published — day trips, museums, workshops, classes, activities.

Each card: image · title · short description · city · price from.

**Description, not duration.** These are varied things — a museum ticket, a dance class, a full-day excursion — and duration means something different for each. A line of description tells someone what it actually is.

**Heading must be factual, not "popular".** There's no booking data, so "popular" isn't true — same issue as "Popular routes" on the transfers page.

Link through to `/experiences`.

### 6. გიდები

Cards from `guides` where published: photo, name, city, **languages with Georgian shown prominently**.

Language is the entire differentiation — don't bury it in small text.

⚠️ Guides don't exist yet (WHY-84). Section stays hidden until at least one is published.

Link through to `/guides`.

### 7. ბლოგი

Three most recent published posts. Image, title, date.

Link through to `/tips`.

### 8. Footer

Contact · about · social icons, linked.

---

## Constraints

- **Mobile first.** Most traffic is phone. Design for 380px, then scale up.
- **Georgian copy is founder-written.** Use `TODO:` placeholders — do not write Georgian.
- **No invented content.** No placeholder tours, cities, guides or prices. Empty means hidden.
- **ISR `revalidate = 3600`**, matching the rest of the site.
- **Brand:** FiraGO, yellow `#FCCC01`, ink `#111110`. Never white text on yellow — it fails contrast at 1.52:1.
- **Accessibility:** semantic headings in order, keyboard-navigable, focus visible, contrast ≥ 4.5:1, images have alt text.

## Out of scope

- Destination hub pages (WHY-65)
- The `/experiences` page itself — this ticket is the homepage only
- Content writing
- Founders / about section — deliberately excluded

## Acceptance

- All eight sections built to spec
- **Every section renders nothing when empty** — verify by loading with an empty database
- Page looks intentional with only 1 tour and 2 destinations published
- Hero shows a peek of section 2 at 1440px and at 380px
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95, SEO 100
- axe-core clean
- Build output shows the route as static or ISR, not dynamic
