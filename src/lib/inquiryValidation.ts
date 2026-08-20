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

export const transactionalInquirySchema = z.object({
  service_type: z.enum(['transfer', 'day_trip']),
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

export const consultativeInquirySchema = z.object({
  service_type: z.enum(['guide', 'experience']),
  service_id: uuidOrNull,
  destination_id: z.string().uuid('error_required'),
  travel_date: z.string().trim().optional().or(z.literal('')),
  travel_time: z.string().trim().optional().or(z.literal('')),
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

// Discriminated union used by the API to pick the right schema based on
// the incoming service_type without duplicating the branch logic.
export function validateInquiryPayload(body: unknown) {
  if (typeof body !== 'object' || body === null) {
    return { ok: false as const, error: 'Invalid body' }
  }
  const serviceType = (body as { service_type?: string }).service_type
  if (serviceType === 'transfer' || serviceType === 'day_trip') {
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
