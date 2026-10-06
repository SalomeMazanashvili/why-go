import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getDestinationBySlug, isDestinationIndexable } from '@/lib/destinations'
import { listServices, serviceHref } from '@/lib/services'
import { listTransferRoutes } from '@/lib/transferRoutes'
import { listNews } from '@/lib/news'
import { isReservedSlug } from '@/lib/reservedSlugs'
import {
  breadcrumbJsonLd,
  canonicalFor,
  DEFAULT_OG_IMAGES,
  faqPageJsonLd,
  jsonLdScript,
} from '@/lib/seo'
import ServiceCard from '@/components/services/ServiceCard'
import {
  getDestinationDescription,
  getDestinationName,
  getNewsTitle,
  type Locale,
  type Service,
  type ServiceType,
  type TransferRoute,
} from '@/types'

// WHY-65: the destination hub, /barcelona. The SEO anchor for a city: it
// links out to every published service, transfer route and post there, and
// they link back. Same ISR shape as the other detail pages: nothing
// prerendered at build, each slug renders on first request, admin writes
// expire it through revalidateContent().
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

// Every section renders only when it has real content, so a new city with
// nothing published yet is a clean page (title, photo, contact), never a
// row of empty headings. The guide section waits for WHY-84: guides have no
// destination_id yet.

// Linkable service types, in the order the services spec gives
// (transfers are their own section below). Headings reuse existing copy.
const TYPE_ORDER: ServiceType[] = ['day_trip', 'guide', 'experience']

function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
}

async function loadHub(slug: string) {
  if (isReservedSlug(slug)) return null
  return getDestinationBySlug(slug)
}

export async function generateMetadata(
  props: { params: Promise<{ locale: string; destination: string }> },
): Promise<Metadata> {
  const { locale, destination: slug } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const d = await loadHub(slug)
  if (!d) return { title: 'Not found' }

  const name = getDestinationName(d, loc)
  const title = (loc === 'ka' && d.seo_title_ka) || name
  const description =
    (loc === 'ka' && d.seo_description_ka) ||
    paragraphs(getDestinationDescription(d, loc))[0] ||
    name
  const canonical = canonicalFor(loc, `/${d.slug}`)

  return {
    title,
    description,
    alternates: { canonical },
    // Rule 5: under 300 words of Georgian (intro + practical info + FAQ) the
    // hub is served but noindex, and the sitemap skips it. The key must be
    // absent otherwise so the layout's English noindex still applies.
    ...(isDestinationIndexable(d) ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: d.cover_image ? [{ url: d.cover_image }] : DEFAULT_OG_IMAGES,
    },
  }
}

export default async function DestinationHubPage(
  props: { params: Promise<{ locale: string; destination: string }> },
) {
  const { locale, destination: slug } = await props.params
  setRequestLocale(locale)
  const loc = locale as Locale

  const d = await loadHub(slug)
  if (!d) notFound()

  const [services, routes, posts, t, tDayTrips, tTransfers, tHome, tNav, tContact] =
    await Promise.all([
      listServices(),
      listTransferRoutes(),
      listNews(),
      getTranslations({ locale, namespace: 'destination_page' }),
      getTranslations({ locale, namespace: 'day_trips_page' }),
      getTranslations({ locale, namespace: 'transfers_page' }),
      getTranslations({ locale, namespace: 'home' }),
      getTranslations({ locale, namespace: 'nav' }),
      getTranslations({ locale, namespace: 'contact' }),
    ])

  const name = getDestinationName(d, loc)
  const intro = paragraphs(getDestinationDescription(d, loc))
  const practical = loc === 'ka' ? paragraphs(d.practical_info_ka) : []
  const faq = loc === 'ka' ? d.faq : []

  // Only services with a public detail page, so no card links to a 404.
  const hereServices = services.filter(
    (s) => s.destination_id === d.id && serviceHref(s) !== null,
  )
  const typeHeading: Record<ServiceType, string> = {
    day_trip: tDayTrips('nav_label'),
    guide: tNav('guides'),
    experience: tNav('experiences'),
  }
  const serviceGroups = TYPE_ORDER
    .map((type) => ({ type, items: hereServices.filter((s) => s.service_type === type) }))
    .filter((g) => g.items.length > 0)

  const hereRoutes = routes.filter(
    (r) => r.from_destination_id === d.id || r.to_destination_id === d.id,
  )
  const herePosts = posts.filter((p) => p.destination_id === d.id)

  const crumbs = breadcrumbJsonLd(loc as 'en' | 'ka', loc === 'ka' ? 'მთავარი' : 'Home', [
    { name, path: `/${d.slug}` },
  ])
  const faqLd = faq.length > 0
    ? faqPageJsonLd(faq.map((f) => ({ q: f.q_ka, a: f.a_ka })))
    : null

  return (
    <div className="surface-light min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(faqLd) }}
        />
      )}

      <article className="max-w-4xl mx-auto px-6 md:px-12 pt-24 pb-16">
        <header className="mb-10">
          {d.country && (
            <p className="text-[10px] font-bold tracking-widest uppercase text-accent mb-3">
              {d.country}
            </p>
          )}
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            {name}
          </h1>
        </header>

        {d.cover_image && (
          <div className="relative aspect-[16/9] mb-12 overflow-hidden">
            <Image
              src={d.cover_image}
              alt=""
              fill
              priority
              sizes="(min-width: 896px) 800px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        {intro.length > 0 && (
          <div className="mb-14 max-w-3xl">
            {intro.map((p, i) => (
              <p key={i} className="text-lg text-fg leading-relaxed mb-4 whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        )}

        {serviceGroups.map((g) => (
          <Section key={g.type} title={typeHeading[g.type]}>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {g.items.map((s) => (
                <li key={s.id}>
                  <ServiceCard
                    service={s}
                    loc={loc}
                    href={serviceHref(s)!}
                    details={dayTripDetails(s, tDayTrips)}
                    price={
                      s.price_from != null
                        ? tDayTrips('card_price_from', { price: `${s.currency} ${s.price_from}` })
                        : null
                    }
                  />
                </li>
              ))}
            </ul>
          </Section>
        ))}

        {hereRoutes.length > 0 && (
          <Section title={tTransfers('landing_title')}>
            <ul className="divide-y divide-line border-y border-line">
              {hereRoutes.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/transfers/${r.slug}`}
                    className="flex items-center justify-between gap-4 py-4 min-h-[44px] text-fg hover:underline decoration-brand-yellow decoration-2 underline-offset-4"
                  >
                    <span className="font-bold">{routeLabel(r, loc)}</span>
                    <span aria-hidden="true" className="text-muted">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {herePosts.length > 0 && (
          <Section title={tHome('blog_title')}>
            <ul className="space-y-3">
              {herePosts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/tips/${p.slug}`}
                    className="text-lg font-bold text-fg hover:underline decoration-brand-yellow decoration-2 underline-offset-4"
                  >
                    {getNewsTitle(p, loc)}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {practical.length > 0 && (
          <Section title={t('practical_title')}>
            {practical.map((p, i) => (
              <p key={i} className="text-fg leading-relaxed mb-4 whitespace-pre-line">
                {p}
              </p>
            ))}
          </Section>
        )}

        {faq.length > 0 && (
          <Section title={t('faq_title')}>
            <dl className="divide-y divide-line border-y border-line">
              {faq.map((f, i) => (
                <div key={i} className="py-5">
                  <dt className="font-bold text-fg mb-2">{f.q_ka}</dt>
                  <dd className="text-fg leading-relaxed whitespace-pre-line">{f.a_ka}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        <p className="pt-4">
          <Link
            href="/contact"
            className="inline-flex items-center min-h-[44px] bg-brand-yellow text-ink font-black uppercase tracking-widest text-sm px-8 py-4 hover:brightness-110 transition-colors"
          >
            {tContact('label')}
          </Link>
        </p>
      </article>
    </div>
  )
}

function dayTripDetails(
  s: Service,
  t: Awaited<ReturnType<typeof getTranslations<'day_trips_page'>>>,
): string | null {
  return s.service_type === 'day_trip' && s.duration_hours != null
    ? t('card_duration_hours', { hours: s.duration_hours })
    : null
}

function routeLabel(r: TransferRoute, loc: Locale) {
  const from = loc === 'ka' ? (r.from_name_ka || r.from_name_en) : (r.from_name_en || r.from_name_ka)
  const to = loc === 'ka' ? (r.to_name_ka || r.to_name_en) : (r.to_name_en || r.to_name_ka)
  return `${from} → ${to}`
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <h2 className="text-2xl font-black tracking-tight mb-5">{title}</h2>
      {children}
    </section>
  )
}

