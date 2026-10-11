import { hasAdminSupabase, getAdminSupabase, getContentSupabase } from '@/lib/supabase/admin'
import { hasDetailPage, serviceHref } from '@/lib/services'
import type { Service, ServiceType, TransferRoute } from '@/types'

// WHY-118: one linkable service, of either kind the services spec counts as
// a service (§1): a transfer route, or a day trip / guide / experience.
export type ServiceLink =
  | { kind: 'transfer_route'; id: string; href: string; route: TransferRoute }
  | { kind: 'service'; id: string; href: string; service: Service }

// What the admin picker stores per row, and the RPC takes, in order.
export type RelatedRef = { service_id: string } | { transfer_route_id: string }

// CLAUDE.md: every blog post links to at least 2 services.
export const MIN_RELATED_SERVICES = 2

function routeLink(r: TransferRoute): ServiceLink {
  return { kind: 'transfer_route', id: r.id, href: `/transfers/${r.slug}`, route: r }
}

// Null when the service has no public detail page yet (guides, experiences
// until WHY-84/85): never link to a 404.
function serviceLink(s: Service): ServiceLink | null {
  const href = serviceHref(s)
  return href ? { kind: 'service', id: s.id, href, service: s } : null
}

// Resolve stored refs against the *published* lists. A picked service that
// was unpublished since, or has no detail page, simply drops out, so the
// article never renders a link to a 404. (Deleted ones are gone already:
// the FK cascades.)
export function resolveRefs(
  refs: RelatedRef[],
  services: Service[],
  routes: TransferRoute[],
): ServiceLink[] {
  const byService = new Map(services.map((s) => [s.id, s]))
  const byRoute = new Map(routes.map((r) => [r.id, r]))
  const out: ServiceLink[] = []
  for (const ref of refs) {
    if ('service_id' in ref) {
      const s = byService.get(ref.service_id)
      const link = s ? serviceLink(s) : null
      if (link) out.push(link)
    } else {
      const r = byRoute.get(ref.transfer_route_id)
      if (r) out.push(routeLink(r))
    }
  }
  return out
}

function toRefs(rows: Array<{ service_id: string | null; transfer_route_id: string | null }>): RelatedRef[] {
  return rows.map((r) =>
    r.service_id ? { service_id: String(r.service_id) } : { transfer_route_id: String(r.transfer_route_id) },
  )
}

const RELATED_COLUMNS = 'service_id, transfer_route_id'

// Public: the stored refs for an article, in the editor's order. Resolve
// with resolveRefs() against listServices()/listTransferRoutes().
export async function listRelatedRefs(newsId: string): Promise<RelatedRef[]> {
  if (!hasAdminSupabase()) return []
  try {
    const s = getContentSupabase()
    const { data, error } = await s
      .from('news_related_services')
      .select(RELATED_COLUMNS)
      .eq('news_id', newsId)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[serviceLinks] listRelatedRefs query failed', newsId, error)
      return []
    }
    return toRefs(data ?? [])
  } catch (err) {
    console.error('[serviceLinks] listRelatedRefs threw', newsId, err)
    return []
  }
}

// Admin: refs for every article, keyed by news_id (the list's link count).
export async function listRelatedRefsForAdmin(): Promise<Map<string, RelatedRef[]>> {
  const out = new Map<string, RelatedRef[]>()
  if (!hasAdminSupabase()) return out
  try {
    const s = getAdminSupabase()
    const { data, error } = await s
      .from('news_related_services')
      .select(`news_id, ${RELATED_COLUMNS}`)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[serviceLinks] listRelatedRefsForAdmin query failed', error)
      return out
    }
    for (const row of data ?? []) {
      const id = String(row.news_id)
      out.set(id, [...(out.get(id) ?? []), ...toRefs([row])])
    }
    return out
  } catch (err) {
    console.error('[serviceLinks] listRelatedRefsForAdmin threw', err)
    return out
  }
}

// docs/whygo-services-spec.md §9, the generic cross-sell: other published
// services in this destination, ordered transfers → day trips → guides →
// experiences, max 3. Only what's real and published; an empty result means
// the block renders nothing. `exclude` drops what the page already links to
// (the article's picked services) so the two blocks never repeat.
const CROSS_SELL_ORDER: ServiceType[] = ['day_trip', 'guide', 'experience']
export const CROSS_SELL_MAX = 3

export function alsoInDestination(
  destinationId: string,
  services: Service[],
  routes: TransferRoute[],
  exclude: Set<string> = new Set(),
): ServiceLink[] {
  const transferLinks = routes
    .filter((r) => r.from_destination_id === destinationId || r.to_destination_id === destinationId)
    .map(routeLink)
  const serviceLinks = CROSS_SELL_ORDER.flatMap((type) =>
    services
      .filter((s) => s.destination_id === destinationId && s.service_type === type)
      .map(serviceLink)
      .filter((l): l is ServiceLink => l !== null),
  )
  return [...transferLinks, ...serviceLinks]
    .filter((l) => !exclude.has(l.id))
    .slice(0, CROSS_SELL_MAX)
}

// ---- Admin writes (news API) -------------------------------------------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const MAX_RELATED_SERVICES = 12

// Shape check for the `related` array the admin form sends.
export function parseRelatedRefs(
  value: unknown,
): { ok: true; refs: RelatedRef[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) return { ok: false, error: 'related must be an array' }
  if (value.length > MAX_RELATED_SERVICES) {
    return { ok: false, error: `Pick at most ${MAX_RELATED_SERVICES} related services` }
  }
  const refs: RelatedRef[] = []
  const seen = new Set<string>()
  for (const v of value) {
    const sid = v?.service_id
    const rid = v?.transfer_route_id
    const id = sid ?? rid
    if ((sid == null) === (rid == null) || typeof id !== 'string' || !UUID.test(id)) {
      return { ok: false, error: 'Each related service needs exactly one service_id or transfer_route_id' }
    }
    if (seen.has(id)) return { ok: false, error: 'A related service is listed twice' }
    seen.add(id)
    refs.push(sid != null ? { service_id: sid } : { transfer_route_id: rid })
  }
  return { ok: true, refs }
}

// How many refs would render on the public page right now: published, and
// (for services) of a type with a detail page. Uncached admin read.
export async function countLiveRefs(refs: RelatedRef[]): Promise<number> {
  const serviceIds = refs.flatMap((r) => ('service_id' in r ? [r.service_id] : []))
  const routeIds = refs.flatMap((r) => ('transfer_route_id' in r ? [r.transfer_route_id] : []))
  const s = getAdminSupabase()
  const [svc, rts] = await Promise.all([
    serviceIds.length
      ? s.from('services').select('id, service_type').in('id', serviceIds).eq('is_published', true)
      : Promise.resolve({ data: [], error: null }),
    routeIds.length
      ? s.from('transfer_routes').select('id').in('id', routeIds).eq('is_published', true)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (svc.error) throw new Error(svc.error.message)
  if (rts.error) throw new Error(rts.error.message)
  const liveServices = (svc.data ?? []).filter((row: { service_type: ServiceType }) =>
    hasDetailPage(row.service_type),
  )
  return liveServices.length + (rts.data ?? []).length
}

export const PUBLISH_RULE_ERROR =
  `A published article needs at least ${MIN_RELATED_SERVICES} related services that are themselves ` +
  'published (and have a page). Pick more, or untick Published to save it as a draft.'

// Replace an article's list atomically (supabase/migrations/…why118…).
export async function saveRelatedRefs(newsId: string, refs: RelatedRef[]): Promise<string | null> {
  const { error } = await getAdminSupabase().rpc('set_news_related_services', {
    p_news_id: newsId,
    p_items: refs,
  })
  return error ? error.message : null
}

// The publish rule, shared by the news POST and PUT handlers. `related` in
// the body replaces the stored list; without it the stored list is checked.
// The rule applies to the state after the save, so an already-published
// article whose picks were unpublished since can't be re-saved as is.
export async function checkRelatedForSave(
  body: Record<string, unknown>,
  isPublished: boolean,
  newsId?: string,
): Promise<{ ok: true; refs: RelatedRef[] | null } | { ok: false; error: string }> {
  let refs: RelatedRef[] | null = null
  if ('related' in body) {
    const parsed = parseRelatedRefs(body.related)
    if (!parsed.ok) return parsed
    refs = parsed.refs
  }
  if (isPublished) {
    const effective = refs ?? (newsId ? await getRelatedRefsForAdmin(newsId) : [])
    if ((await countLiveRefs(effective)) < MIN_RELATED_SERVICES) {
      return { ok: false, error: PUBLISH_RULE_ERROR }
    }
  }
  return { ok: true, refs }
}

// Admin: one article's stored refs, uncached.
export async function getRelatedRefsForAdmin(newsId: string): Promise<RelatedRef[]> {
  const { data, error } = await getAdminSupabase()
    .from('news_related_services')
    .select(RELATED_COLUMNS)
    .eq('news_id', newsId)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return toRefs(data ?? [])
}
