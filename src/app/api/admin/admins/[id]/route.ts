import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated, hashPassword, currentAdminId } from '@/lib/adminAuth'
import { getAdminSupabase, hasAdminSupabase } from '@/lib/supabase/admin'

interface Ctx { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasAdminSupabase()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  try {
    const body = await req.json()
    const payload: Record<string, any> = {}
    if (typeof body?.is_active === 'boolean') payload.is_active = body.is_active
    if (typeof body?.password === 'string') {
      if (body.password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }
      payload.password_hash = hashPassword(body.password)
    }
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }
    const s = getAdminSupabase()
    const { error } = await s.from('admins').update(payload).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasAdminSupabase()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  if (currentAdminId() === params.id) {
    return NextResponse.json({ error: 'Cannot delete the account you are signed in with' }, { status: 400 })
  }
  try {
    const s = getAdminSupabase()
    const { error } = await s.from('admins').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
