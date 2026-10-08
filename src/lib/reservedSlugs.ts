// WHY-65: destination hubs live at /[slug], beside the site's own top-level
// routes. A hub whose slug matched one of these would be shadowed by the
// static route, or would shadow it once that route ships. Over-reserved on
// purpose: current routes, planned ones (WHY-84 guides, WHY-85 experiences,
// legal pages), locale prefixes and framework paths.
//
// Keep in sync with the destinations_slug_not_reserved CHECK constraint in
// supabase/schema.sql. The admin API checks this list first so the founders
// get a readable error instead of a constraint violation.
export const RESERVED_TOP_LEVEL_SLUGS = [
  'en', 'ka',
  'tours', 'transfers', 'day-trips', 'experiences', 'guides',
  'tips', 'blog', 'about', 'contact', 'destinations', 'services',
  'terms', 'privacy', 'cookies',
  'admin', 'api', 'whisky-tour',
  'sitemap.xml', 'robots.txt', 'icon.png', 'favicon.ico', '-', '_next',
] as const

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_TOP_LEVEL_SLUGS as readonly string[]).includes(slug.trim().toLowerCase())
}
