// WHY-106: one set of rules for every numeric column the admin writes, used
// by the /api/admin handlers (the check that matters) and by the admin
// NumberField (min/step, so the browser blocks bad input before submit).
// No Supabase import: the admin forms are client components.
//
// The test transfer route went live with duration_minutes = -40 and a new
// service's sort order showed -32: number inputs had no min, and
// Number(v) || 0 accepted anything a scroll wheel or arrow key produced.

export interface NumericRule {
  integer: boolean
  min: number
  // Empty input stores null. sort_order (default 0) and reading time
  // (default 5) are required.
  nullable: boolean
  label: string
  // Allowed increment for decimals, e.g. 0.5 for half-hour durations.
  step?: number
}

export const NUMERIC_RULES = {
  sort_order: { integer: true, min: 0, nullable: false, label: 'Sort order' },
  price_from: { integer: false, min: 0, nullable: true, label: 'Price' },
  duration_days: { integer: true, min: 1, nullable: true, label: 'Duration (days)' },
  duration_minutes: { integer: true, min: 1, nullable: true, label: 'Duration (minutes)' },
  // Half-hour steps: 0.5, 1, 1.5… Museum slots, cooking classes and wine
  // tours are often 1.5h. Matches services_duration_hours_half CHECK.
  duration_hours: { integer: false, min: 0.5, step: 0.5, nullable: true, label: 'Duration (hours)' },
  min_group_size: { integer: true, min: 1, nullable: true, label: 'Min group size' },
  max_group_size: { integer: true, min: 1, nullable: true, label: 'Max group size' },
  max_passengers: { integer: true, min: 1, nullable: true, label: 'Max passengers' },
  reading_time_min: { integer: true, min: 1, nullable: false, label: 'Reading time' },
} satisfies Record<string, NumericRule>

function offStep(n: number, step: number): boolean {
  const k = n / step
  return Math.abs(k - Math.round(k)) > 1e-9
}

export type NumericField = keyof typeof NUMERIC_RULES
export type FieldErrors = Partial<Record<string, string>>

function ruleMessage(rule: NumericRule): string {
  return rule.integer
    ? `${rule.label} must be a whole number of ${rule.min} or more.`
    : `${rule.label} must be ${rule.min} or more.`
}

// Validates and coerces, in place, every numeric field present in the
// payload (PUT bodies may be partial). Returns field errors, or null when
// everything is valid. Strings from JSON are accepted if they parse.
export function validateNumericFields(payload: Record<string, unknown>): FieldErrors | null {
  const errors: FieldErrors = {}
  for (const [field, rule] of Object.entries(NUMERIC_RULES) as [NumericField, NumericRule][]) {
    if (!(field in payload)) continue
    const raw = payload[field]
    if (raw === null || raw === undefined || raw === '') {
      if (rule.nullable) payload[field] = null
      else errors[field] = `${rule.label} is required.`
      continue
    }
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw.trim()) : NaN
    if (!Number.isFinite(n)) {
      errors[field] = `${rule.label} must be a number.`
    } else if ((rule.integer && !Number.isInteger(n)) || n < rule.min) {
      errors[field] = ruleMessage(rule)
    } else if ('step' in rule && rule.step && offStep(n, rule.step)) {
      errors[field] = `${rule.label} must be in steps of ${rule.step} (e.g. ${rule.step * 3}).`
    } else {
      payload[field] = n
    }
  }
  const lo = payload.min_group_size
  const hi = payload.max_group_size
  if (
    !errors.min_group_size && !errors.max_group_size &&
    typeof lo === 'number' && typeof hi === 'number' && lo > hi
  ) {
    errors.max_group_size = 'Max group size must be at least the min group size.'
  }
  return Object.keys(errors).length > 0 ? errors : null
}

// The 400 body every admin route returns for bad numbers. Forms read
// fieldErrors to mark the fields; error is the toast text.
export function numericErrorBody(fieldErrors: FieldErrors) {
  return { error: Object.values(fieldErrors).join(' '), fieldErrors }
}
