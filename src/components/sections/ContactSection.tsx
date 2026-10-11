'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/types'
import { FormField, inputClass, buttonClass } from '@/components/forms/FormField'

// /contact only. Light surface, request-panel card, and the shared FormField
// primitives so every control has a real <label> (WHY-109).
// WHY-121: phone is required (it's how the founders confirm), email is
// optional, and the tour dropdown is gone (it rendered "—": nothing fed it).
type Field = 'full_name' | 'phone' | 'email' | 'message'
type ErrorKey = 'error_required' | 'error_phone_format' | 'error_email_format'
const EMPTY = { full_name: '', phone: '', email: '', message: '' }

export default function ContactSection({
  locale,
  details,
}: {
  locale: Locale
  // Server-rendered ContactDetails (WHY-111); null when nothing is set.
  details?: React.ReactNode
}) {
  const t = useTranslations('contact')
  const tShared = useTranslations('inquiry.shared')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'rate_limited'>('idle')
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<Field, ErrorKey>>>({})
  const errorText = (f: Field) => (errors[f] ? tShared(errors[f]!) : null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrors({})
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language: locale }),
      })
      if (res.status === 429) return setStatus('rate_limited')
      if (res.status === 400) {
        const data = await res.json().catch(() => ({}))
        setErrors(data.fieldErrors ?? {})
        return setStatus('error')
      }
      if (!res.ok) throw new Error()
      setStatus('success')
      setForm(EMPTY)
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
          <FormField label={t('name')} required error={errorText('full_name')}>
            {({ id, describedBy, invalid }) => (
              <input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} autoComplete="name"
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                className={inputClass} placeholder={t('placeholder_name')} required minLength={2} maxLength={120} />
            )}
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            <FormField label={tShared('phone')} required error={errorText('phone')}>
              {({ id, describedBy, invalid }) => (
                <input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} type="tel" autoComplete="tel"
                  inputMode="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className={inputClass} required minLength={7} maxLength={30} />
              )}
            </FormField>
            <FormField label={t('email')} error={errorText('email')}>
              {({ id, describedBy, invalid }) => (
                <input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} type="email" autoComplete="email"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className={inputClass} placeholder={t('placeholder_email')} />
              )}
            </FormField>
          </div>
          <FormField label={t('message')} required error={errorText('message')}>
            {({ id, describedBy, invalid }) => (
              <textarea id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined}
                value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                rows={4} className={inputClass + ' resize-none'} placeholder={t('placeholder_message')}
                required minLength={10} maxLength={4000} />
            )}
          </FormField>
          <div className="flex items-center gap-6 pt-2 flex-wrap">
            <button type="submit" disabled={status === 'loading'} className={buttonClass}>
              {status === 'loading' ? '...' : `${t('submit')} →`}
            </button>
            <p role="status" aria-live="polite"
              className={`text-sm ${status === 'error' || status === 'rate_limited' ? 'text-danger' : 'text-muted'}`}>
              {status === 'success' ? t('success') : status === 'rate_limited' ? tShared('error_rate_limited') : status === 'error' ? t('error') : t('reply_note')}
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}
