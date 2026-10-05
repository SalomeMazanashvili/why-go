'use client'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { SocialLink } from '@/lib/socialNetworks'
import { SocialIcon } from '@/components/SocialIcon'

// WHY-67: product pages live in the primary nav; the footer carries about,
// contact and social (docs/whygo-homepage-brief.md §8). Social icons render
// only for networks whose URL is set in Admin → Branding.
export default function Footer({ socials }: { socials: SocialLink[] }) {
  const t = useTranslations('nav')
  const tFooter = useTranslations('footer')

  return (
    <footer className="surface-dark px-6 md:px-10 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="font-black text-xl tracking-tight text-white">
            WHY<span className="text-brand-yellow">GO</span>
          </p>
          <p className="text-[10px] tracking-widest uppercase text-white/60 mt-1">{tFooter('tagline')}</p>
        </div>
        <nav aria-label={t('footer_label')} className="flex gap-6 flex-wrap">
          {[['about', t('about')], ['contact', t('contact')]].map(([path, label]) => (
            <Link key={path} href={`/${path}`}
              className="text-[10px] tracking-widest uppercase text-white/60 hover:text-brand-yellow transition-colors">
              {label}
            </Link>
          ))}
        </nav>
        {socials.length > 0 && (
          <ul aria-label={t('social_label')} className="flex gap-2 -ml-3 md:ml-0">
            {socials.map((s) => (
              <li key={s.key}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="flex items-center justify-center w-11 h-11 text-white/60 hover:text-brand-yellow transition-colors"
                >
                  <SocialIcon network={s.key} />
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] tracking-wide text-white/60">
          © {new Date().getFullYear()} WHYGO · whygo.ge
        </p>
      </div>
    </footer>
  )
}
