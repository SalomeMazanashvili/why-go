import type { Locale } from '@/types'
import { listTours } from '@/lib/tours'
import ContactSection from '@/components/sections/ContactSection'

export const dynamic = 'force-dynamic'

export default async function ContactPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  const tours = await listTours()
  return (
    <div className="pt-24">
      <ContactSection tours={tours} locale={locale as Locale} />
    </div>
  )
}
