import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated, hashPassword } from '@/lib/adminAuth'
import { getAdminSupabase, hasAdminSupabase } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasAdminSupabase()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  try {
    const body = await req.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('admins')
      .insert({ email, password_hash: hashPassword(password) })
      .select('id')
      .single()
    if (error) {
      const dup = error.code === '23505' || /duplicate/i.test(error.message)
      return NextResponse.json(
        { error: dup ? 'An admin with that email already exists' : error.message },
        { status: dup ? 409 : 500 },
      )
    }
    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
