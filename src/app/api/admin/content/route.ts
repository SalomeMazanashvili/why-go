import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { getAdminSupabase, hasAdminSupabase } from '@/lib/supabase/admin'

interface Item {
  key: string
  value_en?: string | null
  value_ka?: string | null
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasAdminSupabase()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  try {
    const body = await req.json()
    const items: Item[] = Array.isArray(body?.items) ? body.items : []
    if (items.length === 0) return NextResponse.json({ error: 'No items' }, { status: 400 })
    const rows = items
      .filter((i) => typeof i.key === 'string' && i.key.length > 0)
      .map((i) => ({
        key: i.key,
        value_en: i.value_en ?? null,
        value_ka: i.value_ka ?? null,
        updated_at: new Date().toISOString(),
      }))
    const s = getAdminSupabase()
    const { error } = await s.from('site_content').upsert(rows, { onConflict: 'key' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, count: rows.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
