import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { getAdminSupabase, hasAdminSupabase } from '@/lib/supabase/admin'
import { countServicesByCategory } from '@/lib/services'

const WRITABLE = [
  'slug',
  'name_en', 'name_ka',
  'description_en', 'description_ka',
  'icon',
  'is_published',
  'sort_order',
] as const

function pickPayload(body: any) {
  const out: Record<string, any> = {}
  for (const key of WRITABLE) {
    if (key in body) out[key] = body[key]
  }
  out.updated_at = new Date().toISOString()
  return out
}

interface Ctx { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, props: Ctx) {
  const params = await props.params
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasAdminSupabase()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  try {
    const body = await req.json()
    const payload = pickPayload(body)
    const s = getAdminSupabase()
    const { error } = await s.from('service_categories').update(payload).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/', 'layout')
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, props: Ctx) {
  const params = await props.params
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasAdminSupabase()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  try {
    // Preflight: service_categories FK into services with ON DELETE RESTRICT.
    const serviceCount = await countServicesByCategory(params.id)
    if (serviceCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: referenced by ${serviceCount} service${serviceCount === 1 ? '' : 's'}. Reassign them to another category first.` },
        { status: 409 },
      )
    }
    const s = getAdminSupabase()
    const { error } = await s.from('service_categories').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/', 'layout')
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
