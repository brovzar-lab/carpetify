/**
 * VALD-04: Date Compliance
 * All supporting documents must have issue dates no more than 90 days
 * before the registration period close date.
 * Uses differenceInCalendarDays from date-fns.
 */
import { differenceInCalendarDays } from 'date-fns'
import type { ValidationResult } from '../types'

interface DateDoc {
  tipo: string
  fecha_emision?: Date
}

export function validateDateCompliance(
  docs: DateDoc[],
  registrationCloseDate: Date,
): ValidationResult {
  const base = {
    ruleId: 'VALD-04',
    ruleName: 'Vigencia de documentos',
    severity: 'blocker' as const,
    navigateTo: { screen: 'documentos' as const },
  }

  const docsWithDates = docs.filter((d) => d.fecha_emision !== undefined)

  if (docsWithDates.length === 0) {
    return {
      ...base,
      status: 'skip',
      message: 'No hay documentos cargados con fecha de emision.',
    }
  }

  const expired: string[] = []

  for (const doc of docsWithDates) {
    const daysDiff = differenceInCalendarDays(
      registrationCloseDate,
      doc.fecha_emision!,
    )
    if (daysDiff > 90) {
      expired.push(`${doc.tipo}: ${daysDiff} dias`)
    }
  }

  if (expired.length > 0) {
    return {
      ...base,
      status: 'fail',
      message: `${expired.length} documento(s) exceden el plazo de 90 dias: ${expired.join(', ')}.`,
      details: expired,
    }
  }

  return {
    ...base,
    status: 'pass',
    message: 'Todos los documentos estan dentro del plazo de 90 dias.',
  }
}
