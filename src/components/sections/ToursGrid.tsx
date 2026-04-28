'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { Tour, Locale } from '@/types'
import { getTourTitle, getTourSubtitle, getTourTag, formatPrice } from '@/types'

export default function ToursGrid({ tours, locale }: { tours: Tour[]; locale: Locale }) {
  const t = useTranslations('tours')

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
        <Link href={`/${locale}/tours`}
          className="text-[11px] font-bold tracking-widest uppercase text-black border-b-2 border-yellow-400 pb-0.5 hover:text-yellow-600 transition-colors">
          {t('view_all')}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5">
        {tours.map((tour, i) => (
          <motion.div key={tour.id}
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.08 }}>
            <Link href={`/${locale}/tours/${tour.slug}`} className="group block relative overflow-hidden bg-black">
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={tour.cover_image ?? ''}
                  alt={getTourTitle(tour, locale)}
                  fill
                  className="object-cover opacity-80 group-hover:scale-[1.06] group-hover:opacity-100 transition-all duration-700"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-6 flex flex-col justify-end">
                <p className="text-[9px] font-bold tracking-widest uppercase text-yellow-400 mb-2">
                  {getTourTag(tour, locale)}
                </p>
                <h3 className="font-black text-2xl text-white leading-none tracking-tight">
                  {getTourTitle(tour, locale).toUpperCase()}
                </h3>
                <p className="text-xs text-white/50 mt-1.5">{getTourSubtitle(tour, locale)}</p>
              </div>
              <div className="absolute top-4 right-4 bg-yellow-400 text-black font-black text-[11px] tracking-wide px-3 py-1.5">
                {formatPrice(tour.price_from, tour.currency)}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
