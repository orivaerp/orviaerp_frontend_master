/**
 * The number to dial for a stored phone value: digits only, leading zeros dropped,
 * and — when there are more than 10 digits (country code / trunk prefix) — just the
 * last 10.
 *
 *   "+91 91557 72255"  -> "9155772255"
 *   "09155772255"      -> "9155772255"
 *   "0091-9155772255"  -> "9155772255"
 *
 * Shorter numbers (e.g. a landline typed without the full code) are left as they are.
 * Returns '' when there are no usable digits, so callers can hide the button.
 */
export function dialNumber(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '').replace(/^0+/, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/** href for a Call button, or null when the value has no usable digits. */
export function telHref(raw: string | null | undefined): string | null {
  const number = dialNumber(raw);
  return number ? `tel:${number}` : null;
}
