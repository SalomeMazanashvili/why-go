import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

// WHY-67 §1. Shorter than the viewport (~78svh) so the next section peeks —
// a deliberate scroll cue. One headline, one supporting line, one CTA.
// The CTA points at /transfers until /experiences has more than one trip.
// Server-rendered with no entrance animation: this is the LCP element.
export default async function HomeHero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home' })
  return (
    <section className="relative min-h-[78svh] flex flex-col justify-end px-6 md:px-10 pt-28 pb-12 md:pb-16 overflow-hidden surface-dark">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg,transparent,transparent 79px,rgba(252,204,1,0.04) 80px),repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(252,204,1,0.04) 80px)',
        }}
      />
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <h1
          className="font-black tracking-tight text-white max-w-4xl"
          style={{ fontSize: 'clamp(40px, 8vw, 96px)', letterSpacing: '-0.03em', lineHeight: 0.95 }}
        >
          {t('hero_title')}
        </h1>
        <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-white/70">
          {t('hero_sub')}
        </p>
        <Link
          href="/transfers"
          className="mt-8 inline-flex items-center min-h-[48px] bg-brand-yellow text-ink font-black text-[12px] tracking-widest uppercase px-8 hover:brightness-110 transition-colors"
        >
          {t('hero_cta')}
        </Link>
      </div>
    </section>
  )
}
