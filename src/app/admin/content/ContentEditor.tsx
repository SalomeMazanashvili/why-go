'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../_components/ToastProvider'

type ContentValue = { en: string; ka: string }
type ContentMap = Record<string, ContentValue>

interface Props {
  groups: { label: string; keys: string[] }[]
  initial: ContentMap
}

function isLong(key: string) {
  return key.endsWith('.body') || key.endsWith('.sub')
}

function label(key: string) {
  return key.split('.').slice(1).join('.').replace(/_/g, ' ')
}

export default function ContentEditor({ groups, initial }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [values, setValues] = useState<ContentMap>(initial)
  const [saving, setSaving] = useState(false)

  const update = (key: string, locale: 'en' | 'ka', value: string) =>
    setValues((prev) => ({ ...prev, [key]: { ...prev[key], [locale]: value } }))

  const save = async () => {
    setSaving(true)
    try {
      const items = Object.entries(values).map(([key, v]) => ({
        key,
        value_en: v.en,
        value_ka: v.ka,
      }))
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Save failed')
        return
      }
      toast.success('Content saved')
      router.refresh()
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label} className="admin-card space-y-5">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00]">{group.label}</p>
          {group.keys.map((key) => (
            <div key={key} className="border-t border-white/5 pt-4 first:border-0 first:pt-0">
              <p className="text-[11px] font-bold tracking-widest uppercase text-white/60 mb-3">
                {label(key)}
                <span className="text-white/25 ml-2 normal-case tracking-normal font-normal">{key}</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">English</label>
                  {isLong(key) ? (
                    <textarea
                      rows={4}
                      className="admin-input resize-y"
                      value={values[key]?.en ?? ''}
                      onChange={(e) => update(key, 'en', e.target.value)}
                    />
                  ) : (
                    <input
                      className="admin-input"
                      value={values[key]?.en ?? ''}
                      onChange={(e) => update(key, 'en', e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <label className="admin-label">Georgian</label>
                  {isLong(key) ? (
                    <textarea
                      rows={4}
                      className="admin-input resize-y"
                      value={values[key]?.ka ?? ''}
                      onChange={(e) => update(key, 'ka', e.target.value)}
                    />
                  ) : (
                    <input
                      className="admin-input"
                      value={values[key]?.ka ?? ''}
                      onChange={(e) => update(key, 'ka', e.target.value)}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      ))}

      <div className="sticky bottom-4 flex justify-end">
        <button onClick={save} disabled={saving} className="admin-btn shadow-lg">
          {saving ? 'Saving…' : 'Save content'}
        </button>
      </div>
    </div>
  )
}
