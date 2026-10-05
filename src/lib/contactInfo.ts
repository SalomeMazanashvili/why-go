// Client-safe: imported by the admin Branding editor, the settings API and
// the public /contact page (WHY-111).

// Direct contact details, set in Admin → Branding → Contact. Nothing is
// rendered for a field until it is filled in.
export const CONTACT_FIELDS = [
  { key: 'contact_phone', name: 'Phone', kind: 'phone' },
  { key: 'contact_whatsapp', name: 'WhatsApp', kind: 'phone' },
  { key: 'contact_hours', name: 'Opening hours', kind: 'text' },
] as const

export type ContactKey = (typeof CONTACT_FIELDS)[number]['key']

// Accepts what people type ("+995 598 98 87 11", "+995-598-988-711") and
// returns E.164 ("+995598988711"), or null if it isn't a full international
// number. A leading + and country code are required: a local "598…" number
// would dial wrong from abroad, which is exactly where our customers are.
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('+')) return null
  const digits = trimmed.slice(1).replace(/[\s\-().]/g, '')
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null
}

// Display form. Georgian mobiles (+995 5XX XXX XXX) get the local grouping
// "+995 598 98 87 11"; anything else shows as "+<country> <rest>".
export function formatPhone(e164: string): string {
  const d = e164.slice(1)
  const ge = d.match(/^995(\d{3})(\d{2})(\d{2})(\d{2})$/)
  if (ge) return `+995 ${ge[1]} ${ge[2]} ${ge[3]} ${ge[4]}`
  return e164
}

export interface ContactInfo {
  phone: { display: string; href: string; e164: string } | null
  whatsapp: { display: string; href: string } | null
  hours: string | null
}

export function contactInfoFrom(settings: Record<string, string>): ContactInfo {
  const phone = normalizePhone(settings.contact_phone ?? '')
  const whatsapp = normalizePhone(settings.contact_whatsapp ?? '')
  const hours = settings.contact_hours?.trim() || null
  return {
    phone: phone ? { display: formatPhone(phone), href: `tel:${phone}`, e164: phone } : null,
    whatsapp: whatsapp
      ? { display: formatPhone(whatsapp), href: `https://wa.me/${whatsapp.slice(1)}` }
      : null,
    hours,
  }
}
