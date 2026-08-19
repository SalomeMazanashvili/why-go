'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '../_components/ToastProvider'
import ImageUploader from '../_components/ImageUploader'
import type { Service, Destination, ServiceCategory } from '@/types'

interface Props {
  initial?: Service | null
  mode: 'create' | 'edit'
  destinations: Destination[]
  categories: ServiceCategory[]
}

const empty: Service = {
  id: '',
  slug: '',
  destination_id: null,
  category_id: null,
  name_en: '',
  name_ka: '',
  short_description_en: '',
  short_description_ka: '',
  description_en: '',
  description_ka: '',
  seo_title_ka: '',
  seo_description_ka: '',
  price_from: null,
  currency: 'GEL',
  duration_hours: null,
  min_group_size: null,
  max_group_size: null,
  cover_image: '',
  is_published: false,
  is_featured: false,
  sort_order: 0,
}

export default function ServiceForm({ initial, mode, destinations, categories }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [item, setItem] = useState<Service>(initial ?? empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const update = <K extends keyof Service>(key: K, value: Service[K]) =>
    setItem((prev) => ({ ...prev, [key]: value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = mode === 'create' ? '/api/admin/services' : `/api/admin/services/${item.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Save failed')
        setSaving(false)
        return
      }
      toast.success(mode === 'create' ? 'Service created' : 'Service saved')
      if (mode === 'create' && data.id) {
        router.push(`/admin/services/${data.id}`)
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
    if (!confirm(`Delete "${item.name_ka || item.name_en || 'this service'}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/services/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Delete failed')
        setDeleting(false)
        return
      }
      toast.success('Service deleted')
      router.push('/admin/services')
      router.refresh()
    } catch {
      toast.error('Network error')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Meta</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Slug</label>
            <input className="admin-input" value={item.slug} onChange={(e) => update('slug', e.target.value)} required />
          </div>
          <div>
            <label className="admin-label">Destination</label>
            <select
              className="admin-input"
              value={item.destination_id ?? ''}
              onChange={(e) => update('destination_id', e.target.value || null)}
            >
              <option value="">— Select destination —</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_ka || d.name_en} {d.country ? `(${d.country})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="admin-label">Category</label>
            <select
              className="admin-input"
              value={item.category_id ?? ''}
              onChange={(e) => update('category_id', e.target.value || null)}
            >
              <option value="">— Select category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ka || c.name_en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="admin-label">Sort order</label>
            <input
              type="number"
              className="admin-input"
              value={item.sort_order}
              onChange={(e) => update('sort_order', Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="admin-label">Price from</label>
            <input
              type="number"
              step="0.01"
              className="admin-input"
              value={item.price_from ?? ''}
              onChange={(e) => update('price_from', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="admin-label">Currency</label>
            <input
              className="admin-input"
              value={item.currency}
              onChange={(e) => update('currency', e.target.value.toUpperCase())}
              placeholder="GEL"
            />
          </div>
          <div>
            <label className="admin-label">Duration (hours)</label>
            <input
              type="number"
              step="0.5"
              className="admin-input"
              value={item.duration_hours ?? ''}
              onChange={(e) => update('duration_hours', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="admin-label">Min group size</label>
            <input
              type="number"
              className="admin-input"
              value={item.min_group_size ?? ''}
              onChange={(e) => update('min_group_size', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="admin-label">Max group size</label>
            <input
              type="number"
              className="admin-input"
              value={item.max_group_size ?? ''}
              onChange={(e) => update('max_group_size', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="flex items-center gap-6 mt-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.is_published}
                onChange={(e) => update('is_published', e.target.checked)}
                className="w-4 h-4 accent-[#FFCC00]"
              />
              <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">Published</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.is_featured}
                onChange={(e) => update('is_featured', e.target.checked)}
                className="w-4 h-4 accent-[#FFCC00]"
              />
              <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">Featured</span>
            </label>
          </div>
        </div>
        <div>
          <ImageUploader
            value={item.cover_image ?? ''}
            onChange={(url) => update('cover_image', url)}
            folder="services"
          />
        </div>
      </section>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Georgian</p>
        <div>
          <label className="admin-label">Name</label>
          <input className="admin-input" value={item.name_ka} onChange={(e) => update('name_ka', e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Short description (card copy)</label>
          <textarea
            rows={2}
            className="admin-input resize-y"
            value={item.short_description_ka}
            onChange={(e) => update('short_description_ka', e.target.value)}
          />
        </div>
        <div>
          <label className="admin-label">Full description</label>
          <textarea
            rows={10}
            className="admin-input resize-y"
            value={item.description_ka}
            onChange={(e) => update('description_ka', e.target.value)}
            placeholder="300+ words of unique Georgian content required before publishing (CLAUDE.md)."
          />
        </div>
        <div>
          <label className="admin-label">SEO title (Georgian)</label>
          <input
            className="admin-input"
            value={item.seo_title_ka}
            onChange={(e) => update('seo_title_ka', e.target.value)}
            maxLength={70}
            placeholder="≤ 60 chars, appears in Google results"
          />
          <p className="text-[10px] text-white/40 mt-1">{item.seo_title_ka.length}/60 recommended</p>
        </div>
        <div>
          <label className="admin-label">SEO description (Georgian)</label>
          <textarea
            rows={3}
            className="admin-input resize-y"
            value={item.seo_description_ka}
            onChange={(e) => update('seo_description_ka', e.target.value)}
            maxLength={200}
            placeholder="140–160 chars, appears in Google results"
          />
          <p className="text-[10px] text-white/40 mt-1">{item.seo_description_ka.length}/160 recommended</p>
        </div>
      </section>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">English</p>
        <div>
          <label className="admin-label">Name</label>
          <input className="admin-input" value={item.name_en} onChange={(e) => update('name_en', e.target.value)} required />
        </div>
        <div>
          <label className="admin-label">Short description</label>
          <textarea
            rows={2}
            className="admin-input resize-y"
            value={item.short_description_en}
            onChange={(e) => update('short_description_en', e.target.value)}
          />
        </div>
        <div>
          <label className="admin-label">Full description</label>
          <textarea
            rows={10}
            className="admin-input resize-y"
            value={item.description_en}
            onChange={(e) => update('description_en', e.target.value)}
          />
        </div>
      </section>

      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={saving} className="admin-btn">
          {saving ? 'Saving…' : mode === 'create' ? 'Create service' : 'Save changes'}
        </button>
        <Link href="/admin/services" className="admin-btn admin-btn-ghost">Cancel</Link>
        {mode === 'edit' && (
          <button type="button" onClick={remove} disabled={deleting} className="admin-btn admin-btn-danger ml-auto">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )
}
