import type { Metadata } from 'next'
import type { Locale } from '@/types'
import { setRequestLocale } from 'next-intl/server'
import { listTours } from '@/lib/tours'
import { listNews } from '@/lib/news'
import { canonicalFor, SITE_NAME } from '@/lib/seo'
import HeroSection from '@/components/sections/HeroSection'
import MarqueeStrip from '@/components/sections/MarqueeStrip'
import ToursGrid from '@/components/sections/ToursGrid'
import AboutSection from '@/components/sections/AboutSection'
import BlogSection from '@/components/sections/BlogSection'
import ContactSection from '@/components/sections/ContactSection'

export const revalidate = 3600 // 1h; admin publish triggers revalidatePath on top

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const canonical = canonicalFor(loc, '/')
  return {
    // Homepage uses the layout's default title (SITE_NAME) — no override so
    // the template `%s · Why Go` isn't applied to just `Why Go · Why Go`.
    title: SITE_NAME,
    description: 'TODO: 140-160 char Georgian meta description for the home page (founders to write).',
    alternates: { canonical },
    openGraph: { url: canonical },
  }
}

export default async function HomePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)

  const [tours, news] = await Promise.all([listTours(), listNews()])
  return (
    <>
      <HeroSection locale={locale as Locale} />
      <MarqueeStrip tours={tours} locale={locale as Locale} />
      <ToursGrid tours={tours} locale={locale as Locale} />
      <AboutSection locale={locale as Locale} />
      <BlogSection news={news} locale={locale as Locale} />
      <ContactSection tours={tours} locale={locale as Locale} />
    </>
  )
}
