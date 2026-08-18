'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '../_components/ToastProvider'
import ImageUploader from '../_components/ImageUploader'
import type { Guide } from '@/types'

interface Props {
  initial?: Guide | null
  mode: 'create' | 'edit'
}

const empty: Guide = {
  id: '',
  slug: '',
  name_en: '',
  name_ka: '',
  bio_en: '',
  bio_ka: '',
  photo: '',
  languages: '',
  destinations_covered: '',
  specialties_en: '',
  specialties_ka: '',
  is_published: false,
  sort_order: 0,
}

export default function GuideForm({ initial, mode }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [item, setItem] = useState<Guide>(initial ?? empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const update = <K extends keyof Guide>(key: K, value: Guide[K]) =>
    setItem((prev) => ({ ...prev, [key]: value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = mode === 'create' ? '/api/admin/guides' : `/api/admin/guides/${item.id}`
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
      toast.success(mode === 'create' ? 'Guide created' : 'Guide saved')
      if (mode === 'create' && data.id) {
        router.push(`/admin/guides/${data.id}`)
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
    if (!confirm(`Delete "${item.name_ka || item.name_en || 'this guide'}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/guides/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Delete failed')
        setDeleting(false)
        return
      }
      toast.success('Guide deleted')
      router.push('/admin/guides')
      router.refresh()
    } catch {
      toast.error('Network error')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <div className="admin-card border-l-2 border-l-[#FFCC00]">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Consent required</p>
        <p className="text-white/60 text-xs leading-relaxed">
          Only add guides who have explicitly consented to being publicly named and photographed
          on the site. The Oktoberfest tour expert must never be added here — that credential
          lives in the tour&apos;s <span className="font-mono text-white/80">expert_credential_ka</span> field and stays anonymous.
        </p>
      </div>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Meta</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Slug</label>
            <input className="admin-input" value={item.slug} onChange={(e) => update('slug', e.target.value)} required />
          </div>
          <div>
            <label className="admin-label">Languages</label>
            <input
              className="admin-input"
              value={item.languages}
              onChange={(e) => update('languages', e.target.value)}
              placeholder="e.g. ქართული, ინგლისური, გერმანული"
            />
          </div>
          <div className="md:col-span-2">
            <label className="admin-label">Destinations covered</label>
            <input
              className="admin-input"
              value={item.destinations_covered}
              onChange={(e) => update('destinations_covered', e.target.value)}
              placeholder="e.g. მიუნხენი, ბერლინი"
            />
            <p className="text-[10px] text-white/40 mt-1">Free text for now. PR C may link this to destinations.</p>
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
            value={item.photo ?? ''}
            onChange={(url) => update('photo', url)}
            folder="guides"
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
          <label className="admin-label">Bio</label>
          <textarea
            rows={6}
            className="admin-input resize-y"
            value={item.bio_ka}
            onChange={(e) => update('bio_ka', e.target.value)}
          />
        </div>
        <div>
          <label className="admin-label">Specialties</label>
          <input
            className="admin-input"
            value={item.specialties_ka}
            onChange={(e) => update('specialties_ka', e.target.value)}
            placeholder="e.g. კულინარული ტურები, ისტორია"
          />
        </div>
      </section>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">English</p>
        <div>
          <label className="admin-label">Name</label>
          <input className="admin-input" value={item.name_en} onChange={(e) => update('name_en', e.target.value)} required />
        </div>
        <div>
          <label className="admin-label">Bio</label>
          <textarea
            rows={6}
            className="admin-input resize-y"
            value={item.bio_en}
            onChange={(e) => update('bio_en', e.target.value)}
          />
        </div>
        <div>
          <label className="admin-label">Specialties</label>
          <input
            className="admin-input"
            value={item.specialties_en}
            onChange={(e) => update('specialties_en', e.target.value)}
            placeholder="e.g. Food tours, history"
          />
        </div>
      </section>

      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={saving} className="admin-btn">
          {saving ? 'Saving…' : mode === 'create' ? 'Create guide' : 'Save changes'}
        </button>
        <Link href="/admin/guides" className="admin-btn admin-btn-ghost">Cancel</Link>
        {mode === 'edit' && (
          <button type="button" onClick={remove} disabled={deleting} className="admin-btn admin-btn-danger ml-auto">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )
}
