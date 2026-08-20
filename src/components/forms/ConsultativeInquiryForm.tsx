'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { FormField, inputClass, buttonClass } from './FormField'
import { TurnstileWidget } from './TurnstileWidget'
import { consultativeInquirySchema } from '@/lib/inquiryValidation'
import type { Destination, Service, InquiryServiceType } from '@/types'

interface Props {
  serviceType: Extract<InquiryServiceType, 'guide' | 'experience'>
  serviceId?: string | null
  destinationId?: string | null
  destinations: Destination[]
  service?: Service | null
}

type FormState = {
  service_id: string
  destination_id: string
  travel_date: string
  travel_time: string
  passengers: string
  interests: string[]
  name: string
  phone: string
  email: string
  notes: string
}

const INTEREST_KEYS = ['food', 'history', 'wine', 'nature', 'family'] as const

function emptyState(serviceId?: string | null, destinationId?: string | null): FormState {
  return {
    service_id: serviceId ?? '',
    destination_id: destinationId ?? '',
    travel_date: '',
    travel_time: '',
    passengers: '2',
    interests: [],
    name: '',
    phone: '',
    email: '',
    notes: '',
  }
}

export function ConsultativeInquiryForm({
  serviceType,
  serviceId,
  destinationId,
  destinations,
  service: _service,
}: Props) {
  const t = useTranslations('inquiry')
  const errorLabels: Record<string, string> = {
    error_required: t('shared.error_required'),
    error_phone_format: t('shared.error_phone_format'),
    error_email_format: t('shared.error_email_format'),
  }
  const interestLabels: Record<(typeof INTEREST_KEYS)[number], string> = {
    food: t('consultative.interest_food'),
    history: t('consultative.interest_history'),
    wine: t('consultative.interest_wine'),
    nature: t('consultative.interest_nature'),
    family: t('consultative.interest_family'),
  }
  const [state, setState] = useState<FormState>(() => emptyState(serviceId, destinationId))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const toggleInterest = (key: string) =>
    setState((prev) =>
      prev.interests.includes(key)
        ? { ...prev, interests: prev.interests.filter((k) => k !== key) }
        : { ...prev, interests: [...prev.interests, key] },
    )

  const handleTurnstileToken = useCallback((token: string | null) => {
    setTurnstileToken(token)
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const payload = {
      service_type: serviceType,
      service_id: state.service_id || null,
      destination_id: state.destination_id,
      travel_date: state.travel_date || undefined,
      travel_time: state.travel_time || undefined,
      passengers: state.passengers || undefined,
      interests: state.interests,
      name: state.name,
      phone: state.phone,
      email: state.email,
      notes: state.notes,
      turnstile_token: turnstileToken || undefined,
    }

    const parsed = consultativeInquirySchema.safeParse(payload)
    if (!parsed.success) {
      const next: Partial<Record<keyof FormState, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState
        if (!next[key]) next[key] = errorLabels[issue.message] ?? issue.message
      }
      setErrors(next)
      setFormStatus('error')
      return
    }

    setErrors({})
    setFormStatus('submitting')

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (res.status === 201) {
        setFormStatus('success')
        setState(emptyState(serviceId, destinationId))
        return
      }
      if (res.status === 429) {
        setFormError(t('shared.error_rate_limited'))
      } else if (res.status === 403) {
        setFormError(t('shared.error_turnstile'))
      } else {
        setFormError(t('shared.error_generic'))
      }
      setFormStatus('error')
    } catch {
      setFormError(t('shared.error_generic'))
      setFormStatus('error')
    }
  }

  if (formStatus === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="admin-card border-l-4 border-l-[#FFCC00] max-w-2xl"
      >
        <h2 className="text-2xl font-black text-white mb-3">{t('shared.success_title')}</h2>
        <p className="text-white/70">{t('shared.success_body')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl" noValidate>
      <h2 className="text-2xl font-black text-white">{t('consultative.heading')}</h2>

      <div
        role="alert"
        aria-live="assertive"
        className={`min-h-[1.5rem] text-sm ${formError ? 'text-red-400' : ''}`}
      >
        {formError}
      </div>

      {!destinationId && (
        <FormField label={t('consultative.destination')} required error={errors.destination_id}>
          {({ id, describedBy, invalid }) => (
            <select
              id={id}
              required
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.destination_id}
              onChange={(e) => set('destination_id', e.target.value)}
            >
              <option value="">—</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_ka || d.name_en}
                </option>
              ))}
            </select>
          )}
        </FormField>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label={t('consultative.date_from')} error={errors.travel_date}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="date"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.travel_date}
              onChange={(e) => set('travel_date', e.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('consultative.date_to')} error={errors.travel_time}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="date"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.travel_time}
              onChange={(e) => set('travel_time', e.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('consultative.travellers')} error={errors.passengers}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="number"
              min={1}
              max={50}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.passengers}
              onChange={(e) => set('passengers', e.target.value)}
            />
          )}
        </FormField>
      </div>

      <fieldset className="space-y-3">
        <legend className="block text-sm font-semibold text-white mb-2">
          {t('consultative.interests')}
        </legend>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {INTEREST_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-3 min-h-11">
              <input
                type="checkbox"
                checked={state.interests.includes(key)}
                onChange={() => toggleInterest(key)}
                className="w-4 h-4 accent-[#FFCC00]"
              />
              <span className="text-white">{interestLabels[key]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <FormField label={t('shared.notes')} required error={errors.notes}>
        {({ id, describedBy, invalid }) => (
          <textarea
            id={id}
            rows={5}
            required
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={`${inputClass} resize-y`}
            value={state.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        )}
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label={t('shared.name')} required error={errors.name}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="text"
              required
              autoComplete="name"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.name}
              onChange={(e) => set('name', e.target.value)}
            />
          )}
        </FormField>

        <FormField
          label={t('shared.phone')}
          required
          error={errors.phone}
          helpText="e.g. 551 71 03 03"
        >
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          )}
        </FormField>
      </div>

      <FormField label={t('shared.email')} error={errors.email}>
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            type="email"
            autoComplete="email"
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={inputClass}
            value={state.email}
            onChange={(e) => set('email', e.target.value)}
          />
        )}
      </FormField>

      <TurnstileWidget onToken={handleTurnstileToken} />

      <div className="flex items-center gap-6 flex-wrap">
        <button type="submit" disabled={formStatus === 'submitting'} className={buttonClass}>
          {formStatus === 'submitting' ? t('shared.sending') : t('shared.submit')}
        </button>
        <p className="text-sm text-white/60">{t('shared.reply_note')}</p>
      </div>
    </form>
  )
}
