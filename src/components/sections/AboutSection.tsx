'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/types'

const STATS = [
  { num: '6+', key: 'stat_destinations' as const },
  { num: '100%', key: 'stat_bespoke' as const },
  { num: '2', key: 'stat_languages' as const },
  { num: '∞', key: 'stat_experiences' as const },
]

export default function AboutSection({ locale }: { locale: Locale }) {
  const t = useTranslations('about')

  return (
    <section className="bg-[#111] py-20 px-6 md:px-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <p className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 mb-4">{t('label')}</p>
          <h2 className="font-black uppercase text-white leading-none tracking-tight"
            style={{ fontSize: 'clamp(32px,4vw,52px)', letterSpacing: '-0.04em', lineHeight: 0.95 }}>
            {t('title_1')}<br />{t('title_2')}<br />{t('title_3')}
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-white/55 max-w-sm">{t('body')}</p>
          <Link href={`/${locale}/about`}
            className="inline-block mt-8 bg-yellow-400 text-black font-black text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-yellow-300 transition-colors">
            {t('cta')} →
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
          className="grid grid-cols-2 gap-px bg-white/10">
          {STATS.map(({ num, key }) => (
            <div key={key} className="bg-[#111] px-8 py-10 text-center">
              <p className="text-[52px] font-black text-yellow-400 leading-none tracking-tight">{num}</p>
              <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-2">{t(key)}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
