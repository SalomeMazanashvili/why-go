import { getTranslations } from 'next-intl/server'
import type { ContactInfo } from '@/lib/contactInfo'
import type { SocialLink } from '@/lib/socialNetworks'
import { SocialIcon } from '@/components/SocialIcon'

// WHY-111: direct contact on /contact — phone (tel:), opening hours beside
// it, WhatsApp (wa.me) and social profiles. Everything comes from Admin →
// Branding & contact; a field that isn't set there isn't rendered, and the
// whole block disappears when nothing is set.
export function hasContactDetails(info: ContactInfo, socials: SocialLink[]) {
  return Boolean(info.phone || info.whatsapp || socials.length)
}

export default async function ContactDetails({
  info,
  socials,
}: {
  info: ContactInfo
  socials: SocialLink[]
}) {
  if (!hasContactDetails(info, socials)) return null
  const t = await getTranslations('contact')
  const label = 'text-[10px] font-bold tracking-widest uppercase text-muted mb-2'

  return (
    <aside aria-labelledby="contact-details-heading" className="panel space-y-8 self-start">
      <h2 id="contact-details-heading" className="text-lg font-black text-fg">
        {t('details_heading')}
      </h2>

      {info.phone && (
        <div>
          <p className={label}>{t('phone_label')}</p>
          <a
            href={info.phone.href}
            className="inline-flex items-center min-h-11 text-2xl font-black tracking-tight text-fg underline decoration-brand-yellow decoration-[3px] underline-offset-[6px] hover:decoration-fg transition-colors whitespace-nowrap"
          >
            {info.phone.display}
          </a>
          {info.hours && (
            <p className="text-sm text-muted mt-1">
              {t('hours_label')}: {info.hours}
            </p>
          )}
        </div>
      )}

      {info.whatsapp && (
        <a
          href={info.whatsapp.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center min-h-11 px-6 bg-ink text-white font-bold text-sm tracking-wide hover:bg-black transition-colors"
        >
          {t('whatsapp_cta')}
        </a>
      )}

      {socials.length > 0 && (
        <div>
          <p className={label} id="contact-social-label">{t('social_heading')}</p>
          <ul aria-labelledby="contact-social-label" className="flex gap-2 -ml-3">
            {socials.map((s) => (
              <li key={s.key}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="flex items-center justify-center w-11 h-11 text-fg hover:text-muted transition-colors"
                >
                  <SocialIcon network={s.key} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
