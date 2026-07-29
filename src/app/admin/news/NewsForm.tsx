'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '../_components/ToastProvider'
import ImageUploader from '../_components/ImageUploader'
import type { AdminNews } from '@/lib/news'

interface Props {
  initial?: AdminNews | null
  mode: 'create' | 'edit'
}

const empty: AdminNews = {
  id: '',
  slug: '',
  title_en: '', excerpt_en: '', content_en: '', tag_en: '',
  title_ka: '', excerpt_ka: '', content_ka: '', tag_ka: '',
  cover_image: '',
  author: 'Whygo Team',
  reading_time_min: 5,
  is_featured: false,
  is_published: true,
  published_at: new Date().toISOString(),
}

export default function NewsForm({ initial, mode }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [item, setItem] = useState<AdminNews>(initial ?? empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
        body: JSON.stringify(item),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Save failed')
        setSaving(false)
        return
      }
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
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Meta</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Slug</label>
            <input className="admin-input" value={item.slug} onChange={(e) => update('slug', e.target.value)} required />
          </div>
          <div>
            <label className="admin-label">Author</label>
            <input className="admin-input" value={item.author} onChange={(e) => update('author', e.target.value)} />
          </div>
          <div>
            <label className="admin-label">Reading time (min)</label>
            <input
              type="number"
              className="admin-input"
              value={item.reading_time_min}
              onChange={(e) => update('reading_time_min', Number(e.target.value) || 0)}
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
              className="w-4 h-4 accent-[#FFCC00]"
            />
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">Featured</span>
          </label>
          <label className="flex items-center gap-3 mt-2">
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
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">English</p>
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
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Georgian</p>
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
          <textarea
            rows={10}
            className="admin-input resize-y font-mono text-[13px]"
            value={item.content_ka}
            onChange={(e) => update('content_ka', e.target.value)}
          />
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
