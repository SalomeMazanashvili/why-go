'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar({ locale }: { locale: string }) {
  const t = useTranslations('nav')
  const currentLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const switchLocale = () => {
    const next = currentLocale === 'en' ? 'ka' : 'en'
    const stripped = pathname.replace(/^\/(en|ka)/, '') || '/'
    router.push(`/${next}${stripped}`)
  }

  const navLinks = [
    { href: `/${locale}/tours`, label: t('tours') },
    { href: `/${locale}/about`, label: t('about') },
    { href: `/${locale}/tips`, label: t('tips') },
    { href: `/${locale}/contact`, label: t('contact') },
  ]

  return (
    <>
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/95 backdrop-blur-sm' : ''}`}>
        <div className="flex items-center justify-between px-6 md:px-10 py-5">
          <Link href={`/${locale}`} className="text-xl font-black tracking-tight text-white">
            WHY<span className="text-yellow-400">GO</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="text-[11px] font-bold tracking-widest uppercase text-white/60 hover:text-yellow-400 transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={switchLocale}
              className="text-[11px] font-black tracking-widest bg-yellow-400 text-black px-3 py-2 hover:bg-yellow-300 transition-colors">
              {currentLocale === 'en' ? 'ქარ' : 'ENG'}
            </button>
            <button className="flex flex-col gap-1.5 md:hidden" onClick={() => setMenuOpen(true)}>
              <span className="block w-7 h-0.5 bg-white" />
              <span className="block w-7 h-0.5 bg-white" />
              <span className="block w-5 h-0.5 bg-white" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: [0.77, 0, 0.175, 1] }}
            className="fixed inset-0 bg-black z-[200] flex flex-col justify-center px-10"
          >
            <button onClick={() => setMenuOpen(false)}
              className="absolute top-6 right-8 text-4xl text-white font-thin">×</button>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.div key={link.href}
                  initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}>
                  <Link href={link.href} onClick={() => setMenuOpen(false)}
                    className="block text-[clamp(36px,8vw,60px)] font-black leading-tight tracking-tight text-white hover:text-yellow-400 transition-colors uppercase">
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
