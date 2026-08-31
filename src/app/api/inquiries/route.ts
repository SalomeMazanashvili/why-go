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
    pickup_point_id: 'pickup_point_id' in d && d.pickup_point_id ? d.pickup_point_id : null,
    travel_date: 'travel_date' in d && d.travel_date ? d.travel_date : null,
    travel_time: 'travel_time' in d && d.travel_time ? d.travel_time : null,
    travel_date_end: 'travel_date_end' in d && d.travel_date_end ? d.travel_date_end : null,
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
    // WHY-68 transfer additions. All null on non-transfer submissions and
    // one-way transfers. Present schema fires only when the customer opens
    // the return-journey toggle on the transfer form.
    flight_number: 'flight_number' in d && d.flight_number ? d.flight_number : null,
    return_pickup_point_id:
      'return_pickup_point_id' in d && d.return_pickup_point_id ? d.return_pickup_point_id : null,
    return_date: 'return_date' in d && d.return_date ? d.return_date : null,
    return_time: 'return_time' in d && d.return_time ? d.return_time : null,
    return_pickup_from:
      'return_pickup_from' in d && d.return_pickup_from ? d.return_pickup_from : null,
    return_pickup_to:
      'return_pickup_to' in d && d.return_pickup_to ? d.return_pickup_to : null,
  }

  const { data, error } = await s.from('inquiries').insert(insertRow).select('*').single()
  if (error) {
    console.error('[api/inquiries] insert failed', error)
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  // Await email dispatch. Earlier fire-and-forget pattern was unreliable on
  // Vercel serverless: the function terminates when the response is returned,
  // and unresolved promises (including the outbound fetch to Resend) get
  // cancelled mid-flight. Vercel's External APIs panel showed the fetch was
  // initiated, but Resend never received the request. Awaiting adds ~500-
  // 1500ms to the form response but guarantees delivery. Wrapped in try/catch
  // so a Resend outage still returns 201 — the row is persisted regardless.
  const inquiry = data as Inquiry
  try {
    await dispatchInquiryEmails(inquiry)
  } catch (err) {
    console.error('[api/inquiries] email dispatch threw', err)
  }

  return NextResponse.json({ success: true, id: inquiry.id }, { status: 201 })
}
