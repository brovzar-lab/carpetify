import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Format centavos as MXN currency string.
 * $X,XXX,XXX MXN -- comma thousands separator, no decimals, peso sign, MXN suffix.
 */
export function formatMXN(centavos: number): string {
  const pesos = Math.round(centavos / 100)
  return `$${pesos.toLocaleString('es-MX')} MXN`
}

/**
 * Parse an MXN-formatted string (or raw digits) back to centavos.
 * Strips $, commas, spaces, and "MXN", parses remaining digits as pesos,
 * returns value in centavos.
 */
export function parseMXNInput(input: string): number {
  const cleaned = input.replace(/[$,\sMXN]/g, '')
  const pesos = parseInt(cleaned, 10)
  if (isNaN(pesos)) return 0
  return pesos * 100
}

/**
 * Format a Date in Spanish: "15 de julio de 2026"
 * Accepts Date objects, Firestore Timestamps (with .toDate()), ISO strings, or epoch ms.
 */
export function formatDateES(date: unknown): string {
  let d: Date
  if (date instanceof Date) {
    d = date
  } else if (date && typeof date === 'object' && 'toDate' in date && typeof (date as { toDate: () => Date }).toDate === 'function') {
    d = (date as { toDate: () => Date }).toDate()
  } else if (typeof date === 'string') {
    d = new Date(date)
  } else if (typeof date === 'number') {
    d = new Date(date)
  } else {
    return '—'
  }
  if (isNaN(d.getTime())) return '—'
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es })
}

/**
 * Format a Date as month + year in Spanish: "agosto 2026" (lowercase)
 */
export function formatMonthYearES(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: es })
}
