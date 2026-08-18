import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'
import type { Guide } from '@/types'

const GUIDE_COLUMNS =
  'id, slug, name_en, name_ka, bio_en, bio_ka, photo, languages, destinations_covered, specialties_en, specialties_ka, is_published, sort_order'

function normalize(row: any): Guide {
  return {
    id: String(row.id),
    slug: row.slug ?? '',
    name_en: row.name_en ?? '',
    name_ka: row.name_ka ?? '',
    bio_en: row.bio_en ?? '',
    bio_ka: row.bio_ka ?? '',
    photo: row.photo ?? null,
    languages: row.languages ?? '',
    destinations_covered: row.destinations_covered ?? '',
    specialties_en: row.specialties_en ?? '',
    specialties_ka: row.specialties_ka ?? '',
    is_published: row.is_published ?? false,
    sort_order: row.sort_order ?? 0,
  }
}

export async function listGuides(): Promise<Guide[]> {
  if (!hasAdminSupabase()) {
    console.warn('[guides] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('guides')
      .select(GUIDE_COLUMNS)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[guides] listGuides query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[guides] listGuides threw', err)
    return []
  }
}

export async function listGuidesForAdmin(): Promise<Guide[]> {
  if (!hasAdminSupabase()) {
    console.warn('[guides] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('guides')
      .select(GUIDE_COLUMNS)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[guides] listGuidesForAdmin query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[guides] listGuidesForAdmin threw', err)
    return []
  }
}

export async function getGuideById(id: string): Promise<Guide | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('guides')
      .select(GUIDE_COLUMNS)
      .eq('id', id)
      .maybeSingle()
    if (error) {
      console.error('[guides] getGuideById query failed', id, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[guides] getGuideById threw', id, err)
    return null
  }
}

export async function getGuideBySlug(slug: string): Promise<Guide | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('guides')
      .select(GUIDE_COLUMNS)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
    if (error) {
      console.error('[guides] getGuideBySlug query failed', slug, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[guides] getGuideBySlug threw', slug, err)
    return null
  }
}
