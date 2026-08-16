import type { MetadataRoute } from 'next'
import { listTours } from '@/lib/tours'
import { SITE_URL } from '@/lib/seo'

// WHY-69: Georgian URLs only. English is noindex; whisky-tour is noindex.
// Under next-intl `localePrefix: 'as-needed'`, Georgian routes are served
// unprefixed.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticPaths = ['/', '/tours', '/tips', '/about', '/contact']

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'weekly',
    priority: path === '/' ? 1.0 : 0.7,
  }))

  const tourEntries: MetadataRoute.Sitemap = (await listTours()).map((tour) => ({
    url: `${SITE_URL}/tours/${tour.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticEntries, ...tourEntries]
}
