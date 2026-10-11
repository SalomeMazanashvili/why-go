# Writing an article: every field

What to write for one complete article on `/tips/[slug]`. The fields follow the admin form (**Admin → News → New article**), top to bottom. Written 2026-10-11 (WHY-120); keep it in step with `src/app/admin/news/NewsForm.tsx`.

**To be indexed by Google, an article needs all three of:**
- a Georgian title;
- a Georgian excerpt;
- 300 or more words of Georgian body.

Without them it still publishes, but as `noindex`, and it stays out of the sitemap.

**To be published at all**, it needs at least 2 related services that are themselves published (CLAUDE.md: every post links to ≥ 2 services).

## Slug format: decided

**Latin, lowercase, hyphenated.** For example `barcelona-airport-to-city` or `barselonas-aeroportidan-kalakshi`.

Articles get shared in WhatsApp and Instagram DMs. There a Georgian URL becomes an unreadable percent-encoded string: `/tips/%E1%83%91%E1%83%90%E1%83%A0…`.

The rule is enforced by the admin form and the API:
- a–z, 0–9 and single hyphens only;
- 3–60 characters;
- no hyphen at either end.

**Suggest** transliterates the Georgian title (national romanisation: ბ→b, ქ→k, შ→sh, წ→ts, …). Trim the result to the 3–6 words that matter.

**Never change a slug after publishing:** every link already shared breaks.

## Meta

| Field (admin label) | Required | Where it shows | Guidance |
|---|---|---|---|
| **Slug (the URL)** | Yes | The address: `whygo.ge/tips/<slug>` | Latin as above. 3–6 words, ≤ 60 characters. Set once. |
| **Author** | No (default "WHYGO Team") | Not on the page. In the article's structured data (Google). | A team name or a real person's name. **Never the Oktoberfest expert** (CLAUDE.md rule 7). |
| **Reading time (min)** | Yes (default 5) | Under the headline, next to the date | Georgian body words ÷ 200, rounded. A 1,000-word article is 5. |
| **Published at** | Yes (defaults to now) | Under the headline (shown in Tbilisi time); in structured data; order on `/tips` and the homepage, newest first | The date the article goes live. A future date doesn't schedule it: **Published** decides visibility. |
| **Destination** | Recommended | City link above the headline. Listed on that city's hub page (`/barcelona`). The "also in this city" block at the end comes from it. | One city. Leave empty only for articles about no single city. |
| **Cover image** | Recommended | Top of the article; card on `/tips`; homepage blog card; link previews (WhatsApp, Facebook) | See *Cover image* below. |
| **Featured** | No | Nothing yet for articles. The homepage shows the newest 3. | Leave off. |
| **Published** | — (new articles start as drafts) | Whether the article exists publicly at all | Tick it last, after related services are picked. Saving as published fails with fewer than 2 live related services. |

### Cover image

| | |
|---|---|
| **Shape** | Landscape, **16:10** |
| **Size to upload** | **At least 1600 × 1000 px.** Smaller images look soft on large screens. |
| **Format** | JPEG or PNG; a phone photo is fine. The admin converts to WebP and scales it to 1600 px on upload, so file size isn't your concern. Avoid HEIC: it only uploads from Safari. |
| **Composition** | Keep the subject in the **middle 60%**. Pages show the full 16:10. Link previews crop to about 1.91:1, cutting a strip off the top and bottom. |
| **Text in the image** | None. It's cropped differently in different places, and isn't read by screen readers. |
| **Description (alt)** | None needed: the image is treated as decoration, and the headline right below it carries the meaning. |
| **Rights** | Your own photo or one you have the rights to. Never a stock photo presented as WHYGO's own trip. |

## Georgian (what visitors read)

| Field | Required | Where it shows | Guidance |
|---|---|---|---|
| **Title** | Yes, for Google | The headline (h1), the browser tab, the Google result title, link previews, and the article's card on `/tips`, the homepage and the hub | **≤ 50 characters**: the site adds " · WHYGO", and Google cuts titles at about 60. Unique; says what the article answers, e.g. which question a Georgian traveller types. |
| **Tag** | No | Nowhere yet: the `/tips` cards currently show the *English* tag (a bug, in the copy worklist) | 1–2 words, a category ("ტრანსფერები", "რჩევები"). |
| **Excerpt** | Yes, for Google | The meta description (Google snippet, link previews), the lead under the headline, and the card text on `/tips` | **140–160 characters**, the same rule as every meta description. One or two sentences that make someone tap. `თქვენ` form. |
| **Content** | Yes: **300+ words** to be indexed | The article body | **800–1,500 words** for a guide-type post. A blank line between paragraphs. Start a paragraph with `## ` for a subheading, every 150–300 words. Name the related services in the text where they fit. Write the useful thing; the services follow from it. |

## English (scaffolding, not published)

English pages are `noindex` and only reached through the ENG switch, so a working version is enough.

| Field | Required | Guidance |
|---|---|---|
| **Title** | **Yes** (the admin won't save without it) | A working title is fine. The admin list shows it. |
| **Tag** | No | — |
| **Excerpt** | No | — |
| **Content** | No | — |

## Related services

| Field | Required | Where it shows | Guidance |
|---|---|---|---|
| **Related services** | **At least 2 live, to publish** | Cards under the article, in your order | The specific services this article is about, most relevant first: a transfer route, a day trip and so on. They can be in any city. Only published services with a page count as "live". If one is unpublished later, the article quietly drops that card (the admin article list flags it when fewer than 2 remain). |

**What's automatic:**
- The **"also in this city"** block below the related services: up to 3 other published services in the article's destination, never repeating your picks.
- The **date line**, **breadcrumbs** and **Google structured data**.

You don't write those.

## Once per site, not per article

Three labels in `messages/ka.json` (`article_page.*`) are shared by every article. They're in the copy worklist (`docs/georgian-copy-worklist.md`, `npm run copy:todo`):
- reading time (`{minutes}` …);
- the heading over related services;
- the "also in this city" heading.
