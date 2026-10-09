'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import type { NavItem } from '@/lib/nav'

export default function Navbar({ items }: { items: NavItem[] }) {
  const t = useTranslations('nav')
  const currentLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuPanelRef = useRef<HTMLDivElement>(null)
  // Focus goes back to the menu button when the menu is dismissed (close
  // button, Escape) but not after following a link — the new page owns focus.
  const returnFocusRef = useRef(true)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = useCallback((returnFocus = true) => {
    returnFocusRef.current = returnFocus
    setMenuOpen(false)
  }, [])

  // WHY-101: the mobile menu is a modal dialog. Move focus in, keep Tab
  // inside it, close on Escape, and stop the page behind from scrolling.
  useEffect(() => {
    if (!menuOpen) return
    const panel = menuPanelRef.current
    const trigger = menuButtonRef.current
    const focusable = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
    focusable()[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      if (returnFocusRef.current) trigger?.focus()
    }
  }, [menuOpen, closeMenu])

  const switchLocale = () => {
    const next = currentLocale === 'en' ? 'ka' : 'en'
    router.replace(pathname, { locale: next })
  }

  // WHY-67: items are computed server-side (lib/nav.ts) so only pages with
  // published content appear.
  const navLinks = items.map((item) => ({ href: item.href, label: t(item.key) }))

  const isHome = pathname === '/'
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  // WHY-112: the current page is marked by weight (900 vs 700, both loaded
  // FiraGO weights) plus a yellow underline, not colour alone (WCAG 1.4.1),
  // and keeps aria-current="page" for assistive tech.
  const desktopLinkClass = (current: boolean) =>
    `text-[15px] tracking-wide uppercase underline-offset-[10px] decoration-2 decoration-brand-yellow transition-colors ${
      current ? 'font-black text-white underline' : 'font-bold text-white/70 hover:text-brand-yellow'
    }`
  const hasBackground = !isHome || scrolled

  return (
    <>
      <header className={`tone-dark fixed top-0 left-0 w-full z-50 transition-all duration-500 ${hasBackground ? 'bg-ink/95 backdrop-blur-sm' : ''}`}>
        <div className="flex items-center justify-between px-6 md:px-10 py-5">
          <Link href="/" className="text-xl font-black tracking-tight text-white">
            WHY<span className="text-brand-yellow">GO</span>
          </Link>

          {/* WHY-113: the full row needs ~1000px once Contact sits beside the
              five 15px links (measured: 0px slack at 768, 89px each side at
              1024), so below lg the ☰ menu takes over. */}
          <nav aria-label={t('primary_label')} className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                aria-current={isCurrent(link.href) ? 'page' : undefined}
                className={desktopLinkClass(isCurrent(link.href))}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* WHY-113: Contact is the one yellow button, set apart from the
                product links. Yellow takes ink text only. */}
            <Link href="/contact"
              aria-current={isCurrent('/contact') ? 'page' : undefined}
              className={`hidden lg:inline-flex items-center min-h-[44px] px-5 bg-brand-yellow text-ink text-[15px] font-black tracking-wide uppercase hover:brightness-110 transition-colors decoration-2 underline-offset-4 decoration-ink ${
                isCurrent('/contact') ? 'underline' : ''
              }`}>
              {t('contact')}
            </Link>
            {/* The language switch steps back to an outline so it doesn't
                compete with Contact. */}
            <button onClick={switchLocale}
              className="min-h-[44px] min-w-[44px] text-[11px] font-black tracking-widest border border-white/50 text-white px-3 hover:border-brand-yellow hover:text-brand-yellow transition-colors">
              {currentLocale === 'en' ? 'ქარ' : 'ENG'}
            </button>
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={t('menu_open')}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-haspopup="dialog"
              className="flex flex-col items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] -mr-2 lg:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <span aria-hidden="true" className="block w-7 h-0.5 bg-white" />
              <span aria-hidden="true" className="block w-7 h-0.5 bg-white" />
              <span aria-hidden="true" className="block w-5 h-0.5 bg-white" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={menuPanelRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t('menu_title')}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: [0.77, 0, 0.175, 1] }}
            className="surface-dark fixed inset-0 z-[200] flex flex-col justify-center px-10"
          >
            <button type="button" onClick={() => closeMenu()} aria-label={t('menu_close')}
              className="absolute top-4 right-6 flex items-center justify-center w-11 h-11 text-4xl text-white font-thin">
              <span aria-hidden="true">×</span>
            </button>
            <nav aria-label={t('primary_label')} className="flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.div key={link.href}
                  initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}>
                  <Link href={link.href} onClick={() => closeMenu(false)}
                    aria-current={isCurrent(link.href) ? 'page' : undefined}
                    className={`block text-[clamp(36px,8vw,60px)] leading-tight tracking-tight uppercase transition-colors underline-offset-[12px] decoration-4 decoration-brand-yellow ${
                      isCurrent(link.href) ? 'font-black text-white underline' : 'font-bold text-white/80 hover:text-brand-yellow'
                    }`}>
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + navLinks.length * 0.08 }}
              className="mt-12">
              <Link href="/contact" onClick={() => closeMenu(false)}
                aria-current={isCurrent('/contact') ? 'page' : undefined}
                className={`flex items-center justify-center w-full min-h-[56px] bg-brand-yellow text-ink text-xl font-black tracking-wide uppercase decoration-2 underline-offset-4 decoration-ink ${
                  isCurrent('/contact') ? 'underline' : ''
                }`}>
                {t('contact')}
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
