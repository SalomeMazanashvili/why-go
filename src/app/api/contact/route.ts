import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase, hasAdminSupabase } from '@/lib/supabase/admin'
import { contactSchema } from '@/lib/inquiryValidation'
import { checkRateLimit, clientIpFrom } from '@/lib/rateLimit'

// /contact form submissions (WHY-121). Same order as /api/inquiries:
// rate limit, validate, insert. Only whitelisted fields reach the row, and a
// failed insert is an error, never a silent "success".
export async function POST(req: NextRequest) {
  const ip = clientIpFrom(req.headers)
  const rate = await checkRateLimit(`contact:${ip}`, 5, 60_000)
  if (!rate.allowed) return NextResponse.json({ error: 'error_rate_limited' }, { status: 429 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? 'form')
      fieldErrors[field] ??= issue.message
    }
    return NextResponse.json({ error: 'Invalid submission', fieldErrors }, { status: 400 })
  }

  if (!hasAdminSupabase()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const d = parsed.data
  const { error } = await getAdminSupabase().from('contact_submissions').insert({
    full_name: d.full_name,
    phone: d.phone,
    email: d.email || null,
    message: d.message,
    language: d.language ?? 'ka',
    ip_address: ip === 'unknown' ? null : ip,
  })
  if (error) {
    console.error('[contact] insert failed', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
  return NextResponse.json({ success: true }, { status: 201 })
}
