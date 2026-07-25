import { hasAdminSupabase, getAdminSupabase } from '@/lib/supabase/admin'

export interface AdminUser {
  id: string
  email: string
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

const COLUMNS = 'id, email, is_active, created_at, last_login_at'

export async function listAdmins(): Promise<AdminUser[]> {
  if (!hasAdminSupabase()) return []
  try {
    const s = getAdminSupabase()
    const { data, error } = await s.from('admins').select(COLUMNS).order('created_at', { ascending: true })
    if (error || !data) return []
    return data as AdminUser[]
  } catch {
    return []
  }
}
