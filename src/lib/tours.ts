import { hasAdminSupabase, getAdminSupabase, getContentSupabase } from '@/lib/supabase/admin'
import type { Tour } from '@/types'

const TOUR_COLUMNS =
  'id, slug, title_en, subtitle_en, description_en, tag_en, title_ka, subtitle_ka, description_ka, tag_ka, destination, price_from, currency, duration_days, cover_image, is_featured, sort_order, expert_credential_ka, updated_at'

function normalize(row: any): Tour {
  return {
    updated_at: row.updated_at ?? null,
    id: String(row.id),
    slug: row.slug ?? '',
    title_en: row.title_en ?? '',
    subtitle_en: row.subtitle_en ?? '',
    description_en: row.description_en ?? '',
    tag_en: row.tag_en ?? '',
    title_ka: row.title_ka ?? '',
    subtitle_ka: row.subtitle_ka ?? '',
    description_ka: row.description_ka ?? '',
    tag_ka: row.tag_ka ?? '',
    destination: row.destination ?? '',
    price_from: row.price_from ?? null,
    currency: row.currency ?? 'USD',
    duration_days: row.duration_days ?? null,
    cover_image: row.cover_image ?? null,
    is_featured: Boolean(row.is_featured),
    sort_order: row.sort_order ?? 0,
    expert_credential_ka: row.expert_credential_ka ?? '',
  }
}

export async function listTours(): Promise<Tour[]> {
  if (!hasAdminSupabase()) {
    console.warn('[tours] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getContentSupabase()
    const { data, error } = await s
      .from('tours')
      .select(TOUR_COLUMNS)
      // WHY-67: public list — inactive tours were leaking to /tours, the
      // sitemap and (now) the homepage.
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[tours] listTours query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[tours] listTours threw', err)
    return []
  }
}

// Admin list — inactive tours included. Never call from public pages.
export async function listToursForAdmin(): Promise<Tour[]> {
  if (!hasAdminSupabase()) return []
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('tours')
      .select(TOUR_COLUMNS)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[tours] listToursForAdmin query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[tours] listToursForAdmin threw', err)
    return []
  }
}

export async function getTourById(id: string): Promise<Tour | null> {
  if (!hasAdminSupabase()) {
    console.warn('[tours] Supabase not configured — cannot fetch tour', id)
    return null
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s.from('tours').select(TOUR_COLUMNS).eq('id', id).maybeSingle()
    if (error) {
      console.error('[tours] getTourById query failed', id, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[tours] getTourById threw', id, err)
    return null
  }
}
