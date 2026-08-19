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

export interface ServiceCategory {
  id: string
  slug: string
  name_en: string
  name_ka: string
  description_en: string
  description_ka: string
  icon: string
  is_published: boolean
  sort_order: number
}

export interface Guide {
  id: string
  slug: string
  name_en: string
  name_ka: string
  bio_en: string
  bio_ka: string
  photo: string | null
  languages: string
  destinations_covered: string
  specialties_en: string
  specialties_ka: string
  is_published: boolean
  sort_order: number
}

export interface Service {
  id: string
  slug: string
  destination_id: string | null
  category_id: string | null
  name_en: string
  name_ka: string
  short_description_en: string
  short_description_ka: string
  description_en: string
  description_ka: string
  seo_title_ka: string
  seo_description_ka: string
  price_from: number | null
  currency: string
  duration_hours: number | null
  min_group_size: number | null
  max_group_size: number | null
  cover_image: string | null
  is_published: boolean
  is_featured: boolean
  sort_order: number
}

export interface TransferRoute {
  id: string
  slug: string
  from_destination_id: string | null
  to_destination_id: string | null
  from_name_en: string
  from_name_ka: string
  to_name_en: string
  to_name_ka: string
  description_en: string
  description_ka: string
  seo_title_ka: string
  seo_description_ka: string
  price_from: number | null
  currency: string
  duration_minutes: number | null
  vehicle_type: string
  max_passengers: number | null
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
export function getCategoryName(c: ServiceCategory, l: Locale) { return l === 'ka' && c.name_ka ? c.name_ka : c.name_en }
export function getCategoryDescription(c: ServiceCategory, l: Locale) { return l === 'ka' && c.description_ka ? c.description_ka : c.description_en }
export function getGuideName(g: Guide, l: Locale) { return l === 'ka' && g.name_ka ? g.name_ka : g.name_en }
export function getGuideBio(g: Guide, l: Locale) { return l === 'ka' && g.bio_ka ? g.bio_ka : g.bio_en }
export function getGuideSpecialties(g: Guide, l: Locale) { return l === 'ka' && g.specialties_ka ? g.specialties_ka : g.specialties_en }
export function getServiceName(s: Service, l: Locale) { return l === 'ka' && s.name_ka ? s.name_ka : s.name_en }
export function getServiceShortDescription(s: Service, l: Locale) { return l === 'ka' && s.short_description_ka ? s.short_description_ka : s.short_description_en }
export function getServiceDescription(s: Service, l: Locale) { return l === 'ka' && s.description_ka ? s.description_ka : s.description_en }
export function getTransferRouteFrom(r: TransferRoute, l: Locale) { return l === 'ka' && r.from_name_ka ? r.from_name_ka : r.from_name_en }
export function getTransferRouteTo(r: TransferRoute, l: Locale) { return l === 'ka' && r.to_name_ka ? r.to_name_ka : r.to_name_en }
export function getTransferRouteDescription(r: TransferRoute, l: Locale) { return l === 'ka' && r.description_ka ? r.description_ka : r.description_en }

export function formatPrice(amount: number | null, currency: string): string {
  if (!amount) return 'POA'
  const s: Record<string, string> = { EUR: '€', GBP: '£', USD: '$', JPY: '¥', GEL: '₾' }
  const sym = s[currency] ?? currency
  return currency === 'JPY'
    ? `From ${sym}${Math.round(amount).toLocaleString()}`
    : `From ${sym}${amount.toLocaleString()}`
}
