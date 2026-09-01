import type { MetadataRoute } from 'next'
import { listTours } from '@/lib/tours'
import { listTransferRoutes } from '@/lib/transferRoutes'
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

  return [...staticEntries, ...tourEntries, ...transferRouteEntries]
}
