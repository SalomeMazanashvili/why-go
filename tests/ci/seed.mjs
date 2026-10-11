// WHY-98 PR B: seed the throwaway CI database with hand-written fixtures.
//
// Rules (decided 2026-10-09/11):
// - Hand-written and committed, never dumped from production.
// - `inquiries` is never seeded: in production it holds real names,
//   emails and phone numbers.
// - Georgian is never written here (CLAUDE.md rule 2). Every Georgian
//   string is composed from founder-written sentences already in
//   messages/ka.json (option (a)), repeated to reach length. Everything
//   else is English, marked as a CI fixture.
// - Refuses to run against anything but a local database.
//
// Fixtures exist to make every template render its populated branch: the
// /tips grid, hubs with routes/services/posts, indexable (300+ words) and
// thin variants, so axe/Lighthouse/link checks see real pages, not empty
// states. Usage: DB_URL=postgres://…@127.0.0.1:54322/postgres node tests/ci/seed.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const url = process.env.DB_URL
if (!url) throw new Error('DB_URL is not set')
const host = new URL(url).hostname
if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
  throw new Error(`Refusing to seed ${host}: CI fixtures only ever go into a local database.`)
}

// Founder-written Georgian sentences (keys, not text, so a copy edit flows through).
const ka = JSON.parse(fs.readFileSync(path.join(root, 'messages/ka.json'), 'utf8'))
const get = (key) => key.split('.').reduce((o, k) => o?.[k], ka)
const SENTENCE_KEYS = [
  'transfers_page.landing_intro',
  'day_trips_page.index_intro',
  'inquiry.shared.success_body',
  'contact.reply_note',
  'inquiry.consultative.interests',
  'inquiry.transfer.not_covered',
  'inquiry.shared.error_rate_limited',
]
const sentences = SENTENCE_KEYS.map((k) => {
  const v = get(k)
  if (typeof v !== 'string' || v.startsWith('TODO') || !/[Ⴀ-ჿ]/.test(v)) {
    throw new Error(`messages/ka.json ${k} is not founder Georgian; pick another key`)
  }
  return /[.?!…]$/.test(v.trim()) ? v.trim() : `${v.trim()}.`
})
const words = (s) => s.split(/\s+/).filter(Boolean).length
// At least `min` words, in paragraphs of three sentences.
function georgian(min) {
  const out = []
  for (let i = 0; words(out.join(' ')) < min; i++) out.push(sentences[i % sentences.length])
  const paras = []
  for (let i = 0; i < out.length; i += 3) paras.push(out.slice(i, i + 3).join(' '))
  return paras.join('\n\n')
}

const IMG = 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1600' // allowed in next.config remotePatterns
const FIXTURE = 'CI fixture — not real content.'

const db = new pg.Client({ connectionString: url })
await db.connect()
const one = async (sql, params) => (await db.query(sql, params)).rows[0]

try {
  await db.query('BEGIN')

  const cityA = await one(
    `INSERT INTO destinations (slug, name_en, country, description_en, description_ka, practical_info_ka, faq,
       seo_title_ka, seo_description_ka, cover_image, is_published, sort_order)
     VALUES ('ci-city-a', 'CI City A', 'Fixtureland', $1, $2, $3, $4, NULL, NULL, $5, true, 1) RETURNING id`,
    [FIXTURE, georgian(320), georgian(40), JSON.stringify([{ q_ka: sentences[4], a_ka: sentences[0] }, { q_ka: sentences[5], a_ka: sentences[1] }]), IMG],
  )
  // Thin hub: under 300 words, so it must render noindex and stay out of the sitemap.
  const cityB = await one(
    `INSERT INTO destinations (slug, name_en, country, description_en, description_ka, cover_image, is_published, sort_order)
     VALUES ('ci-city-b', 'CI City B', 'Fixtureland', $1, $2, $3, true, 2) RETURNING id`,
    [FIXTURE, georgian(20), IMG],
  )

  const category = await one(
    `INSERT INTO service_categories (slug, name_en, description_en, is_published, sort_order)
     VALUES ('ci-category', 'CI category', $1, true, 1) RETURNING id`, [FIXTURE])

  // Indexable day trip (300+ Georgian words across its editorial fields).
  const dayTrip = await one(
    `INSERT INTO services (slug, destination_id, category_id, service_type, name_en, short_description_en,
       description_en, description_ka, route_ka, included_ka, what_to_bring_ka, meeting_point_ka,
       price_from, currency, duration_hours, min_group_size, max_group_size, cover_image, gallery,
       is_published, is_featured, sort_order)
     VALUES ('ci-day-trip-indexable', $1, $2, 'day_trip', 'CI fixture day trip (indexable)', $3,
       $3, $4, $5, $6, $7, $8, 120, 'GEL', 7.5, 2, 8, $9, ARRAY[$9, $9], true, true, 1) RETURNING id`,
    [cityA.id, category.id, FIXTURE, georgian(220), georgian(60),
      [sentences[0], sentences[1], sentences[2]].join('\n'), [sentences[3], sentences[4]].join('\n'), sentences[5], IMG],
  )
  // Thin day trip: noindex, out of the sitemap.
  await db.query(
    `INSERT INTO services (slug, destination_id, category_id, service_type, name_en, short_description_en,
       description_ka, price_from, currency, duration_hours, cover_image, is_published, sort_order)
     VALUES ('ci-day-trip-thin', $1, $2, 'day_trip', 'CI fixture day trip (thin)', $3, $4, 90, 'GEL', 1.5, $5, true, 2)`,
    [cityB.id, category.id, FIXTURE, georgian(30), IMG],
  )
  // Experience: published but no detail page yet (WHY-85), so never linked.
  const experience = await one(
    `INSERT INTO services (slug, destination_id, service_type, name_en, description_en, is_published)
     VALUES ('ci-experience', $1, 'experience', 'CI fixture experience', $2, true) RETURNING id`, [cityA.id, FIXTURE])
  // Unpublished day trip that article A still has picked (WHY-118): the
  // article must drop the link rather than point at its 404.
  const draftTrip = await one(
    `INSERT INTO services (slug, destination_id, category_id, service_type, name_en, description_ka, is_published, sort_order)
     VALUES ('ci-day-trip-draft', $1, $2, 'day_trip', 'CI fixture day trip (unpublished)', $3, false, 3) RETURNING id`,
    [cityA.id, category.id, georgian(30)])

  for (const p of [['ci-airport-t1', 'CI Airport T1', 1], ['ci-airport-t2', 'CI Airport T2', 2]]) {
    await db.query(
      `INSERT INTO pickup_points (destination_id, label_en, notes, price_from, currency, is_published, sort_order)
       VALUES ($1, $2, $3, 30, 'GEL', true, $4)`, [cityA.id, p[1], FIXTURE, p[2]])
  }

  // Two routes, so the /transfers route list renders (it needs 2+).
  const routeIds = {}
  for (const [slug, to, n] of [['ci-route-a-centre', 'CI City A centre', 1], ['ci-route-a-b', 'CI City B', 2]]) {
    routeIds[slug] = (await one(
      `INSERT INTO transfer_routes (slug, from_destination_id, to_destination_id, from_name_en, to_name_en,
         description_en, description_ka, price_from, currency, duration_minutes, vehicle_type, max_passengers,
         is_published, sort_order)
       VALUES ($1, $2, $3, 'CI Airport', $4, $5, $6, 40, 'GEL', 45, 'Sedan', 3, true, $7) RETURNING id`,
      [slug, cityA.id, n === 2 ? cityB.id : cityA.id, to, FIXTURE, georgian(310), n],
    )).id
  }

  await db.query(
    `INSERT INTO tours (slug, title_en, subtitle_en, description_en, description_ka, tag_en, destination,
       price_from, currency, duration_days, cover_image, gallery, is_active, is_featured, sort_order)
     VALUES ('ci-tour', 'CI fixture tour', $1, $1, $2, 'Fixture', 'CI City A', 1500, 'GEL', 5, $3, ARRAY[$3], true, true, 1)`,
    [FIXTURE, georgian(150), IMG],
  )

  // Articles (WHY-118): A is indexable (Georgian title + excerpt + 300+
  // words) with related services picked; B is thin (noindex, no hub, no
  // picks); the draft must 404. A's Georgian title is a founder nav label.
  const articles = {}
  for (const [slug, title, titleKa, body, pub, dest] of [
    ['ci-article-a', 'CI fixture article A', get('nav.tips'), georgian(320), true, cityA.id],
    ['ci-article-b', 'CI fixture article B', null, georgian(120), true, null],
    ['ci-article-draft', 'CI fixture draft', null, georgian(320), false, cityA.id],
  ]) {
    articles[slug] = (await one(
      `INSERT INTO news (slug, title_en, title_ka, excerpt_en, content_en, content_ka, excerpt_ka, tag_en, cover_image,
         is_published, destination_id, reading_time_min)
       VALUES ($1, $2, $3, $4, $4, $5, $6, 'Fixture', $7, $8, $9, 4) RETURNING id`,
      [slug, title, titleKa, FIXTURE, body, sentences[0], IMG, pub, dest],
    )).id
  }
  // A's picks, in order: one live route, the unpublished trip (dropped), the
  // live trip, the page-less experience (dropped). So 2 render, and the §9
  // block below shows the city's remaining route (ci-route-a-b) only.
  const picks = [
    { transfer_route_id: routeIds['ci-route-a-centre'] },
    { service_id: draftTrip.id },
    { service_id: dayTrip.id },
    { service_id: experience.id },
  ]
  await db.query('SELECT set_news_related_services($1, $2)', [articles['ci-article-a'], JSON.stringify(picks)])

  // Published guide: not shown until WHY-84 (GUIDES_PAGE_LIVE), seeded so it is ready.
  await db.query(
    `INSERT INTO guides (slug, name_en, bio_en, bio_ka, languages, is_published, sort_order)
     VALUES ('ci-guide', 'CI fixture guide', $1, $2, 'ka, en', true, 1)`, [FIXTURE, georgian(60)])

  await db.query('COMMIT')
} catch (err) {
  await db.query('ROLLBACK')
  throw err
}

const counts = await db.query(`
  SELECT 'destinations' t, count(*)::int n FROM destinations UNION ALL
  SELECT 'services', count(*)::int FROM services UNION ALL
  SELECT 'transfer_routes', count(*)::int FROM transfer_routes UNION ALL
  SELECT 'pickup_points', count(*)::int FROM pickup_points UNION ALL
  SELECT 'tours', count(*)::int FROM tours UNION ALL
  SELECT 'news', count(*)::int FROM news UNION ALL
  SELECT 'news_related_services', count(*)::int FROM news_related_services UNION ALL
  SELECT 'guides', count(*)::int FROM guides UNION ALL
  SELECT 'inquiries', count(*)::int FROM inquiries`)
console.log('Seeded:', counts.rows.map((r) => `${r.t}=${r.n}`).join(' '))
if (counts.rows.find((r) => r.t === 'inquiries').n !== 0) throw new Error('inquiries must stay empty in CI')
await db.end()
