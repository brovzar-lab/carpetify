/**
 * Server-side formatters for currency, dates, and legal amounts.
 * Mirrors src/lib/format.ts for frontend but runs in Cloud Functions (Node).
 * All monetary values stored and computed as centavos (integer arithmetic).
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Format centavos as MXN currency string.
 * $X,XXX,XXX MXN -- comma thousands separator, no decimals, peso sign, MXN suffix.
 */
export function formatMXN(centavos: number): string {
  const pesos = Math.round(centavos / 100);
  return `$${pesos.toLocaleString('es-MX')} MXN`;
}

/**
 * Format centavos as legal MXN amount for contracts.
 * Returns: "$500,000.00 (quinientos mil pesos 00/100 M.N.)"
 */
export function formatMXNLegal(centavos: number): string {
  const pesos = Math.round(centavos / 100);
  const formattedAmount = pesos.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const words = numberToSpanishWords(pesos);
  return `$${formattedAmount} (${words} pesos 00/100 M.N.)`;
}

/**
 * Format a Date in Spanish: "15 de julio de 2026"
 */
export function formatDateES(date: Date): string {
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Format a Date as month + year in Spanish: "agosto 2026" (lowercase)
 */
export function formatMonthYearES(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: es });
}

// ---- Number to Spanish words (simplified for legal amounts) ----

const UNIDADES = [
  '', 'un', 'dos', 'tres', 'cuatro', 'cinco',
  'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince',
  'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiun', 'veintidos', 'veintitres', 'veinticuatro',
  'veinticinco', 'veintiseis', 'veintisiete', 'veintiocho', 'veintinueve',
];

const DECENAS = [
  '', '', '', 'treinta', 'cuarenta', 'cincuenta',
  'sesenta', 'setenta', 'ochenta', 'noventa',
];

const CENTENAS = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos',
];

function numberToSpanishWords(n: number): string {
  if (n === 0) return 'cero';
  if (n === 100) return 'cien';

  let result = '';

  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000);
    if (millions === 1) {
      result += 'un millon ';
    } else {
      result += numberToSpanishWords(millions) + ' millones ';
    }
    n = n % 1000000;
  }

  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    if (thousands === 1) {
      result += 'mil ';
    } else {
      result += numberToSpanishWords(thousands) + ' mil ';
    }
    n = n % 1000;
  }

  if (n >= 100) {
    if (n === 100) {
      result += 'cien';
      return result.trim();
    }
    result += CENTENAS[Math.floor(n / 100)] + ' ';
    n = n % 100;
  }

  if (n >= 30) {
    result += DECENAS[Math.floor(n / 10)];
    if (n % 10 > 0) {
      result += ' y ' + UNIDADES[n % 10];
    }
  } else if (n > 0) {
    result += UNIDADES[n];
  }

  return result.trim();
}
