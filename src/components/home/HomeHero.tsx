import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import HeroArtFlight from './hero/HeroArtFlight'
import HeroArtRoutes from './hero/HeroArtRoutes'
import HeroArtScale from './hero/HeroArtScale'

// WHY-67 §1. Shorter than the viewport (~78svh) so the next section peeks —
// a deliberate scroll cue. One headline, one supporting line, one CTA.
// The CTA points at /transfers until /experiences has more than one trip.
// Server-rendered with no entrance animation: this is the LCP element.
//
// WHY-79 companion: `variant` picks the graphic treatment behind it. 'grid'
// is what ships today; 'flight' / 'routes' / 'scale' are directions A–C,
// previewed at /hero-preview and not yet chosen. All of them are inline SVG
// (aria-hidden, no requests, never the LCP element); the headline sits
// above them and keeps 4.5:1+.
export type HeroVariant = 'grid' | 'flight' | 'routes' | 'scale'

// The established highlight block (as on /contact): <mark>…</mark> in the
// message wraps a word in yellow with ink text, never white on yellow.
const mark = (chunks: ReactNode) => (
  <span className="bg-brand-yellow text-ink px-[0.08em] box-decoration-clone">{chunks}</span>
)

export default async function HomeHero({
  locale,
  variant = 'grid',
  title,
}: {
  locale: string
  variant?: HeroVariant
  // Preview only: a stand-in headline to test one- and three-line lengths.
  title?: ReactNode
}) {
  const t = await getTranslations({ locale, namespace: 'home' })
  return (
    <section className="relative min-h-[78svh] flex flex-col justify-end px-6 md:px-10 pt-28 pb-12 md:pb-16 overflow-hidden surface-dark">
      {variant === 'grid' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 79px,rgba(252,204,1,0.04) 80px),repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(252,204,1,0.04) 80px)',
          }}
        />
      )}
      {variant === 'flight' && <HeroArtFlight />}
      {variant === 'scale' && <HeroArtScale />}
      {/* B lives in the free space above the text, never behind it. */}
      {variant === 'routes' && (
        <div className="relative flex-1 min-h-0 -mx-6 md:-mx-10 mb-8 md:mb-10">
          <HeroArtRoutes />
        </div>
      )}
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <h1
          className="font-black tracking-tight text-white max-w-4xl"
          style={{ fontSize: 'clamp(40px, 8vw, 96px)', letterSpacing: '-0.03em', lineHeight: 0.95 }}
        >
          {title ?? t.rich('hero_title', { mark })}
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
