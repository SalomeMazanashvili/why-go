import type { Metadata } from 'next'
import type { Locale } from '@/types'
import { setRequestLocale } from 'next-intl/server'
import { listTours } from '@/lib/tours'
import { listNews } from '@/lib/news'
import { listDestinations } from '@/lib/destinations'
import { listExperiences } from '@/lib/services'
import { listGuides } from '@/lib/guides'
import { GUIDES_PAGE_LIVE } from '@/lib/nav'
import { canonicalFor, SITE_NAME } from '@/lib/seo'
import HomeHero from '@/components/home/HomeHero'
import {
  BlogSection,
  CitiesSection,
  ExperiencesSection,
  GuidesSection,
  ToursSection,
  TransfersBanner,
} from '@/components/home/HomeSections'

export const revalidate = 3600 // 1h; admin publish triggers revalidatePath on top

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const canonical = canonicalFor(loc, '/')
  return {
    // Homepage uses the layout's default title (SITE_NAME) — no override so
    // the template `%s · WHYGO` isn't applied to just `WHYGO · WHYGO`.
    title: SITE_NAME,
    description: 'TODO: 140-160 char Georgian meta description for the home page (founders to write).',
    alternates: { canonical },
    openGraph: { url: canonical },
  }
}

// WHY-67: section order and content from docs/whygo-homepage-brief.md. Most
// sources are near-empty at launch; each section hides itself when empty.
// The footer (§8) is the shared site footer.
export default async function HomePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const loc = locale as Locale

  const [tours, destinations, experiences, guides, news] = await Promise.all([
    listTours(),
    listDestinations(),
    listExperiences(),
    GUIDES_PAGE_LIVE ? listGuides() : Promise.resolve([]),
    listNews(),
  ])

  return (
    <>
      <HomeHero locale={locale} />
      <ToursSection tours={tours} locale={loc} />
      <CitiesSection destinations={destinations} experiences={experiences} locale={loc} />
      <TransfersBanner locale={loc} />
      <ExperiencesSection experiences={experiences} destinations={destinations} locale={loc} />
      <GuidesSection guides={guides} enabled={GUIDES_PAGE_LIVE} locale={loc} />
      <BlogSection posts={news} locale={loc} />
    </>
  )
}
