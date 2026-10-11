import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { ServiceLink } from '@/lib/serviceLinks'
import { getServiceName, getServiceShortDescription, type Locale, type TransferRoute } from '@/types'

// WHY-118: a short list of services (transfer routes and day trips / guides
// / experiences together), used on the article page for the editor's picks
// and for the §9 "also in this destination" block. Every item already has a
// live href (see resolveRefs / alsoInDestination).
export default async function ServiceLinkList({
  links,
  loc,
}: {
  links: ServiceLink[]
  loc: Locale
}) {
  const [tNav, tDayTrips, tTransfers] = await Promise.all([
    getTranslations({ locale: loc, namespace: 'nav' }),
    getTranslations({ locale: loc, namespace: 'day_trips_page' }),
    getTranslations({ locale: loc, namespace: 'transfers_page' }),
  ])
  const typeLabel = {
    transfer_route: tTransfers('nav_label'),
    day_trip: tDayTrips('nav_label'),
    guide: tNav('guides'),
    experience: tNav('experiences'),
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {links.map((l) => {
        const isRoute = l.kind === 'transfer_route'
        const name = isRoute ? routeLabel(l.route, loc) : getServiceName(l.service, loc)
        const short = isRoute ? null : getServiceShortDescription(l.service, loc)
        const priced = isRoute ? l.route : l.service
        return (
          <li key={l.id}>
            <Link
              href={l.href}
              className="group flex flex-col h-full min-h-[44px] p-5 bg-raised border border-line hover:border-fg transition-colors"
            >
              <span className="text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
                {isRoute ? typeLabel.transfer_route : typeLabel[l.service.service_type]}
              </span>
              <span className="text-lg font-bold text-fg group-hover:underline decoration-brand-yellow decoration-2 underline-offset-4">
                {name}
              </span>
              {short && <span className="text-sm text-muted mt-2 leading-relaxed">{short}</span>}
              {priced.price_from != null && (
                <span className="mt-4 self-start text-xs inline-block bg-brand-yellow text-ink font-bold px-1.5">
                  {tDayTrips('card_price_from', { price: `${priced.currency} ${priced.price_from}` })}
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function routeLabel(r: TransferRoute, loc: Locale) {
  const from = loc === 'ka' ? (r.from_name_ka || r.from_name_en) : (r.from_name_en || r.from_name_ka)
  const to = loc === 'ka' ? (r.to_name_ka || r.to_name_en) : (r.to_name_en || r.to_name_ka)
  return `${from} → ${to}`
}
