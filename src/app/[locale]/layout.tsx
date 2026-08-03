import type { Metadata } from 'next'
import { Noto_Sans_Georgian } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import '../globals.css'

// Georgian-first: Noto Sans Georgian is the primary family. Latin characters
// (product names, English `/en/*` routes) fall through the CSS font cascade
// to the system sans-serif — see `sans` in tailwind.config.ts.
const notoSansGeorgian = Noto_Sans_Georgian({
  subsets: ['georgian'],
  variable: '--font-georgian',
  weight: ['400', '700', '900'],
  display: 'swap',
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
    <html lang={locale} className={notoSansGeorgian.variable}>
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
