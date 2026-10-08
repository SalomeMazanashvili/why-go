import type { MetadataRoute } from 'next'
import { listTours } from '@/lib/tours'
import { listTransferRoutes } from '@/lib/transferRoutes'
import { isDayTripIndexable, listDayTrips, listExperiences } from '@/lib/services'
import { isDestinationIndexable, listDestinations } from '@/lib/destinations'
import { isReservedSlug } from '@/lib/reservedSlugs'
import { SITE_URL } from '@/lib/seo'

// WHY-69: Georgian URLs only. English is noindex; whisky-tour is noindex.
// Under next-intl `localePrefix: 'as-needed'`, Georgian routes are served
// unprefixed.
// WHY-103: rendered per request. As ISR (revalidate = 3600) Vercel cached it
// outside the page cache: on 2026-10-08 it was 27.5h old and still listed a
// deleted route, while the route's own page already 404'd. Nothing reached
// it, not revalidateContent() and not the 1h window. Its reads still go
// through the tagged Data Cache (getContentSupabase), so this costs no extra
// Supabase queries, and an admin write expires them at once.
export const dynamic = 'force-dynamic'

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

  // WHY-67: /experiences 404s while nothing linkable is published, same rule
  // as the nav item.
  const experienceEntries: MetadataRoute.Sitemap =
    (await listExperiences()).length > 0
      ? [{
          url: `${SITE_URL}/experiences`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }]
      : []

  // WHY-65: destination hubs, only once they carry 300+ words of Georgian.
  // Below that they're served noindex and kept out of here.
  const hubEntries: MetadataRoute.Sitemap = (await listDestinations())
    .filter((d) => !isReservedSlug(d.slug) && isDestinationIndexable(d))
    .map((d) => ({
      url: `${SITE_URL}/${d.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  return [
    ...staticEntries,
    ...hubEntries,
    ...tourEntries,
    ...transferRouteEntries,
    ...dayTripEntries,
    ...experienceEntries,
  ]
}
