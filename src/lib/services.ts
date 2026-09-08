import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'
import type { Service, ServiceType } from '@/types'

const SERVICE_COLUMNS =
  'id, slug, destination_id, category_id, service_type, name_en, name_ka, short_description_en, short_description_ka, description_en, description_ka, seo_title_ka, seo_description_ka, route_en, route_ka, included_en, included_ka, what_to_bring_en, what_to_bring_ka, meeting_point_en, meeting_point_ka, gallery, departure_times, price_from, currency, duration_hours, min_group_size, max_group_size, cover_image, is_published, is_featured, sort_order'

const SERVICE_TYPES: ServiceType[] = ['day_trip', 'guide', 'experience']

// Postgres CHECK already constrains this, but rows written before WHY-83
// (or by a future migration) shouldn't be able to widen the union at the
// type boundary. Anything unrecognised falls back to 'experience', which
// matches the column default.
function normalizeServiceType(value: unknown): ServiceType {
  return SERVICE_TYPES.includes(value as ServiceType) ? (value as ServiceType) : 'experience'
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string' && v.trim() !== '')
}

// Admin-write guard for the WHY-83 columns. `service_type` is backed by a
// Postgres CHECK and `gallery`/`departure_times` by TEXT[], so bad input
// would otherwise surface as a raw constraint error in a toast. Validating
// here gives the admin a readable message and keeps the two service route
// handlers (POST and PUT) from drifting apart.
export function validateServiceWriteFields(
  payload: Record<string, any>,
): { ok: true } | { ok: false; error: string } {
  if ('service_type' in payload && !SERVICE_TYPES.includes(payload.service_type)) {
    return { ok: false, error: `service_type must be one of: ${SERVICE_TYPES.join(', ')}` }
  }
  for (const key of ['gallery', 'departure_times'] as const) {
    if (key in payload) {
      const value = payload[key]
      if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
        return { ok: false, error: `${key} must be an array of strings` }
      }
    }
  }
  return { ok: true }
}

function normalize(row: any): Service {
  return {
    id: String(row.id),
    slug: row.slug ?? '',
    destination_id: row.destination_id ?? null,
    category_id: row.category_id ?? null,
    service_type: normalizeServiceType(row.service_type),
    name_en: row.name_en ?? '',
    name_ka: row.name_ka ?? '',
    short_description_en: row.short_description_en ?? '',
    short_description_ka: row.short_description_ka ?? '',
    description_en: row.description_en ?? '',
    description_ka: row.description_ka ?? '',
    seo_title_ka: row.seo_title_ka ?? '',
    seo_description_ka: row.seo_description_ka ?? '',
    route_en: row.route_en ?? '',
    route_ka: row.route_ka ?? '',
    included_en: row.included_en ?? '',
    included_ka: row.included_ka ?? '',
    what_to_bring_en: row.what_to_bring_en ?? '',
    what_to_bring_ka: row.what_to_bring_ka ?? '',
    meeting_point_en: row.meeting_point_en ?? '',
    meeting_point_ka: row.meeting_point_ka ?? '',
    gallery: normalizeStringArray(row.gallery),
    departure_times: normalizeStringArray(row.departure_times),
    price_from: row.price_from ?? null,
    currency: row.currency ?? 'GEL',
    duration_hours: row.duration_hours ?? null,
    min_group_size: row.min_group_size ?? null,
    max_group_size: row.max_group_size ?? null,
    cover_image: row.cover_image ?? null,
    is_published: row.is_published ?? false,
    is_featured: row.is_featured ?? false,
    sort_order: row.sort_order ?? 0,
  }
}

export async function listServices(): Promise<Service[]> {
  if (!hasAdminSupabase()) {
    console.warn('[services] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('services')
      .select(SERVICE_COLUMNS)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[services] listServices query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[services] listServices threw', err)
    return []
  }
}

export async function listServicesForAdmin(): Promise<Service[]> {
  if (!hasAdminSupabase()) return []
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('services')
      .select(SERVICE_COLUMNS)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[services] listServicesForAdmin query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[services] listServicesForAdmin threw', err)
    return []
  }
}

export async function getServiceById(id: string): Promise<Service | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('services')
      .select(SERVICE_COLUMNS)
      .eq('id', id)
      .maybeSingle()
    if (error) {
      console.error('[services] getServiceById query failed', id, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[services] getServiceById threw', id, err)
    return null
  }
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('services')
      .select(SERVICE_COLUMNS)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
    if (error) {
      console.error('[services] getServiceBySlug query failed', slug, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[services] getServiceBySlug threw', slug, err)
    return null
  }
}

// WHY-83: day-trip reads. Kept as dedicated helpers rather than a
// `listServices({ type })` option so callers can't accidentally omit the
// filter and leak guides/experiences onto /day-trips.

// Public list of published day trips, ordered for the index page.
export async function listDayTrips(): Promise<Service[]> {
  if (!hasAdminSupabase()) {
    console.warn('[services] Supabase not configured — returning empty day-trip list')
    return []
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('services')
      .select(SERVICE_COLUMNS)
      .eq('service_type', 'day_trip')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[services] listDayTrips query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[services] listDayTrips threw', err)
    return []
  }
}

// Admin list — drafts included. Never call from public pages.
export async function listDayTripsForAdmin(): Promise<Service[]> {
  if (!hasAdminSupabase()) return []
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('services')
      .select(SERVICE_COLUMNS)
      .eq('service_type', 'day_trip')
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[services] listDayTripsForAdmin query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[services] listDayTripsForAdmin threw', err)
    return []
  }
}

// Public lookup for /day-trips/[slug] (PR B). Filters on service_type as
// well as slug so a guide or experience sharing a slug can never render
// through the day-trip template.
export async function getDayTripBySlug(slug: string): Promise<Service | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('services')
      .select(SERVICE_COLUMNS)
      .eq('slug', slug)
      .eq('service_type', 'day_trip')
      .eq('is_published', true)
      .maybeSingle()
    if (error) {
      console.error('[services] getDayTripBySlug query failed', slug, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[services] getDayTripBySlug threw', slug, err)
    return null
  }
}

// Count services referencing a given destination — used by the destination
// DELETE endpoint to produce a friendly FK-violation error before Postgres
// throws code 23503.
export async function countServicesByDestination(destinationId: string): Promise<number> {
  if (!hasAdminSupabase()) return 0
  try {
    const s = getAdminSupabase()
    const { count, error } = await s
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('destination_id', destinationId)
    if (error) {
      console.error('[services] countServicesByDestination failed', destinationId, error)
      return 0
    }
    return count ?? 0
  } catch (err) {
    console.error('[services] countServicesByDestination threw', destinationId, err)
    return 0
  }
}

export async function countServicesByCategory(categoryId: string): Promise<number> {
  if (!hasAdminSupabase()) return 0
  try {
    const s = getAdminSupabase()
    const { count, error } = await s
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
    if (error) {
      console.error('[services] countServicesByCategory failed', categoryId, error)
      return 0
    }
    return count ?? 0
  } catch (err) {
    console.error('[services] countServicesByCategory threw', categoryId, err)
    return 0
  }
}
