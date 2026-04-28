'use client'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { News, Locale } from '@/types'
import { getNewsTitle, getNewsExcerpt } from '@/types'

export default function BlogSection({ news, locale }: { news: News[]; locale: Locale }) {
  const t = useTranslations('blog')
  const [featured, ...rest] = news
  if (!featured) return null

  return (
    <section className="bg-white py-20 px-6 md:px-10">
      <div className="flex justify-between items-end mb-12 flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-black/40 mb-2">{t('section_tag')}</p>
          <h2 className="font-black uppercase text-black leading-none tracking-tight"
            style={{ fontSize: 'clamp(32px,5vw,52px)', letterSpacing: '-0.04em', lineHeight: 0.95 }}>
            {t('section_title_1')}<br />{t('section_title_2')}
          </h2>
        </div>
        <Link href={`/${locale}/tips`}
          className="text-[11px] font-bold tracking-widest uppercase text-black border-b-2 border-yellow-400 pb-0.5 hover:text-yellow-600 transition-colors">
          {t('view_all')}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0.5">
        <motion.div className="lg:col-span-3 group bg-black overflow-hidden"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Link href={`/${locale}/tips/${featured.slug}`}>
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image src={featured.cover_image ?? ''} alt={getNewsTitle(featured, locale)} fill
                className="object-cover opacity-70 group-hover:scale-[1.04] group-hover:opacity-90 transition-all duration-700"
                sizes="(max-width:1024px) 100vw, 60vw" />
            </div>
            <div className="p-8">
              <p className="text-[9px] font-bold tracking-widest uppercase text-yellow-400 mb-2">{featured.tag_en}</p>
              <h3 className="font-black text-xl md:text-2xl text-white leading-tight tracking-tight">
                {getNewsTitle(featured, locale)}
              </h3>
              <p className="text-sm text-white/40 mt-3 leading-relaxed line-clamp-2">{getNewsExcerpt(featured, locale)}</p>
              <p className="text-[10px] font-bold tracking-widest uppercase text-white/25 mt-4">
                {new Date(featured.published_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                {' · '}{featured.reading_time_min} {t('min_read')}
              </p>
            </div>
          </Link>
        </motion.div>

        <div className="lg:col-span-2 flex flex-col gap-0.5">
          {rest.map((article, i) => (
            <motion.div key={article.id} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Link href={`/${locale}/tips/${article.slug}`}
                className="block bg-gray-50 p-6 hover:bg-yellow-50 transition-colors">
                <p className="text-[9px] font-bold tracking-widest uppercase text-black/40 mb-2">{article.tag_en}</p>
                <h4 className="font-bold text-base text-black leading-snug tracking-tight">{getNewsTitle(article, locale)}</h4>
                <p className="text-[10px] font-bold tracking-widest uppercase text-black/30 mt-3">
                  {new Date(article.published_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  {' · '}{article.reading_time_min} {t('min_read')}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
