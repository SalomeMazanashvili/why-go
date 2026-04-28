import { STATIC_TOURS, STATIC_NEWS } from '@/types'
import type { Locale } from '@/types'
import HeroSection from '@/components/sections/HeroSection'
import MarqueeStrip from '@/components/sections/MarqueeStrip'
import ToursGrid from '@/components/sections/ToursGrid'
import AboutSection from '@/components/sections/AboutSection'
import BlogSection from '@/components/sections/BlogSection'
import ContactSection from '@/components/sections/ContactSection'

export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <>
      <HeroSection locale={locale as Locale} />
      <MarqueeStrip tours={STATIC_TOURS} locale={locale as Locale} />
      <ToursGrid tours={STATIC_TOURS} locale={locale as Locale} />
      <AboutSection locale={locale as Locale} />
      <BlogSection news={STATIC_NEWS} locale={locale as Locale} />
      <ContactSection tours={STATIC_TOURS} locale={locale as Locale} />
    </>
  )
}
