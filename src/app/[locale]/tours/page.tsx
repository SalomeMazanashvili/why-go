import { getTranslations } from 'next-intl/server'
import { listTours } from '@/lib/tours'
import ToursGridClient from './ToursGridClient'

export const dynamic = 'force-dynamic'

export default async function ToursPage({ params: { locale } }: { params: { locale: string } }) {
  const [tours, t] = await Promise.all([
    listTours(),
    getTranslations({ locale, namespace: 'tours' }),
  ])

  return (
    <>
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
