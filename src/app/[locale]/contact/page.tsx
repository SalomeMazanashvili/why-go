import type { Locale } from '@/types'
import { setRequestLocale } from 'next-intl/server'
import { listTours } from '@/lib/tours'
import ContactSection from '@/components/sections/ContactSection'

export const revalidate = 3600

export default async function ContactPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)

  const tours = await listTours()
  return (
    <div className="pt-24">
      <ContactSection tours={tours} locale={locale as Locale} />
    </div>
  )
}
