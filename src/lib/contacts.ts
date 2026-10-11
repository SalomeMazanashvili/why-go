import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'

export type ContactStatus = 'new' | 'replied' | 'archived'

export interface ContactSubmission {
  id: string
  full_name: string
  // WHY-121: required since 2026-10-11; older rows have none.
  phone: string | null
  email: string | null
  tour_slug: string | null
  message: string | null
  language: string
  status: ContactStatus
  created_at: string
}

const COLUMNS = 'id, full_name, phone, email, tour_slug, message, language, status, created_at'

export async function listContacts(status?: ContactStatus | 'all'): Promise<ContactSubmission[]> {
  if (!hasAdminSupabase()) return []
  try {
    const s = getAdminSupabase()
    let query = s.from('contact_submissions').select(COLUMNS).order('created_at', { ascending: false })
    if (status && status !== 'all') query = query.eq('status', status)
    const { data, error } = await query
    if (error || !data) return []
    return data as ContactSubmission[]
  } catch {
    return []
  }
}
