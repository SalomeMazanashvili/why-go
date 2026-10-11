'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '../_components/ToastProvider'
import NumberField from '../_components/NumberField'
import type { FieldErrors } from '@/lib/numericFields'
import { SLUG_MAX, SLUG_MIN, SLUG_PATTERN, suggestSlug } from '@/lib/slug'
import ImageUploader from '../_components/ImageUploader'
import type { AdminNews } from '@/lib/news'
import type { Destination } from '@/types'
import type { RelatedRef } from '@/lib/serviceLinks'
import type { RelatedOption } from './relatedOptions'

// Mirrors MIN_RELATED_SERVICES in lib/serviceLinks (that module is server-only).
const MIN_RELATED = 2

interface Props {
  initial?: AdminNews | null
  mode: 'create' | 'edit'
  destinations: Destination[]
  relatedOptions: RelatedOption[]
  initialRelated?: RelatedRef[]
}

const refId = (r: RelatedRef) => ('service_id' in r ? r.service_id : r.transfer_route_id)

const empty: AdminNews = {
  id: '',
  slug: '',
  title_en: '', excerpt_en: '', content_en: '', tag_en: '',
  title_ka: '', excerpt_ka: '', content_ka: '', tag_ka: '',
  cover_image: '',
  author: 'WHYGO Team',
  reading_time_min: 5,
  is_featured: false,
  // WHY-118: drafts first; publishing needs 2+ related services.
  is_published: false,
  published_at: new Date().toISOString(),
  destination_id: null,
}

export default function NewsForm({ initial, mode, destinations, relatedOptions, initialRelated = [] }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [item, setItem] = useState<AdminNews>(initial ?? empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  // WHY-118: ids of the picked services, in display order.
  const [related, setRelated] = useState<string[]>(initialRelated.map(refId))
  const optionById = new Map(relatedOptions.map((o) => [o.id, o]))
  const liveCount = related.filter((id) => optionById.get(id)?.live).length
  const move = (i: number, d: -1 | 1) =>
    setRelated((prev) => {
      const next = [...prev]
      ;[next[i], next[i + d]] = [next[i + d], next[i]]
      return next
    })
  // Same-city options first in the picker.
  const unpicked = relatedOptions
    .filter((o) => !related.includes(o.id))
    .sort((a, b) => {
      const here = (o: RelatedOption) => (item.destination_id && o.destinationIds.includes(item.destination_id) ? 0 : 1)
      return here(a) - here(b)
    })
  const groups = [...new Set(unpicked.map((o) => o.group))]

  const update = <K extends keyof AdminNews>(key: K, value: AdminNews[K]) =>
    setItem((prev) => ({ ...prev, [key]: value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = mode === 'create' ? '/api/admin/news' : `/api/admin/news/${item.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          related: related.flatMap((id) => {
            const o = optionById.get(id)
            return o ? [o.ref] : []
          }),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFieldErrors(data.fieldErrors ?? {})
        toast.error(data.error || 'Save failed')
        setSaving(false)
        return
      }
      setFieldErrors({})
      toast.success(mode === 'create' ? 'Article created' : 'Article saved')
      if (mode === 'create' && data.id) {
        router.push(`/admin/news/${data.id}`)
      } else {
        router.refresh()
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!item.id) return
    if (!confirm(`Delete "${item.title_en || 'this article'}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/news/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Delete failed')
        setDeleting(false)
        return
      }
      toast.success('Article deleted')
      router.push('/admin/news')
      router.refresh()
    } catch {
      toast.error('Network error')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-brand-yellow">Meta</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="admin-label" htmlFor="news-slug">Slug (the URL)</label>
            <div className="flex gap-2">
              <input
                id="news-slug"
                className="admin-input"
                value={item.slug}
                onChange={(e) => update('slug', e.target.value.toLowerCase())}
                required
                pattern={SLUG_PATTERN}
                minLength={SLUG_MIN}
                maxLength={SLUG_MAX}
                aria-invalid={Boolean(fieldErrors.slug) || undefined}
                aria-describedby="news-slug-help"
              />
              <button
                type="button"
                className="admin-btn admin-btn-ghost whitespace-nowrap"
                disabled={!item.title_ka && !item.title_en}
                onClick={() => update('slug', suggestSlug(item.title_ka || item.title_en))}
              >
                Suggest
              </button>
            </div>
            <p id="news-slug-help" className={`text-[10px] mt-1 ${fieldErrors.slug ? 'text-red-400' : 'text-white/40'}`}>
              {fieldErrors.slug ??
                'Latin only, so links stay readable in WhatsApp and Instagram: a–z, 0–9, hyphens, 3–6 words. Suggest transliterates the Georgian title. Don\'t change it after publishing: old links break.'}
            </p>
          </div>
          <div>
            <label className="admin-label">Author</label>
            <input className="admin-input" value={item.author} onChange={(e) => update('author', e.target.value)} />
          </div>
          <div>
            <NumberField
              field="reading_time_min"
              label="Reading time (min)"
              value={item.reading_time_min}
              onChange={(v) => update('reading_time_min', v ?? 0)}
              error={fieldErrors.reading_time_min}
            />
          </div>
          <div>
            <label className="admin-label">Published at</label>
            <input
              type="datetime-local"
              className="admin-input"
              value={item.published_at ? item.published_at.slice(0, 16) : ''}
              onChange={(e) =>
                update('published_at', e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString())
              }
            />
          </div>
          <div>
            <label className="admin-label" htmlFor="news-destination">Destination</label>
            <select
              id="news-destination"
              className="admin-input"
              value={item.destination_id ?? ''}
              onChange={(e) => update('destination_id', e.target.value || null)}
            >
              <option value="">— None —</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_ka || d.name_en} {d.country ? `(${d.country})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-white/40 mt-1">
              The post is listed on this city's hub page.
            </p>
          </div>
          <div className="md:col-span-2">
            <ImageUploader
              value={item.cover_image ?? ''}
              onChange={(url) => update('cover_image', url)}
              folder="news"
            />
          </div>
          <label className="flex items-center gap-3 mt-2">
            <input
              type="checkbox"
              checked={item.is_featured}
              onChange={(e) => update('is_featured', e.target.checked)}
              className="w-4 h-4 accent-brand-yellow"
            />
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">Featured</span>
          </label>
          <label className="flex items-center gap-3 mt-2">
            <input
              type="checkbox"
              checked={item.is_published}
              onChange={(e) => update('is_published', e.target.checked)}
              className="w-4 h-4 accent-brand-yellow"
            />
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">Published</span>
          </label>
        </div>
      </section>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-brand-yellow">English</p>
        <div>
          <label className="admin-label">Title</label>
          <input className="admin-input" value={item.title_en} onChange={(e) => update('title_en', e.target.value)} required />
        </div>
        <div>
          <label className="admin-label">Tag</label>
          <input className="admin-input" value={item.tag_en} onChange={(e) => update('tag_en', e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Excerpt</label>
          <textarea
            rows={3}
            className="admin-input resize-y"
            value={item.excerpt_en}
            onChange={(e) => update('excerpt_en', e.target.value)}
          />
        </div>
        <div>
          <label className="admin-label">Content</label>
          <textarea
            rows={10}
            className="admin-input resize-y font-mono text-[13px]"
            value={item.content_en}
            onChange={(e) => update('content_en', e.target.value)}
          />
        </div>
      </section>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-brand-yellow">Georgian</p>
        <div>
          <label className="admin-label">Title</label>
          <input className="admin-input" value={item.title_ka} onChange={(e) => update('title_ka', e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Tag</label>
          <input className="admin-input" value={item.tag_ka} onChange={(e) => update('tag_ka', e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Excerpt</label>
          <textarea
            rows={3}
            className="admin-input resize-y"
            value={item.excerpt_ka}
            onChange={(e) => update('excerpt_ka', e.target.value)}
          />
        </div>
        <div>
          <label className="admin-label">Content</label>
          <p className="text-[10px] text-white/40 mb-1">
            Blank line between paragraphs. Start a paragraph with ## for a subheading. Indexed by
            Google from 300 words, with a Georgian title and excerpt.
          </p>
          <textarea
            rows={10}
            className="admin-input resize-y font-mono text-[13px]"
            value={item.content_ka}
            onChange={(e) => update('content_ka', e.target.value)}
          />
        </div>
      </section>

      <section className="admin-card space-y-4" aria-labelledby="news-related-heading">
        <div>
          <p id="news-related-heading" className="text-[10px] font-bold tracking-widest uppercase text-brand-yellow">
            Related services
          </p>
          <p className="text-[11px] text-white/50 mt-2 leading-relaxed">
            The services this article is about, shown under it in this order. A published article
            needs at least {MIN_RELATED} that are published and have a page. If one is unpublished
            later, the article simply stops linking to it. Same-city services are listed first.
          </p>
        </div>
        <p
          className={`text-[11px] font-bold tracking-widest uppercase ${liveCount >= MIN_RELATED ? 'text-emerald-400' : 'text-amber-400'}`}
          aria-live="polite"
        >
          {liveCount} live of {MIN_RELATED} needed to publish
        </p>
        {related.length > 0 && (
          <ol className="space-y-2">
            {related.map((id, i) => {
              const o = optionById.get(id)
              return (
                <li key={id} className="flex items-center gap-3 border border-white/10 px-3 py-2">
                  <span className="text-white/40 text-xs w-5">{i + 1}.</span>
                  <span className="flex-1 text-sm">
                    <span className="text-white/40 text-[10px] uppercase tracking-widest mr-2">{o?.group ?? 'Deleted'}</span>
                    {o?.label ?? id}
                    {o?.note && <span className="ml-2 text-amber-400 text-[10px] uppercase tracking-widest">{o.note}</span>}
                  </span>
                  <button type="button" className="admin-btn admin-btn-ghost px-2 py-1 text-xs" disabled={i === 0}
                    onClick={() => move(i, -1)} aria-label={`Move ${o?.label ?? 'item'} up`}>↑</button>
                  <button type="button" className="admin-btn admin-btn-ghost px-2 py-1 text-xs" disabled={i === related.length - 1}
                    onClick={() => move(i, 1)} aria-label={`Move ${o?.label ?? 'item'} down`}>↓</button>
                  <button type="button" className="admin-btn admin-btn-ghost px-2 py-1 text-xs"
                    onClick={() => setRelated((prev) => prev.filter((x) => x !== id))} aria-label={`Remove ${o?.label ?? 'item'}`}>
                    Remove
                  </button>
                </li>
              )
            })}
          </ol>
        )}
        <div>
          <label className="admin-label" htmlFor="news-related-add">Add a service</label>
          <select
            id="news-related-add"
            className="admin-input"
            value=""
            onChange={(e) => e.target.value && setRelated((prev) => [...prev, e.target.value])}
          >
            <option value="">— Choose —</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {unpicked.filter((o) => o.group === g).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}{o.note ? ` — ${o.note}` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </section>

      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={saving} className="admin-btn">
          {saving ? 'Saving…' : mode === 'create' ? 'Create article' : 'Save changes'}
        </button>
        <Link href="/admin/news" className="admin-btn admin-btn-ghost">Cancel</Link>
        {mode === 'edit' && (
          <button type="button" onClick={remove} disabled={deleting} className="admin-btn admin-btn-danger ml-auto">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )
}
