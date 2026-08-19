import type { Inquiry } from '@/types'

// Two emails on every submission:
//   1. Founder notification — utilitarian, English (both founders speak English
//      and skim these operationally). Contains every submitted field so a
//      founder can act on it without opening the admin.
//   2. Customer confirmation — first branded message the customer receives.
//      Structured as a section-per-TODO template: subject, greeting,
//      what-happens-next, contact, sign-off. Founders fill in sentences,
//      never designing the email from scratch after the fact. The
//      "24 saatis" promise line is the one verbatim string the ticket
//      approved and it ships without a TODO.

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function send(payload: {
  from: string
  to: string[]
  subject: string
  html: string
  replyTo?: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[inquiryEmail] RESEND_API_KEY not set — skipping dispatch')
    return true
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        reply_to: payload.replyTo,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[inquiryEmail] Resend responded', res.status, text)
      return false
    }
    return true
  } catch (err) {
    console.error('[inquiryEmail] send threw', err)
    return false
  }
}

function founderTemplate(i: Inquiry): string {
  const rows: Array<[string, string]> = [
    ['Type', i.service_type],
    ['Name', i.name],
    ['Phone', i.phone],
    ['Email', i.email || '—'],
    ['Destination ID', i.destination_id || '—'],
    ['Service ID', i.service_id || '—'],
    ['Date', i.travel_date || '—'],
    ['Time', i.travel_time || '—'],
    ['Passengers', i.passengers != null ? String(i.passengers) : '—'],
    ['Luggage', i.luggage_pieces != null ? String(i.luggage_pieces) : '—'],
    ['Pickup from', i.pickup_from || '—'],
    ['Pickup to', i.pickup_to || '—'],
    ['Interests', i.interests.length ? i.interests.join(', ') : '—'],
    ['Payment', i.payment_method ? `${i.payment_method} (${i.payment_status})` : '—'],
    ['Notes', i.notes || '—'],
    ['Language', i.language],
  ]
  const rowHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">${escapeHtml(
          k,
        )}</td><td style="padding:8px 12px;color:#fff;font-size:14px">${escapeHtml(v)}</td></tr>`,
    )
    .join('')
  return `
    <div style="background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:24px">
      <h1 style="color:#FFCC00;font-size:20px;margin:0 0 16px;letter-spacing:2px;text-transform:uppercase">New inquiry</h1>
      <table style="width:100%;border-collapse:collapse;background:#111;border-radius:6px;overflow:hidden">${rowHtml}</table>
      <p style="color:#666;font-size:11px;margin-top:16px">Open the admin panel at whygo.ge/admin/inquiries/${i.id} to update status.</p>
    </div>`
}

// Customer template — every TODO string is a section for the founders to
// fill in Georgian. Layout is fixed; only the marked strings should change.
function customerTemplate(i: Inquiry): string {
  return `
    <div style="background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:32px">
      <div style="max-width:520px;margin:0 auto">
        <p style="color:#FFCC00;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 24px">WHYGO</p>

        <!-- SECTION: Greeting -->
        <p style="color:#fff;font-size:16px;line-height:1.6;margin:0 0 20px">
          TODO: Georgian greeting sentence needed (e.g. "გამარჯობა, ${escapeHtml(i.name)}")
        </p>

        <!-- SECTION: Opening paragraph acknowledging the request -->
        <p style="color:#ccc;font-size:15px;line-height:1.7;margin:0 0 20px">
          TODO: Georgian opening paragraph needed — acknowledge that we received their request, mention the service type in words if useful.
        </p>

        <!-- SECTION: The 24-hour promise (founder-approved verbatim string, do NOT translate or edit) -->
        <div style="background:#111;border-left:3px solid #FFCC00;padding:16px 20px;margin:0 0 24px">
          <p style="color:#fff;font-size:15px;font-weight:bold;margin:0">
            პასუხს მოგცემთ 24 საათის განმავლობაში
          </p>
        </div>

        <!-- SECTION: What happens next (steps) -->
        <p style="color:#ccc;font-size:15px;line-height:1.7;margin:0 0 12px">
          TODO: Georgian "what happens next" intro sentence needed.
        </p>
        <ol style="color:#ccc;font-size:15px;line-height:1.7;margin:0 0 24px;padding-left:20px">
          <li style="margin-bottom:8px">TODO: Georgian step 1 needed (e.g. our team reviews availability)</li>
          <li style="margin-bottom:8px">TODO: Georgian step 2 needed (e.g. we confirm price and details)</li>
          <li style="margin-bottom:8px">TODO: Georgian step 3 needed (e.g. we contact you to finalise)</li>
        </ol>

        <!-- SECTION: Contact block -->
        <p style="color:#888;font-size:13px;line-height:1.6;margin:24px 0 0;border-top:1px solid #222;padding-top:20px">
          TODO: Georgian contact block needed (phone, WhatsApp, hours).
        </p>

        <!-- SECTION: Sign-off -->
        <p style="color:#666;font-size:12px;margin:16px 0 0">
          TODO: Georgian sign-off needed (e.g. Whygo team).
        </p>
      </div>
    </div>`
}

export async function dispatchInquiryEmails(inquiry: Inquiry): Promise<void> {
  const from = process.env.CONTACT_NOTIFICATION_FROM
  const founderList = (process.env.FOUNDER_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (!from) {
    console.warn('[inquiryEmail] CONTACT_NOTIFICATION_FROM not set — skipping dispatch')
    return
  }

  const jobs: Array<Promise<boolean>> = []

  if (founderList.length > 0) {
    jobs.push(
      send({
        from,
        to: founderList,
        subject: `New inquiry: ${inquiry.service_type} — ${inquiry.name}`,
        html: founderTemplate(inquiry),
        replyTo: inquiry.email || undefined,
      }),
    )
  } else {
    console.warn('[inquiryEmail] FOUNDER_EMAILS empty — no founder notification sent')
  }

  if (inquiry.email) {
    jobs.push(
      send({
        from,
        to: [inquiry.email],
        subject: 'TODO: Georgian subject line needed',
        html: customerTemplate(inquiry),
      }),
    )
  }

  await Promise.all(jobs)
}
