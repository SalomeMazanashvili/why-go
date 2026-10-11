import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import HeroPlane from './hero/HeroPlane'

// WHY-67 §1. Shorter than the viewport (~78svh) so the next section peeks —
// a deliberate scroll cue. One headline, one supporting line, one CTA.
// The CTA points at /transfers until /experiences has more than one trip.
// Server-rendered with no entrance animation: this is the LCP element.
// WHY-79: behind it, the oversized plane (HeroPlane); the only motion is the
// plane's one-time drift-in.

// The established highlight block (as on /contact): <mark>…</mark> in
// home.hero_title wraps a word in yellow with ink text, never white on
// yellow. Works at any headline length.
const mark = (chunks: ReactNode) => (
  <span className="bg-brand-yellow text-ink px-[0.08em] box-decoration-clone">{chunks}</span>
)

export default async function HomeHero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home' })
  return (
    <section className="relative min-h-[78svh] flex flex-col justify-end px-6 md:px-10 pt-28 pb-12 md:pb-16 overflow-hidden surface-dark">
      <HeroPlane />
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <h1
          className="font-black tracking-tight text-white max-w-4xl"
          style={{ fontSize: 'clamp(40px, 8vw, 96px)', letterSpacing: '-0.03em', lineHeight: 0.95 }}
        >
          {t.rich('hero_title', { mark })}
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
