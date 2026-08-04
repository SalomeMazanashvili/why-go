import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  SITE_NAME,
  SITE_URL,
  canonicalFor,
  orgJsonLd,
  webSiteJsonLd,
  jsonLdScript,
} from '@/lib/seo'
import '../globals.css'

// Self-hosted via @fontsource/firago. The `latin` subset files carry both
// Latin and Georgian glyphs (~2.5k in cmap incl. full Mkhedruli) — one
// download covers both scripts for the whole public site.
const firago = localFont({
  variable: '--font-firago',
  display: 'swap',
  src: [
    {
      path: '../../../node_modules/@fontsource/firago/files/firago-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../node_modules/@fontsource/firago/files/firago-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../../node_modules/@fontsource/firago/files/firago-latin-900-normal.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
})

const locales = ['en', 'ka']

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

// Per-locale layout metadata. English is `noindex, follow` so the language
// toggle keeps passing signal back to the Georgian tree without asking
// Google to index English pages (see WHY-69: English SEO is unwinnable for
// our market; Georgian is primary).
export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  return {
    metadataBase: new URL(SITE_URL),
    title: { template: `%s · ${SITE_NAME}`, default: SITE_NAME },
    description: 'TODO: 140-160 char Georgian site description (founders to write).',
    alternates: { canonical: canonicalFor(loc, '/') },
    robots: loc === 'en' ? { index: false, follow: true } : undefined,
    openGraph: {
      siteName: SITE_NAME,
      type: 'website',
      locale: loc === 'ka' ? 'ka_GE' : 'en',
      url: canonicalFor(loc, '/'),
    },
  }
}

export default async function LocaleLayout(
  props: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
  }
) {
  const { locale } = await props.params
  const { children } = props

  if (!locales.includes(locale)) notFound()
  // Required by next-intl for statically-rendered routes; without this,
  // rendering silently falls back to dynamic and WHY-74 achieves nothing.
  setRequestLocale(locale)
  const messages = await getMessages()
  const loc = locale as 'en' | 'ka'

  return (
    <html lang={locale} className={firago.variable}>
      <body className="font-sans bg-black text-white antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(orgJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(webSiteJsonLd(loc)) }}
        />
        <NextIntlClientProvider messages={messages}>
          <Navbar locale={locale} />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
