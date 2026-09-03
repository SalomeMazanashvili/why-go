'use client'

import { useCallback, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { FormField, inputClass, buttonClass } from './FormField'
import { TurnstileWidget } from './TurnstileWidget'
import { transferInquirySchema } from '@/lib/inquiryValidation'
import type { Destination, Locale, PickupPoint } from '@/types'

// Pick the destination / pickup-point label that matches the active form
// locale. Falls back to the other language if the localized value is empty
// (e.g. destination.name_ka not yet written) so the dropdown never renders
// an empty option.
function destName(d: Destination, l: Locale) {
  return l === 'ka' ? (d.name_ka || d.name_en) : (d.name_en || d.name_ka)
}
function pointLabelFor(p: PickupPoint, l: Locale) {
  return l === 'ka' ? (p.label_ka || p.label_en) : (p.label_en || p.label_ka)
}

// Sentinel select values.
//   ''            — nothing selected
//   '__other__'   — customer picked "Other, tell us where" → reveal free-text
//   <UUID>        — a real pickup_points.id
const OTHER = '__other__'

interface Props {
  pickupPoints: PickupPoint[]
  destinations: Destination[]
  // Optional: preselect a pickup point when the form is embedded on a route
  // page. Route pages deep-link into /transfers with the pickup pre-selected
  // (WHY-68 route-page follow-up).
  initialPickupPointId?: string | null
}

type FormState = {
  pickup_point_id: string
  pickup_from: string
  pickup_to: string
  travel_date: string
  travel_time: string
  passengers: string
  luggage_pieces: string
  payment_method: 'cash' | 'iban'
  flight_number: string
  return_enabled: boolean
  return_pickup_point_id: string
  return_date: string
  return_time: string
  return_pickup_from: string
  return_pickup_to: string
  name: string
  phone: string
  email: string
  notes: string
}

function emptyState(initialPickupPointId?: string | null): FormState {
  return {
    pickup_point_id: initialPickupPointId ?? '',
    pickup_from: '',
    pickup_to: '',
    travel_date: '',
    travel_time: '',
    passengers: '1',
    luggage_pieces: '0',
    payment_method: 'cash',
    flight_number: '',
    return_enabled: false,
    return_pickup_point_id: '',
    return_date: '',
    return_time: '',
    return_pickup_from: '',
    return_pickup_to: '',
    name: '',
    phone: '',
    email: '',
    notes: '',
  }
}

// Group pickup points by origin destination so the select renders one
// <optgroup> per contracted city. Alphabetical within each group so the
// option order is stable regardless of insertion order. Locale-aware
// labelling so the active form language matches the option text.
function groupPointsByOrigin(
  points: PickupPoint[],
  destinations: Destination[],
  locale: Locale,
) {
  const nameById = new Map(destinations.map((d) => [d.id, destName(d, locale)]))
  const groups = new Map<string, { label: string; points: PickupPoint[] }>()
  for (const p of points) {
    const label = nameById.get(p.destination_id) ?? 'Other'
    const existing = groups.get(p.destination_id)
    if (existing) existing.points.push(p)
    else groups.set(p.destination_id, { label, points: [p] })
  }
  for (const g of groups.values()) {
    g.points.sort((a, b) => (a.sort_order - b.sort_order) || a.label_en.localeCompare(b.label_en))
  }
  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label))
}

export function TransferInquiryForm({ pickupPoints, destinations, initialPickupPointId }: Props) {
  const t = useTranslations('inquiry')
  const locale = useLocale() as Locale
  const errorLabels: Record<string, string> = {
    error_required: t('shared.error_required'),
    error_phone_format: t('shared.error_phone_format'),
    error_email_format: t('shared.error_email_format'),
  }

  const [state, setState] = useState<FormState>(() => emptyState(initialPickupPointId))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const pointGroups = useMemo(
    () => groupPointsByOrigin(pickupPoints, destinations, locale),
    [pickupPoints, destinations, locale],
  )

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const handleTurnstileToken = useCallback((token: string | null) => {
    setTurnstileToken(token)
  }, [])

  // Toggling return on auto-fills the return "From" with whatever was typed
  // as the outbound "To". Auto-fill runs only when return_pickup_from is
  // empty so re-opening the toggle doesn't overwrite an edit. Toggling off
  // wipes every return field to prevent a hidden partially-filled leg from
  // sneaking into the payload.
  const toggleReturn = (enabled: boolean) => {
    if (!enabled) {
      setState((prev) => ({
        ...prev,
        return_enabled: false,
        return_pickup_point_id: '',
        return_date: '',
        return_time: '',
        return_pickup_from: '',
        return_pickup_to: '',
      }))
      return
    }
    setState((prev) => ({
      ...prev,
      return_enabled: true,
      return_pickup_from: prev.return_pickup_from || prev.pickup_to,
    }))
  }

  const outboundIsOther = state.pickup_point_id === OTHER
  const returnIsOther = state.return_pickup_point_id === OTHER

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const pickupPointIdOrNull =
      state.pickup_point_id && state.pickup_point_id !== OTHER ? state.pickup_point_id : null
    const returnPointIdOrNull =
      state.return_enabled &&
      state.return_pickup_point_id &&
      state.return_pickup_point_id !== OTHER
        ? state.return_pickup_point_id
        : null

    const payload = {
      service_type: 'transfer' as const,
      pickup_point_id: pickupPointIdOrNull,
      pickup_from: outboundIsOther ? state.pickup_from : '',
      pickup_to: state.pickup_to,
      travel_date: state.travel_date,
      travel_time: state.travel_time,
      passengers: state.passengers,
      luggage_pieces: state.luggage_pieces,
      payment_method: state.payment_method,
      flight_number: state.flight_number || undefined,
      return_pickup_point_id: state.return_enabled ? returnPointIdOrNull : null,
      return_date: state.return_enabled ? state.return_date : '',
      return_time: state.return_enabled ? state.return_time : '',
      return_pickup_from: state.return_enabled ? state.return_pickup_from : '',
      return_pickup_to: state.return_enabled && returnIsOther ? state.return_pickup_to : '',
      name: state.name,
      phone: state.phone,
      email: state.email,
      notes: state.notes,
      turnstile_token: turnstileToken || undefined,
    }

    const parsed = transferInquirySchema.safeParse(payload)
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
        setState(emptyState(initialPickupPointId))
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
      <h2 className="text-2xl font-black text-white">{t('transfer.heading')}</h2>

      <div
        role="alert"
        aria-live="assertive"
        className={`min-h-[1.5rem] text-sm ${formError ? 'text-red-400' : ''}`}
      >
        {formError}
      </div>

      {/* Outbound "From" — pickup point dropdown */}
      <FormField label={t('transfer.pickup_point')} required error={errors.pickup_point_id}>
        {({ id, describedBy, invalid }) => (
          <select
            id={id}
            required
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={inputClass}
            value={state.pickup_point_id}
            onChange={(e) => set('pickup_point_id', e.target.value)}
          >
            <option value="">— {t('transfer.pickup_placeholder')} —</option>
            {pointGroups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.points.map((p) => (
                  <option key={p.id} value={p.id}>
                    {pointLabelFor(p, locale)}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value={OTHER}>{t('transfer.pickup_other')}</option>
          </select>
        )}
      </FormField>

      {outboundIsOther && (
        <FormField label={t('transfer.pickup_from_other')} required error={errors.pickup_from}>
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
              placeholder={t('transfer.pickup_from_other_placeholder')}
            />
          )}
        </FormField>
      )}

      {/* Outbound "To" — always free-text hotel + address */}
      <FormField
        label={t('transfer.destination')}
        required
        error={errors.pickup_to}
        helpText={t('transfer.destination_help')}
      >
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
            placeholder={t('transfer.destination_placeholder')}
          />
        )}
      </FormField>

      {/* Date + time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <FormField label={t('transactional.travel_time')} required error={errors.travel_time}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="time"
              required
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={inputClass}
              value={state.travel_time}
              onChange={(e) => set('travel_time', e.target.value)}
            />
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Flight number — always visible + optional */}
      <FormField
        label={t('transfer.flight_number')}
        error={errors.flight_number}
        helpText={t('transfer.flight_number_help')}
      >
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            type="text"
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={inputClass}
            value={state.flight_number}
            onChange={(e) => set('flight_number', e.target.value.toUpperCase())}
            placeholder="e.g. LH1234"
            maxLength={20}
            autoComplete="off"
            spellCheck={false}
          />
        )}
      </FormField>

      {/* Payment method */}
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

      {/* Return journey toggle + fields */}
      <div className="border-t border-white/10 pt-6">
        <label className="flex items-center gap-3 min-h-11 cursor-pointer">
          <input
            type="checkbox"
            checked={state.return_enabled}
            onChange={(e) => toggleReturn(e.target.checked)}
            className="w-5 h-5 accent-[#FFCC00]"
          />
          <span className="text-white font-semibold">{t('transfer.return_toggle')}</span>
        </label>

        {state.return_enabled && (
          <div className="mt-6 space-y-6 pl-8 border-l-2 border-[#FFCC00]/30">
            {/* Return "From" — always free-text, auto-filled from outbound "To" */}
            <FormField
              label={t('transfer.return_from')}
              required
              error={errors.return_pickup_from}
              helpText={t('transfer.destination_help')}
            >
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="text"
                  required
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  className={inputClass}
                  value={state.return_pickup_from}
                  onChange={(e) => set('return_pickup_from', e.target.value)}
                  placeholder={t('transfer.destination_placeholder')}
                />
              )}
            </FormField>

            {/* Return "To" — pickup point dropdown (reversed direction) */}
            <FormField
              label={t('transfer.return_to')}
              required
              error={errors.return_pickup_point_id}
            >
              {({ id, describedBy, invalid }) => (
                <select
                  id={id}
                  required
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  className={inputClass}
                  value={state.return_pickup_point_id}
                  onChange={(e) => set('return_pickup_point_id', e.target.value)}
                >
                  <option value="">— {t('transfer.return_to_placeholder')} —</option>
                  {pointGroups.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.points.map((p) => (
                        <option key={p.id} value={p.id}>
                          {pointLabelFor(p, locale)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value={OTHER}>{t('transfer.pickup_other')}</option>
                </select>
              )}
            </FormField>

            {returnIsOther && (
              <FormField
                label={t('transfer.return_to_other')}
                required
                error={errors.return_pickup_to}
              >
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    type="text"
                    required
                    aria-invalid={invalid}
                    aria-describedby={describedBy}
                    className={inputClass}
                    value={state.return_pickup_to}
                    onChange={(e) => set('return_pickup_to', e.target.value)}
                  />
                )}
              </FormField>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={t('transfer.return_date')} required error={errors.return_date}>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    type="date"
                    required
                    aria-invalid={invalid}
                    aria-describedby={describedBy}
                    className={inputClass}
                    value={state.return_date}
                    onChange={(e) => set('return_date', e.target.value)}
                  />
                )}
              </FormField>
              <FormField label={t('transfer.return_time')} error={errors.return_time}>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    type="time"
                    aria-invalid={invalid}
                    aria-describedby={describedBy}
                    className={inputClass}
                    value={state.return_time}
                    onChange={(e) => set('return_time', e.target.value)}
                  />
                )}
              </FormField>
            </div>
          </div>
        )}
      </div>

      {/* Contact */}
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

      <p className="text-xs text-white/50 pt-2 border-t border-white/5">
        {t('transfer.not_covered')}
      </p>
    </form>
  )
}
