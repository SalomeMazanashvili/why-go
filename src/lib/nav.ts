import { listTours } from '@/lib/tours'
import { listExperiences } from '@/lib/services'
import { listNews } from '@/lib/news'

// WHY-67: the flat primary nav from docs/whygo-homepage-brief.md.
//   ტურები · ტრანსფერები · გამოცდილება · გიდები · ბლოგი
// An item only appears when its page has published content — the same rule
// as the homepage sections — so the menu never links to a 404 or an empty
// page. About and contact live in the footer.

export type NavKey = 'tours' | 'transfers' | 'experiences' | 'guides' | 'blog'

export interface NavItem {
  key: NavKey
  href: string
}

// /guides doesn't exist until WHY-84. Flip this when that page ships; from
// then on the item follows the published-guides rule like the others.
const GUIDES_PAGE_LIVE = false

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
  ]
  return items.filter((i) => i.show).map(({ key, href }) => ({ key, href }))
}
