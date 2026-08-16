import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/types'
import { getTourTitle, getTourSubtitle, getTourDescription, getTourTag, formatPrice } from '@/types'
import { listTours } from '@/lib/tours'
import {
  breadcrumbJsonLd,
  canonicalFor,
  jsonLdScript,
  touristTripJsonLd,
} from '@/lib/seo'

export const revalidate = 3600
// Empty `generateStaticParams` + default `dynamicParams: true` = ISR
// on-demand: nothing prerendered at build (so CI needs no env), each
// slug renders on first request and caches for `revalidate` seconds.
// Admin publish/edit triggers revalidatePath('/', 'layout') to bust.
export async function generateStaticParams() {
  return []
}

export async function generateMetadata(
  props: { params: Promise<{ locale: string; slug: string }> },
): Promise<Metadata> {
  const { locale, slug } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const tours = await listTours()
  const tour = tours.find((t) => t.slug === slug)
  if (!tour) {
    // notFound() is called by the page; return minimal metadata.
    return { title: 'Not found' }
  }
  const title = getTourTitle(tour, loc as Locale)
  const description =
    getTourDescription(tour, loc as Locale) || getTourSubtitle(tour, loc as Locale) || ''
  const canonical = canonicalFor(loc, `/tours/${slug}`)
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: tour.cover_image ? [{ url: tour.cover_image }] : undefined,
    },
  }
}

export default async function TourDetailPage(
  props: {
    params: Promise<{ locale: string; slug: string }>
  }
) {
  const { locale, slug } = await props.params
  setRequestLocale(locale)

  const [tours, tNav] = await Promise.all([
    listTours(),
    getTranslations({ locale, namespace: 'nav' }),
  ])
  const tour = tours.find((t) => t.slug === slug)
  if (!tour) notFound()
  const loc = locale as Locale

  const crumbs = breadcrumbJsonLd(loc as 'en' | 'ka', loc === 'ka' ? 'მთავარი' : 'Home', [
    { name: tNav('tours'), path: '/tours' },
    { name: getTourTitle(tour, loc), path: `/tours/${slug}` },
  ])
  const trip = touristTripJsonLd({
    locale: loc as 'en' | 'ka',
    slug,
    name: getTourTitle(tour, loc),
    description:
      getTourDescription(tour, loc) || getTourSubtitle(tour, loc) || getTourTitle(tour, loc),
    coverImage: tour.cover_image,
    destination: tour.destination,
    priceFrom: tour.price_from,
    currency: tour.currency,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(trip) }}
      />
      <section className="relative h-[85vh] flex items-end overflow-hidden">
        <Image
          src={tour.cover_image ?? ''}
          alt={getTourTitle(tour, loc)}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="relative z-10 px-6 md:px-10 pb-12 w-full">
          <Link
            href="/tours"
            className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 hover:text-white transition-colors inline-block mb-4"
          >
            ← All Tours
          </Link>
          <p className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 mb-3">
            {getTourTag(tour, loc)}
          </p>
          <h1
            className="font-black uppercase text-white leading-none tracking-tight"
            style={{ fontSize: 'clamp(48px,8vw,96px)', letterSpacing: '-0.04em' }}
          >
            {getTourTitle(tour, loc).toUpperCase()}
          </h1>
          <p className="text-lg text-white/60 mt-3 max-w-lg">{getTourSubtitle(tour, loc)}</p>
        </div>
      </section>

      <section className="bg-white px-6 md:px-10 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <p className="text-[10px] font-bold tracking-widest uppercase text-black/40 mb-4">
              About This Experience
            </p>
            <p className="text-base leading-relaxed text-black/80">
              {getTourDescription(tour, loc)}
            </p>
          </div>
          <div className="bg-black p-8">
            <p className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 mb-6">
              Trip Details
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-bold tracking-widest uppercase text-white/30 mb-1">
                  Starting From
                </p>
                <p className="font-black text-yellow-400 text-2xl tracking-tight">
                  {formatPrice(tour.price_from, tour.currency)}
                </p>
              </div>
              {tour.duration_days && (
                <div>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-white/30 mb-1">
                    Duration
                  </p>
                  <p className="font-bold text-white">{tour.duration_days} days</p>
                </div>
              )}
              <div>
                <p className="text-[9px] font-bold tracking-widest uppercase text-white/30 mb-1">
                  Destination
                </p>
                <p className="font-bold text-white">{tour.destination}</p>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <Link
                href="/contact"
                className="block w-full text-center bg-yellow-400 text-black font-black text-[11px] tracking-widest uppercase py-4 hover:bg-yellow-300 transition-colors"
              >
                Book This Tour →
              </Link>
              <Link
                href="/contact"
                className="block w-full text-center border border-white/20 text-white font-black text-[11px] tracking-widest uppercase py-4 hover:border-yellow-400 hover:text-yellow-400 transition-colors"
              >
                Enquire
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
