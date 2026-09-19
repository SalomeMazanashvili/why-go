import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { listDayTrips } from '@/lib/services'
import { listDestinations } from '@/lib/destinations'
import {
  breadcrumbJsonLd,
  canonicalFor,
  DEFAULT_OG_IMAGES,
  jsonLdScript,
} from '@/lib/seo'
import {
  getDestinationName,
  getServiceName,
  getServiceShortDescription,
  type Destination,
  type Locale,
  type Service,
} from '@/types'

// ISR + revalidatePath('/', 'layout') on admin service writes keeps this in
// sync with publishes without a rebuild.
export const revalidate = 3600

// WHY-83 PR B. The filtered SEO view for day-trip intent
// (`ბარსელონადან ერთდღიანი ექსკურსია`). The `გამოცდილება` nav item points at
// /experiences (WHY-67), not here — this page is reached from search, the
// sitemap and, once WHY-65 lands, destination hubs.
//
// With ~30 products in the whole catalogue, "filterable by destination" is
// plain server-rendered groups with in-page anchors: crawlable, works without
// JS, and no filter infrastructure (CLAUDE.md: curated, not marketplace).

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const t = await getTranslations({ locale, namespace: 'day_trips_page' })
  const canonical = canonicalFor(loc, '/day-trips')
  return {
    title: t('index_title'),
    description: t('index_meta_description'),
    alternates: { canonical },
    openGraph: {
      title: t('index_title'),
      description: t('index_meta_description'),
      url: canonical,
      type: 'website',
      images: DEFAULT_OG_IMAGES,
    },
  }
}

interface Group {
  key: string
  destination: Destination | null
  trips: Service[]
}

// Groups follow destination sort_order. Trips whose destination is unset or
// unpublished go last, under a neutral heading, rather than disappearing.
function groupByDestination(trips: Service[], destinations: Destination[]): Group[] {
  const groups: Group[] = destinations
    .map((d) => ({
      key: d.slug,
      destination: d,
      trips: trips.filter((t) => t.destination_id === d.id),
    }))
    .filter((g) => g.trips.length > 0)
  const known = new Set(destinations.map((d) => d.id))
  const rest = trips.filter((t) => !t.destination_id || !known.has(t.destination_id))
  if (rest.length > 0) groups.push({ key: 'other', destination: null, trips: rest })
  return groups
}

export default async function DayTripsIndexPage(
  props: { params: Promise<{ locale: string }> },
) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const loc = locale as Locale

  const [trips, destinations, t] = await Promise.all([
    listDayTrips(),
    listDestinations(),
    getTranslations({ locale, namespace: 'day_trips_page' }),
  ])

  // Nothing published → no page. An empty index would be a thin, public page
  // with placeholder copy; the sitemap omits it under the same condition.
  if (trips.length === 0) notFound()

  const groups = groupByDestination(trips, destinations)
  const groupLabel = (g: Group) =>
    g.destination ? getDestinationName(g.destination, loc) : t('index_other_group')

  const crumbs = breadcrumbJsonLd(loc as 'en' | 'ka', loc === 'ka' ? 'მთავარი' : 'Home', [
    { name: t('nav_label'), path: '/day-trips' },
  ])

  return (
    <div className="bg-black text-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />

      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-24 pb-16">
        <header className="mb-12 max-w-3xl">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-3">
            {t('nav_label')}
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
            {t('index_title')}
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">{t('index_intro')}</p>
        </header>

        {/* In-page jump links — only worth showing once there's a choice. */}
        {groups.length >= 2 && (
          <nav aria-label={t('index_jump_label')} className="mb-12">
            <ul className="flex flex-wrap gap-3">
              {groups.map((g) => (
                <li key={g.key}>
                  <a
                    href={`#${g.key}`}
                    className="inline-flex items-center min-h-[44px] px-4 border border-white/20 text-sm font-bold hover:border-[#FFCC00] hover:text-[#FFCC00] transition-colors"
                  >
                    {groupLabel(g)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="space-y-16">
          {groups.map((g) => (
            <section key={g.key} id={g.key} aria-labelledby={`${g.key}-heading`} className="scroll-mt-24">
              <h2 id={`${g.key}-heading`} className="text-2xl md:text-3xl font-black tracking-tight mb-6">
                {groupLabel(g)}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {g.trips.map((trip) => (
                  <li key={trip.id}>
                    <DayTripCard
                      trip={trip}
                      loc={loc}
                      duration={
                        trip.duration_hours != null
                          ? t('card_duration_hours', { hours: trip.duration_hours })
                          : null
                      }
                      price={
                        trip.price_from != null
                          ? t('card_price_from', { price: `${trip.currency} ${trip.price_from}` })
                          : null
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

function DayTripCard({
  trip,
  loc,
  duration,
  price,
}: {
  trip: Service
  loc: Locale
  duration: string | null
  price: string | null
}) {
  const name = getServiceName(trip, loc)
  const short = getServiceShortDescription(trip, loc)
  return (
    <Link
      href={`/day-trips/${trip.slug}`}
      className="group block h-full border border-white/10 hover:border-[#FFCC00]/50 transition-colors"
    >
      {trip.cover_image && (
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Decorative here: the card's accessible name is the title below. */}
          <Image
            src={trip.cover_image}
            alt=""
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-bold group-hover:text-[#FFCC00] transition-colors">{name}</h3>
        {short && <p className="text-white/60 text-sm mt-2 leading-relaxed">{short}</p>}
        {(duration || price) && (
          <p className="text-xs text-white/50 mt-4 flex flex-wrap gap-x-4">
            {duration && <span>{duration}</span>}
            {price && <span className="text-[#FFCC00] font-bold">{price}</span>}
          </p>
        )}
      </div>
    </Link>
  )
}
