import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import {
  getTransferRouteBySlug,
  listTransferRoutes,
} from '@/lib/transferRoutes'
import { getDestinationById } from '@/lib/destinations'
import { listPickupPoints } from '@/lib/pickupPoints'
import {
  breadcrumbJsonLd,
  canonicalFor,
  jsonLdScript,
  serviceJsonLd,
} from '@/lib/seo'
import type { Locale, TransferRoute } from '@/types'

export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

function routeLabel(r: TransferRoute, loc: Locale) {
  const from = loc === 'ka' ? (r.from_name_ka || r.from_name_en) : (r.from_name_en || r.from_name_ka)
  const to = loc === 'ka' ? (r.to_name_ka || r.to_name_en) : (r.to_name_en || r.to_name_ka)
  return { from, to, combined: `${from} → ${to}` }
}

export async function generateMetadata(
  props: { params: Promise<{ locale: string; slug: string }> },
): Promise<Metadata> {
  const { locale, slug } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const route = await getTransferRouteBySlug(slug)
  if (!route) return { title: 'Not found' }

  const label = routeLabel(route, loc as Locale).combined
  const canonical = canonicalFor(loc, `/transfers/${slug}`)
  const title = route.seo_title_ka && loc === 'ka' ? route.seo_title_ka : label
  const description =
    (loc === 'ka' && route.seo_description_ka) ||
    (loc === 'ka' ? route.description_ka : route.description_en) ||
    label
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
    },
  }
}

export default async function TransferRouteDetailPage(
  props: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await props.params
  setRequestLocale(locale)
  const loc = locale as Locale

  const route = await getTransferRouteBySlug(slug)
  if (!route) notFound()

  const [originDestination, allRoutes, allPickupPoints, tPage] = await Promise.all([
    route.from_destination_id
      ? getDestinationById(route.from_destination_id)
      : Promise.resolve(null),
    listTransferRoutes(),
    listPickupPoints(),
    getTranslations({ locale, namespace: 'transfers_page' }),
  ])

  const label = routeLabel(route, loc)
  const description = loc === 'ka' ? route.description_ka : route.description_en

  // Deep-link the "Book this transfer" CTA to /transfers with a pickup
  // pre-selected — but only when the route's origin destination has
  // exactly one published pickup point. Multiple pickups (e.g. Barcelona
  // has El Prat T1 + T2) leaves it to the customer to pick.
  const originPickupPoints = allPickupPoints.filter(
    (p) => route.from_destination_id && p.destination_id === route.from_destination_id,
  )
  const preselectId =
    originPickupPoints.length === 1 ? originPickupPoints[0].id : null
  const bookHref = preselectId ? `/transfers?pickup=${preselectId}` : '/transfers'

  // Related routes: same origin destination, different slug. Limits to 5
  // so the block stays scannable.
  const relatedRoutes = allRoutes
    .filter(
      (r) =>
        r.slug !== route.slug &&
        route.from_destination_id &&
        r.from_destination_id === route.from_destination_id,
    )
    .slice(0, 5)

  const originLabel = originDestination
    ? (loc === 'ka'
        ? originDestination.name_ka || originDestination.name_en
        : originDestination.name_en || originDestination.name_ka)
    : undefined

  const crumbs = breadcrumbJsonLd(loc as 'en' | 'ka', loc === 'ka' ? 'მთავარი' : 'Home', [
    { name: tPage('nav_label'), path: '/transfers' },
    { name: label.combined, path: `/transfers/${slug}` },
  ])
  const service = serviceJsonLd({
    locale: loc as 'en' | 'ka',
    slug,
    name: label.combined,
    description: description || label.combined,
    serviceType: 'Airport transfer',
    areaServed: originLabel,
    priceFrom: route.price_from,
    currency: route.currency,
  })

  return (
    <div className="bg-black text-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(service) }}
      />

      <div className="max-w-4xl mx-auto px-6 md:px-12 pt-24 pb-16">
        <nav className="mb-8 text-[10px] font-bold tracking-widest uppercase text-white/40">
          <Link href="/transfers" className="hover:text-[#FFCC00]">
            ← {tPage('nav_label')}
          </Link>
        </nav>

        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            {label.from}
            <br />
            <span className="text-[#FFCC00]">→ {label.to}</span>
          </h1>
        </header>

        {/* Facts panel */}
        <section className="admin-card mb-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {route.duration_minutes != null && (
            <Fact
              label={tPage('route_facts_duration')}
              value={`${route.duration_minutes} ${tPage('route_facts_duration_minutes')}`}
            />
          )}
          {route.vehicle_type && (
            <Fact label={tPage('route_facts_vehicle')} value={route.vehicle_type} />
          )}
          {route.max_passengers != null && (
            <Fact
              label={tPage('route_facts_max_passengers')}
              value={String(route.max_passengers)}
            />
          )}
          {route.price_from != null && (
            <Fact
              label={tPage('route_facts_price_from')}
              value={`${route.currency} ${route.price_from}`}
              accent
            />
          )}
        </section>

        {/* Description — 300+ words unique Georgian per CLAUDE.md.
            Rendered as plain paragraphs preserving line breaks. */}
        {description && (
          <section className="prose prose-invert max-w-none mb-12">
            {description.split(/\n\n+/).map((para, i) => (
              <p key={i} className="text-lg text-white/80 leading-relaxed mb-4 whitespace-pre-wrap">
                {para}
              </p>
            ))}
          </section>
        )}

        {/* CTA */}
        <div className="mb-16">
          <Link
            href={bookHref}
            className="inline-block bg-[#FFCC00] text-black font-black uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-300 transition-colors"
          >
            {tPage('route_book_cta')} →
          </Link>
        </div>

        {/* Related routes */}
        {relatedRoutes.length > 0 && (
          <section>
            <h2 className="text-2xl font-black tracking-tight mb-6">
              {tPage('route_related')}
            </h2>
            <ul className="space-y-3">
              {relatedRoutes.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/transfers/${r.slug}`}
                    className="block admin-card hover:border-[#FFCC00]/50 transition-colors group"
                  >
                    <p className="font-bold text-white group-hover:text-[#FFCC00] transition-colors">
                      {routeLabel(r, loc).combined}
                    </p>
                    {r.price_from != null && (
                      <p className="text-white/50 text-xs mt-2">
                        {tPage('route_facts_price_from')} {r.currency} {r.price_from}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">
        {label}
      </p>
      <p className={`text-lg font-bold ${accent ? 'text-[#FFCC00]' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}
