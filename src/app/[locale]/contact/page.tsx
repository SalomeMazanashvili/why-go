import type { Metadata } from 'next'
import type { Locale } from '@/types'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { listTours } from '@/lib/tours'
import { breadcrumbJsonLd, canonicalFor, jsonLdScript } from '@/lib/seo'
import ContactSection from '@/components/sections/ContactSection'

export const revalidate = 3600

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const t = await getTranslations({ locale, namespace: 'nav' })
  const canonical = canonicalFor(loc, '/contact')
  return {
    title: t('contact'),
    description: 'TODO: 140-160 char Georgian meta description for contact (founders to write).',
    alternates: { canonical },
    openGraph: { url: canonical },
  }
}

export default async function ContactPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)

  const [tours, tNav] = await Promise.all([
    listTours(),
    getTranslations({ locale, namespace: 'nav' }),
  ])
  const loc = locale as 'en' | 'ka'
  const crumbs = breadcrumbJsonLd(loc, loc === 'ka' ? 'მთავარი' : 'Home', [
    { name: tNav('contact'), path: '/contact' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      <div className="pt-24">
        <ContactSection tours={tours} locale={locale as Locale} />
      </div>
    </>
  )
}
