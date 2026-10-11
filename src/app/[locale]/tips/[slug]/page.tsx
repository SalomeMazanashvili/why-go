import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getNewsBySlug, isNewsIndexable } from '@/lib/news'
import { getDestinationById } from '@/lib/destinations'
import { listServices } from '@/lib/services'
import { listTransferRoutes } from '@/lib/transferRoutes'
import { alsoInDestination, listRelatedRefs, resolveRefs } from '@/lib/serviceLinks'
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  canonicalFor,
  DEFAULT_OG_IMAGES,
  jsonLdScript,
} from '@/lib/seo'
import ServiceLinkList from '@/components/services/ServiceLinkList'
import { getDestinationName, getNewsExcerpt, getNewsTitle, type Locale } from '@/types'

// WHY-118: the article page. /tips, the homepage blog section and the hubs
// all link here. Same ISR shape as the other detail pages: nothing
// prerendered at build, each slug renders on first request, admin writes
// expire it through revalidateContent().
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

// The body is plain text from the admin textarea: paragraphs are separated
// by a blank line, and a paragraph starting with "## " is a subheading.
type Block = { kind: 'h2' | 'p'; text: string }
function blocks(text: string): Block[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith('## ') ? { kind: 'h2', text: p.slice(3).trim() } : { kind: 'p', text: p }))
}

function body(article: { content_ka?: string; content_en?: string }, loc: Locale) {
  return (loc === 'ka' ? article.content_ka || article.content_en : article.content_en || article.content_ka) ?? ''
}

export async function generateMetadata(
  props: { params: Promise<{ locale: string; slug: string }> },
): Promise<Metadata> {
  const { locale, slug } = await props.params
  const loc = (locale === 'en' ? 'en' : 'ka') as 'en' | 'ka'
  const article = await getNewsBySlug(slug)
  if (!article) return { title: 'Not found' }

  const title = getNewsTitle(article, loc)
  const description = getNewsExcerpt(article, loc) || title
  const canonical = canonicalFor(loc, `/tips/${slug}`)

  return {
    title,
    description,
    alternates: { canonical },
    // Rule 5: without a Georgian title, excerpt and 300+ words of Georgian
    // body the article is served noindex and left out of the sitemap. The
    // key must be absent otherwise so the layout's English noindex applies.
    ...(isNewsIndexable(article) ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      publishedTime: article.published_at,
      ...(article.updated_at ? { modifiedTime: article.updated_at } : {}),
      images: article.cover_image ? [{ url: article.cover_image }] : DEFAULT_OG_IMAGES,
    },
  }
}

export default async function ArticlePage(
  props: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await props.params
  setRequestLocale(locale)
  const loc = locale as Locale

  const article = await getNewsBySlug(slug)
  if (!article) notFound()

  const [refs, services, routes, destination, t, tNav] = await Promise.all([
    listRelatedRefs(article.id),
    listServices(),
    listTransferRoutes(),
    article.destination_id ? getDestinationById(article.destination_id) : Promise.resolve(null),
    getTranslations({ locale, namespace: 'article_page' }),
    getTranslations({ locale, namespace: 'nav' }),
  ])
  // getDestinationById doesn't filter drafts; never surface an unpublished one.
  const hub = destination?.is_published ? destination : null

  // The editor's picks, minus anything unpublished since (never a 404).
  const related = resolveRefs(refs, services, routes)
  // §9 cross-sell, below the article and separate from the picks.
  const alsoIn = hub
    ? alsoInDestination(hub.id, services, routes, new Set(related.map((l) => l.id)))
    : []

  const title = getNewsTitle(article, loc)
  const excerpt = getNewsExcerpt(article, loc)
  const content = blocks(body(article, loc))
  const published = new Date(article.published_at)
  const dateLabel = Number.isNaN(published.getTime())
    ? null
    : published.toLocaleDateString(loc === 'ka' ? 'ka-GE' : 'en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Tbilisi',
      })

  const crumbs = breadcrumbJsonLd(loc as 'en' | 'ka', loc === 'ka' ? 'მთავარი' : 'Home', [
    { name: tNav('tips'), path: '/tips' },
    { name: title, path: `/tips/${slug}` },
  ])
  const posting = blogPostingJsonLd({
    locale: loc as 'en' | 'ka',
    path: `/tips/${slug}`,
    headline: title,
    description: excerpt || title,
    image: article.cover_image,
    author: article.author,
    datePublished: article.published_at,
    dateModified: article.updated_at,
  })

  return (
    <div className="surface-light min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(posting) }}
      />

      <article className="max-w-3xl mx-auto px-6 md:px-12 pt-24 pb-16">
        {/* A single back link, not a landmark (axe landmark-unique). */}
        <p className="mb-8 text-[10px] font-bold tracking-widest uppercase text-muted">
          <Link href="/tips" className="hover:underline decoration-brand-yellow decoration-2 underline-offset-4">
            ← {tNav('tips')}
          </Link>
        </p>

        <header className="mb-10">
          {/* Every post links back to its city's hub (content architecture). */}
          {hub && (
            <p className="text-[10px] font-bold tracking-widest uppercase text-accent mb-3">
              <Link
                href={`/${hub.slug}`}
                className="hover:underline decoration-brand-yellow decoration-2 underline-offset-4"
              >
                {getDestinationName(hub, loc)}
              </Link>
            </p>
          )}
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">{title}</h1>
          {excerpt && <p className="text-lg text-muted leading-relaxed mt-6">{excerpt}</p>}
          <p className="text-xs text-muted mt-6 flex flex-wrap gap-x-4">
            {dateLabel && <time dateTime={article.published_at}>{dateLabel}</time>}
            {article.reading_time_min > 0 && (
              <span>{t('reading_time', { minutes: article.reading_time_min })}</span>
            )}
          </p>
        </header>

        {article.cover_image && (
          <div className="relative aspect-[16/10] mb-10 overflow-hidden">
            <Image
              src={article.cover_image}
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 720px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="mb-12">
          {content.map((b, i) =>
            b.kind === 'h2' ? (
              <h2 key={i} className="text-2xl font-black tracking-tight mt-10 mb-4">{b.text}</h2>
            ) : (
              <p key={i} className="text-lg text-fg leading-relaxed mb-4 whitespace-pre-line">{b.text}</p>
            ),
          )}
        </div>

        {/* The services this article is about, picked by the editor. */}
        {related.length > 0 && (
          <section className="mb-12" aria-labelledby="article-related">
            <h2 id="article-related" className="text-2xl font-black tracking-tight mb-5">
              {t('related_title')}
            </h2>
            <ServiceLinkList links={related} loc={loc} />
          </section>
        )}
      </article>

      {/* docs/whygo-services-spec.md §9: below the article, max 3, nothing
          when the city has nothing else published. */}
      {hub && alsoIn.length > 0 && (
        <section
          className="max-w-3xl mx-auto px-6 md:px-12 pb-24"
          aria-labelledby="article-also-in"
        >
          <h2 id="article-also-in" className="text-xl font-black tracking-tight mb-5">
            {t('also_in_title', { city: getDestinationName(hub, loc) })}
          </h2>
          <ServiceLinkList links={alsoIn} loc={loc} />
        </section>
      )}
    </div>
  )
}
