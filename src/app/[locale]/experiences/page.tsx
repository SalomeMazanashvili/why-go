import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import {
  groupByDestination,
  listExperiences,
  serviceHref,
  type DestinationGroup,
} from '@/lib/services'
import ServiceCard from '@/components/services/ServiceCard'
import { listDestinations } from '@/lib/destinations'
import {
  breadcrumbJsonLd,
  canonicalFor,
  DEFAULT_OG_IMAGES,
  jsonLdScript,
} from '@/lib/seo'
import { getDestinationName, type Locale } from '@/types'

// ISR + revalidatePath('/', 'layout') on admin service writes keeps this in
// sync with publishes without a rebuild.
export const revalidate = 3600

// WHY-67 PR A. The `გამოცდილება` catalogue: every published service that has
// a detail page (day trips only, until WHY-84/WHY-85 add guides and
// experiences), grouped by destination. WHY-85 extends this page.
//
// City filtering is in-page anchors (`/experiences#<destination-slug>`), not
// `?destination=`: reading searchParams would make the route dynamic, and the
// anchors match /day-trips. Curated catalogue, not marketplace (CLAUDE.md).

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const t = await getTranslations({ locale, namespace: 'experiences_page' })
  const canonical = canonicalFor(loc, '/experiences')
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

export default async function ExperiencesIndexPage(
  props: { params: Promise<{ locale: string }> },
) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const loc = locale as Locale

  const [services, destinations, t] = await Promise.all([
    listExperiences(),
    listDestinations(),
    getTranslations({ locale, namespace: 'experiences_page' }),
  ])

  // Nothing published → no page. The nav item and sitemap entry are hidden
  // under the same condition, so nothing links here while it 404s.
  if (services.length === 0) notFound()

  const groups = groupByDestination(services, destinations)
  const groupLabel = (g: DestinationGroup) =>
    g.destination ? getDestinationName(g.destination, loc) : t('index_other_group')

  const crumbs = breadcrumbJsonLd(loc as 'en' | 'ka', loc === 'ka' ? 'მთავარი' : 'Home', [
    { name: t('nav_label'), path: '/experiences' },
  ])

  return (
    <div className="bg-black text-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />

      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-24 pb-16">
        <header className="mb-12 max-w-3xl">
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
                {g.services.map((service) => (
                  <li key={service.id}>
                    <ServiceCard
                      service={service}
                      loc={loc}
                      href={serviceHref(service)!}
                      price={
                        service.price_from != null
                          ? t('card_price_from', {
                              price: `${service.currency} ${service.price_from}`,
                            })
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
