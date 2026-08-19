import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'
import type { Service } from '@/types'

const SERVICE_COLUMNS =
  'id, slug, destination_id, category_id, name_en, name_ka, short_description_en, short_description_ka, description_en, description_ka, seo_title_ka, seo_description_ka, price_from, currency, duration_hours, min_group_size, max_group_size, cover_image, is_published, is_featured, sort_order'

function normalize(row: any): Service {
  return {
    id: String(row.id),
    slug: row.slug ?? '',
    destination_id: row.destination_id ?? null,
    category_id: row.category_id ?? null,
    name_en: row.name_en ?? '',
    name_ka: row.name_ka ?? '',
    short_description_en: row.short_description_en ?? '',
    short_description_ka: row.short_description_ka ?? '',
    description_en: row.description_en ?? '',
    description_ka: row.description_ka ?? '',
    seo_title_ka: row.seo_title_ka ?? '',
    seo_description_ka: row.seo_description_ka ?? '',
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
