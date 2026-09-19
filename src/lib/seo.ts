// Central SEO helpers. Kept small so per-page files stay thin.

export const SITE_URL = 'https://whygo.ge'
export const SITE_NAME = 'WHYGO'

// Default OG images every page includes. Next 16's metadata merge replaces
// `openGraph` objects entirely when a child sets one, so file-convention
// image inheritance is unreliable across the [locale] → page boundary.
// Referencing this constant from each generateMetadata guarantees an
// og:image tag on every route.
export const DEFAULT_OG_IMAGES = [
  {
    url: '/opengraph-image',
    width: 1200,
    height: 630,
    alt: 'WHYGO — boutique tours built around real skills',
  },
]

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

interface ServiceLd {
  '@context': 'https://schema.org'
  '@type': 'Service'
  name: string
  description: string
  url: string
  serviceType: string
  areaServed?: string
  provider: {
    '@type': 'Organization'
    name: string
    url: string
  }
  offers?: OfferLd
}

// Build Service + Offer JSON-LD for a transfer route detail page. Only
// emits `offers` when a real price exists — no fake pricing per
// CLAUDE.md "never invent content".
export function serviceJsonLd(input: {
  locale: 'en' | 'ka'
  slug: string
  name: string
  description: string
  serviceType: string
  areaServed?: string
  priceFrom: number | null
  currency: string
}): ServiceLd {
  const ld: ServiceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: canonicalFor(input.locale, `/transfers/${input.slug}`),
    serviceType: input.serviceType,
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
  if (input.areaServed) ld.areaServed = input.areaServed
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

interface ProductLd {
  '@context': 'https://schema.org'
  '@type': 'Product'
  name: string
  description: string
  url: string
  image?: string[]
  brand: { '@type': 'Brand'; name: string }
  offers: OfferLd & { url: string }
}

// Build Product + Offer JSON-LD for a day-trip detail page (WHY-83).
// Returns null without a real price: Google rejects a Product that has no
// offers, and CLAUDE.md forbids inventing one. Callers skip the <script>.
export function productJsonLd(input: {
  locale: 'en' | 'ka'
  path: string
  name: string
  description: string
  images: string[]
  priceFrom: number | null
  currency: string
}): ProductLd | null {
  if (input.priceFrom == null) return null
  const url = canonicalFor(input.locale, input.path)
  const ld: ProductLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    url,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      price: String(input.priceFrom),
      priceCurrency: input.currency,
      availability: 'https://schema.org/InStock',
      url,
    },
  }
  if (input.images.length > 0) ld.image = input.images
  return ld
}

// CLAUDE.md rule 5: programmatic pages need 300+ words of unique Georgian
// content or they must not be indexed. Whitespace splitting is accurate for
// Georgian, which separates words with spaces.
export const MIN_INDEXABLE_WORDS = 300

export function countWords(...texts: Array<string | null | undefined>): number {
  return texts.reduce(
    (n, t) => n + (t ? t.split(/\s+/).filter(Boolean).length : 0),
    0,
  )
}

// Render a JSON-LD payload as a <script> tag string safe for
// `dangerouslySetInnerHTML`. Callers pass the object; this stringifies
// with </script> escaped so an attacker can't break out of the block
// via crafted content.
export function jsonLdScript(payload: object): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c')
}
