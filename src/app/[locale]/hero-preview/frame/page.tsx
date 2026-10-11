import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import HomeHero, { type HeroVariant } from '@/components/home/HomeHero'
import { HEADLINES, HEADLINE_KEYS, VARIANTS, type HeadlineKey } from '../headlines'

// WHY-79 preview only (not for merge): one hero, as the homepage renders
// it, with the next section peeking below. Loaded in iframes by the board.
//   ?v=flight|routes|scale|grid  &h=placeholder|one|three  &mark=1
export const metadata: Metadata = { title: 'Hero preview', robots: { index: false, follow: false } }

export default async function HeroPreviewFrame(props: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ v?: string; h?: string; mark?: string }>
}) {
  const { locale } = await props.params
  const sp = await props.searchParams
  setRequestLocale(locale)
  const variant = (VARIANTS.find((x) => x.key === sp.v)?.key ?? 'flight') as HeroVariant
  const h = (HEADLINE_KEYS.includes(sp.h as HeadlineKey) ? sp.h : 'placeholder') as HeadlineKey
  const t = await getTranslations({ locale, namespace: 'home' })

  let title: React.ReactNode = undefined
  if (h !== 'placeholder') {
    const text: string = HEADLINES[h]
    if (sp.mark === '1') {
      // The /contact highlight block on the last word, as <mark> would give.
      const cut = text.lastIndexOf(' ')
      title = (
        <>
          {text.slice(0, cut + 1)}
          <span className="bg-brand-yellow text-ink px-[0.08em] box-decoration-clone">{text.slice(cut + 1)}</span>
        </>
      )
    } else {
      title = text
    }
  }

  return (
    <>
      <HomeHero locale={locale} variant={variant} title={title} />
      {/* Stand-in for section 2, so the peek below the hero is visible. */}
      <section className="surface-light px-6 md:px-10 py-16 md:py-20 border-t border-line">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black tracking-tight leading-none text-3xl md:text-5xl mb-8">{t('tours_title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/3] bg-raised border border-line" />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
