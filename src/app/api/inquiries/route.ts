import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase, hasAdminSupabase } from '@/lib/supabase/admin'
import { validateInquiryPayload } from '@/lib/inquiryValidation'
import { verifyTurnstile } from '@/lib/turnstile'
import { checkRateLimit, clientIpFrom } from '@/lib/rateLimit'
import { dispatchInquiryEmails } from '@/lib/inquiryEmail'
import type { Inquiry } from '@/types'

// Public inquiry submission endpoint. Order of checks matters:
//   1. Rate limit — cheapest gate, kills obvious burst spam before we do any
//      other work.
//   2. Turnstile verify — proves the caller isn't a bot; skipped in envs
//      where TURNSTILE_SECRET_KEY isn't set so dev/preview aren't blocked.
//   3. Zod validation — schema is strict enough that a valid payload is
//      safe to insert as-is.
//   4. Supabase insert.
//   5. Email dispatch (fire-and-forget; failures don't block the 201).
export async function POST(req: NextRequest) {
  const ip = clientIpFrom(req.headers)

  // 5 submissions per minute per IP is generous for a real person on a
  // shared network, tight enough to stop a script from filling the inbox.
  const rate = await checkRateLimit(`inquiries:${ip}`, 5, 60_000)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const token = typeof body === 'object' && body !== null ? (body as { turnstile_token?: string }).turnstile_token : null
  const turnstileOk = await verifyTurnstile(token ?? null, ip)
  if (!turnstileOk) {
    return NextResponse.json({ error: 'Turnstile verification failed' }, { status: 403 })
  }

  const validation = validateInquiryPayload(body)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  if (!hasAdminSupabase()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const s = getAdminSupabase()
  const d = validation.data

  const insertRow = {
    service_type: d.service_type,
    service_id: d.service_id || null,
    destination_id: d.destination_id || null,
    travel_date: 'travel_date' in d && d.travel_date ? d.travel_date : null,
    travel_time: 'travel_time' in d && d.travel_time ? d.travel_time : null,
    passengers: 'passengers' in d && d.passengers != null ? d.passengers : null,
    luggage_pieces:
      'luggage_pieces' in d && d.luggage_pieces != null ? d.luggage_pieces : null,
    pickup_from: 'pickup_from' in d ? d.pickup_from : null,
    pickup_to: 'pickup_to' in d ? d.pickup_to : null,
    interests: 'interests' in d && d.interests ? d.interests : [],
    payment_method: 'payment_method' in d ? d.payment_method : null,
    payment_status:
      'payment_method' in d && d.payment_method === 'iban' ? 'awaiting' : 'not_applicable',
    status: 'new',
    name: d.name,
    phone: d.phone,
    email: d.email || null,
    notes: d.notes || null,
    language: req.headers.get('accept-language')?.startsWith('ka') ? 'ka' : 'en',
  }

  const { data, error } = await s.from('inquiries').insert(insertRow).select('*').single()
  if (error) {
    console.error('[api/inquiries] insert failed', error)
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  // Fire-and-forget email dispatch — a slow SMTP or missing config must not
  // block the customer response. Errors are logged inside dispatchInquiryEmails.
  const inquiry = data as Inquiry
  dispatchInquiryEmails(inquiry).catch((err) =>
    console.error('[api/inquiries] email dispatch threw', err),
  )

  return NextResponse.json({ success: true, id: inquiry.id }, { status: 201 })
}
