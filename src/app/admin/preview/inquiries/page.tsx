import Link from 'next/link'
import { NextIntlClientProvider } from 'next-intl'
import { requireAdmin } from '@/lib/adminAuth'
import { listDestinationsForAdmin } from '@/lib/destinations'
import { TransactionalInquiryForm } from '@/components/forms/TransactionalInquiryForm'
import { ConsultativeInquiryForm } from '@/components/forms/ConsultativeInquiryForm'
import kaMessages from '../../../../../messages/ka.json'
import enMessages from '../../../../../messages/en.json'

// Founder-only preview page: mounts both inquiry forms with real destination
// data so the flow can be walked end-to-end before WHY-65 wires them onto
// public service detail pages. Behind requireAdmin so nothing leaks to
// customers before we're ready.
//
// Admin routes live outside the [locale] tree so the NextIntlClientProvider
// from the public layout isn't in scope. The form components call
// useTranslations('inquiry'), so we wrap them in a local provider with
// both message bundles loaded — founders can preview either locale from
// this page via ?locale=en without leaving admin.

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ locale?: string }>
}

export default async function InquiryPreviewPage(props: Props) {
  await requireAdmin()
  const [{ locale = 'ka' }, destinations] = await Promise.all([
    props.searchParams,
    listDestinationsForAdmin(),
  ])
  const messages = locale === 'en' ? enMessages : kaMessages

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="p-8 lg:p-12 space-y-16">
        <header>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Preview</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Inquiry forms</h1>
          <p className="text-white/50 text-sm mt-3 max-w-2xl">
            Both forms in the request-to-book system. Submitting here writes to <span className="font-mono">inquiries</span>{' '}
            and (in production) triggers founder notification + customer confirmation emails. Rate-limited to 5 per minute
            per IP. Turnstile only renders in production. Real integration onto service pages ships in WHY-65.
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
              → Admin inquiries list (empty until PR C)
            </Link>
          </p>
        </header>

        <section className="admin-card">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-6">
            Transactional (transfers, day trips)
          </p>
          <TransactionalInquiryForm
            serviceType="transfer"
            destinations={destinations}
          />
        </section>

        <section className="admin-card">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-6">
            Consultative (guides, experiences)
          </p>
          <ConsultativeInquiryForm
            serviceType="guide"
            destinations={destinations}
          />
        </section>
      </div>
    </NextIntlClientProvider>
  )
}
