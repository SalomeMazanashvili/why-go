'use client'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { SocialKey, SocialLink } from '@/lib/socialNetworks'

// WHY-67: product pages live in the primary nav; the footer carries about,
// contact and social (docs/whygo-homepage-brief.md §8). Social icons render
// only for networks whose URL is set in Admin → Branding.
export default function Footer({ socials }: { socials: SocialLink[] }) {
  const t = useTranslations('nav')
  const tFooter = useTranslations('footer')

  return (
    <footer className="bg-ink border-t border-white/10 px-6 md:px-10 py-10">
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

function SocialIcon({ network }: { network: SocialKey }) {
  const svg = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const
  switch (network) {
    case 'social_instagram':
      return (
        <svg {...svg}>
          <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.2-.1 1.6-.1 4.8-.1zm0 2c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 7.4a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8zm5.7-7.6a1.1 1.1 0 1 1-2.1 0 1.1 1.1 0 0 1 2.1 0z" />
        </svg>
      )
    case 'social_facebook':
      return (
        <svg {...svg}>
          <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z" />
        </svg>
      )
    case 'social_tiktok':
      return (
        <svg {...svg}>
          <path d="M16.6 2h-3.3v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.2a6.2 6.2 0 1 0 5.3 6.2V8.6a7.9 7.9 0 0 0 4.6 1.5V6.8a4.6 4.6 0 0 1-4.6-4.6v-.2z" />
        </svg>
      )
  }
}
