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
  // Pre-resolved for transfer inquiries. Server component looks up the
  // PickupPoint via inquiry.pickup_point_id / return_pickup_point_id and
  // passes the formatted label ("Barcelona · El Prat T1"). Null when the
  // customer picked "Other" and typed a free-text address instead.
  outboundPickupLabel?: string | null
  returnPickupLabel?: string | null
}

// Pre-formatted message body for manual paste into WhatsApp. Contains every
// piece of info the driver/guide needs to accept or decline the booking.
// English, since drivers and guides in-country typically operate in local
// language + English; the customer's language is captured in the row for
// admin context.
//
// Transfer semantics:
//   Outbound "From" = pickup point (or free-text pickup_from when Other)
//   Outbound "To"   = free-text destination (always pickup_to, hotel + address)
//   Return "From"   = free-text (always return_pickup_from, hotel + address)
//   Return "To"     = pickup point (or free-text return_pickup_to when Other)
export function buildWhatsAppMessage({
  inquiry,
  contact,
  destinationLabel,
  outboundPickupLabel,
  returnPickupLabel,
}: BuildOpts): string {
  const lines: string[] = []
  lines.push(`New booking request — ${inquiry.service_type.replace('_', ' ')}`)
  if (destinationLabel) lines.push(`Destination: ${destinationLabel}`)
  if (contact) lines.push(`Assigned: ${contact.name} (${contact.contact_type})`)
  lines.push('')
  lines.push(`Customer: ${inquiry.name}`)
  lines.push(`Phone: ${inquiry.phone}`)
  if (inquiry.email) lines.push(`Email: ${inquiry.email}`)
  lines.push('')

  // Outbound leg
  if (inquiry.service_type === 'transfer') {
    const from = outboundPickupLabel || inquiry.pickup_from
    if (from) lines.push(`Pickup: ${from}`)
    if (inquiry.pickup_to) lines.push(`Dropoff: ${inquiry.pickup_to}`)
  } else {
    if (inquiry.pickup_from) lines.push(`From: ${inquiry.pickup_from}`)
    if (inquiry.pickup_to) lines.push(`To: ${inquiry.pickup_to}`)
  }
  if (inquiry.travel_date) lines.push(`Date: ${inquiry.travel_date}`)
  if (inquiry.travel_date_end) lines.push(`Until: ${inquiry.travel_date_end}`)
  if (inquiry.travel_time) lines.push(`Time: ${inquiry.travel_time}`)
  if (inquiry.flight_number) lines.push(`Flight: ${inquiry.flight_number}`)
  if (inquiry.passengers != null) lines.push(`Passengers: ${inquiry.passengers}`)
  if (inquiry.luggage_pieces != null && inquiry.luggage_pieces > 0)
    lines.push(`Luggage: ${inquiry.luggage_pieces}`)
  if (inquiry.interests.length) lines.push(`Interests: ${inquiry.interests.join(', ')}`)
  if (inquiry.payment_method) lines.push(`Payment: ${inquiry.payment_method}`)

  // Return leg — one section, same driver assumption. Only for transfers
  // and only when the customer opened the return toggle (any return field
  // is populated).
  const hasReturn =
    inquiry.service_type === 'transfer' &&
    (inquiry.return_pickup_point_id ||
      inquiry.return_date ||
      inquiry.return_pickup_from ||
      inquiry.return_pickup_to)
  if (hasReturn) {
    lines.push('')
    lines.push('Return journey:')
    if (inquiry.return_pickup_from) lines.push(`  Pickup: ${inquiry.return_pickup_from}`)
    const returnTo = returnPickupLabel || inquiry.return_pickup_to
    if (returnTo) lines.push(`  Dropoff: ${returnTo}`)
    if (inquiry.return_date) lines.push(`  Date: ${inquiry.return_date}`)
    if (inquiry.return_time) lines.push(`  Time: ${inquiry.return_time}`)
  }

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
