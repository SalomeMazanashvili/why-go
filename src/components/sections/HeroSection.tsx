'use client'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Locale } from '@/types'

export default function HeroSection({ locale }: { locale: Locale }) {
  const t = useTranslations('hero')

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  }
  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
  }

  return (
    <section className="relative min-h-screen flex flex-col justify-end pb-16 px-6 md:px-10 overflow-hidden bg-[#080808]">

      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 79px,rgba(255,204,0,0.04) 80px),repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(255,204,0,0.04) 80px)' }} />

      {/* Paper plane */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[min(50vw,340px)] pointer-events-none"
      >
        <svg viewBox="0 0 240 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M8 110 L232 18 L168 202 L108 132 Z" fill="#FFCC00" opacity="0.15" />
          <path d="M108 132 L168 202 L120 145 Z" fill="#FFCC00" opacity="0.07" />
          <line x1="8" y1="110" x2="120" y2="145" stroke="#FFCC00" strokeWidth="1.5" opacity="0.2" />
          <path d="M8 110 Q80 60 160 20" stroke="#FFCC00" strokeWidth="1" strokeDasharray="4 8" opacity="0.1" />
        </svg>
      </motion.div>

      {/* Content */}
      <motion.div className="relative z-10" variants={stagger} initial="hidden" animate="show">
        <motion.p variants={item} className="eyebrow text-yellow-400 mb-4">
          {t('eyebrow')}
        </motion.p>

        <motion.h1 variants={item}
          className="font-black uppercase leading-none tracking-tight text-white"
          style={{ fontSize: 'clamp(56px, 11vw, 112px)', letterSpacing: '-0.04em', lineHeight: 0.88 }}>
          <span className="text-yellow-400">{t('line1')}</span>
          <br />{t('line2')}
          <br />{t('line3')}
        </motion.h1>

        <motion.p variants={item} className="mt-6 max-w-md text-sm leading-relaxed text-white/55">
          {t('sub')}
        </motion.p>

        <motion.div variants={item} className="mt-8 flex flex-wrap gap-4">
          <Link href={`/${locale}/tours`}
            className="inline-block bg-yellow-400 text-black font-black text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-yellow-300 transition-colors">
            {t('cta_primary')} →
          </Link>
          <Link href={`/${locale}/about`}
            className="inline-block border-2 border-white/25 text-white font-black text-[11px] tracking-widest uppercase px-8 py-4 hover:border-yellow-400 hover:text-yellow-400 transition-colors">
            {t('cta_secondary')}
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 1.5 }}
        className="absolute bottom-10 right-10 flex flex-col items-center gap-2">
        <span className="eyebrow text-[9px]">{t('scroll')}</span>
        <motion.div animate={{ scaleY: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
          className="w-px h-14 bg-white origin-top" />
      </motion.div>
    </section>
  )
}
