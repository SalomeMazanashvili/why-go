import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'
import { STATIC_TOURS, type Tour } from '@/types'

const TOUR_COLUMNS =
  'id, slug, title_en, subtitle_en, description_en, tag_en, title_ka, subtitle_ka, description_ka, tag_ka, destination, price_from, currency, duration_days, cover_image, is_featured, sort_order'

function normalize(row: any): Tour {
  return {
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
  }
}

export async function listTours(): Promise<Tour[]> {
  if (!hasAdminSupabase()) return STATIC_TOURS
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('tours')
      .select(TOUR_COLUMNS)
      .order('sort_order', { ascending: true })
    if (error || !data || data.length === 0) return STATIC_TOURS
    return data.map(normalize)
  } catch {
    return STATIC_TOURS
  }
}

export async function getTourById(id: string): Promise<Tour | null> {
  if (!hasAdminSupabase()) {
    return STATIC_TOURS.find((t) => t.id === id) ?? null
  }
  try {
    const s = getAdminSupabase()
    const { data } = await s.from('tours').select(TOUR_COLUMNS).eq('id', id).maybeSingle()
    if (data) return normalize(data)
  } catch {
    // fall through
  }
  return STATIC_TOURS.find((t) => t.id === id) ?? null
}
