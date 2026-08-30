import type { Inquiry } from '@/types'

// Two emails on every submission:
//   1. Founder notification — utilitarian, English (both founders speak English
//      and skim these operationally). Contains every submitted field so a
//      founder can act on it without opening the admin.
//   2. Customer confirmation — first branded message the customer receives.
//      Sectioned layout (subject, greeting, opening, what-happens-next steps,
//      contact block, sign-off) with founder-written Georgian in each slot.
//      Uses თქვენ form throughout per CLAUDE.md rule 3.

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

// Customer template — sections were TODOs during scaffold, filled by the
// founders once Georgian copy was written. Layout is fixed; edit the strings
// (not the markup) if wording changes. Uses თქვენ form throughout per
// CLAUDE.md rule 3.
function customerTemplate(i: Inquiry): string {
  return `
    <div style="background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:32px">
      <div style="max-width:520px;margin:0 auto">
        <p style="color:#FFCC00;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 24px">WHYGO</p>

        <!-- SECTION: Greeting -->
        <p style="color:#fff;font-size:16px;line-height:1.6;margin:0 0 20px">
          გამარჯობა, ${escapeHtml(i.name)}
        </p>

        <!-- SECTION: Opening paragraph acknowledging the request -->
        <p style="color:#ccc;font-size:15px;line-height:1.7;margin:0 0 20px">
          მადლობა! მოთხოვნა მივიღეთ და საკითხზე უკვე ვმუშაობთ.
        </p>

        <!-- SECTION: The 24-hour promise (founder-approved verbatim string, do NOT translate or edit) -->
        <div style="background:#111;border-left:3px solid #FFCC00;padding:16px 20px;margin:0 0 24px">
          <p style="color:#fff;font-size:15px;font-weight:bold;margin:0">
            დაგიკავშირდებით 24 საათის განმავლობაში
          </p>
        </div>

        <!-- SECTION: What happens next (steps) -->
        <p style="color:#ccc;font-size:15px;line-height:1.7;margin:0 0 12px">
          შემდეგი ეტაპები:
        </p>
        <ol style="color:#ccc;font-size:15px;line-height:1.7;margin:0 0 24px;padding-left:20px">
          <li style="margin-bottom:8px">ვამოწმებთ, არის თუ არა ხელმისაწვდომი ჩვენი მძღოლი/გიდი.</li>
          <li style="margin-bottom:8px">ფასს და დამატებით დეტალებს შეგითანხმებთ.</li>
          <li style="margin-bottom:8px">გამოგიგზავნით ყველა საჭირო ინფორმაციას — ვინ დაგხვდებათ, სად და როდის.</li>
        </ol>

        <!-- SECTION: Contact block -->
        <p style="color:#888;font-size:13px;line-height:1.6;margin:24px 0 0;border-top:1px solid #222;padding-top:20px">
          თუ საკითხი გადაუდებელია, მოგვწერეთ WhatsApp-ზე ან დაგვირეკეთ ნომერზე +995 598 988 711.
        </p>

        <!-- SECTION: Sign-off -->
        <p style="color:#666;font-size:12px;margin:16px 0 0">
          სალომე &amp; ბაკური, WHyGo
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
        subject: 'მოთხოვნა მიღებულია - WhyGo',
        html: customerTemplate(inquiry),
      }),
    )
  }

  await Promise.all(jobs)
}
