import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'
import type { DestinationContact, DestinationContactType } from '@/types'

const CONTACT_COLUMNS =
  'id, destination_id, contact_type, name, phone_e164, whatsapp_e164, notes'

function normalize(row: any): DestinationContact {
  return {
    id: String(row.id),
    destination_id: String(row.destination_id),
    contact_type: row.contact_type,
    name: row.name ?? '',
    phone_e164: row.phone_e164 ?? '',
    whatsapp_e164: row.whatsapp_e164 ?? '',
    notes: row.notes ?? '',
  }
}

export async function listDestinationContactsForAdmin(): Promise<DestinationContact[]> {
  if (!hasAdminSupabase()) {
    console.warn('[destination_contacts] Supabase not configured — returning empty list')
    return []
  }
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('destination_contacts')
      .select(CONTACT_COLUMNS)
      .order('created_at', { ascending: true })
    if (error) {
      console.error('[destination_contacts] listDestinationContactsForAdmin query failed', error)
      return []
    }
    return (data ?? []).map(normalize)
  } catch (err) {
    console.error('[destination_contacts] listDestinationContactsForAdmin threw', err)
    return []
  }
}

export async function getDestinationContactById(id: string): Promise<DestinationContact | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('destination_contacts')
      .select(CONTACT_COLUMNS)
      .eq('id', id)
      .maybeSingle()
    if (error) {
      console.error('[destination_contacts] getDestinationContactById query failed', id, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[destination_contacts] getDestinationContactById threw', id, err)
    return null
  }
}

// Fetch the contact for a destination that matches the given type. Used by
// the WhatsApp copy block in PR C to route inquiries to the correct driver
// (for transfers/day_trips) or guide (for guides/experiences).
export async function getDestinationContact(
  destinationId: string,
  contactType: DestinationContactType,
): Promise<DestinationContact | null> {
  if (!hasAdminSupabase()) return null
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('destination_contacts')
      .select(CONTACT_COLUMNS)
      .eq('destination_id', destinationId)
      .eq('contact_type', contactType)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error('[destination_contacts] getDestinationContact query failed', destinationId, contactType, error)
      return null
    }
    return data ? normalize(data) : null
  } catch (err) {
    console.error('[destination_contacts] getDestinationContact threw', destinationId, contactType, err)
    return null
  }
}
