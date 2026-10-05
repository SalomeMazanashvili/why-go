'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Tour, Locale } from '@/types'
import { getTourTitle } from '@/types'
import { FormField, inputClass, buttonClass } from '@/components/forms/FormField'

// /contact only. Light surface, request-panel card, and the shared FormField
// primitives so every control has a real <label> (WHY-109).
export default function ContactSection({
  tours,
  locale,
  details,
}: {
  tours: Tour[]
  locale: Locale
  // Server-rendered ContactDetails (WHY-111); null when nothing is set.
  details?: React.ReactNode
}) {
  const t = useTranslations('contact')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [form, setForm] = useState({ full_name: '', email: '', tour_slug: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language: locale }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setForm({ full_name: '', email: '', tour_slug: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="surface-light pt-32 pb-20 px-6 md:px-10">
      <div className="max-w-2xl">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-4">{t('label')}</p>
        <h1 className="font-black uppercase text-fg leading-none tracking-tight"
          style={{ fontSize: 'clamp(40px,7vw,80px)', letterSpacing: '-0.04em', lineHeight: 1.15 }}>
          {t('title_1')}<br />{t('title_2')}<br />
          <span className="bg-brand-yellow text-ink px-[0.08em] box-decoration-clone">{t('title_3')}</span>
        </h1>
      </div>
      {/* Details come first in the DOM so a phone user sees the number before
          the form; on wide screens they sit beside it. */}
      <div className={details ? 'mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start max-w-5xl' : 'max-w-2xl'}>
        {details && <div className="lg:order-2">{details}</div>}
        <form onSubmit={handleSubmit} className={`request-panel space-y-2 ${details ? 'lg:order-1' : 'mt-12'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            <FormField label={t('name')} required>
              {({ id, describedBy }) => (
                <input id={id} aria-describedby={describedBy} autoComplete="name"
                  value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className={inputClass} placeholder={t('placeholder_name')} required minLength={2} />
              )}
            </FormField>
            <FormField label={t('email')} required>
              {({ id, describedBy }) => (
                <input id={id} aria-describedby={describedBy} type="email" autoComplete="email"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className={inputClass} placeholder={t('placeholder_email')} required />
              )}
            </FormField>
          </div>
          <FormField label={t('interest')}>
            {({ id, describedBy }) => (
              <select id={id} aria-describedby={describedBy}
                value={form.tour_slug} onChange={e => setForm({ ...form, tour_slug: e.target.value })}
                className={inputClass + ' cursor-pointer'}>
                <option value="">—</option>
                {tours.map(tour => (
                  <option key={tour.slug} value={tour.slug}>{getTourTitle(tour, locale)}</option>
                ))}
              </select>
            )}
          </FormField>
          <FormField label={t('message')} required>
            {({ id, describedBy }) => (
              <textarea id={id} aria-describedby={describedBy}
                value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                rows={4} className={inputClass + ' resize-none'} placeholder={t('placeholder_message')}
                required minLength={10} />
            )}
          </FormField>
          <div className="flex items-center gap-6 pt-2 flex-wrap">
            <button type="submit" disabled={status === 'loading'} className={buttonClass}>
              {status === 'loading' ? '...' : `${t('submit')} →`}
            </button>
            <p role="status" aria-live="polite"
              className={`text-sm ${status === 'error' ? 'text-danger' : 'text-muted'}`}>
              {status === 'success' ? t('success') : status === 'error' ? t('error') : t('reply_note')}
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}
