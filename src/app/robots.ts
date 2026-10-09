import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /en is noindex via meta tags (crawl-time signal; /whisky-tour now
        // 308s to /tours, WHY-114). Blocking /admin and /api at the robots level prevents
        // wasteful crawls of routes that will 401 or 405 anyway.
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
