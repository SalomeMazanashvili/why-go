import { NextRequest, NextResponse } from 'next/server'
import {
  verifyPassword,
  createSessionCookieValue,
  ADMIN_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Missing password' }, { status: 400 })
    }
    if (!verifyPassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
    const res = NextResponse.json({ success: true })
    res.cookies.set(ADMIN_COOKIE, createSessionCookieValue(), SESSION_COOKIE_OPTIONS)
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
