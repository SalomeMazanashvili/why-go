'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '../_components/ToastProvider'
import type { TransferRoute, Destination } from '@/types'

interface Props {
  initial?: TransferRoute | null
  mode: 'create' | 'edit'
  destinations: Destination[]
}

const empty: TransferRoute = {
  id: '',
  slug: '',
  from_destination_id: null,
  to_destination_id: null,
  from_name_en: '',
  from_name_ka: '',
  to_name_en: '',
  to_name_ka: '',
  description_en: '',
  description_ka: '',
  seo_title_ka: '',
  seo_description_ka: '',
  price_from: null,
  currency: 'GEL',
  duration_minutes: null,
  vehicle_type: '',
  max_passengers: null,
  is_published: false,
  sort_order: 0,
}

export default function TransferRouteForm({ initial, mode, destinations }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [item, setItem] = useState<TransferRoute>(initial ?? empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const update = <K extends keyof TransferRoute>(key: K, value: TransferRoute[K]) =>
    setItem((prev) => ({ ...prev, [key]: value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = mode === 'create' ? '/api/admin/transfer-routes' : `/api/admin/transfer-routes/${item.id}`
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
      toast.success(mode === 'create' ? 'Route created' : 'Route saved')
      if (mode === 'create' && data.id) {
        router.push(`/admin/transfer-routes/${data.id}`)
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
    const label = `${item.from_name_ka || item.from_name_en} → ${item.to_name_ka || item.to_name_en}`
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/transfer-routes/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Delete failed')
        setDeleting(false)
        return
      }
      toast.success('Route deleted')
      router.push('/admin/transfer-routes')
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
            <input
              className="admin-input"
              value={item.slug}
              onChange={(e) => update('slug', e.target.value)}
              required
              placeholder="e.g. munich-airport-to-city"
            />
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
            <label className="admin-label">From destination (hub)</label>
            <select
              className="admin-input"
              value={item.from_destination_id ?? ''}
              onChange={(e) => update('from_destination_id', e.target.value || null)}
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
            <label className="admin-label">To destination (hub)</label>
            <select
              className="admin-input"
              value={item.to_destination_id ?? ''}
              onChange={(e) => update('to_destination_id', e.target.value || null)}
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
            <label className="admin-label">Duration (minutes)</label>
            <input
              type="number"
              className="admin-input"
              value={item.duration_minutes ?? ''}
              onChange={(e) => update('duration_minutes', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="admin-label">Max passengers</label>
            <input
              type="number"
              className="admin-input"
              value={item.max_passengers ?? ''}
              onChange={(e) => update('max_passengers', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="admin-label">Vehicle type</label>
            <input
              className="admin-input"
              value={item.vehicle_type}
              onChange={(e) => update('vehicle_type', e.target.value)}
              placeholder="e.g. sedan, van, minibus"
            />
          </div>
          <label className="flex items-center gap-3 mt-6">
            <input
              type="checkbox"
              checked={item.is_published}
              onChange={(e) => update('is_published', e.target.checked)}
              className="w-4 h-4 accent-[#FFCC00]"
            />
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">Published</span>
          </label>
        </div>
      </section>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Endpoint names</p>
        <p className="text-white/40 text-xs">
          Specific pickup / drop-off labels (finer than the destination hub). Shown in cards and route titles.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="admin-label">From (Georgian)</label>
            <input
              className="admin-input"
              value={item.from_name_ka}
              onChange={(e) => update('from_name_ka', e.target.value)}
              placeholder="e.g. მიუნხენის აეროპორტი"
            />
          </div>
          <div>
            <label className="admin-label">From (English)</label>
            <input
              className="admin-input"
              value={item.from_name_en}
              onChange={(e) => update('from_name_en', e.target.value)}
              required
              placeholder="e.g. Munich Airport"
            />
          </div>
          <div>
            <label className="admin-label">To (Georgian)</label>
            <input
              className="admin-input"
              value={item.to_name_ka}
              onChange={(e) => update('to_name_ka', e.target.value)}
              placeholder="e.g. მიუნხენის ცენტრი"
            />
          </div>
          <div>
            <label className="admin-label">To (English)</label>
            <input
              className="admin-input"
              value={item.to_name_en}
              onChange={(e) => update('to_name_en', e.target.value)}
              required
              placeholder="e.g. Munich City Centre"
            />
          </div>
        </div>
      </section>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Georgian</p>
        <div>
          <label className="admin-label">Description</label>
          <textarea
            rows={10}
            className="admin-input resize-y"
            value={item.description_ka}
            onChange={(e) => update('description_ka', e.target.value)}
            placeholder="300+ words of unique Georgian content required before publishing (CLAUDE.md — programmatic pages)."
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
          <label className="admin-label">Description</label>
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
          {saving ? 'Saving…' : mode === 'create' ? 'Create route' : 'Save changes'}
        </button>
        <Link href="/admin/transfer-routes" className="admin-btn admin-btn-ghost">Cancel</Link>
        {mode === 'edit' && (
          <button type="button" onClick={remove} disabled={deleting} className="admin-btn admin-btn-danger ml-auto">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )
}
