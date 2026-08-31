import Link from 'next/link'
import { NextIntlClientProvider } from 'next-intl'
import { requireAdmin } from '@/lib/adminAuth'
import { listDestinationsForAdmin } from '@/lib/destinations'
import { listTransferRoutesForAdmin } from '@/lib/transferRoutes'
import { TransferInquiryForm } from '@/components/forms/TransferInquiryForm'
import { TransactionalInquiryForm } from '@/components/forms/TransactionalInquiryForm'
import { ConsultativeInquiryForm } from '@/components/forms/ConsultativeInquiryForm'
import kaMessages from '../../../../../messages/ka.json'
import enMessages from '../../../../../messages/en.json'

// Founder-only preview page: mounts every inquiry form with real data so the
// flow can be walked end-to-end before WHY-65 wires them onto public service
// detail pages. Behind requireAdmin so nothing leaks to customers before
// we're ready.
//
// Admin routes live outside the [locale] tree so the NextIntlClientProvider
// from the public layout isn't in scope. The form components call
// useTranslations('inquiry'), so we wrap them in a local provider with both
// message bundles loaded — founders can preview either locale from this page
// via ?locale=en without leaving admin.

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ locale?: string }>
}

export default async function InquiryPreviewPage(props: Props) {
  await requireAdmin()
  const [{ locale = 'ka' }, destinations, transferRoutes] = await Promise.all([
    props.searchParams,
    listDestinationsForAdmin(),
    listTransferRoutesForAdmin(),
  ])
  const messages = locale === 'en' ? enMessages : kaMessages
  const publishedRoutes = transferRoutes.filter((r) => r.is_published)

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="p-8 lg:p-12 space-y-16">
        <header>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Preview</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Inquiry forms</h1>
          <p className="text-white/50 text-sm mt-3 max-w-2xl">
            Every form in the request-to-book system. Submitting here writes to <span className="font-mono">inquiries</span>{' '}
            and (in production) triggers founder notification + customer confirmation emails. Rate-limited to 5 per minute
            per IP. Turnstile only renders in production.
          </p>
          <p className="text-white/40 text-xs mt-3 flex gap-4 items-center">
            <span>Locale: <strong className="text-white">{locale}</strong></span>
            <Link
              href={`/admin/preview/inquiries?locale=${locale === 'ka' ? 'en' : 'ka'}`}
              className="text-[#FFCC00] hover:underline"
            >
              Switch to {locale === 'ka' ? 'English' : 'Georgian'}
            </Link>
            <Link href="/admin/inquiries" className="hover:text-[#FFCC00]">
              → Admin inquiries list
            </Link>
          </p>
        </header>

        <section className="admin-card">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-6">
            Transfer (WHY-68 — route dropdown + flight number + return toggle)
          </p>
          {publishedRoutes.length === 0 ? (
            <p className="text-orange-400 text-sm">
              No published transfer routes yet — the dropdown will only show &quot;Other&quot;. Add routes at{' '}
              <Link href="/admin/transfer-routes" className="underline hover:text-[#FFCC00]">
                /admin/transfer-routes
              </Link>{' '}
              and toggle Published.
            </p>
          ) : (
            <TransferInquiryForm routes={publishedRoutes} destinations={destinations} />
          )}
        </section>

        <section className="admin-card">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-6">
            Day trip (legacy transactional form — WHY-83 will replace this)
          </p>
          <TransactionalInquiryForm serviceType="day_trip" destinations={destinations} />
        </section>

        <section className="admin-card">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-6">
            Consultative (guides, experiences)
          </p>
          <ConsultativeInquiryForm serviceType="guide" destinations={destinations} />
        </section>
      </div>
    </NextIntlClientProvider>
  )
}
