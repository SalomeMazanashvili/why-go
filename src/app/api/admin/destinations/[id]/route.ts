import { NextRequest, NextResponse } from 'next/server'
import { revalidateContent } from '@/lib/revalidate'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { numericErrorBody, validateNumericFields } from '@/lib/numericFields'
import { getAdminSupabase, hasAdminSupabase } from '@/lib/supabase/admin'
import { normalizeFaq } from '@/lib/destinations'
import { isReservedSlug, RESERVED_TOP_LEVEL_SLUGS } from '@/lib/reservedSlugs'
import { countServicesByDestination } from '@/lib/services'
import { countTransferRoutesByDestination } from '@/lib/transferRoutes'

const WRITABLE = [
  'slug',
  'name_en', 'name_ka',
  'country',
  'description_en', 'description_ka',
  'seo_title_ka', 'seo_description_ka',
  'cover_image',
  'is_published',
  'sort_order',
  'practical_info_ka', 'faq',
] as const

// WHY-65: hubs are served at /<slug>, so a slug can't take a site route.
function reservedSlugError(slug: string) {
  return `"${slug}" is reserved for a site page and can't be a destination slug. Reserved: ${RESERVED_TOP_LEVEL_SLUGS.join(', ')}`
}

function pickPayload(body: any) {
  const out: Record<string, any> = {}
  for (const key of WRITABLE) {
    if (key in body) out[key] = body[key]
  }
  if ('faq' in out) out.faq = normalizeFaq(out.faq)
  if (typeof out.slug === 'string') out.slug = out.slug.trim().toLowerCase()
  out.updated_at = new Date().toISOString()
  return out
}

interface Ctx { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, props: Ctx) {
  const params = await props.params
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasAdminSupabase()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  try {
    const body = await req.json()
    const payload = pickPayload(body)
    const numberErrors = validateNumericFields(payload)
    if (numberErrors) return NextResponse.json(numericErrorBody(numberErrors), { status: 400 })
    if (typeof payload.slug === 'string' && isReservedSlug(payload.slug)) {
      return NextResponse.json({ error: reservedSlugError(payload.slug) }, { status: 400 })
    }
    const s = getAdminSupabase()
    const { error } = await s.from('destinations').update(payload).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidateContent()
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, props: Ctx) {
  const params = await props.params
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasAdminSupabase()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  try {
    // Preflight: destinations FK into services + transfer_routes with ON DELETE RESTRICT.
    // Count references first so we can return exact numbers instead of a bare Postgres 23503.
    const [serviceCount, routeCount] = await Promise.all([
      countServicesByDestination(params.id),
      countTransferRoutesByDestination(params.id),
    ])
    if (serviceCount + routeCount > 0) {
      const parts: string[] = []
      if (serviceCount > 0) parts.push(`${serviceCount} service${serviceCount === 1 ? '' : 's'}`)
      if (routeCount > 0) parts.push(`${routeCount} transfer route${routeCount === 1 ? '' : 's'}`)
      return NextResponse.json(
        { error: `Cannot delete: referenced by ${parts.join(' and ')}. Remove or reassign them first.` },
        { status: 409 },
      )
    }
    const s = getAdminSupabase()
    const { error } = await s.from('destinations').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidateContent()
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
