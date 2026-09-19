# WhyGo — Site structure & launch plan

Supersedes the page architecture in `docs/whygo-services-spec.md` §2.

---

## 1. Who the launch is for

**Not customers. Contractors.**

Guides and drivers in Barcelona, Madrid, Paris, Rome, Venice have expressed interest but want to see a finished website before committing. The site is the credential.

This resolves the chicken-and-egg: references are needed to sign contractors, and contractors are needed to build references. The site breaks the loop.

### What that reader needs

- A company that looks real and considered
- **Their category visibly represented** — a guide needs to see what a guide page looks like
- Evidence of seriousness: real tours, real blog content, real people behind it
- A clear sense of where customers come from

### What that reader does *not* need

- Every city covered
- A service in every category
- Complete pricing

### ⚠️ The trap: "example services"

Publishing demo content to show contractors recreates the fictional-tours failure from July — a real customer books something that doesn't exist.

**Instead: build every template, publish only what's real.** Show contractors the live Barcelona transfer page as the example of what theirs would look like. A real page is more persuasive than a mockup and nothing on the site is false.

---

## 2. The two product lines

Everything follows from this split.

**ტურები — you travel with us.** Signature expert-led trips (Oktoberfest, whisky) *and* ordinary package tours (Thailand, Belgium). The tour is the product; the destination is incidental.

**Services abroad — you're already there.** Transfers, day trips, guides, experiences. The *destination* is the organising fact; the service is incidental.

These want opposite navigation — one product-led, one destination-led. That tension is why the structure has felt unresolved.

---

## 3. Navigation

```
ტურები · ტრანსფერები · ერთდღიანი ტურები · გიდები · ბლოგი
```

Flat. Five items. No dropdowns. About and contact in the footer.

**Why flat:** most traffic is phone, and hover menus don't exist there. Every mobile alternative is worse than a plain list.

**Why no `სერვისები` umbrella:** it adds a click and a page containing nothing but four links.

**Why no `მიმართულებები` yet:** destination hubs matter for SEO, but a page listing four cities where only Barcelona has more than one service type reads as abandoned. Hubs get their internal links from the homepage grid, from service pages, and from blog posts — enough to be crawled and ranked. Add the nav item at 6+ destinations with real coverage.

**Watch this:** `ტურები` and `ერთდღიანი ტურები` sitting adjacent may read oddly. It's honest — a day trip *is* a one-day tour — but check it with someone who hasn't seen the site. If it confuses, the fix is grouping, not renaming.

**When experiences launch**, the nav hits six items and gets crowded. That's the point to decide between grouping services under one parent or dropping something from the bar.

---

## 4. Homepage

The reader arrives from an Instagram bio knowing nothing. The page answers *what is this* and *what can you do for me*, in that order.

| # | Section | Job |
|---|---|---|
| 1 | **Hero** | The positioning. Georgian-speaking layer between a traveller and a foreign country. Not "WAY BEYOND". |
| 2 | **Two things we do** | Trips we run · things we arrange while you're there. Two cards, plain language. |
| 3 | **Where we work** | Destination grid. **This is where hubs get their internal links.** |
| 4 | **Signature tours** | The flagship. What nobody else has. |
| 5 | **Services** | Four cards — transfers, day trips, guides, experiences. |
| 6 | **From the blog** | 3 recent posts. Proof of a working business. |
| 7 | **Who we are** | Salome and Bakuri. **Faces.** |
| 8 | **Contact** | |

**Section 7 matters more than it looks.** The entire proposition is real Georgian-speaking humans and the site currently shows none. For a contractor deciding whether to work with you, this is the section they read most carefully.

**Section 2 exists** because "we run tours AND we arrange things where you already are" is not obvious, and every visitor needs it in the first screen.

---

## 5. Page inventory

| Route | Status | Notes |
|---|---|---|
| `/` | Rebuild | Per §4 |
| `/tours` · `/tours/[slug]` | Live | All tours — signature and package |
| `/transfers` · `/transfers/[route]` | Live | WHY-68 |
| `/day-trips` · `/day-trips/[slug]` | WHY-83 | Georgian label: ერთდღიანი ტურები |
| `/guides` · `/guides/[slug]` | WHY-84 | Profile is the product |
| `/experiences` · `/experiences/[slug]` | WHY-85 | Post-launch |
| `/[destination]` | WHY-65 | SEO anchor. No nav item yet. |
| `/tips` | Live | Blog |
| `/about` · `/contact` | Live | Footer |

---

## 6. Launch checklist

**Must be true before showing a contractor:**

- [ ] Homepage rebuilt — positioning clear, founders visible
- [ ] Every service template built, even where empty of content
- [ ] At least one **real, complete** page per service type — the example a contractor is shown
- [ ] 3–5 blog posts in Georgian
- [ ] No English on Georgian pages (WHY-79 — the hero still reads "WAY BEYOND")
- [ ] Favicon and correct brand marks (logo rules v2)
- [ ] Inquiry flow tested end-to-end on production
- [ ] Nothing fictional anywhere

**Not required for this launch:**

- Every city covered
- Experiences
- SMS notifications (WHY-96)
- Destination hubs for every city
- Card payment

---

## 7. Ads — later, and not to the homepage

**Ads should not land on the homepage.** A transfer ad goes to `/transfers`; a Costa Brava ad goes to that day-trip page. The homepage is for people who type the brand name or tap the Instagram bio.

So don't block the contractor launch on ad readiness. They're separate milestones with different requirements: contractors need a site that looks complete; ads need one specific page that converts.

---

## 8. Build order

1. **WHY-83** — day trips. The clearest example of content-that-sells, and it unblocks the transfer→day-trip cross-sell.
2. **WHY-84** — guides. The category where contractors most need to see their own page.
3. **Homepage rebuild** — per §4.
4. **WHY-79** — Georgian hero copy. Founders write.
5. **WHY-65** — destination hubs. Removes the temporary route list under the transfers form.
6. Blog posts — founders write. Can run in parallel throughout.

Experiences, SMS and ads come after the contractor conversations.
