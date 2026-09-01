import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'
import type { PickupPoint } from '@/types'

const PICKUP_POINT_COLUMNS =
  'id, destination_id, label_en, label_ka, price_from, currency, notes, is_published, sort_order'

function normalize(row: any): PickupPoint {
  return {
    id: String(row.id),
    destination_id: String(row.destination_id),
    label_en: row.label_en ?? '',
    label_ka: row.label_ka ?? '',
    price_from: row.price_from != null ? Number(row.price_from) : null,
    currency: row.currency ?? 'EUR',
    notes: row.notes ?? '',
    is_published: Boolean(row.is_published),
    sort_order: row.sort_order ?? 0,
  }
}

// Public list — only published points. Consumed by the transfer form on the
// public site to build the pickup dropdown.
export async function listPickupPoints(): Promise<PickupPoint[]> {
  if (!hasAdminSupabase()) return []
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('pickup_points')
      .select(PICKUP_POINT_COLUMNS)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('label_en', { ascending: true })
    if (error) {
      console.error('[pickup_points] listPickupPoints failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[pickup_points] listPickupPoints threw', err)
    return []
  }
}

// Admin list — includes unpublished drafts so founders can manage them.
export async function listPickupPointsForAdmin(): Promise<PickupPoint[]> {
  if (!hasAdminSupabase()) return []
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('pickup_points')
      .select(PICKUP_POINT_COLUMNS)
      .order('sort_order', { ascending: true })
      .order('label_en', { ascending: true })
    if (error) {
      console.error('[pickup_points] listPickupPointsForAdmin failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[pickup_points] listPickupPointsForAdmin threw', err)
    return []
  }
}

export async function getPickupPointById(id: string): Promise<PickupPoint | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('pickup_points')
      .select(PICKUP_POINT_COLUMNS)
      .eq('id', id)
      .maybeSingle()
    if (error) {
      console.error('[pickup_points] getPickupPointById failed', id, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[pickup_points] getPickupPointById threw', id, err)
    return null
  }
}
