'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '../_components/ToastProvider'
import ImageUploader from '../_components/ImageUploader'
import type { Destination } from '@/types'

interface Props {
  initial?: Destination | null
  mode: 'create' | 'edit'
}

const empty: Destination = {
  id: '',
  slug: '',
  name_en: '',
  name_ka: '',
  country: '',
  description_en: '',
  description_ka: '',
  seo_title_ka: '',
  seo_description_ka: '',
  cover_image: '',
  is_published: false,
  sort_order: 0,
}

export default function DestinationForm({ initial, mode }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [item, setItem] = useState<Destination>(initial ?? empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const update = <K extends keyof Destination>(key: K, value: Destination[K]) =>
    setItem((prev) => ({ ...prev, [key]: value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = mode === 'create' ? '/api/admin/destinations' : `/api/admin/destinations/${item.id}`
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
      toast.success(mode === 'create' ? 'Destination created' : 'Destination saved')
      if (mode === 'create' && data.id) {
        router.push(`/admin/destinations/${data.id}`)
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
    if (!confirm(`Delete "${item.name_ka || item.name_en || 'this destination'}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/destinations/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Delete failed')
        setDeleting(false)
        return
      }
      toast.success('Destination deleted')
      router.push('/admin/destinations')
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
            <label className="admin-label">Country</label>
            <input className="admin-input" value={item.country} onChange={(e) => update('country', e.target.value)} placeholder="e.g. Spain, Germany" />
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
        <div>
          <ImageUploader
            value={item.cover_image ?? ''}
            onChange={(url) => update('cover_image', url)}
            folder="destinations"
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
          <label className="admin-label">Description</label>
          <textarea
            rows={6}
            className="admin-input resize-y"
            value={item.description_ka}
            onChange={(e) => update('description_ka', e.target.value)}
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
          <label className="admin-label">Description</label>
          <textarea
            rows={6}
            className="admin-input resize-y"
            value={item.description_en}
            onChange={(e) => update('description_en', e.target.value)}
          />
        </div>
      </section>

      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={saving} className="admin-btn">
          {saving ? 'Saving…' : mode === 'create' ? 'Create destination' : 'Save changes'}
        </button>
        <Link href="/admin/destinations" className="admin-btn admin-btn-ghost">Cancel</Link>
        {mode === 'edit' && (
          <button type="button" onClick={remove} disabled={deleting} className="admin-btn admin-btn-danger ml-auto">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )
}
