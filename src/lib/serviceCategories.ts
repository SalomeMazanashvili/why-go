import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'
import type { ServiceCategory } from '@/types'

const CATEGORY_COLUMNS =
  'id, slug, name_en, name_ka, description_en, description_ka, icon, is_published, sort_order'

function normalize(row: any): ServiceCategory {
  return {
    id: String(row.id),
    slug: row.slug ?? '',
    name_en: row.name_en ?? '',
    name_ka: row.name_ka ?? '',
    description_en: row.description_en ?? '',
    description_ka: row.description_ka ?? '',
    icon: row.icon ?? '',
    is_published: row.is_published ?? false,
    sort_order: row.sort_order ?? 0,
  }
}

export async function listServiceCategories(): Promise<ServiceCategory[]> {
  if (!hasAdminSupabase()) {
    console.warn('[service_categories] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('service_categories')
      .select(CATEGORY_COLUMNS)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[service_categories] listServiceCategories query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[service_categories] listServiceCategories threw', err)
    return []
  }
}

export async function listServiceCategoriesForAdmin(): Promise<ServiceCategory[]> {
  if (!hasAdminSupabase()) {
    console.warn('[service_categories] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('service_categories')
      .select(CATEGORY_COLUMNS)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[service_categories] listServiceCategoriesForAdmin query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[service_categories] listServiceCategoriesForAdmin threw', err)
    return []
  }
}

export async function getServiceCategoryById(id: string): Promise<ServiceCategory | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('service_categories')
      .select(CATEGORY_COLUMNS)
      .eq('id', id)
      .maybeSingle()
    if (error) {
      console.error('[service_categories] getServiceCategoryById query failed', id, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[service_categories] getServiceCategoryById threw', id, err)
    return null
  }
}

export async function getServiceCategoryBySlug(slug: string): Promise<ServiceCategory | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('service_categories')
      .select(CATEGORY_COLUMNS)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
    if (error) {
      console.error('[service_categories] getServiceCategoryBySlug query failed', slug, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[service_categories] getServiceCategoryBySlug threw', slug, err)
    return null
  }
}
