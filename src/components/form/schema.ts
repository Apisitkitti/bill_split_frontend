import { z } from 'zod'
import { formatBaht, MAX_SATANG, parseBaht } from '../../lib/money'

/**
 * A baht amount, as the string the user typed.
 *
 * It stays a string all the way to the API — a JSON number is an IEEE 754
 * double and 1234.55 would arrive as 1234.5499999999999 — so this validates the
 * text and never coerces it to a number. Parsing goes through `parseBaht` and
 * nothing else: a second regex written here is how the form and the API end up
 * disagreeing about what a valid amount is.
 *
 * The checks are ordered so each failure carries its real reason. Collapsing
 * them into one message is how a user who typed `0` gets told their decimals
 * are wrong.
 */
export const bahtAmount = z.string().superRefine((raw, ctx) => {
  // superRefine rather than a chain of .refine: those do not short-circuit, so
  // "abc" would report both "not a number" and "must be greater than 0" — the
  // second derived from a parse that already failed. One pass, one reason.
  const trimmed = raw.trim()
  const fail = (message: string) =>
    ctx.addIssue({ code: 'custom', message })

  if (!trimmed) return fail('ใส่จำนวนเงิน')

  const satang = parseBaht(trimmed)
  // parseBaht enforces the upper bound itself, exactly as ParseBaht does on the
  // server, so malformed and too-large arrive here as the same `null`. The limit
  // is named in the message rather than re-tested here — a second comparison
  // against MAX_SATANG is the drift this import exists to prevent.
  if (satang === null) {
    return fail(
      `ใส่เป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง และไม่เกิน ฿${formatBaht(MAX_SATANG)}`,
    )
  }
  if (satang < 0) return fail('จำนวนเงินติดลบไม่ได้')
  if (satang === 0) return fail('จำนวนเงินต้องมากกว่า 0')
})

/** Everything a bill needs before it can be sent. */
export const billSchema = z.object({
  title: z.string().trim().min(1, 'ใส่ชื่อรายการก่อน'),
  total: bahtAmount,
  payerId: z.string().min(1),
  participants: z.array(z.string()).min(1, 'เลือกคนหารอย่างน้อย 1 คน'),
})

/**
 * The form's value type, derived from the schema rather than declared beside
 * it. One definition means the fields, their rules, and their type cannot drift
 * apart — adding a field to the schema is what adds it to the type.
 */
export type BillFormValues = z.infer<typeof billSchema>
