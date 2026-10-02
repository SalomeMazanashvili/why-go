import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import ServiceCard from '@/components/services/ServiceCard'
import HomeSection, { gridColsFor } from '@/components/home/HomeSection'
import { serviceHref } from '@/lib/services'
import {
  getDestinationName,
  getGuideName,
  getNewsTitle,
  getTourSubtitle,
  getTourTitle,
  type Destination,
  type Guide,
  type Locale,
  type News,
  type Service,
  type Tour,
} from '@/types'

// WHY-67 homepage sections 2–7 (docs/whygo-homepage-brief.md). Every
// section returns null when its data is empty — no grid, no placeholder, no
// empty-state message — so the sections around it close up.

const priceLabel = (t: (k: 'price_from', v: { price: string }) => string, amount: number | null, currency: string) =>
  amount != null ? t('price_from', { price: `${currency} ${amount}` }) : null

// §2 ტურები — up to four, featured first then sort order.
export async function ToursSection({ tours, locale }: { tours: Tour[]; locale: Locale }) {
  if (tours.length === 0) return null
  const t = await getTranslations({ locale, namespace: 'home' })
  const shown = [...tours]
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order)
    .slice(0, 4)
  return (
    <HomeSection
      id="home-tours"
      title={t('tours_title')}
      viewAll={{ href: '/tours', label: t('view_all') }}
    >
      <ul className={`grid gap-6 ${gridColsFor(shown.length)}`}>
        {shown.map((tour) => {
          const wide = shown.length === 1
          const price = priceLabel(t, tour.price_from, tour.currency)
          const subtitle = getTourSubtitle(tour, locale)
          return (
            <li key={tour.id}>
              <Link
                href={`/tours/${tour.slug}`}
                className={`group block h-full bg-raised border border-line hover:border-fg transition-colors ${wide ? 'md:grid md:grid-cols-2' : ''}`}
              >
                {tour.cover_image && (
                  <div className={`relative aspect-[4/3] overflow-hidden ${wide ? 'md:aspect-auto md:min-h-[320px]' : ''}`}>
                    <Image
                      src={tour.cover_image}
                      alt=""
                      fill
                      sizes={wide ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw'}
                      className="object-cover"
                    />
                  </div>
                )}
                <div className={wide ? 'p-5 md:p-8 md:self-center' : 'p-5'}>
                  {tour.destination && (
                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
                      {tour.destination}
                    </p>
                  )}
                  <h3 className="text-lg font-bold group-hover:underline decoration-yellow-400 decoration-2 underline-offset-4">
                    {getTourTitle(tour, locale)}
                  </h3>
                  {subtitle && <p className="text-muted text-sm mt-2 leading-relaxed">{subtitle}</p>}
                  {(tour.duration_days || price) && (
                    <p className="text-xs text-muted mt-4 flex flex-wrap gap-x-4 items-center">
                      {tour.duration_days ? <span>{t('tour_days', { days: tour.duration_days })}</span> : null}
                      {price && <span className="inline-block bg-yellow-400 text-ink font-bold px-1.5">{price}</span>}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </HomeSection>
  )
}

// §3 ქალაქები — the homepage is where destination hubs get internal links.
// Until hubs exist (WHY-65) each city links to its group on /experiences, so
// only cities with a cover image AND at least one linkable experience show:
// a tile must never lead to a missing anchor or a 404.
export async function CitiesSection({
  destinations,
  experiences,
  locale,
}: {
  destinations: Destination[]
  experiences: Service[]
  locale: Locale
}) {
  const withExperiences = new Set(experiences.map((s) => s.destination_id))
  const cities = destinations.filter((d) => d.cover_image && withExperiences.has(d.id))
  if (cities.length === 0) return null
  const t = await getTranslations({ locale, namespace: 'home' })
  return (
    <HomeSection id="home-cities" title={t('cities_title')}>
      <ul className={`grid gap-4 ${cities.length === 1 ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {cities.map((d) => (
          <li key={d.id}>
            <Link
              href={`/experiences#${d.slug}`}
              className={`group relative block overflow-hidden bg-ink tone-dark ${cities.length === 1 ? 'aspect-[4/3] md:aspect-[21/9]' : 'aspect-[4/5]'}`}
            >
              <Image
                src={d.cover_image!}
                alt=""
                fill
                sizes={cities.length === 1 ? '100vw' : '(min-width: 1024px) 280px, 50vw'}
                className="object-cover group-hover:scale-[1.04] transition-transform duration-700"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <span className="absolute bottom-0 left-0 p-4 text-xl md:text-2xl font-black text-white group-hover:text-yellow-400 transition-colors">
                {getDestinationName(d, locale)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </HomeSection>
  )
}

// §4 Transfers banner — a single block, not a grid. /transfers is a standing
// page, so this always renders. Yellow with ink text (never white on yellow).
export async function TransfersBanner({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' })
  return (
    <section aria-labelledby="home-transfers-heading" className="tone-light bg-yellow-400 text-ink px-6 md:px-10 py-14 md:py-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div className="max-w-2xl">
          <h2 id="home-transfers-heading" className="font-black tracking-tight leading-none text-3xl md:text-5xl">
            {t('transfers_title')}
          </h2>
          <p className="mt-4 text-base md:text-lg leading-relaxed">{t('transfers_body')}</p>
        </div>
        <Link
          href="/transfers"
          className="self-start md:self-auto inline-flex items-center min-h-[48px] bg-ink text-white font-black text-[12px] tracking-widest uppercase px-8 hover:bg-black transition-colors focus-visible:outline-ink"
        >
          {t('transfers_cta')}
        </Link>
      </div>
    </section>
  )
}

// §5 გამოცდილებები — description, not duration (a museum ticket and a
// full-day excursion don't share a meaningful duration). Heading is factual,
// never "popular": there's no booking data.
export async function ExperiencesSection({
  experiences,
  destinations,
  locale,
}: {
  experiences: Service[]
  destinations: Destination[]
  locale: Locale
}) {
  if (experiences.length === 0) return null
  const t = await getTranslations({ locale, namespace: 'home' })
  const shown = [...experiences]
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order)
    .slice(0, 4)
  const byId = new Map(destinations.map((d) => [d.id, d]))
  return (
    <HomeSection
      id="home-experiences"
      title={t('experiences_title')}
      viewAll={{ href: '/experiences', label: t('view_all') }}
    >
      <ul className={`grid gap-6 ${gridColsFor(shown.length)}`}>
        {shown.map((s) => {
          const dest = s.destination_id ? byId.get(s.destination_id) : undefined
          return (
            <li key={s.id}>
              <ServiceCard
                service={s}
                loc={locale}
                href={serviceHref(s)!}
                city={dest ? getDestinationName(dest, locale) : null}
                wide={shown.length === 1}
                price={priceLabel(t, s.price_from, s.currency)}
              />
            </li>
          )
        })}
      </ul>
    </HomeSection>
  )
}

// §6 გიდები — language is the whole differentiation, so it leads the card and
// Georgian is pulled to the front. Hidden until /guides exists (WHY-84).
const GEORGIAN = /ქართ|georgian/i

export async function GuidesSection({
  guides,
  enabled,
  locale,
}: {
  guides: Guide[]
  enabled: boolean
  locale: Locale
}) {
  if (!enabled || guides.length === 0) return null
  const t = await getTranslations({ locale, namespace: 'home' })
  const shown = guides.slice(0, 4)
  return (
    <HomeSection
      id="home-guides"
      title={t('guides_title')}
      viewAll={{ href: '/guides', label: t('view_all') }}
    >
      <ul className={`grid gap-6 ${gridColsFor(shown.length)}`}>
        {shown.map((g) => {
          const languages = g.languages
            .split(/[,;/]/)
            .map((l) => l.trim())
            .filter(Boolean)
            .sort((a, b) => Number(GEORGIAN.test(b)) - Number(GEORGIAN.test(a)))
          return (
            <li key={g.id}>
              <Link
                href={`/guides/${g.slug}`}
                className="group block h-full bg-raised border border-line hover:border-fg transition-colors"
              >
                {g.photo && (
                  <div className="relative aspect-square overflow-hidden">
                    <Image src={g.photo} alt="" fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
                  </div>
                )}
                <div className="p-5">
                  {languages.length > 0 && (
                    <ul className="flex flex-wrap gap-2 mb-3">
                      {languages.map((l) => (
                        <li
                          key={l}
                          className={
                            GEORGIAN.test(l)
                              ? 'bg-yellow-400 text-[#111110] text-sm font-black px-2.5 py-1'
                              : 'border border-line text-fg text-xs font-bold px-2 py-1'
                          }
                        >
                          {l}
                        </li>
                      ))}
                    </ul>
                  )}
                  <h3 className="text-lg font-bold group-hover:underline decoration-yellow-400 decoration-2 underline-offset-4">
                    {getGuideName(g, locale)}
                  </h3>
                  {g.destinations_covered && (
                    <p className="text-muted text-sm mt-1">{g.destinations_covered}</p>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </HomeSection>
  )
}

// §7 ბლოგი — three most recent published posts: image, title, date.
export async function BlogSection({ posts, locale }: { posts: News[]; locale: Locale }) {
  if (posts.length === 0) return null
  const t = await getTranslations({ locale, namespace: 'home' })
  const shown = posts.slice(0, 3)
  const fmt = new Intl.DateTimeFormat(locale === 'ka' ? 'ka-GE' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return (
    <HomeSection
      id="home-blog"
      title={t('blog_title')}
      viewAll={{ href: '/tips', label: t('view_all') }}
    >
      <ul className={`grid gap-6 ${gridColsFor(shown.length)}`}>
        {shown.map((post) => (
          <li key={post.id}>
            <Link
              href={`/tips/${post.slug}`}
              className="group block h-full bg-raised border border-line hover:border-fg transition-colors"
            >
              {post.cover_image && (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={post.cover_image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <h3 className="text-lg font-bold leading-snug group-hover:underline decoration-yellow-400 decoration-2 underline-offset-4">
                  {getNewsTitle(post, locale)}
                </h3>
                <time dateTime={post.published_at} className="block text-xs text-muted mt-3">
                  {fmt.format(new Date(post.published_at))}
                </time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </HomeSection>
  )
}
