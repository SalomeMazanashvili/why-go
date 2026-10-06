import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { groupByDestination, listDayTrips, serviceHref, type DestinationGroup } from '@/lib/services'
import ServiceCard from '@/components/services/ServiceCard'
import { listDestinations } from '@/lib/destinations'
import {
  breadcrumbJsonLd,
  canonicalFor,
  DEFAULT_OG_IMAGES,
  jsonLdScript,
} from '@/lib/seo'
import { getDestinationName, type Locale } from '@/types'

// ISR + revalidateContent() on admin service writes keeps this in
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
  const groupLabel = (g: DestinationGroup) =>
    g.destination ? getDestinationName(g.destination, loc) : t('index_other_group')

  const crumbs = breadcrumbJsonLd(loc as 'en' | 'ka', loc === 'ka' ? 'მთავარი' : 'Home', [
    { name: t('nav_label'), path: '/day-trips' },
  ])

  return (
    <div className="surface-light min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />

      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-24 pb-16">
        <header className="mb-12 max-w-3xl">
          <p className="text-[10px] font-bold tracking-widest uppercase text-accent mb-3">
            {t('nav_label')}
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
            {t('index_title')}
          </h1>
          <p className="text-lg text-muted leading-relaxed">{t('index_intro')}</p>
        </header>

        {/* In-page jump links — only worth showing once there's a choice. */}
        {groups.length >= 2 && (
          <nav aria-label={t('index_jump_label')} className="mb-12">
            <ul className="flex flex-wrap gap-3">
              {groups.map((g) => (
                <li key={g.key}>
                  <a
                    href={`#${g.key}`}
                    className="inline-flex items-center min-h-[44px] px-4 border border-line text-sm font-bold hover:border-fg hover:underline decoration-brand-yellow decoration-2 underline-offset-4 transition-colors"
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
                {g.services.map((trip) => (
                  <li key={trip.id}>
                    <ServiceCard
                      service={trip}
                      loc={loc}
                      href={serviceHref(trip) ?? `/day-trips/${trip.slug}`}
                      details={
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
