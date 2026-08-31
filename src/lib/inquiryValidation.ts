import { z } from 'zod'

// Georgians typically enter local numbers without the +995 country code
// (e.g. "551 71 03 03"). Accept lax input, normalize to E.164 in one place
// so admin views + WhatsApp wa.me links always get a valid international
// number regardless of how the customer typed it.
export function normalizePhone(input: string): string {
  const stripped = input.replace(/[\s\-().]/g, '')
  if (!stripped) return ''
  if (stripped.startsWith('+')) return stripped
  if (stripped.startsWith('995')) return '+' + stripped
  // Bare digit strings default to Georgian (+995) since the target audience
  // is Georgian travellers. Foreign customers must include the leading +.
  if (/^\d{7,15}$/.test(stripped)) return '+995' + stripped
  return input
}

const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => /^\+[0-9]{7,15}$/.test(v), { message: 'error_phone_format' })

const emailSchema = z
  .string()
  .trim()
  .email('error_email_format')
  .optional()
  .or(z.literal(''))

const nameSchema = z.string().trim().min(2, 'error_required')

// Nullable Supabase UUIDs from destination/service pickers.
const uuidOrNull = z.string().uuid().nullish().or(z.literal(''))

// Day-trip only. Transfers now use transferInquirySchema below (WHY-68).
// WHY-83 will retire this schema entirely in favour of dayTripInquirySchema.
export const transactionalInquirySchema = z.object({
  service_type: z.literal('day_trip'),
  service_id: uuidOrNull,
  destination_id: uuidOrNull,
  pickup_from: z.string().trim().min(1, 'error_required'),
  pickup_to: z.string().trim().min(1, 'error_required'),
  travel_date: z.string().trim().min(1, 'error_required'),
  travel_time: z.string().trim().optional().or(z.literal('')),
  passengers: z.coerce.number().int().min(1).max(50),
  luggage_pieces: z.coerce.number().int().min(0).max(50).optional(),
  payment_method: z.enum(['cash', 'iban']),
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  turnstile_token: z.string().optional(),
})

// WHY-68: transfer form. Route-driven with an "Other" free-text escape hatch,
// optional flight number, optional return leg stored inline (same row) with
// its own route_id, date, time, and free-text fallbacks. Server-side cross-
// field check ensures the outbound has either a route_id or both free-text
// endpoints — no way to submit "which city?" garbage.
export const transferInquirySchema = z
  .object({
    service_type: z.literal('transfer'),
    service_id: uuidOrNull,
    destination_id: uuidOrNull,
    route_id: uuidOrNull,
    pickup_from: z.string().trim().max(500).optional().or(z.literal('')),
    pickup_to: z.string().trim().max(500).optional().or(z.literal('')),
    travel_date: z.string().trim().min(1, 'error_required'),
    travel_time: z.string().trim().min(1, 'error_required'),
    passengers: z.coerce.number().int().min(1).max(50),
    luggage_pieces: z.coerce.number().int().min(0).max(50).optional(),
    payment_method: z.enum(['cash', 'iban']),
    flight_number: z.string().trim().max(20).optional().or(z.literal('')),
    return_route_id: uuidOrNull,
    return_date: z.string().trim().optional().or(z.literal('')),
    return_time: z.string().trim().optional().or(z.literal('')),
    return_pickup_from: z.string().trim().max(500).optional().or(z.literal('')),
    return_pickup_to: z.string().trim().max(500).optional().or(z.literal('')),
    name: nameSchema,
    phone: phoneSchema,
    email: emailSchema,
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
    turnstile_token: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasOutboundRoute = Boolean(data.route_id)
    const hasOutboundFreeText = Boolean(data.pickup_from) && Boolean(data.pickup_to)
    if (!hasOutboundRoute && !hasOutboundFreeText) {
      ctx.addIssue({
        code: 'custom',
        message: 'error_required',
        path: ['pickup_from'],
      })
    }
    // Return leg is optional. If any return field is set the customer
    // opened the toggle — enforce enough info to actually run the leg.
    const returnStarted =
      Boolean(data.return_route_id) ||
      Boolean(data.return_date) ||
      Boolean(data.return_pickup_from) ||
      Boolean(data.return_pickup_to)
    if (returnStarted) {
      if (!data.return_date) {
        ctx.addIssue({ code: 'custom', message: 'error_required', path: ['return_date'] })
      }
      const hasReturnRoute = Boolean(data.return_route_id)
      const hasReturnFreeText = Boolean(data.return_pickup_from) && Boolean(data.return_pickup_to)
      if (!hasReturnRoute && !hasReturnFreeText) {
        ctx.addIssue({
          code: 'custom',
          message: 'error_required',
          path: ['return_pickup_from'],
        })
      }
    }
  })

export const consultativeInquirySchema = z.object({
  service_type: z.enum(['guide', 'experience']),
  service_id: uuidOrNull,
  destination_id: z.string().uuid('error_required'),
  travel_date: z.string().trim().optional().or(z.literal('')),
  travel_date_end: z.string().trim().optional().or(z.literal('')),
  passengers: z.coerce.number().int().min(1).max(50).optional(),
  interests: z.array(z.string()).max(20).optional(),
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  notes: z.string().trim().min(1, 'error_required').max(2000),
  turnstile_token: z.string().optional(),
})

export type TransactionalInquiryPayload = z.infer<typeof transactionalInquirySchema>
export type ConsultativeInquiryPayload = z.infer<typeof consultativeInquirySchema>
export type TransferInquiryPayload = z.infer<typeof transferInquirySchema>

// Discriminated union used by the API to pick the right schema based on
// the incoming service_type without duplicating the branch logic.
export function validateInquiryPayload(body: unknown) {
  if (typeof body !== 'object' || body === null) {
    return { ok: false as const, error: 'Invalid body' }
  }
  const serviceType = (body as { service_type?: string }).service_type
  if (serviceType === 'transfer') {
    const parsed = transferInquirySchema.safeParse(body)
    return parsed.success
      ? { ok: true as const, kind: 'transfer' as const, data: parsed.data }
      : { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Invalid form' }
  }
  if (serviceType === 'day_trip') {
    const parsed = transactionalInquirySchema.safeParse(body)
    return parsed.success
      ? { ok: true as const, kind: 'transactional' as const, data: parsed.data }
      : { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Invalid form' }
  }
  if (serviceType === 'guide' || serviceType === 'experience') {
    const parsed = consultativeInquirySchema.safeParse(body)
    return parsed.success
      ? { ok: true as const, kind: 'consultative' as const, data: parsed.data }
      : { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Invalid form' }
  }
  return { ok: false as const, error: 'Unknown service_type' }
}
