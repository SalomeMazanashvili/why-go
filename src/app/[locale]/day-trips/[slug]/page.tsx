import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getDayTripBySlug, isDayTripIndexable } from '@/lib/services'
import { getDestinationById } from '@/lib/destinations'
import {
  breadcrumbJsonLd,
  canonicalFor,
  DEFAULT_OG_IMAGES,
  jsonLdScript,
  productJsonLd,
} from '@/lib/seo'
import { DayTripInquiryForm } from '@/components/forms/DayTripInquiryForm'
import {
  getDestinationName,
  getServiceDescription,
  getServiceIncluded,
  getServiceMeetingPoint,
  getServiceName,
  getServiceRoute,
  getServiceShortDescription,
  getServiceWhatToBring,
  type Locale,
} from '@/types'

// Same ISR shape as /tours/[slug] and /transfers/[slug]: nothing prerendered
// at build, each slug renders on first request, admin writes bust the cache.
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

// WHY-83 PR B. The page is the article *and* the sales page: someone
// searching `ბარსელონადან ერთდღიანი ექსკურსია` arrives undecided, so the
// editorial does the persuading and the form sits at the end. Canonical URL
// stays /day-trips/[slug] even once /experiences exists (decision on the
// ticket, 2026-09-19).

function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
}

// Admin fields "included" and "what to bring" are one item per line.
function lines(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean)
}

export async function generateMetadata(
  props: { params: Promise<{ locale: string; slug: string }> },
): Promise<Metadata> {
  const { locale, slug } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const trip = await getDayTripBySlug(slug)
  if (!trip) return { title: 'Not found' }

  const name = getServiceName(trip, loc)
  const title = (loc === 'ka' && trip.seo_title_ka) || name
  const description =
    (loc === 'ka' && trip.seo_description_ka) ||
    getServiceShortDescription(trip, loc) ||
    name
  const canonical = canonicalFor(loc, `/day-trips/${slug}`)

  return {
    title,
    description,
    alternates: { canonical },
    // Rule 5: under 300 words of Georgian editorial, the page may exist (the
    // founders can preview it) but must not be indexed. The sitemap uses the
    // same check. The key must be *absent* otherwise: Next's metadata merge
    // treats `robots: undefined` as an override and drops the layout's
    // English noindex.
    ...(isDayTripIndexable(trip) ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: trip.cover_image ? [{ url: trip.cover_image }] : DEFAULT_OG_IMAGES,
    },
  }
}

export default async function DayTripDetailPage(
  props: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await props.params
  setRequestLocale(locale)
  const loc = locale as Locale

  const trip = await getDayTripBySlug(slug)
  if (!trip) notFound()

  const [destination, t] = await Promise.all([
    trip.destination_id ? getDestinationById(trip.destination_id) : Promise.resolve(null),
    getTranslations({ locale, namespace: 'day_trips_page' }),
  ])
  // getDestinationById doesn't filter drafts; never surface an unpublished one.
  const destinationName =
    destination?.is_published ? getDestinationName(destination, loc) : null

  const name = getServiceName(trip, loc)
  const short = getServiceShortDescription(trip, loc)
  const description = getServiceDescription(trip, loc)
  const route = getServiceRoute(trip, loc)
  const included = lines(getServiceIncluded(trip, loc))
  const whatToBring = lines(getServiceWhatToBring(trip, loc))
  const meetingPoint = getServiceMeetingPoint(trip, loc)
  const photos = [trip.cover_image, ...trip.gallery].filter((u): u is string => !!u)

  const groupSize =
    trip.min_group_size != null && trip.max_group_size != null
      ? `${trip.min_group_size}–${trip.max_group_size}`
      : trip.max_group_size != null
        ? String(trip.max_group_size)
        : null

  const crumbs = breadcrumbJsonLd(loc as 'en' | 'ka', loc === 'ka' ? 'მთავარი' : 'Home', [
    { name: t('nav_label'), path: '/day-trips' },
    { name, path: `/day-trips/${slug}` },
  ])
  const product = productJsonLd({
    locale: loc as 'en' | 'ka',
    path: `/day-trips/${slug}`,
    name,
    description: short || name,
    images: photos,
    priceFrom: trip.price_from,
    currency: trip.currency,
  })

  return (
    <div className="bg-black text-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(product) }}
        />
      )}

      <article className="max-w-3xl mx-auto px-6 md:px-12 pt-24 pb-16">
        {/* A single back link, not a landmark — a second unlabelled <nav>
            next to the header's fails axe landmark-unique. */}
        <p className="mb-8 text-[10px] font-bold tracking-widest uppercase text-white/60">
          <Link href="/day-trips" className="hover:text-[#FFCC00]">
            ← {t('back_to_index')}
          </Link>
        </p>

        <header className="mb-10">
          {destinationName && (
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-3">
              {destinationName}
            </p>
          )}
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            {name}
          </h1>
          {short && <p className="text-lg text-white/70 leading-relaxed mt-6">{short}</p>}
        </header>

        {trip.cover_image && (
          <div className="relative aspect-[16/10] mb-10 overflow-hidden">
            <Image
              src={trip.cover_image}
              alt={name}
              fill
              priority
              sizes="(min-width: 768px) 720px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        {(trip.duration_hours != null || groupSize || trip.price_from != null) && (
          <section className="admin-card mb-10 grid grid-cols-2 md:grid-cols-3 gap-6">
            {trip.duration_hours != null && (
              <Fact
                label={t('facts_duration')}
                value={`${trip.duration_hours} ${t('facts_hours')}`}
              />
            )}
            {groupSize && <Fact label={t('facts_group_size')} value={groupSize} />}
            {trip.price_from != null && (
              <Fact
                label={t('facts_price_from')}
                value={`${trip.currency} ${trip.price_from}`}
                accent
              />
            )}
          </section>
        )}

        <p className="mb-12">
          <a
            href="#request"
            className="inline-flex items-center min-h-[44px] bg-[#FFCC00] text-black font-black uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-300 transition-colors"
          >
            {t('request_cta')} ↓
          </a>
        </p>

        {description && (
          <div className="mb-12">
            {paragraphs(description).map((p, i) => (
              <p key={i} className="text-lg text-white/80 leading-relaxed mb-4 whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        )}

        {route && (
          <Section title={t('section_route')}>
            {paragraphs(route).map((p, i) => (
              <p key={i} className="text-white/80 leading-relaxed mb-4 whitespace-pre-line">
                {p}
              </p>
            ))}
          </Section>
        )}

        {included.length > 0 && (
          <Section title={t('section_included')}>
            <BulletList items={included} />
          </Section>
        )}

        {whatToBring.length > 0 && (
          <Section title={t('section_what_to_bring')}>
            <BulletList items={whatToBring} />
          </Section>
        )}

        {meetingPoint && (
          <Section title={t('section_meeting_point')}>
            <p className="text-white/80 leading-relaxed whitespace-pre-line">{meetingPoint}</p>
          </Section>
        )}

        {trip.gallery.length > 0 && (
          <Section title={t('section_gallery')}>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trip.gallery.map((url, i) => (
                <li key={`${i}-${url}`} className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={url}
                    alt={t('gallery_alt', { name, n: i + 1 })}
                    fill
                    sizes="(min-width: 640px) 360px, 100vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </Section>
        )}
      </article>

      <section id="request" className="max-w-3xl mx-auto px-6 md:px-12 pb-24 scroll-mt-24">
        <div className="admin-card">
          <DayTripInquiryForm dayTrips={[trip]} serviceId={trip.id} />
        </div>
      </section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-black tracking-tight mb-4">{title}</h2>
      {children}
    </section>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-white/80 leading-relaxed">
          <span aria-hidden="true" className="text-[#FFCC00]">—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-widest uppercase text-white/60 mb-2">
        {label}
      </p>
      <p className={`text-lg font-bold ${accent ? 'text-[#FFCC00]' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}
