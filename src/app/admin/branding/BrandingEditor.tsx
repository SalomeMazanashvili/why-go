'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../_components/ToastProvider'
import { SOCIAL_NETWORKS } from '@/lib/socialNetworks'
import { CONTACT_FIELDS, normalizePhone, type ContactKey } from '@/lib/contactInfo'

const CONTACT_LABELS: Record<ContactKey, string> = {
  contact_phone: 'Phone',
  contact_whatsapp: 'WhatsApp',
  contact_hours: 'Opening hours (optional)',
}

const CONTACT_HINTS: Record<ContactKey, string> = {
  contact_phone: 'International format. Dials when tapped on a phone.',
  contact_whatsapp: 'Usually the same number. Opens a WhatsApp chat.',
  contact_hours: 'In Georgian, as customers should read it. Leave empty if you answer any time.',
}

type Settings = Record<string, string>

interface Props {
  initial: Settings
}

const COLORS: { key: string; label: string }[] = [
  { key: 'color_primary', label: 'Primary yellow' },
  { key: 'color_background', label: 'Background' },
  { key: 'color_surface', label: 'Surface' },
  { key: 'color_accent', label: 'Accent' },
  { key: 'color_text', label: 'Text' },
]

const FONT_SIZES: { key: string; label: string; hint: string }[] = [
  { key: 'font_hero_size', label: 'Hero heading size', hint: 'e.g. 112px' },
  { key: 'font_section_size', label: 'Section title size', hint: 'e.g. 52px' },
]

function normalizeColor(v: string) {
  const trimmed = v.trim()
  if (!trimmed) return '#000000'
  if (trimmed.startsWith('#')) return trimmed
  return `#${trimmed}`
}

export default function BrandingEditor({ initial }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [settings, setSettings] = useState<Settings>(initial)
  const [saving, setSaving] = useState(false)

  const update = (key: string, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      const items = Object.entries(settings).map(([key, value]) => ({ key, value }))
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Save failed')
        return
      }
      toast.success('Branding saved')
      router.refresh()
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
      <div className="space-y-6">
        <section className="admin-card space-y-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-brand-yellow">Colors</p>
          {COLORS.map((c) => (
            <div key={c.key} className="flex items-center gap-4">
              <input
                type="color"
                value={normalizeColor(settings[c.key] ?? '#000000')}
                onChange={(e) => update(c.key, e.target.value.toUpperCase())}
                className="w-14 h-14 rounded-sm bg-transparent border border-white/10 cursor-pointer"
              />
              <div className="flex-1">
                <label className="admin-label">{c.label}</label>
                <input
                  className="admin-input font-mono uppercase"
                  value={settings[c.key] ?? ''}
                  onChange={(e) => update(c.key, e.target.value)}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="admin-card space-y-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-brand-yellow">Typography</p>
          {FONT_SIZES.map((f) => (
            <div key={f.key}>
              <label className="admin-label">{f.label}</label>
              <input
                className="admin-input font-mono"
                value={settings[f.key] ?? ''}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.hint}
              />
            </div>
          ))}
        </section>

        <section className="admin-card space-y-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-brand-yellow">Contact</p>
          <p className="text-[10px] text-white/40">
            Shown on the contact page. Leave a field empty to hide it.
          </p>
          {CONTACT_FIELDS.map((f) => {
            const value = settings[f.key] ?? ''
            const invalid = f.kind === 'phone' && value.trim() !== '' && !normalizePhone(value)
            const hintId = `${f.key}-hint`
            return (
              <div key={f.key}>
                <label className="admin-label" htmlFor={f.key}>{CONTACT_LABELS[f.key]}</label>
                <input
                  id={f.key}
                  type={f.kind === 'phone' ? 'tel' : 'text'}
                  inputMode={f.kind === 'phone' ? 'tel' : undefined}
                  className={`admin-input ${f.kind === 'phone' ? 'font-mono' : ''}`}
                  value={value}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.kind === 'phone' ? '+995 598 12 34 56' : ''}
                  aria-invalid={invalid || undefined}
                  aria-describedby={hintId}
                />
                <p id={hintId} className={`text-[10px] mt-1 ${invalid ? 'text-red-400' : 'text-white/40'}`}>
                  {invalid ? 'Use the full international number, starting with +995.' : CONTACT_HINTS[f.key]}
                </p>
              </div>
            )
          })}
        </section>

        <section className="admin-card space-y-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-brand-yellow">Social links</p>
          <p className="text-[10px] text-white/40">
            Full profile URL starting with https://. Shown as icons in the site footer and on the
            contact page; leave empty to hide a network.
          </p>
          {SOCIAL_NETWORKS.map((n) => (
            <div key={n.key}>
              <label className="admin-label" htmlFor={n.key}>{n.name}</label>
              <input
                id={n.key}
                type="url"
                className="admin-input font-mono"
                value={settings[n.key] ?? ''}
                onChange={(e) => update(n.key, e.target.value.trim())}
                placeholder="https://"
              />
            </div>
          ))}
        </section>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="admin-btn">
            {saving ? 'Saving…' : 'Save branding'}
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 self-start">
        <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-3">Preview</p>
        <div
          className="border border-white/10 overflow-hidden"
          style={{ background: normalizeColor(settings.color_background) }}
        >
          <div className="p-8 space-y-6" style={{ color: normalizeColor(settings.color_text) }}>
            <p
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: normalizeColor(settings.color_primary) }}
            >
              Preview
            </p>
            <p
              className="font-black leading-[0.9] tracking-tight"
              style={{ fontSize: `min(${settings.font_hero_size || '112px'}, 88px)` }}
            >
              GO<br />
              <span style={{ color: normalizeColor(settings.color_primary) }}>BEYOND</span>
            </p>
            <p className="text-sm opacity-70">
              Boutique tours built around language, sport, and culinary skills.
            </p>
            <div className="flex gap-3">
              <span
                className="inline-block px-5 py-3 text-[11px] font-black tracking-widest uppercase"
                style={{
                  background: normalizeColor(settings.color_primary),
                  color: normalizeColor(settings.color_background),
                }}
              >
                Explore
              </span>
              <span
                className="inline-block px-5 py-3 text-[11px] font-black tracking-widest uppercase border"
                style={{ borderColor: normalizeColor(settings.color_text) + '40' }}
              >
                Story
              </span>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p
                className="font-black leading-[0.9] tracking-tight"
                style={{ fontSize: `min(${settings.font_section_size || '52px'}, 40px)` }}
              >
                Section title
              </p>
            </div>
          </div>
          <div className="p-6" style={{ background: normalizeColor(settings.color_surface) }}>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: normalizeColor(settings.color_accent) }}>
              Card surface
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}
