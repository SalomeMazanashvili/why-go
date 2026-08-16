import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { listTours } from '@/lib/tours'
import { breadcrumbJsonLd, canonicalFor, jsonLdScript } from '@/lib/seo'
import ToursGridClient from './ToursGridClient'

export const revalidate = 3600

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const t = await getTranslations({ locale, namespace: 'nav' })
  const canonical = canonicalFor(loc, '/tours')
  return {
    title: t('tours'),
    description: 'TODO: 140-160 char Georgian meta description for tours listing (founders to write).',
    alternates: { canonical },
    openGraph: { url: canonical },
  }
}

export default async function ToursPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)

  const [tours, t, tNav] = await Promise.all([
    listTours(),
    getTranslations({ locale, namespace: 'tours' }),
    getTranslations({ locale, namespace: 'nav' }),
  ])
  const loc = locale as 'en' | 'ka'
  const crumbs = breadcrumbJsonLd(loc, loc === 'ka' ? 'მთავარი' : 'Home', [
    { name: tNav('tours'), path: '/tours' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      <section className="pt-36 pb-16 px-6 md:px-10 bg-black">
        <p className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 mb-4">{t('section_tag')}</p>
        <h1 className="font-black uppercase text-white leading-none tracking-tight"
          style={{ fontSize: 'clamp(52px,8vw,96px)', letterSpacing: '-0.04em' }}>
          {t('section_title_1')}<br />{t('section_title_2')}
        </h1>
      </section>

      <ToursGridClient tours={tours} locale={locale} />
    </>
  )
}
