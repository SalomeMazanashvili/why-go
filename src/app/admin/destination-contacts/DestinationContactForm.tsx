'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '../_components/ToastProvider'
import type { DestinationContact, Destination, DestinationContactType } from '@/types'

interface Props {
  initial?: DestinationContact | null
  mode: 'create' | 'edit'
  destinations: Destination[]
}

const empty: DestinationContact = {
  id: '',
  destination_id: '',
  contact_type: 'driver',
  name: '',
  phone_e164: '',
  whatsapp_e164: '',
  notes: '',
}

const CONTACT_TYPES: DestinationContactType[] = ['driver', 'guide']

export default function DestinationContactForm({ initial, mode, destinations }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [item, setItem] = useState<DestinationContact>(initial ?? empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const update = <K extends keyof DestinationContact>(key: K, value: DestinationContact[K]) =>
    setItem((prev) => ({ ...prev, [key]: value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = mode === 'create' ? '/api/admin/destination-contacts' : `/api/admin/destination-contacts/${item.id}`
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
      toast.success(mode === 'create' ? 'Contact created' : 'Contact saved')
      if (mode === 'create' && data.id) {
        router.push(`/admin/destination-contacts/${data.id}`)
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
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/destination-contacts/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Delete failed')
        setDeleting(false)
        return
      }
      toast.success('Contact deleted')
      router.push('/admin/destination-contacts')
      router.refresh()
    } catch {
      toast.error('Network error')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <div className="admin-card border-l-2 border-l-[#FFCC00]">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Internal only</p>
        <p className="text-white/60 text-xs leading-relaxed">
          These contacts are never shown to customers. They power the WhatsApp copy block on inquiry
          admin pages so the founders can forward booking details to the right driver or guide.
          Numbers must be in international <span className="font-mono text-white/80">E.164</span> format
          (e.g. <span className="font-mono text-white/80">+995555123456</span>).
        </p>
      </div>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Routing</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Destination</label>
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
          </div>
          <div>
            <label className="admin-label">Role</label>
            <select
              className="admin-input"
              value={item.contact_type}
              onChange={(e) => update('contact_type', e.target.value as DestinationContactType)}
              required
            >
              {CONTACT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-white/40 mt-1">
              Drivers are matched to transfer and day-trip inquiries; guides to guide and experience inquiries.
            </p>
          </div>
        </div>
      </section>

      <section className="admin-card space-y-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">Contact</p>
        <div>
          <label className="admin-label">Name</label>
          <input
            className="admin-input"
            value={item.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Phone (E.164)</label>
            <input
              type="tel"
              className="admin-input"
              value={item.phone_e164}
              onChange={(e) => update('phone_e164', e.target.value)}
              required
              placeholder="+995555123456"
              pattern="\+[0-9]{7,15}"
            />
          </div>
          <div>
            <label className="admin-label">WhatsApp (E.164, optional)</label>
            <input
              type="tel"
              className="admin-input"
              value={item.whatsapp_e164}
              onChange={(e) => update('whatsapp_e164', e.target.value)}
              placeholder="Leave blank to use phone number"
              pattern="\+[0-9]{7,15}"
            />
          </div>
        </div>
        <div>
          <label className="admin-label">Notes</label>
          <textarea
            rows={3}
            className="admin-input resize-y"
            value={item.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Availability, vehicle details, languages spoken, etc."
          />
        </div>
      </section>

      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={saving} className="admin-btn">
          {saving ? 'Saving…' : mode === 'create' ? 'Create contact' : 'Save changes'}
        </button>
        <Link href="/admin/destination-contacts" className="admin-btn admin-btn-ghost">Cancel</Link>
        {mode === 'edit' && (
          <button type="button" onClick={remove} disabled={deleting} className="admin-btn admin-btn-danger ml-auto">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )
}
