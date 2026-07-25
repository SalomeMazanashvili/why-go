import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { getAdminSupabase, hasAdminSupabase } from '@/lib/supabase/admin'

const WRITABLE = [
  'slug',
  'title_en', 'excerpt_en', 'content_en', 'tag_en',
  'title_ka', 'excerpt_ka', 'content_ka', 'tag_ka',
  'cover_image', 'author', 'reading_time_min',
  'is_featured', 'is_published', 'published_at',
] as const

function pickPayload(body: any) {
  const out: Record<string, any> = {}
  for (const key of WRITABLE) {
    if (key in body) out[key] = body[key]
  }
  return out
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasAdminSupabase()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  try {
    const body = await req.json()
    const payload = pickPayload(body)
    if (!payload.slug || !payload.title_en) {
      return NextResponse.json({ error: 'slug and title_en are required' }, { status: 400 })
    }
    const s = getAdminSupabase()
    const { data, error } = await s.from('news').insert(payload).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
