import { countWords, MIN_INDEXABLE_WORDS } from '@/lib/seo'
import type { Destination } from '@/types'

// No Supabase import: the admin DestinationForm (a client component) shows
// the same count, and must not pull the service-role client into its bundle.
// WHY-65 / CLAUDE.md rule 5: a hub needs 300+ words of unique Georgian before
// Google may index it. Intro, practical info and FAQ all count. Below that
// the hub is still served (founders can preview it, links pass through it)
// but is noindex and left out of the sitemap. The admin shows the count.
export function destinationWordCount(d: Destination): number {
  return countWords(
    d.description_ka,
    d.practical_info_ka,
    ...d.faq.flatMap((f) => [f.q_ka, f.a_ka]),
  )
}

export function isDestinationIndexable(d: Destination): boolean {
  return destinationWordCount(d) >= MIN_INDEXABLE_WORDS
}
