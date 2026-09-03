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

  const [pickupPoints, destinations, routes, tPage] = await Promise.all([
    listPickupPoints(),
    listDestinations(),
    listTransferRoutes(),
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

      <div className="max-w-3xl mx-auto px-6 md:px-12 pt-24 pb-16">
        <header className="mb-12">
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

        <div className="admin-card">
          <TransferInquiryForm
            pickupPoints={pickupPoints}
            destinations={destinations}
            initialPickupPointId={pickup ?? null}
          />
        </div>

        {/* Crawlable text list of published routes so /transfers/[slug]
            pages aren't orphaned in the internal link graph — the form's
            <select> isn't crawlable. Rendered only when 2+ routes exist
            so a single-route site doesn't ship a one-item nav. This is a
            temporary bandaid; WHY-65 destination hubs will link to
            routes properly and this list can be removed then. */}
        {routes.length >= 2 && (
          <nav
            aria-label={tPage('nav_label')}
            className="mt-16 pt-8 border-t border-white/10"
          >
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {routes.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/transfers/${r.slug}`}
                    className="text-white/60 hover:text-[#FFCC00] transition-colors underline underline-offset-4"
                  >
                    {routeLabel(r, loc)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  )
}
