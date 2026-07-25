'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '../_components/ToastProvider'
import type { Tour } from '@/types'

interface Props {
  initial?: Tour | null
  mode: 'create' | 'edit'
}

const emptyTour: Tour = {
  id: '',
  slug: '',
  title_en: '', subtitle_en: '', description_en: '', tag_en: '',
  title_ka: '', subtitle_ka: '', description_ka: '', tag_ka: '',
  destination: '',
  price_from: null,
  currency: 'USD',
  duration_days: null,
  cover_image: '',
  is_featured: false,
  sort_order: 0,
}

export default function TourForm({ initial, mode }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [tour, setTour] = useState<Tour>(initial ?? emptyTour)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const update = <K extends keyof Tour>(key: K, value: Tour[K]) =>
    setTour((prev) => ({ ...prev, [key]: value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = mode === 'create' ? '/api/admin/tours' : `/api/admin/tours/${tour.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tour),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Save failed')
        setSaving(false)
        return
      }
      toast.success(mode === 'create' ? 'Tour created' : 'Tour saved')
      if (mode === 'create' && data.id) {
        router.push(`/admin/tours/${data.id}`)
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
    if (!tour.id) return
    if (!confirm(`Delete "${tour.title_en || 'this tour'}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/tours/${tour.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Delete failed')
        setDeleting(false)
        return
      }
      toast.success('Tour deleted')
      router.push('/admin/tours')
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
            <input className="admin-input" value={tour.slug} onChange={(e) => update('slug', e.target.value)} required />
          </div>
          <div>
            <label className="admin-label">Destination</label>
            <input className="admin-input" value={tour.destination} onChange={(e) => update('destination', e.target.value)} required />
          </div>
          <div>
            <label className="admin-label">Price from</label>
            <input
              type="number"
              className="admin-input"
              value={tour.price_from ?? ''}
              onChange={(e) => update('price_from', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="admin-label">Currency</label>
            <input className="admin-input" value={tour.currency} onChange={(e) => update('currency', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="admin-label">Duration (days)</label>
            <input
              type="number"
              className="admin-input"
              value={tour.duration_days ?? ''}
              onChange={(e) => update('duration_days', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="admin-label">Sort order</label>
            <input
              type="number"
              className="admin-input"
              value={tour.sort_order ?? 0}
              onChange={(e) => update('sort_order', Number(e.target.value) || 0)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="admin-label">Cover image URL</label>
            <input className="admin-input" value={tour.cover_image ?? ''} onChange={(e) => update('cover_image', e.target.value)} />
          </div>
          <label className="flex items-center gap-3 mt-2">
            <input
              type="checkbox"
              checked={tour.is_featured}
              onChange={(e) => update('is_featured', e.target.checked)}
              className="w-4 h-4 accent-[#FFCC00]"
            />
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">Featured</span>
          </label>
        </div>
      </section>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">English</p>
        <div>
          <label className="admin-label">Title</label>
          <input className="admin-input" value={tour.title_en} onChange={(e) => update('title_en', e.target.value)} required />
        </div>
        <div>
          <label className="admin-label">Subtitle</label>
          <input className="admin-input" value={tour.subtitle_en} onChange={(e) => update('subtitle_en', e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Tag</label>
          <input className="admin-input" value={tour.tag_en} onChange={(e) => update('tag_en', e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Description</label>
          <textarea
            rows={6}
            className="admin-input resize-y"
            value={tour.description_en}
            onChange={(e) => update('description_en', e.target.value)}
          />
        </div>
      </section>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Georgian</p>
        <div>
          <label className="admin-label">Title</label>
          <input className="admin-input" value={tour.title_ka} onChange={(e) => update('title_ka', e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Subtitle</label>
          <input className="admin-input" value={tour.subtitle_ka} onChange={(e) => update('subtitle_ka', e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Tag</label>
          <input className="admin-input" value={tour.tag_ka} onChange={(e) => update('tag_ka', e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Description</label>
          <textarea
            rows={6}
            className="admin-input resize-y"
            value={tour.description_ka}
            onChange={(e) => update('description_ka', e.target.value)}
          />
        </div>
      </section>

      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={saving} className="admin-btn">
          {saving ? 'Saving…' : mode === 'create' ? 'Create tour' : 'Save changes'}
        </button>
        <Link href="/admin/tours" className="admin-btn admin-btn-ghost">Cancel</Link>
        {mode === 'edit' && (
          <button type="button" onClick={remove} disabled={deleting} className="admin-btn admin-btn-danger ml-auto">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )
}
