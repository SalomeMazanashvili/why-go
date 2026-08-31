import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/adminAuth'
import { getInquiryById } from '@/lib/inquiries'
import { getDestinationContact } from '@/lib/destinationContacts'
import { getDestinationById } from '@/lib/destinations'
import { getTransferRouteById } from '@/lib/transferRoutes'
import { contactTypeFor } from '@/lib/whatsapp'
import InquiryDetail from './InquiryDetail'
import type { TransferRoute } from '@/types'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

// Format a transfer_routes row as "From → To" using the KA label when
// available, EN fallback otherwise. Same convention as the form + WhatsApp
// block so a driver sees the same string everywhere.
function formatRouteLabel(route: TransferRoute | null): string | null {
  if (!route) return null
  const from = route.from_name_ka || route.from_name_en
  const to = route.to_name_ka || route.to_name_en
  return `${from} → ${to}`
}

export default async function InquiryDetailPage(props: Params) {
  await requireAdmin()
  const { id } = await props.params
  const inquiry = await getInquiryById(id)
  if (!inquiry) notFound()

  // Resolve the routing target for the WhatsApp block: driver for
  // transfer/day_trip, guide for guide/experience. Both may be null if the
  // admin hasn't set up destination_contacts yet — the client component
  // renders a helpful stub in that case.
  //
  // Resolve outbound + return route rows for transfer inquiries so the
  // detail view + WhatsApp message show real "From → To" labels instead of
  // opaque UUIDs. Server-side fetch keeps the route data off the client
  // bundle.
  const [contact, destination, outboundRoute, returnRoute] = await Promise.all([
    inquiry.destination_id
      ? getDestinationContact(inquiry.destination_id, contactTypeFor(inquiry.service_type))
      : Promise.resolve(null),
    inquiry.destination_id ? getDestinationById(inquiry.destination_id) : Promise.resolve(null),
    inquiry.route_id ? getTransferRouteById(inquiry.route_id) : Promise.resolve(null),
    inquiry.return_route_id ? getTransferRouteById(inquiry.return_route_id) : Promise.resolve(null),
  ])

  return (
    <div className="p-8 lg:p-12 max-w-5xl">
      <header className="mb-8">
        <Link href="/admin/inquiries" className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-[#FFCC00]">
          ← Inquiries
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">
          {inquiry.name}
        </h1>
        <p className="text-white/40 text-sm mt-2 font-mono">
          {inquiry.service_type.replace('_', ' ')} · {new Date(inquiry.created_at).toLocaleString()} · ref {inquiry.id.slice(0, 8)}
        </p>
      </header>
      <InquiryDetail
        inquiry={inquiry}
        contact={contact}
        destinationLabel={destination ? destination.name_ka || destination.name_en : null}
        outboundRouteLabel={formatRouteLabel(outboundRoute)}
        returnRouteLabel={formatRouteLabel(returnRoute)}
      />
    </div>
  )
}
