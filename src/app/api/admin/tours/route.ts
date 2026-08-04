import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { getAdminSupabase, hasAdminSupabase } from '@/lib/supabase/admin'

const WRITABLE = [
  'slug',
  'title_en', 'subtitle_en', 'description_en', 'tag_en',
  'title_ka', 'subtitle_ka', 'description_ka', 'tag_ka',
  'destination', 'price_from', 'currency', 'duration_days',
  'cover_image', 'is_featured', 'sort_order',
] as const

function pickPayload(body: any) {
  const out: Record<string, any> = {}
  for (const key of WRITABLE) {
    if (key in body) out[key] = body[key]
  }
  return out
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasAdminSupabase()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  try {
    const body = await req.json()
    const payload = pickPayload(body)
    if (!payload.slug || !payload.title_en || !payload.destination) {
      return NextResponse.json({ error: 'slug, title_en and destination are required' }, { status: 400 })
    }
    const s = getAdminSupabase()
    const { data, error } = await s.from('tours').insert(payload).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/', 'layout')
    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
