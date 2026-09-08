'use client'

import { useCallback, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { FormField, inputClass, buttonClass } from './FormField'
import { TurnstileWidget } from './TurnstileWidget'
import { dayTripInquirySchema } from '@/lib/inquiryValidation'
import { getServiceName, type Locale, type Service } from '@/types'

// WHY-83: the day-trip request form. Deliberately NOT the transfer template —
// the founders confirmed the split (ticket comment, 2026-08-30). A day trip is
// a round trip by definition with a hotel pickup, so there is no return leg, no
// flight number, no luggage count and no route dropdown. The customer is
// deciding *whether to go*, so the surrounding page does the persuading and
// this form stays as short as it can be.
//
// travel_time is a preference, not a booking: the operator sets the real
// departure. It renders only when the selected trip has departure slots
// configured, so we never present invented times.

interface Props {
  // Published day trips, for the picker. On a detail page pass the single
  // trip plus `serviceId` to lock the selection.
  dayTrips: Service[]
  serviceId?: string | null
}

type FormState = {
  service_id: string
  travel_date: string
  travel_time: string
  passengers: string
  pickup_from: string
  name: string
  phone: string
  email: string
  notes: string
}

function emptyState(serviceId?: string | null): FormState {
  return {
    service_id: serviceId ?? '',
    travel_date: '',
    travel_time: '',
    passengers: '1',
    pickup_from: '',
    name: '',
    phone: '',
    email: '',
    notes: '',
  }
}

export function DayTripInquiryForm({ dayTrips, serviceId }: Props) {
  const t = useTranslations('inquiry')
  const locale = useLocale() as Locale
  const errorLabels: Record<string, string> = {
    error_required: t('shared.error_required'),
    error_phone_format: t('shared.error_phone_format'),
    error_email_format: t('shared.error_email_format'),
  }

  const [state, setState] = useState<FormState>(() => emptyState(serviceId))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const handleTurnstileToken = useCallback((token: string | null) => {
    setTurnstileToken(token)
  }, [])

  const selectedTrip = useMemo(
    () => dayTrips.find((d) => d.id === state.service_id) ?? null,
    [dayTrips, state.service_id],
  )

  // Departure slots belong to the trip, so switching trips must not carry a
  // stale time over. Clearing on change is simpler than reconciling.
  const onTripChange = (nextId: string) => {
    setState((prev) => ({ ...prev, service_id: nextId, travel_time: '' }))
  }

  const departureTimes = selectedTrip?.departure_times ?? []

  // Nothing to request against — render the empty state instead of a form
  // that can only fail validation. Expected until the founders publish the
  // first day trips.
  if (dayTrips.length === 0) {
    return (
      <p role="status" className="text-white/60 text-sm">
        {t('day_trip.no_trips')}
      </p>
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const payload = {
      service_type: 'day_trip' as const,
      service_id: state.service_id,
      // Derived from the trip, never asked. The admin WhatsApp block and
      // destination_contacts routing key off destination_id, so a day-trip
      // inquiry that omitted it would land with no driver to route to.
      destination_id: selectedTrip?.destination_id || null,
      travel_date: state.travel_date,
      travel_time: state.travel_time || undefined,
      passengers: state.passengers,
      pickup_from: state.pickup_from,
      name: state.name,
      phone: state.phone,
      email: state.email,
      notes: state.notes,
      turnstile_token: turnstileToken || undefined,
    }

    const parsed = dayTripInquirySchema.safeParse(payload)
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
        setState(emptyState(serviceId))
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
      <h2 className="text-2xl font-black text-white">{t('day_trip.heading')}</h2>

      <div
        role="alert"
        aria-live="assertive"
        className={`min-h-[1.5rem] text-sm ${formError ? 'text-red-400' : ''}`}
      >
        {formError}
      </div>

      {/* On a detail page the trip is already chosen — the picker would be a
          one-option select, so it's replaced by a hidden value. */}
      {serviceId ? (
        <input type="hidden" name="service_id" value={state.service_id} />
      ) : (
        <FormField label={t('day_trip.day_trip')} required error={errors.service_id}>
          {({ id, describedBy, invalid }) => (
            <select
              id={id}
              required
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.service_id}
              onChange={(e) => onTripChange(e.target.value)}
            >
              <option value="">{t('day_trip.day_trip_placeholder')}</option>
              {dayTrips.map((d) => (
                <option key={d.id} value={d.id}>
                  {getServiceName(d, locale)}
                </option>
              ))}
            </select>
          )}
        </FormField>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label={t('day_trip.travel_date')} required error={errors.travel_date}>
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

        <FormField label={t('day_trip.passengers')} required error={errors.passengers}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="number"
              min={1}
              max={50}
              required
              inputMode="numeric"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.passengers}
              onChange={(e) => set('passengers', e.target.value)}
            />
          )}
        </FormField>
      </div>

      <FormField
        label={t('day_trip.pickup_from')}
        required
        error={errors.pickup_from}
        helpText={t('day_trip.pickup_from_help')}
      >
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            type="text"
            required
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={inputClass}
            placeholder={t('day_trip.pickup_from_placeholder')}
            value={state.pickup_from}
            onChange={(e) => set('pickup_from', e.target.value)}
          />
        )}
      </FormField>

      {departureTimes.length > 0 && (
        <FormField
          label={t('day_trip.departure_time')}
          error={errors.travel_time}
          helpText={t('day_trip.departure_time_help')}
        >
          {({ id, describedBy, invalid }) => (
            <select
              id={id}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.travel_time}
              onChange={(e) => set('travel_time', e.target.value)}
            >
              <option value="">{t('day_trip.departure_time_any')}</option>
              {departureTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          )}
        </FormField>
      )}

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
