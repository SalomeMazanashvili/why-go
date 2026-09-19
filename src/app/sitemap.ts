import type { MetadataRoute } from 'next'
import { listTours } from '@/lib/tours'
import { listTransferRoutes } from '@/lib/transferRoutes'
import { isDayTripIndexable, listDayTrips } from '@/lib/services'
import { SITE_URL } from '@/lib/seo'

// WHY-69: Georgian URLs only. English is noindex; whisky-tour is noindex.
// Under next-intl `localePrefix: 'as-needed'`, Georgian routes are served
// unprefixed.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticPaths = ['/', '/tours', '/tips', '/about', '/contact', '/transfers']

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1.0 : 0.7,
  }))

  const tourEntries: MetadataRoute.Sitemap = (await listTours()).map((tour) => ({
    url: `${SITE_URL}/tours/${tour.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  // WHY-68 PR B: published transfer routes. listTransferRoutes filters
  // is_published so unpublished draft routes never enter the sitemap.
  const transferRouteEntries: MetadataRoute.Sitemap = (await listTransferRoutes()).map(
    (route) => ({
      url: `${SITE_URL}/transfers/${route.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
  )

  // WHY-83 PR B: day trips. The index only exists once something is
  // published (it 404s otherwise), and detail pages under 300 words of
  // Georgian are noindex — the same isDayTripIndexable check the page uses.
  const dayTrips = await listDayTrips()
  const indexableDayTrips = dayTrips.filter(isDayTripIndexable)
  const dayTripEntries: MetadataRoute.Sitemap = [
    ...(dayTrips.length > 0
      ? [{
          url: `${SITE_URL}/day-trips`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }]
      : []),
    ...indexableDayTrips.map((trip) => ({
      url: `${SITE_URL}/day-trips/${trip.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]

  return [...staticEntries, ...tourEntries, ...transferRouteEntries, ...dayTripEntries]
}
