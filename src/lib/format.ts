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
 */
export function formatDateES(date: Date): string {
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es })
}

/**
 * Format a Date as month + year in Spanish: "agosto 2026" (lowercase)
 */
export function formatMonthYearES(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: es })
}
