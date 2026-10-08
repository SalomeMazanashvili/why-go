'use client'

import { useId } from 'react'
import { NUMERIC_RULES, type NumericField } from '@/lib/numericFields'

// WHY-106: every admin number input. min/step come from the shared rules, so
// the browser refuses a negative or fractional value on submit (and says
// why); the server checks the same rules. The wheel guard stops a page
// scroll from silently changing a focused field, which is how a sort order
// drifted to -32. A server field error shows under the input, linked and
// announced.
export default function NumberField({
  field,
  label,
  value,
  onChange,
  error,
  help,
  step,
}: {
  field: NumericField
  label: string
  value: number | null | undefined
  onChange: (value: number | null) => void
  error?: string
  help?: string
  step?: string
}) {
  const rule = NUMERIC_RULES[field]
  const id = useId()
  const errorId = `${id}-error`
  const helpId = `${id}-help`
  const describedBy = [error ? errorId : null, help ? helpId : null].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <label className="admin-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode={rule.integer ? 'numeric' : 'decimal'}
        min={rule.min}
        step={step ?? (rule.integer ? '1' : 'any')}
        required={!rule.nullable}
        className="admin-input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        onWheel={(e) => e.currentTarget.blur()}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {help && <p id={helpId} className="text-[10px] text-white/40 mt-1">{help}</p>}
      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
}
