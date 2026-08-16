import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { DEFAULT_OG_IMAGES, breadcrumbJsonLd, canonicalFor, jsonLdScript } from '@/lib/seo'

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const t = await getTranslations({ locale, namespace: 'nav' })
  const canonical = canonicalFor(loc, '/about')
  return {
    title: t('about'),
    description: 'TODO: 140-160 char Georgian meta description for about (founders to write).',
    alternates: { canonical },
    openGraph: { url: canonical, images: DEFAULT_OG_IMAGES },
  }
}

export default async function AboutPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)

  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const loc = locale as 'en' | 'ka'
  const crumbs = breadcrumbJsonLd(loc, loc === 'ka' ? 'მთავარი' : 'Home', [
    { name: tNav('about'), path: '/about' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      <section className="pt-36 pb-20 px-6 md:px-10 bg-black min-h-screen">
        <p className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 mb-4">Our Philosophy</p>
        <h1 className="font-black uppercase text-white leading-none tracking-tight"
          style={{ fontSize: 'clamp(48px,8vw,96px)', letterSpacing: '-0.04em', lineHeight: 0.88 }}>
          EXPERIENCE<br />+ DEVELOP<br /><span className="text-yellow-400">MENT</span>
        </h1>
        <div className="mt-16 max-w-2xl">
          <p className="text-base leading-relaxed text-white/70 mb-6">
            Whygo was born in Tbilisi with a simple belief: travel should change you. Not just your photo album — but your skills, your language, your perspective on what you&apos;re capable of.
          </p>
          <p className="text-base leading-relaxed text-white/70 mb-6">
            Every tour we design pairs an unforgettable destination with a real skill — a language to learn, a dish to master, a sport to play. We call it Experience + Development.
          </p>
          <p className="text-base leading-relaxed text-white/70">
            We&apos;re a boutique Georgian agency. We keep groups small, guides personal, and itineraries honest. No tourist traps, no filler days. Just the places and skills that matter.
          </p>
        </div>
      </section>
    </>
  )
}
