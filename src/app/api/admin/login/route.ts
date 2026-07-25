import { NextRequest, NextResponse } from 'next/server'
import {
  authenticate,
  createSessionCookieValue,
  ADMIN_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = typeof body?.email === 'string' ? body.email : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!password) {
      return NextResponse.json({ error: 'Missing password' }, { status: 400 })
    }
    const result = await authenticate(email, password)
    if (!result.ok || !result.adminId) {
      return NextResponse.json({ error: result.error || 'Invalid credentials' }, { status: 401 })
    }
    const res = NextResponse.json({ success: true, email: result.email })
    res.cookies.set(ADMIN_COOKIE, createSessionCookieValue(result.adminId), SESSION_COOKIE_OPTIONS)
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
