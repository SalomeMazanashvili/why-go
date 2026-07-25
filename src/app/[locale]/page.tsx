import type { Locale } from '@/types'
import { listTours } from '@/lib/tours'
import { listNews } from '@/lib/news'
import HeroSection from '@/components/sections/HeroSection'
import MarqueeStrip from '@/components/sections/MarqueeStrip'
import ToursGrid from '@/components/sections/ToursGrid'
import AboutSection from '@/components/sections/AboutSection'
import BlogSection from '@/components/sections/BlogSection'
import ContactSection from '@/components/sections/ContactSection'

export const dynamic = 'force-dynamic'

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
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
