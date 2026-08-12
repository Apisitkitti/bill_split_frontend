/**
 * Amounts are integer satang here for the same reason they are on the server:
 * 0.1 + 0.2 !== 0.3 in JavaScript, and a bill splitter that loses satang loses
 * trust. Nothing in this file produces a fractional number.
 *
 * This mirrors money.go in the backend repo. The two are separate repos, so
 * nothing enforces that they agree — if ParseBaht changes there, change
 * parseBaht here in the same pull request, or the client will start accepting
 * amounts the API rejects.
 */
export type Satang = number

const SATANG_PER_BAHT = 100

/**
 * The largest amount `parseBaht` will accept — one billion baht, mirroring
 * money.MaxSatang in the backend repo.
 *
 * The bound lives here rather than in a form schema because it is a property of
 * parsing, exactly as it is on the server: without it a long digit run overflows
 * to Infinity, and every caller that skips the schema — a settlement field, the
 * `exact` split mode — would have to re-derive the same guard to avoid rendering
 * "฿In,fin,ity.NaN".
 */
export const MAX_SATANG: Satang = 100_000_000_000

/** MAX_SATANG in whole baht, checked before the multiply so it cannot overflow. */
const MAX_BAHT = MAX_SATANG / SATANG_PER_BAHT

/** Formats satang for display: 123456 becomes "1,234.56". */
export function formatBaht(satang: Satang): string {
  const negative = satang < 0
  const value = Math.abs(satang)
  const digits = Math.floor(value / SATANG_PER_BAHT).toString()
  const frac = (value % SATANG_PER_BAHT).toString().padStart(2, '0')

  // Separators are grouped by hand rather than via toLocaleString, mirroring
  // Satang.Format(). Intl in LINE's WebView is one more thing that can differ
  // by phone, and the grouping the API prints must not depend on the device.
  let whole = ''
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) whole += ','
    whole += digits[i]
  }

  return `${negative ? '-' : ''}${whole}.${frac}`
}

/**
 * Parses user input into satang, mirroring the server's ParseBaht so the client
 * rejects the same strings the API would. Returns null for anything malformed
 * or out of range rather than NaN or Infinity, which have a habit of surviving
 * several more operations before anyone notices.
 */
export function parseBaht(input: string): Satang | null {
  const trimmed = input.trim().replace(/,/g, '')
  if (!/^[+-]?(\d+(\.\d{1,2})?|\.\d{1,2})$/.test(trimmed)) return null

  const negative = trimmed.startsWith('-')
  const unsigned = trimmed.replace(/^[+-]/, '')
  const [whole = '0', frac = ''] = unsigned.split('.')

  // Bounded before the multiply, as ParseBaht does: a 300-digit run reaches
  // Number as Infinity, and Infinity * 100 is still Infinity.
  const baht = Number(whole || '0')
  if (baht > MAX_BAHT) return null

  const satang = baht * SATANG_PER_BAHT + Number(frac.padEnd(2, '0') || '0')
  // `>` not `>=`, matching the server's `total > MaxSatang`: exactly one billion
  // baht is an amount the API accepts, so the client must not reject it.
  if (satang > MAX_SATANG) return null

  return negative ? -satang : satang
}

/**
 * Renders satang as the plain string the API expects in request bodies —
 * no separators, always two decimals. Amounts cross the wire as strings
 * because a JSON number is an IEEE 754 double in every browser.
 */
export function toBahtString(satang: Satang): string {
  // Integer quotient and remainder, mirroring Satang.String(). A float divide
  // here would be the one floating-point operation in the file that exists to
  // keep floats away from money.
  const negative = satang < 0
  const value = Math.abs(satang)
  const baht = Math.floor(value / SATANG_PER_BAHT)
  const frac = (value % SATANG_PER_BAHT).toString().padStart(2, '0')
  return `${negative ? '-' : ''}${baht}.${frac}`
}
