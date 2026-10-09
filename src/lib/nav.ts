import { listTours } from '@/lib/tours'
import { listExperiences } from '@/lib/services'
import { listNews } from '@/lib/news'

// WHY-67: the flat primary nav from docs/whygo-homepage-brief.md.
//   ტურები · ტრანსფერები · გამოცდილება · გიდები · ბლოგი
// An item only appears when its page has published content — the same rule
// as the homepage sections — so the menu never links to a 404 or an empty
// page. Contact is a separate button in the header (WHY-113), not an item.

export type NavKey = 'tours' | 'transfers' | 'experiences' | 'guides' | 'blog' | 'about'

export interface NavItem {
  key: NavKey
  href: string
}

// /guides doesn't exist until WHY-84. Flip this when that page ships; from
// then on the item follows the published-guides rule like the others.
export const GUIDES_PAGE_LIVE = false

// WHY-113: About joins the main nav only once /about is founder-written
// Georgian with a real meta description. Today its body is hardcoded English
// and its meta description is a TODO, so it stays footer-only. Flip this when
// the page is rewritten.
export const ABOUT_PAGE_READY = false

export async function getNavItems(): Promise<NavItem[]> {
  const [tours, experiences, news] = await Promise.all([
    listTours(),
    listExperiences(),
    listNews(),
  ])
  const items: Array<NavItem & { show: boolean }> = [
    { key: 'tours', href: '/tours', show: tours.length > 0 },
    // /transfers is a standing landing page with its own request form, so it
    // shows even before any route is published.
    { key: 'transfers', href: '/transfers', show: true },
    { key: 'experiences', href: '/experiences', show: experiences.length > 0 },
    { key: 'guides', href: '/guides', show: GUIDES_PAGE_LIVE },
    { key: 'blog', href: '/tips', show: news.length > 0 },
    { key: 'about', href: '/about', show: ABOUT_PAGE_READY },
  ]
  return items.filter((i) => i.show).map(({ key, href }) => ({ key, href }))
}
