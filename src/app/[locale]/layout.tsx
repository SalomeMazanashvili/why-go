import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
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

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { template: '%s | Whygo', default: 'Whygo — Experience + Development Travel' },
  description: 'Boutique tours built around language, sport, and culinary skills.',
}

const locales = ['en', 'ka']

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout(
  props: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
  }
) {
  const params = await props.params;

  const {
    locale
  } = params;

  const {
    children
  } = props;

  if (!locales.includes(locale)) notFound()
  const messages = await getMessages()

  return (
    <html lang={locale} className={firago.variable}>
      <body className="font-sans bg-black text-white antialiased">
        <NextIntlClientProvider messages={messages}>
          <Navbar locale={locale} />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
