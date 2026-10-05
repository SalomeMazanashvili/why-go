import { CONTACT_FIELDS, normalizePhone } from '@/lib/contactInfo'
import { SOCIAL_NETWORKS } from '@/lib/socialNetworks'

// Public-facing contact settings are shown on the site, so check them here
// rather than trusting the form. Phones are stored as E.164; empty clears.
export function validateSetting(key: string, value: string | null, errors: string[]): string | null {
  const v = value?.trim() ?? ''
  if (!v) return value === null ? null : ''
  const contact = CONTACT_FIELDS.find((f) => f.key === key)
  if (contact?.kind === 'phone') {
    const e164 = normalizePhone(v)
    if (!e164) errors.push(`${contact.name}: use the full international number, e.g. +995 598 12 34 56.`)
    return e164 ?? v
  }
  const social = SOCIAL_NETWORKS.find((n) => n.key === key)
  if (social && !/^https:\/\/\S+$/.test(v)) {
    errors.push(`${social.name}: the link must start with https://.`)
  }
  return v
}
