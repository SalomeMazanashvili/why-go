import type { Metadata } from 'next'
import type { Locale } from '@/types'
import { getNewsTitle, getNewsExcerpt } from '@/types'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { listNews } from '@/lib/news'
import { DEFAULT_OG_IMAGES, breadcrumbJsonLd, canonicalFor, jsonLdScript } from '@/lib/seo'

export const revalidate = 3600

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const t = await getTranslations({ locale, namespace: 'nav' })
  const canonical = canonicalFor(loc, '/tips')
  return {
    title: t('tips'),
    description: 'TODO: 140-160 char Georgian meta description for tips (founders to write).',
    alternates: { canonical },
    openGraph: { url: canonical, images: DEFAULT_OG_IMAGES },
  }
}

export default async function TipsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)

  const loc = locale as Locale
  const [articles, tNav] = await Promise.all([
    listNews(),
    getTranslations({ locale, namespace: 'nav' }),
  ])
  const crumbs = breadcrumbJsonLd(loc as 'en' | 'ka', loc === 'ka' ? 'მთავარი' : 'Home', [
    { name: tNav('tips'), path: '/tips' },
  ])

  if (articles.length === 0) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
        />
        <section className="pt-36 pb-20 px-6 md:px-10 bg-white min-h-screen">
          <p className="text-[10px] font-bold tracking-widest uppercase text-black/40 mb-4">Travel Intelligence</p>
          <h1 className="font-black uppercase text-black leading-none tracking-tight mb-8"
            style={{ fontSize: 'clamp(48px,8vw,80px)', letterSpacing: '-0.04em' }}>
            TIPS &amp;<br />STORIES
          </h1>
          <p className="text-sm text-black/60 max-w-md">
            No articles yet. Check back soon.
          </p>
        </section>
      </>
    )
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      <section className="pt-36 pb-20 px-6 md:px-10 bg-white min-h-screen">
      <p className="text-[10px] font-bold tracking-widest uppercase text-black/40 mb-4">Travel Intelligence</p>
      <h1 className="font-black uppercase text-black leading-none tracking-tight mb-16"
        style={{ fontSize: 'clamp(48px,8vw,80px)', letterSpacing: '-0.04em' }}>
        TIPS &amp;<br />STORIES
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5">
        {articles.map(article => (
          <Link key={article.id} href={`/tips/${article.slug}`} className="group block bg-black overflow-hidden">
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image src={article.cover_image ?? ''} alt={getNewsTitle(article, loc)} fill
                className="object-cover opacity-70 group-hover:opacity-90 group-hover:scale-[1.04] transition-all duration-700"
                sizes="(max-width:768px) 100vw, 33vw" />
            </div>
            <div className="p-6">
              <p className="text-[9px] font-bold tracking-widest uppercase text-yellow-400 mb-2">{article.tag_en}</p>
              <h3 className="font-black text-lg text-white leading-tight tracking-tight">{getNewsTitle(article, loc)}</h3>
              <p className="text-sm text-white/40 mt-3 leading-relaxed line-clamp-2">{getNewsExcerpt(article, loc)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
    </>
  )
}
