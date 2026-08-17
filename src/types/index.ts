export type Locale = 'en' | 'ka'

export interface Tour {
  id: string
  slug: string
  title_en: string
  subtitle_en: string
  description_en: string
  tag_en: string
  title_ka: string
  subtitle_ka: string
  description_ka: string
  tag_ka: string
  destination: string
  price_from: number | null
  currency: string
  duration_days: number | null
  cover_image: string | null
  is_featured: boolean
  sort_order: number
  // Public-facing guide credential (e.g. "სერტიფიცირებული გიდი"). Never a
  // real name — one expert must not be publicly tied to the company.
  expert_credential_ka: string
}

export interface Destination {
  id: string
  slug: string
  name_en: string
  name_ka: string
  country: string
  description_en: string
  description_ka: string
  seo_title_ka: string
  seo_description_ka: string
  cover_image: string | null
  is_published: boolean
  sort_order: number
}

export interface News {
  id: string
  slug: string
  title_en: string
  excerpt_en: string
  tag_en: string
  title_ka: string
  excerpt_ka: string
  tag_ka: string
  cover_image: string | null
  author: string
  reading_time_min: number
  is_featured: boolean
  published_at: string
}

// Helpers
export function getTourTitle(t: Tour, l: Locale) { return l === 'ka' && t.title_ka ? t.title_ka : t.title_en }
export function getTourSubtitle(t: Tour, l: Locale) { return l === 'ka' && t.subtitle_ka ? t.subtitle_ka : t.subtitle_en }
export function getTourDescription(t: Tour, l: Locale) { return l === 'ka' && t.description_ka ? t.description_ka : t.description_en }
export function getTourTag(t: Tour, l: Locale) { return l === 'ka' && t.tag_ka ? t.tag_ka : t.tag_en }
export function getNewsTitle(n: News, l: Locale) { return l === 'ka' && n.title_ka ? n.title_ka : n.title_en }
export function getNewsExcerpt(n: News, l: Locale) { return l === 'ka' && n.excerpt_ka ? n.excerpt_ka : n.excerpt_en }
export function getDestinationName(d: Destination, l: Locale) { return l === 'ka' && d.name_ka ? d.name_ka : d.name_en }
export function getDestinationDescription(d: Destination, l: Locale) { return l === 'ka' && d.description_ka ? d.description_ka : d.description_en }

export function formatPrice(amount: number | null, currency: string): string {
  if (!amount) return 'POA'
  const s: Record<string, string> = { EUR: '€', GBP: '£', USD: '$', JPY: '¥', GEL: '₾' }
  const sym = s[currency] ?? currency
  return currency === 'JPY'
    ? `From ${sym}${Math.round(amount).toLocaleString()}`
    : `From ${sym}${amount.toLocaleString()}`
}
