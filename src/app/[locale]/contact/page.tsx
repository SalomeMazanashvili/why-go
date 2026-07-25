import type { Locale } from '@/types'
import { listTours } from '@/lib/tours'
import ContactSection from '@/components/sections/ContactSection'

export const dynamic = 'force-dynamic'

export default async function ContactPage({ params: { locale } }: { params: { locale: string } }) {
  const tours = await listTours()
  return (
    <div className="pt-24">
      <ContactSection tours={tours} locale={locale as Locale} />
    </div>
  )
}
