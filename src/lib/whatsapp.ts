import type { Inquiry, DestinationContact, DestinationContactType } from '@/types'

// Map the inquiry's service_type to the kind of contact we should forward to.
// Transfers and day trips go to drivers; guides and experiences go to guides.
export function contactTypeFor(serviceType: Inquiry['service_type']): DestinationContactType {
  return serviceType === 'transfer' || serviceType === 'day_trip' ? 'driver' : 'guide'
}

interface BuildOpts {
  inquiry: Inquiry
  contact: DestinationContact | null
  destinationLabel?: string | null
}

// Pre-formatted message body for manual paste into WhatsApp. Contains every
// piece of info the driver/guide needs to accept or decline the booking.
// English, since drivers and guides in-country typically operate in local
// language + English; the customer's language is captured in the row for
// admin context.
export function buildWhatsAppMessage({ inquiry, contact, destinationLabel }: BuildOpts): string {
  const lines: string[] = []
  lines.push(`New booking request — ${inquiry.service_type.replace('_', ' ')}`)
  if (destinationLabel) lines.push(`Destination: ${destinationLabel}`)
  if (contact) lines.push(`Assigned: ${contact.name} (${contact.contact_type})`)
  lines.push('')
  lines.push(`Customer: ${inquiry.name}`)
  lines.push(`Phone: ${inquiry.phone}`)
  if (inquiry.email) lines.push(`Email: ${inquiry.email}`)
  lines.push('')

  if (inquiry.travel_date) lines.push(`Date: ${inquiry.travel_date}`)
  if (inquiry.travel_date_end) lines.push(`Until: ${inquiry.travel_date_end}`)
  if (inquiry.travel_time) lines.push(`Time: ${inquiry.travel_time}`)
  if (inquiry.pickup_from) lines.push(`From: ${inquiry.pickup_from}`)
  if (inquiry.pickup_to) lines.push(`To: ${inquiry.pickup_to}`)
  if (inquiry.passengers != null) lines.push(`Passengers: ${inquiry.passengers}`)
  if (inquiry.luggage_pieces != null && inquiry.luggage_pieces > 0)
    lines.push(`Luggage: ${inquiry.luggage_pieces}`)
  if (inquiry.interests.length) lines.push(`Interests: ${inquiry.interests.join(', ')}`)
  if (inquiry.payment_method) lines.push(`Payment: ${inquiry.payment_method}`)
  if (inquiry.notes) {
    lines.push('')
    lines.push(`Notes: ${inquiry.notes}`)
  }
  lines.push('')
  lines.push(`Ref: ${inquiry.id.slice(0, 8)}`)
  return lines.join('\n')
}

// Build a wa.me link with the message pre-populated. Prefer the contact's
// whatsapp_e164 if present; fall back to phone_e164. Returns null when the
// contact has no reachable number.
export function waLink(contact: DestinationContact | null, message: string): string | null {
  if (!contact) return null
  const raw = contact.whatsapp_e164 || contact.phone_e164
  if (!raw) return null
  const digits = raw.replace(/[^0-9]/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
