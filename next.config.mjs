import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // WHY-114: the Edinburgh whisky tour (Sept/Oct 2025) is over and its page
  // is retired. Instagram and old links still point at it, so send them to
  // /tours permanently (308) instead of a 404. Copy and itinerary are archived
  // in docs/whisky-tour-2025/.
  async redirects() {
    return [
      { source: '/whisky-tour', destination: '/tours', permanent: true },
      { source: '/whisky-tour/:path*', destination: '/tours', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default withNextIntl(nextConfig)
