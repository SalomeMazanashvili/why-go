'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { FormField, inputClass, buttonClass } from './FormField'
import { TurnstileWidget } from './TurnstileWidget'
import { transactionalInquirySchema } from '@/lib/inquiryValidation'
import type { Destination, Service, InquiryServiceType } from '@/types'

interface Props {
  serviceType: Extract<InquiryServiceType, 'transfer' | 'day_trip'>
  serviceId?: string | null
  destinationId?: string | null
  destinations?: Destination[]
  service?: Service | null
}

type FormState = {
  service_id: string
  destination_id: string
  pickup_from: string
  pickup_to: string
  travel_date: string
  travel_time: string
  passengers: string
  luggage_pieces: string
  payment_method: 'cash' | 'iban'
  name: string
  phone: string
  email: string
  notes: string
}

function emptyState(serviceId?: string | null, destinationId?: string | null): FormState {
  return {
    service_id: serviceId ?? '',
    destination_id: destinationId ?? '',
    pickup_from: '',
    pickup_to: '',
    travel_date: '',
    travel_time: '',
    passengers: '1',
    luggage_pieces: '0',
    payment_method: 'cash',
    name: '',
    phone: '',
    email: '',
    notes: '',
  }
}

export function TransactionalInquiryForm({
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
  const [state, setState] = useState<FormState>(() => emptyState(serviceId, destinationId))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const handleTurnstileToken = useCallback((token: string | null) => {
    setTurnstileToken(token)
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const payload = {
      service_type: serviceType,
      service_id: state.service_id || null,
      destination_id: state.destination_id || null,
      pickup_from: state.pickup_from,
      pickup_to: state.pickup_to,
      travel_date: state.travel_date,
      travel_time: state.travel_time || undefined,
      passengers: state.passengers,
      luggage_pieces: state.luggage_pieces,
      payment_method: state.payment_method,
      name: state.name,
      phone: state.phone,
      email: state.email,
      notes: state.notes,
      turnstile_token: turnstileToken || undefined,
    }

    const parsed = transactionalInquirySchema.safeParse(payload)
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
      <h2 className="text-2xl font-black text-white">{t('transactional.heading')}</h2>

      <div
        role="alert"
        aria-live="assertive"
        className={`min-h-[1.5rem] text-sm ${formError ? 'text-red-400' : ''}`}
      >
        {formError}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label={t('transactional.pickup_from')} required error={errors.pickup_from}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="text"
              required
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.pickup_from}
              onChange={(e) => set('pickup_from', e.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('transactional.pickup_to')} required error={errors.pickup_to}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="text"
              required
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.pickup_to}
              onChange={(e) => set('pickup_to', e.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('transactional.travel_date')} required error={errors.travel_date}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="date"
              required
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.travel_date}
              onChange={(e) => set('travel_date', e.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('transactional.travel_time')} error={errors.travel_time}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="time"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.travel_time}
              onChange={(e) => set('travel_time', e.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('transactional.passengers')} required error={errors.passengers}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="number"
              min={1}
              max={50}
              required
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.passengers}
              onChange={(e) => set('passengers', e.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('transactional.luggage_pieces')} error={errors.luggage_pieces}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="number"
              min={0}
              max={50}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.luggage_pieces}
              onChange={(e) => set('luggage_pieces', e.target.value)}
            />
          )}
        </FormField>
      </div>

      {destinations && destinations.length > 0 && !destinationId && (
        <FormField label="Destination" error={errors.destination_id}>
          {({ id, describedBy, invalid }) => (
            <select
              id={id}
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

      <fieldset className="space-y-3">
        <legend className="block text-sm font-semibold text-white">
          {t('transactional.payment_method')}
          <span aria-hidden="true" className="text-[#FFCC00] ml-1">*</span>
          <span className="sr-only"> (required)</span>
        </legend>
        <label className="flex items-center gap-3 min-h-11">
          <input
            type="radio"
            name="payment_method"
            value="cash"
            checked={state.payment_method === 'cash'}
            onChange={() => set('payment_method', 'cash')}
            className="w-4 h-4 accent-[#FFCC00]"
          />
          <span className="text-white">{t('transactional.payment_cash')}</span>
        </label>
        <label className="flex items-center gap-3 min-h-11">
          <input
            type="radio"
            name="payment_method"
            value="iban"
            checked={state.payment_method === 'iban'}
            onChange={() => set('payment_method', 'iban')}
            className="w-4 h-4 accent-[#FFCC00]"
          />
          <span className="text-white">{t('transactional.payment_iban')}</span>
        </label>
      </fieldset>

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
          helpText="+995..."
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

      <FormField label={t('shared.notes')} error={errors.notes}>
        {({ id, describedBy, invalid }) => (
          <textarea
            id={id}
            rows={4}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={`${inputClass} resize-y`}
            value={state.notes}
            onChange={(e) => set('notes', e.target.value)}
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
