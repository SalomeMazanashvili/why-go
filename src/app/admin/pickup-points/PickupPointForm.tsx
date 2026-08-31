'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '../_components/ToastProvider'
import type { PickupPoint, Destination } from '@/types'

interface Props {
  initial?: PickupPoint | null
  mode: 'create' | 'edit'
  destinations: Destination[]
}

const empty: PickupPoint = {
  id: '',
  destination_id: '',
  label_en: '',
  label_ka: '',
  price_from: null,
  currency: 'EUR',
  notes: '',
  is_published: false,
  sort_order: 0,
}

export default function PickupPointForm({ initial, mode, destinations }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [item, setItem] = useState<PickupPoint>(initial ?? empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const update = <K extends keyof PickupPoint>(key: K, value: PickupPoint[K]) =>
    setItem((prev) => ({ ...prev, [key]: value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = mode === 'create' ? '/api/admin/pickup-points' : `/api/admin/pickup-points/${item.id}`
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
      toast.success(mode === 'create' ? 'Pickup point created' : 'Pickup point saved')
      if (mode === 'create' && data.id) {
        router.push(`/admin/pickup-points/${data.id}`)
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
    if (!confirm(`Delete "${item.label_ka || item.label_en}"? Existing inquiries referencing it will keep the reference as NULL.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/pickup-points/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Delete failed')
        setDeleting(false)
        return
      }
      toast.success('Pickup point deleted')
      router.push('/admin/pickup-points')
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
            <label className="admin-label">Origin destination (city)</label>
            <select
              className="admin-input"
              value={item.destination_id}
              onChange={(e) => update('destination_id', e.target.value)}
              required
            >
              <option value="">— Select destination —</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_ka || d.name_en} {d.country ? `(${d.country})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-white/40 mt-1">
              The transfer form groups pickup points by this city.
            </p>
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
            <label className="admin-label">From price (indicative)</label>
            <input
              type="number"
              step="0.01"
              className="admin-input"
              value={item.price_from ?? ''}
              onChange={(e) => update('price_from', e.target.value ? Number(e.target.value) : null)}
            />
            <p className="text-[10px] text-white/40 mt-1">
              Real floor for the smallest vehicle from this pickup. Never a lower number to look competitive.
            </p>
          </div>
          <div>
            <label className="admin-label">Currency</label>
            <input
              className="admin-input"
              value={item.currency}
              onChange={(e) => update('currency', e.target.value.toUpperCase())}
              placeholder="EUR"
              maxLength={3}
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
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Labels</p>
        <p className="text-white/50 text-xs">
          Precise labels — customers read them in the dropdown and drivers read them in the WhatsApp handoff. Include terminal / station identifier so nobody guesses.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Label (Georgian)</label>
            <input
              className="admin-input"
              value={item.label_ka}
              onChange={(e) => update('label_ka', e.target.value)}
              placeholder="მაგ. ბარსელონა · ელ პრატი T1"
            />
          </div>
          <div>
            <label className="admin-label">Label (English)</label>
            <input
              className="admin-input"
              value={item.label_en}
              onChange={(e) => update('label_en', e.target.value)}
              placeholder="e.g. Barcelona · El Prat T1"
              required
            />
          </div>
        </div>
      </section>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Internal notes</p>
        <textarea
          rows={3}
          className="admin-input resize-y"
          value={item.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Not shown to customers. Meeting-point details, driver instructions, etc."
        />
      </section>

      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={saving} className="admin-btn">
          {saving ? 'Saving…' : mode === 'create' ? 'Create pickup point' : 'Save changes'}
        </button>
        <Link href="/admin/pickup-points" className="admin-btn admin-btn-ghost">Cancel</Link>
        {mode === 'edit' && (
          <button type="button" onClick={remove} disabled={deleting} className="admin-btn admin-btn-danger ml-auto">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )
}
