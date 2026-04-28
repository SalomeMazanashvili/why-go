'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { STATIC_TOURS } from '@/types'
import type { Locale } from '@/types'
import { getTourTitle, getTourSubtitle, getTourTag, formatPrice } from '@/types'

export default function ToursPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('tours')
  const loc = locale as Locale
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const tags = Array.from(new Set(STATIC_TOURS.map(t => t.tag_en)))
  const filtered = activeTag ? STATIC_TOURS.filter(t => t.tag_en === activeTag) : STATIC_TOURS

  return (
    <>
      <section className="pt-36 pb-16 px-6 md:px-10 bg-black">
        <p className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 mb-4">{t('section_tag')}</p>
        <h1 className="font-black uppercase text-white leading-none tracking-tight"
          style={{ fontSize: 'clamp(52px,8vw,96px)', letterSpacing: '-0.04em' }}>
          {t('section_title_1')}<br />{t('section_title_2')}
        </h1>
      </section>

      <div className="bg-black/90 border-t border-white/10 px-6 md:px-10 py-5 flex gap-3 flex-wrap sticky top-[69px] z-30 backdrop-blur-sm">
        <button onClick={() => setActiveTag(null)}
          className={`text-[10px] font-black tracking-widest uppercase px-4 py-2 border transition-colors ${!activeTag ? 'bg-yellow-400 text-black border-yellow-400' : 'text-white/60 border-white/20 hover:border-white/50'}`}>
          ALL
        </button>
        {tags.map(tag => (
          <button key={tag} onClick={() => setActiveTag(tag === activeTag ? null : tag)}
            className={`text-[10px] font-black tracking-widest uppercase px-4 py-2 border transition-colors ${activeTag === tag ? 'bg-yellow-400 text-black border-yellow-400' : 'text-white/60 border-white/20 hover:border-white/50'}`}>
            {tag}
          </button>
        ))}
      </div>

      <section className="bg-white min-h-screen px-6 md:px-10 py-12">
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5">
          <AnimatePresence mode="popLayout">
            {filtered.map((tour, i) => (
              <motion.div key={tour.id} layout initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}>
                <Link href={`/${locale}/tours/${tour.slug}`} className="group block relative overflow-hidden bg-black">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image src={tour.cover_image ?? ''} alt={getTourTitle(tour, loc)} fill
                      className="object-cover opacity-80 group-hover:scale-[1.06] group-hover:opacity-100 transition-all duration-700"
                      sizes="(max-width:768px) 100vw, 33vw" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent p-6 flex flex-col justify-end">
                    <p className="text-[9px] font-bold tracking-widest uppercase text-yellow-400 mb-2">{getTourTag(tour, loc)}</p>
                    <h2 className="font-black text-2xl tracking-tight text-white leading-none">{getTourTitle(tour, loc).toUpperCase()}</h2>
                    <p className="text-xs text-white/50 mt-1.5">{getTourSubtitle(tour, loc)}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-yellow-400">{formatPrice(tour.price_from, tour.currency)}</span>
                      {tour.duration_days && <span className="text-[10px] font-bold tracking-widest uppercase text-white/30">{tour.duration_days} {t('days')}</span>}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    </>
  )
}
