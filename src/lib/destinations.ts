import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'
import type { Destination } from '@/types'

const DESTINATION_COLUMNS =
  'id, slug, name_en, name_ka, country, description_en, description_ka, seo_title_ka, seo_description_ka, cover_image, is_published, sort_order'

function normalize(row: any): Destination {
  return {
    id: String(row.id),
    slug: row.slug ?? '',
    name_en: row.name_en ?? '',
    name_ka: row.name_ka ?? '',
    country: row.country ?? '',
    description_en: row.description_en ?? '',
    description_ka: row.description_ka ?? '',
    seo_title_ka: row.seo_title_ka ?? '',
    seo_description_ka: row.seo_description_ka ?? '',
    cover_image: row.cover_image ?? null,
    is_published: row.is_published ?? false,
    sort_order: row.sort_order ?? 0,
  }
}

// Public-facing list. Filters to published rows only — matches the RLS
// policy on the table so unpublished drafts never leak to public reads.
export async function listDestinations(): Promise<Destination[]> {
  if (!hasAdminSupabase()) {
    console.warn('[destinations] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('destinations')
      .select(DESTINATION_COLUMNS)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[destinations] listDestinations query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[destinations] listDestinations threw', err)
    return []
  }
}

// Admin-only list. Returns every destination — drafts included — so the
// admin panel can manage unpublished work. Never call this from public
// pages.
export async function listDestinationsForAdmin(): Promise<Destination[]> {
  if (!hasAdminSupabase()) {
    console.warn('[destinations] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('destinations')
      .select(DESTINATION_COLUMNS)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[destinations] listDestinationsForAdmin query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[destinations] listDestinationsForAdmin threw', err)
    return []
  }
}

export async function getDestinationById(id: string): Promise<Destination | null> {
  if (!hasAdminSupabase()) {
    console.warn('[destinations] Supabase not configured — cannot fetch destination', id)
    return null
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('destinations')
      .select(DESTINATION_COLUMNS)
      .eq('id', id)
      .maybeSingle()
    if (error) {
      console.error('[destinations] getDestinationById query failed', id, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[destinations] getDestinationById threw', id, err)
    return null
  }
}

// Public lookup by slug (used by future /destinations/[slug] page in WHY-65).
// Filters by is_published so unpublished drafts return null.
export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  if (!hasAdminSupabase()) {
    console.warn('[destinations] Supabase not configured — cannot fetch destination by slug', slug)
    return null
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('destinations')
      .select(DESTINATION_COLUMNS)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
    if (error) {
      console.error('[destinations] getDestinationBySlug query failed', slug, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[destinations] getDestinationBySlug threw', slug, err)
    return null
  }
}
