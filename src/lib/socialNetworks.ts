// Client-safe: imported by the admin Branding editor and the site footer.

// Social profiles shown in the footer, set in Admin → Branding. Nothing is
// rendered for a network until its URL is filled in.
export const SOCIAL_NETWORKS = [
  { key: 'social_instagram', name: 'Instagram' },
  { key: 'social_facebook', name: 'Facebook' },
  { key: 'social_tiktok', name: 'TikTok' },
] as const

export type SocialKey = (typeof SOCIAL_NETWORKS)[number]['key']

export interface SocialLink {
  key: SocialKey
  name: string
  url: string
}

export function socialLinksFrom(settings: Record<string, string>): SocialLink[] {
  return SOCIAL_NETWORKS.flatMap(({ key, name }) => {
    const url = settings[key]?.trim()
    return url && /^https:\/\//.test(url) ? [{ key, name, url }] : []
  })
}
