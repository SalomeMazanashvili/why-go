import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface LeadData {
  first_name: string
  last_name: string
  email: string
  phone: string
  travelers: string
  period: string
  message: string
}

async function sendNotificationEmail(data: LeadData) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_NOTIFICATION_FROM

  if (!apiKey || !from) {
    console.warn('[whisky-tour-lead] email not configured, skipping notification')
    return
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0a0a0a;padding:24px 32px;border-bottom:3px solid #f0c419;">
        <h1 style="color:#f0c419;font-size:22px;margin:0;letter-spacing:0.1em;">NEW RESERVATION REQUEST</h1>
        <p style="color:#888;margin:6px 0 0;font-size:13px;">Edinburgh Whisky Tour — WHYGO × David Velijanashvili</p>
      </div>
      <div style="padding:32px;background:#ffffff;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:12px 0;color:#888;width:140px;font-weight:600;">Name</td>
            <td style="padding:12px 0;">${escapeHtml(data.first_name)} ${escapeHtml(data.last_name)}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:12px 0;color:#888;font-weight:600;">Email</td>
            <td style="padding:12px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#5e17eb;">${escapeHtml(data.email)}</a></td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:12px 0;color:#888;font-weight:600;">Phone / WhatsApp</td>
            <td style="padding:12px 0;">${escapeHtml(data.phone)}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:12px 0;color:#888;font-weight:600;">Travellers</td>
            <td style="padding:12px 0;">${escapeHtml(data.travelers)}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:12px 0;color:#888;font-weight:600;">Preferred Period</td>
            <td style="padding:12px 0;">${escapeHtml(data.period)}</td>
          </tr>
          ${data.message ? `
          <tr>
            <td style="padding:12px 0;color:#888;font-weight:600;vertical-align:top;">Message</td>
            <td style="padding:12px 0;white-space:pre-wrap;">${escapeHtml(data.message)}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      <div style="background:#f5f5f5;padding:16px 32px;font-size:12px;color:#888;">
        Submitted via whygo.ge/whisky-tour · Reply directly to this email to respond to the enquiry
      </div>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: 'info@whygo.ge',
      reply_to: data.email,
      subject: `New whisky tour reservation — ${data.first_name} ${data.last_name} (${data.travelers} traveller${data.travelers === '1' ? '' : 's'}, ${data.period})`,
      html,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('[whisky-tour-lead] resend failed', res.status, detail)
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const body = await req.json()

    const { first_name, last_name, email, phone, travelers, period, message } = body

    if (!first_name || !last_name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const { error } = await supabase.from('whisky_tour_leads').insert([
      {
        first_name: String(first_name).trim(),
        last_name: String(last_name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: String(phone).trim(),
        travelers: String(travelers ?? '2'),
        period: String(period ?? 'Flexible'),
        message: message ? String(message).trim() : null,
        tour: 'Edinburgh Whisky Tour',
        source: 'landing-page',
      },
    ])

    if (error) {
      console.error('[whisky-tour-lead] supabase insert error', error)
      throw error
    }

    sendNotificationEmail({
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      travelers: String(travelers ?? '2'),
      period: String(period ?? 'Flexible'),
      message: message ? String(message).trim() : '',
    }).catch((err) => console.error('[whisky-tour-lead] notification error', err))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[whisky-tour-lead]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
