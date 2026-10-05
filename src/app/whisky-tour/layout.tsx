import type { Metadata } from 'next'
import { Bebas_Neue, DM_Sans, Playfair_Display } from 'next/font/google'
import { SITE_URL } from '@/lib/seo'
import '../globals.css'

// preload: false — both this layout and [locale]/layout import globals.css,
// so Turbopack puts these @font-face rules in a CSS chunk shared with the
// Georgian site, and every Georgian page preloaded ~80KB of these fonts.
// Without preload they download only where used (this page).
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
  preload: false,
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: false,
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['italic'],
  display: 'swap',
  preload: false,
})

// WHY-69: legacy English-only landing page — same noindex treatment as
// /en/*. `follow: true` preserves any internal link signal back to the
// Georgian tree; kept out of sitemap.ts entirely.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Whisky Tour | WHYGO',
  description:
    'An exclusive guided whisky tour — expert guides, authentic distilleries, unforgettable tastings.',
  robots: { index: false, follow: true },
}

export default function WhiskyTourLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable} ${playfair.variable}`}>
      <body
        className="antialiased"
        style={{
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
          margin: 0,
        }}
      >
        {children}
      </body>
    </html>
  )
}
