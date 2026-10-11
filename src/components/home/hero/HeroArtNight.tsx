import type { ClockCity } from '@/lib/cityClocks'
import HeroArtScale from './HeroArtScale'
import WorldClocks from './WorldClocks'

// WHY-79, direction D: "Night on Earth". C's oversized plane, a pool of
// wall light like the film's lit clock wall, and the clocks themselves.
// The clocks sit in normal flow above the headline (HomeHero places them),
// so they can never cover text; the hero grows if a headline runs long.
export function HeroNightBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="hero-fade absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 72% 22%, rgba(252,204,1,0.10), rgba(252,204,1,0.03) 45%, transparent 70%)',
        }}
      />
      <HeroArtScale />
    </>
  )
}

export function HeroNightClocks({ cities }: { cities: ClockCity[] }) {
  return (
    <div className="relative z-10 max-w-6xl mx-auto w-full mb-10 md:mb-14 flex md:justify-end">
      <WorldClocks cities={cities} />
    </div>
  )
}
