import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { HEADLINES, VARIANTS } from './headlines'

// WHY-79 preview board (not for merge): directions A–C, plus today's hero,
// each at 380px and 1440px with a one-line and a three-line headline. Every
// frame is the real homepage hero rendered at that viewport; the 1440px
// ones are scaled down to fit the board.
export const metadata: Metadata = { title: 'Hero directions', robots: { index: false, follow: false } }

const PHONE = { w: 380, h: 780 }
const DESK = { w: 1440, h: 900, scale: 0.42 }

export default async function HeroPreviewBoard(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const base = locale === 'en' ? '/en/hero-preview/frame' : '/hero-preview/frame'
  const frames = [
    { label: '380 · one line', line: 'one', mark: false, ...PHONE },
    { label: '380 · three lines + highlight', line: 'three', mark: true, ...PHONE },
    { label: '1440 · one line', line: 'one', mark: false, ...DESK },
    { label: '1440 · three lines + highlight', line: 'three', mark: true, ...DESK },
  ] as const

  return (
    <div className="surface-light min-h-screen px-6 md:px-10 pt-28 pb-24">
      <header className="max-w-3xl mb-12">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-3">WHY-79 · not for merge</p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Hero directions</h1>
        <p className="text-fg leading-relaxed">
          Three graphic treatments for the homepage hero, each shown at 380px and 1440px, with a
          one-line and a three-line headline. Each frame is the real hero at that viewport width
          (open it to see it full size). Motion plays once on load; reload a frame to replay it.
          No direction is chosen.
        </p>
        <p className="text-sm text-muted leading-relaxed mt-3">
          Headline stand-ins for length only, taken from existing founder copy: “{HEADLINES.one}”,
          “{HEADLINES.three}”. The highlighted last word shows the
          /contact highlight block. The live headline is still the WHY-79 placeholder:{' '}
          <a className="underline" href={`${base}?v=flight`}>A</a> ·{' '}
          <a className="underline" href={`${base}?v=routes`}>B</a> ·{' '}
          <a className="underline" href={`${base}?v=scale`}>C</a>.
        </p>
      </header>

      {VARIANTS.map((v) => (
        <section key={v.key} className="mb-20" aria-labelledby={`dir-${v.key}`}>
          <h2 id={`dir-${v.key}`} className="text-2xl md:text-3xl font-black tracking-tight mb-6">{v.label}</h2>
          <div className="flex flex-wrap gap-6 items-start">
            {frames.map((f) => {
              const src = `${base}?v=${v.key}&h=${f.line}${f.mark ? '&mark=1' : ''}`
              const s = 'scale' in f ? f.scale : 1
              return (
                <figure key={f.label} className="m-0">
                  <figcaption className="text-[11px] font-bold tracking-widest uppercase text-muted mb-2">
                    <a href={src} className="hover:underline">{f.label} ↗</a>
                  </figcaption>
                  <div
                    className="overflow-hidden border border-line bg-ink"
                    style={{ width: f.w * s, height: f.h * s }}
                  >
                    <iframe
                      src={src}
                      title={`${v.label}, ${f.label}`}
                      width={f.w}
                      height={f.h}
                      loading="lazy"
                      style={{ transform: `scale(${s})`, transformOrigin: '0 0', border: 0 }}
                    />
                  </div>
                </figure>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
