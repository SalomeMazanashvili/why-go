import { hasDetailPage, listServicesForAdmin } from '@/lib/services'
import { listTransferRoutesForAdmin } from '@/lib/transferRoutes'
import type { RelatedRef } from '@/lib/serviceLinks'
import type { Destination, ServiceType } from '@/types'

// WHY-118: everything the article editor can pick as a related service,
// flattened for the client form. Drafts and types without a page are
// listed too (so an article can be prepared ahead), marked not live: they
// don't count towards the 2 a published article needs, and the page
// skips them.
export interface RelatedOption {
  id: string
  ref: RelatedRef
  group: string
  label: string
  destinationIds: string[]
  live: boolean
  note: string | null
}

const GROUP: Record<ServiceType, string> = {
  day_trip: 'Day trips',
  guide: 'Guides',
  experience: 'Experiences',
}

export async function listRelatedOptions(destinations: Destination[]): Promise<RelatedOption[]> {
  const [services, routes] = await Promise.all([listServicesForAdmin(), listTransferRoutesForAdmin()])
  const city = new Map(destinations.map((d) => [d.id, d.name_en || d.name_ka]))
  const routeOptions: RelatedOption[] = routes.map((r) => ({
    id: r.id,
    ref: { transfer_route_id: r.id },
    group: 'Transfer routes',
    label: `${r.from_name_en || r.from_name_ka} → ${r.to_name_en || r.to_name_ka}`,
    destinationIds: [r.from_destination_id, r.to_destination_id].filter((x): x is string => !!x),
    live: r.is_published,
    note: r.is_published ? null : 'draft',
  }))
  const serviceOptions: RelatedOption[] = services.map((s) => {
    const page = hasDetailPage(s.service_type)
    const where = s.destination_id ? city.get(s.destination_id) : null
    return {
      id: s.id,
      ref: { service_id: s.id },
      group: GROUP[s.service_type],
      label: `${s.name_en || s.name_ka}${where ? ` (${where})` : ''}`,
      destinationIds: s.destination_id ? [s.destination_id] : [],
      live: s.is_published && page,
      note: !s.is_published ? 'draft' : page ? null : 'no page yet',
    }
  })
  return [...routeOptions, ...serviceOptions]
}
