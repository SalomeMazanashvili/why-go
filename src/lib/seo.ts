// Central SEO helpers. Kept small so per-page files stay thin.

export const SITE_URL = 'https://whygo.ge'
export const SITE_NAME = 'Why Go'

// Build an absolute canonical URL for a given locale + path. Under
// next-intl `localePrefix: 'as-needed'`, Georgian (default) is served
// unprefixed and English at `/en/*`.
export function canonicalFor(locale: 'en' | 'ka', pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  const prefix = locale === 'en' ? '/en' : ''
  const url = `${SITE_URL}${prefix}${path === '/' ? '' : path}`
  return url || SITE_URL
}

interface OrgLd {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  name: string
  url: string
  logo: string
  sameAs?: string[]
}

export function orgJsonLd(): OrgLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
  }
}

interface WebSiteLd {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  url: string
  inLanguage: string
}

export function webSiteJsonLd(locale: 'en' | 'ka'): WebSiteLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: locale === 'ka' ? 'ka-GE' : 'en',
  }
}

interface BreadcrumbLd {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }>
}

// Build breadcrumb JSON-LD. Pass segments in visit order, e.g.
// [{ name: 'Tours', path: '/tours' }, { name: 'Madrid', path: '/tours/madrid' }].
// A Home entry is prepended automatically.
export function breadcrumbJsonLd(
  locale: 'en' | 'ka',
  homeLabel: string,
  segments: Array<{ name: string; path: string }>,
): BreadcrumbLd {
  const items = [
    { '@type': 'ListItem' as const, position: 1, name: homeLabel, item: canonicalFor(locale, '/') },
    ...segments.map((s, i) => ({
      '@type': 'ListItem' as const,
      position: i + 2,
      name: s.name,
      item: canonicalFor(locale, s.path),
    })),
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }
}

interface OfferLd {
  '@type': 'Offer'
  price: string
  priceCurrency: string
  availability: 'https://schema.org/InStock'
}
interface TouristTripLd {
  '@context': 'https://schema.org'
  '@type': 'TouristTrip'
  name: string
  description: string
  url: string
  image?: string
  touristType?: string
  offers?: OfferLd
}

// Build TouristTrip JSON-LD for a tour detail page.
// Only emits `offers` when a real price exists — no fake pricing per
// CLAUDE.md "never invent content".
export function touristTripJsonLd(input: {
  locale: 'en' | 'ka'
  slug: string
  name: string
  description: string
  coverImage: string | null
  destination: string
  priceFrom: number | null
  currency: string
}): TouristTripLd {
  const ld: TouristTripLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: input.name,
    description: input.description,
    url: canonicalFor(input.locale, `/tours/${input.slug}`),
    touristType: input.destination,
  }
  if (input.coverImage) ld.image = input.coverImage
  if (input.priceFrom != null) {
    ld.offers = {
      '@type': 'Offer',
      price: String(input.priceFrom),
      priceCurrency: input.currency,
      availability: 'https://schema.org/InStock',
    }
  }
  return ld
}

// Render a JSON-LD payload as a <script> tag string safe for
// `dangerouslySetInnerHTML`. Callers pass the object; this stringifies
// with </script> escaped so an attacker can't break out of the block
// via crafted content.
export function jsonLdScript(payload: object): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c')
}
