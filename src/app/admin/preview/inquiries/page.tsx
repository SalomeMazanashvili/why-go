import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listDestinationsForAdmin } from '@/lib/destinations'
import { TransactionalInquiryForm } from '@/components/forms/TransactionalInquiryForm'
import { ConsultativeInquiryForm } from '@/components/forms/ConsultativeInquiryForm'

// Founder-only preview page: mounts both inquiry forms with real destination
// data so the flow can be walked end-to-end before WHY-65 wires them onto
// public service detail pages. Behind requireAdmin so nothing leaks to
// customers before we're ready.

export const dynamic = 'force-dynamic'

export default async function InquiryPreviewPage() {
  await requireAdmin()
  const destinations = await listDestinationsForAdmin()

  return (
    <div className="p-8 lg:p-12 space-y-16">
      <header>
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Preview</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Inquiry forms</h1>
        <p className="text-white/50 text-sm mt-3 max-w-2xl">
          Both forms in the request-to-book system. Submitting here writes to <span className="font-mono">inquiries</span>{' '}
          and (in production) triggers founder notification + customer confirmation emails. Rate-limited to 5 per minute
          per IP. Turnstile only renders in production. Real integration onto service pages ships in WHY-65.
        </p>
        <p className="text-white/40 text-xs mt-3">
          <Link href="/admin/inquiries" className="hover:text-[#FFCC00]">
            → View admin inquiries list (empty until PR C)
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
  )
}
