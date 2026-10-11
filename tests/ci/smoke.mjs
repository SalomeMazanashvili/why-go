// WHY-98 PR B: smoke test against a production build served from the seeded
// CI database (tests/ci/seed.mjs). Fails if any template falls back to its
// empty state, if the sitemap is wrong for the fixtures, if an internal link
// is broken, or if an indexable page renders a TODO description/title.
// Usage: BASE=http://localhost:3000 node tests/ci/smoke.mjs

const BASE = process.env.BASE ?? 'http://localhost:3000'

// Links known to be broken, each with the ticket that fixes it. The check
// fails if a listed link starts working, so the entry gets removed.
const KNOWN_BROKEN = [
  { pattern: /^\/tips\/[^/]+$/, ticket: 'WHY-118: no /tips/[slug] route; /tips, the homepage and hubs link to it' },
]

const failures = []
const warnings = []
const fail = (m) => failures.push(m)
const cache = new Map()
async function get(path) {
  if (!cache.has(path)) {
    const res = await fetch(BASE + path, { redirect: 'manual' })
    cache.set(path, { status: res.status, location: res.headers.get('location'), body: res.status < 300 ? await res.text() : '' })
  }
  return cache.get(path)
}
const robots = (html) => html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? 'index'
const meta = (html, attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1]

// [path, must contain, must not contain, expect noindex?]
const PAGES = [
  ['/', ['CI City A'], [], false],
  ['/tours', ['CI fixture tour'], [], false],
  ['/tours/ci-tour', ['CI fixture tour'], [], false],
  ['/transfers', ['CI City A centre', 'CI City B'], [], false],
  ['/transfers/ci-route-a-centre', ['CI City A centre'], [], false],
  ['/experiences', ['CI fixture day trip (indexable)'], ['CI fixture experience'], false],
  ['/day-trips', ['CI fixture day trip (indexable)', 'CI fixture day trip (thin)'], [], false],
  ['/day-trips/ci-day-trip-indexable', ['CI fixture day trip (indexable)'], [], false],
  ['/day-trips/ci-day-trip-thin', ['CI fixture day trip (thin)'], [], true],
  ['/tips', ['CI fixture article A', 'CI fixture article B'], ['No articles yet', 'CI fixture draft'], false],
  ['/ci-city-a', ['CI City A', 'CI City A centre', 'CI fixture day trip (indexable)', 'CI fixture article A'], [], false],
  ['/ci-city-b', ['CI City B'], [], true],
  ['/contact', [], [], false],
  ['/about', [], [], false],
]

for (const [path, must, mustNot, noindex] of PAGES) {
  const r = await get(path)
  if (r.status !== 200) { fail(`${path}: HTTP ${r.status}`); continue }
  for (const s of must) if (!r.body.includes(s)) fail(`${path}: missing "${s}" (empty state or missing fixture?)`)
  for (const s of mustNot) if (r.body.includes(s)) fail(`${path}: must not contain "${s}"`)
  const rb = robots(r.body)
  if (noindex !== rb.includes('noindex')) fail(`${path}: robots "${rb}", expected ${noindex ? 'noindex' : 'indexable'}`)
  if (!rb.includes('noindex')) {
    const title = r.body.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''
    for (const [label, v] of [['title', title], ['description', meta(r.body, 'name', 'description')], ['og:description', meta(r.body, 'property', 'og:description')]]) {
      if (v && v.includes('TODO')) {
        // Founder copy pending (WHY-117) is reported, not failed, for titles.
        if (label === 'title') warnings.push(`${path}: TODO in <title> (WHY-117)`)
        else fail(`${path}: TODO in ${label} on an indexable page (WHY-116)`)
      }
    }
  }
}

// WHY-121: /contact takes a required phone, optional email, no tour dropdown.
// Posts go to the throwaway CI database only.
{
  const page = (await get('/contact')).body
  if (!/<input[^>]*type="tel"[^>]*required/.test(page)) fail('/contact: no required phone (type="tel") input')
  if (/<select/.test(page)) fail('/contact: the tour dropdown (<select>) is still there')
  if (/<input[^>]*type="email"[^>]*required/.test(page)) fail('/contact: email is still required')
  const post = (body) =>
    fetch(BASE + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const base = { full_name: 'CI Fixture', message: 'CI fixture message, not a real request.', language: 'ka' }
  const noPhone = await post(base)
  const noPhoneBody = await noPhone.json().catch(() => ({}))
  if (noPhone.status !== 400 || !noPhoneBody.fieldErrors?.phone) fail(`/api/contact without phone: HTTP ${noPhone.status}, expected 400 with a phone error`)
  const ok = await post({ ...base, phone: '555 12 34 56' })
  if (ok.status !== 201) fail(`/api/contact with phone, no email: HTTP ${ok.status}, expected 201`)
  const sneaky = await post({ ...base, phone: '555 12 34 56', status: 'replied', tour_slug: '' })
  if (sneaky.status !== 201) fail(`/api/contact ignores unknown fields: HTTP ${sneaky.status}, expected 201`)
}

// Sitemap: indexable fixtures listed with their row's updated_at as lastmod;
// thin ones and drafts absent; static pages carry no lastmod (WHY-103).
const sm = await get('/sitemap.xml')
if (sm.status !== 200) fail(`/sitemap.xml: HTTP ${sm.status}`)
const entries = [...sm.body.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: m[1].match(/<loc>([^<]+)<\/loc>/)?.[1].replace(/^https?:\/\/[^/]+/, '') || '/',
  lastmod: m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1],
}))
const byLoc = new Map(entries.map((e) => [e.loc, e]))
for (const p of ['/ci-city-a', '/tours/ci-tour', '/transfers/ci-route-a-centre', '/transfers/ci-route-a-b', '/day-trips/ci-day-trip-indexable']) {
  const e = byLoc.get(p)
  if (!e) fail(`sitemap: missing ${p}`)
  else if (!e.lastmod || Number.isNaN(Date.parse(e.lastmod))) fail(`sitemap: ${p} has no row lastmod`)
}
for (const p of ['/ci-city-b', '/day-trips/ci-day-trip-thin', '/tips/ci-article-draft']) if (byLoc.has(p)) fail(`sitemap: must not list ${p}`)
for (const p of ['/', '/tours', '/tips', '/about', '/contact', '/transfers', '/day-trips', '/experiences']) {
  if (byLoc.get(p)?.lastmod) fail(`sitemap: static ${p} must not carry lastmod`)
}

// Internal links on every page above must resolve (200, or a redirect).
const links = new Set()
for (const [path] of PAGES) {
  for (const m of (cache.get(path)?.body ?? '').matchAll(/href="(\/[^"#?]*)/g)) {
    const href = m[1]
    if (!href.startsWith('/_next') && !href.startsWith('/api') && !/\.\w+$/.test(href)) links.add(href.replace(/\/$/, '') || '/')
  }
}
for (const href of [...links].sort()) {
  const r = await get(href)
  const ok = r.status === 200 || (r.status >= 300 && r.status < 400)
  const known = KNOWN_BROKEN.find((k) => k.pattern.test(href))
  if (!ok && known) warnings.push(`${href}: HTTP ${r.status}, known (${known.ticket})`)
  else if (!ok) fail(`broken link ${href}: HTTP ${r.status}`)
  else if (known) fail(`${href} now resolves: remove it from KNOWN_BROKEN (${known.ticket})`)
}

console.log(`Checked ${PAGES.length} pages, ${entries.length} sitemap entries, ${links.size} internal links.`)
for (const w of warnings) console.log(`  warn  ${w}`)
for (const f of failures) console.log(`  FAIL  ${f}`)
if (failures.length) process.exit(1)
console.log('Smoke test passed: every template rendered its seeded content.')
