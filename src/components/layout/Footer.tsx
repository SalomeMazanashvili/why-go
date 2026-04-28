'use client'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

export default function Footer() {
  const t = useTranslations('nav')
  const locale = useLocale()

  return (
    <footer className="bg-black border-t border-white/10 px-6 md:px-10 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="font-black text-xl tracking-tight text-white">
            WHY<span className="text-yellow-400">GO</span>
          </p>
          <p className="text-[10px] tracking-widest uppercase text-white/25 mt-1">Experience + Development</p>
        </div>
        <nav className="flex gap-6 flex-wrap">
          {[['tours', t('tours')], ['about', t('about')], ['tips', t('tips')], ['contact', t('contact')]].map(([path, label]) => (
            <Link key={path} href={`/${locale}/${path}`}
              className="text-[10px] tracking-widest uppercase text-white/30 hover:text-yellow-400 transition-colors">
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-[10px] tracking-wide text-white/20">
          © {new Date().getFullYear()} Whygo · whygo.ge
        </p>
      </div>
    </footer>
  )
}
