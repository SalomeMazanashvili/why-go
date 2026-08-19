import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'
import type { Inquiry, InquiryStatus, InquiryServiceType } from '@/types'

const INQUIRY_COLUMNS =
  'id, service_type, service_id, destination_id, travel_date, travel_time, passengers, luggage_pieces, pickup_from, pickup_to, interests, payment_method, payment_status, status, name, phone, email, notes, language, created_at'

function normalize(row: any): Inquiry {
  return {
    id: String(row.id),
    service_type: row.service_type,
    service_id: row.service_id ?? null,
    destination_id: row.destination_id ?? null,
    travel_date: row.travel_date ?? null,
    travel_time: row.travel_time ?? null,
    passengers: row.passengers ?? null,
    luggage_pieces: row.luggage_pieces ?? null,
    pickup_from: row.pickup_from ?? '',
    pickup_to: row.pickup_to ?? '',
    interests: Array.isArray(row.interests) ? row.interests : [],
    payment_method: row.payment_method ?? null,
    payment_status: row.payment_status ?? 'not_applicable',
    status: row.status ?? 'new',
    name: row.name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    notes: row.notes ?? '',
    language: row.language ?? 'ka',
    created_at: row.created_at ?? '',
  }
}

interface ListOpts {
  status?: InquiryStatus
  service_type?: InquiryServiceType
  destination_id?: string
}

export async function listInquiriesForAdmin(opts: ListOpts = {}): Promise<Inquiry[]> {
  if (!hasAdminSupabase()) {
    console.warn('[inquiries] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getAdminSupabase()
    let q = s.from('inquiries').select(INQUIRY_COLUMNS).order('created_at', { ascending: false })
    if (opts.status) q = q.eq('status', opts.status)
    if (opts.service_type) q = q.eq('service_type', opts.service_type)
    if (opts.destination_id) q = q.eq('destination_id', opts.destination_id)
    const { data, error } = await q
    if (error) {
      console.error('[inquiries] listInquiriesForAdmin query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[inquiries] listInquiriesForAdmin threw', err)
    return []
  }
}

export async function getInquiryById(id: string): Promise<Inquiry | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('inquiries')
      .select(INQUIRY_COLUMNS)
      .eq('id', id)
      .maybeSingle()
    if (error) {
      console.error('[inquiries] getInquiryById query failed', id, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[inquiries] getInquiryById threw', id, err)
    return null
  }
}

export async function countInquiriesByStatus(status: InquiryStatus): Promise<number> {
  if (!hasAdminSupabase()) return 0
  try {
    const s = getAdminSupabase()
    const { count, error } = await s
      .from('inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', status)
    if (error) {
      console.error('[inquiries] countInquiriesByStatus failed', status, error)
      return 0
    }
    return count ?? 0
  } catch (err) {
    console.error('[inquiries] countInquiriesByStatus threw', status, err)
    return 0
  }
}
