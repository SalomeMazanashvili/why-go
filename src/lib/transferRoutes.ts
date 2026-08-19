import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'
import type { TransferRoute } from '@/types'

const ROUTE_COLUMNS =
  'id, slug, from_destination_id, to_destination_id, from_name_en, from_name_ka, to_name_en, to_name_ka, description_en, description_ka, seo_title_ka, seo_description_ka, price_from, currency, duration_minutes, vehicle_type, max_passengers, is_published, sort_order'

function normalize(row: any): TransferRoute {
  return {
    id: String(row.id),
    slug: row.slug ?? '',
    from_destination_id: row.from_destination_id ?? null,
    to_destination_id: row.to_destination_id ?? null,
    from_name_en: row.from_name_en ?? '',
    from_name_ka: row.from_name_ka ?? '',
    to_name_en: row.to_name_en ?? '',
    to_name_ka: row.to_name_ka ?? '',
    description_en: row.description_en ?? '',
    description_ka: row.description_ka ?? '',
    seo_title_ka: row.seo_title_ka ?? '',
    seo_description_ka: row.seo_description_ka ?? '',
    price_from: row.price_from ?? null,
    currency: row.currency ?? 'GEL',
    duration_minutes: row.duration_minutes ?? null,
    vehicle_type: row.vehicle_type ?? '',
    max_passengers: row.max_passengers ?? null,
    is_published: row.is_published ?? false,
    sort_order: row.sort_order ?? 0,
  }
}

export async function listTransferRoutes(): Promise<TransferRoute[]> {
  if (!hasAdminSupabase()) {
    console.warn('[transfer_routes] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('transfer_routes')
      .select(ROUTE_COLUMNS)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[transfer_routes] listTransferRoutes query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[transfer_routes] listTransferRoutes threw', err)
    return []
  }
}

export async function listTransferRoutesForAdmin(): Promise<TransferRoute[]> {
  if (!hasAdminSupabase()) return []
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('transfer_routes')
      .select(ROUTE_COLUMNS)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[transfer_routes] listTransferRoutesForAdmin query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[transfer_routes] listTransferRoutesForAdmin threw', err)
    return []
  }
}

export async function getTransferRouteById(id: string): Promise<TransferRoute | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('transfer_routes')
      .select(ROUTE_COLUMNS)
      .eq('id', id)
      .maybeSingle()
    if (error) {
      console.error('[transfer_routes] getTransferRouteById query failed', id, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[transfer_routes] getTransferRouteById threw', id, err)
    return null
  }
}

export async function getTransferRouteBySlug(slug: string): Promise<TransferRoute | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('transfer_routes')
      .select(ROUTE_COLUMNS)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
    if (error) {
      console.error('[transfer_routes] getTransferRouteBySlug query failed', slug, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[transfer_routes] getTransferRouteBySlug threw', slug, err)
    return null
  }
}

// Count transfer routes that either start or end at the given destination.
// Used by the destination DELETE endpoint to produce a friendly error.
export async function countTransferRoutesByDestination(destinationId: string): Promise<number> {
  if (!hasAdminSupabase()) return 0
  try {
    const s = getAdminSupabase()
    const { count, error } = await s
      .from('transfer_routes')
      .select('id', { count: 'exact', head: true })
      .or(`from_destination_id.eq.${destinationId},to_destination_id.eq.${destinationId}`)
    if (error) {
      console.error('[transfer_routes] countTransferRoutesByDestination failed', destinationId, error)
      return 0
    }
    return count ?? 0
  } catch (err) {
    console.error('[transfer_routes] countTransferRoutesByDestination threw', destinationId, err)
    return 0
  }
}
