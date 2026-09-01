import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { listPickupPoints } from '@/lib/pickupPoints'
import { listDestinations } from '@/lib/destinations'
import { listTransferRoutes } from '@/lib/transferRoutes'
import { canonicalFor, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo'
import { TransferInquiryForm } from '@/components/forms/TransferInquiryForm'
import type { Locale, TransferRoute } from '@/types'

// ISR + revalidatePath('/', 'layout') on admin writes keeps this page in
// sync with pickup_points + transfer_routes without a rebuild.
export const revalidate = 3600

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ pickup?: string }>
}

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const t = await getTranslations({ locale, namespace: 'transfers_page' })
  const canonical = canonicalFor(loc, '/transfers')
  return {
    title: t('landing_title'),
    description: t('landing_intro'),
    alternates: { canonical },
    openGraph: {
      title: t('landing_title'),
      description: t('landing_intro'),
      url: canonical,
      type: 'website',
    },
  }
}

function routeLabel(r: TransferRoute, loc: Locale) {
  const from = loc === 'ka' ? (r.from_name_ka || r.from_name_en) : (r.from_name_en || r.from_name_ka)
  const to = loc === 'ka' ? (r.to_name_ka || r.to_name_en) : (r.to_name_en || r.to_name_ka)
  return `${from} → ${to}`
}

export default async function TransfersLandingPage(props: Props) {
  const [{ locale }, { pickup }] = await Promise.all([props.params, props.searchParams])
  setRequestLocale(locale)
  const loc = locale as Locale

  const [pickupPoints, destinations, routes, tNav, tPage] = await Promise.all([
    listPickupPoints(),
    listDestinations(),
    listTransferRoutes(),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'transfers_page' }),
  ])

  const crumbs = breadcrumbJsonLd(loc as 'en' | 'ka', loc === 'ka' ? 'მთავარი' : 'Home', [
    { name: tPage('nav_label'), path: '/transfers' },
  ])

  return (
    <div className="bg-black text-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />

      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-24 pb-16">
        <header className="mb-12 max-w-3xl">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-3">
            {tPage('nav_label')}
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
            {tPage('landing_title')}
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            {tPage('landing_intro')}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start">
          <div className="admin-card">
            <TransferInquiryForm
              pickupPoints={pickupPoints}
              destinations={destinations}
              initialPickupPointId={pickup ?? null}
            />
          </div>

          <aside>
            <h2 className="text-2xl font-black tracking-tight mb-6">
              {tPage('popular_routes')}
            </h2>
            {routes.length === 0 ? (
              <p className="text-white/50 text-sm">{tPage('no_routes_yet')}</p>
            ) : (
              <ul className="space-y-3">
                {routes.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/transfers/${r.slug}`}
                      className="block admin-card hover:border-[#FFCC00]/50 transition-colors group"
                    >
                      <p className="font-bold text-white group-hover:text-[#FFCC00] transition-colors">
                        {routeLabel(r, loc)}
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
            )}
            <p className="text-xs text-white/40 mt-6">
              — {tNav('contact')}
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
