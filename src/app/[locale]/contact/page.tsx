import { STATIC_TOURS } from '@/types'
import type { Locale } from '@/types'
import ContactSection from '@/components/sections/ContactSection'

export default function ContactPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <div className="pt-24">
      <ContactSection tours={STATIC_TOURS} locale={locale as Locale} />
    </div>
  )
}
