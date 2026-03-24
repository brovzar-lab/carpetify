/**
 * VALD-17: Document Expiration
 * Warning when approaching expiry, BLOCKER when expired.
 * Checks EXPIRABLE_DOC_TYPES against 90-day window relative to period close date.
 * Uses differenceInCalendarDays from date-fns.
 *
 * Severity is dynamic:
 * - 'warning' when docs are approaching expiry but none expired
 * - 'blocker' when any doc is expired (per D-17: "Expired = strict blocker, no dismissal")
 */
import { differenceInCalendarDays } from 'date-fns'
import type { ValidationResult } from '../types'
import { EXPIRABLE_DOC_TYPES } from '../constants'
import { PERIODOS_EFICINE } from '@/lib/constants'

type PeriodoKey = keyof typeof PERIODOS_EFICINE

interface ExpirationDocInput {
  tipo: string
  fecha_emision?: Date
}

export interface DocExpirationStatus {
  tipo: string
  daysRemaining: number
  status: 'vigente' | 'proximo' | 'critico' | 'vencido'
}

export function validateDocumentExpiration(
  docs: ExpirationDocInput[],
  periodoRegistro: string,
): ValidationResult {
  const base = {
    ruleId: 'VALD-17',
    ruleName: 'Vigencia de documentos cargados',
    navigateTo: { screen: 'documentos' as const },
  }

  const periodo = PERIODOS_EFICINE[periodoRegistro as PeriodoKey]
  const closeDate = periodo ? new Date(periodo.close) : new Date()

  // Filter to only expirable doc types with emission dates
  const expirableDocs = docs.filter(
    (d) => EXPIRABLE_DOC_TYPES.includes(d.tipo) && d.fecha_emision,
  )

  if (expirableDocs.length === 0) {
    return {
      ...base,
      severity: 'warning',
      status: 'skip',
      message:
        'No hay documentos con fecha de emision para evaluar vigencia.',
    }
  }

  const docStatuses: DocExpirationStatus[] = []
  let hasExpired = false

  for (const doc of expirableDocs) {
    const daysDiff = differenceInCalendarDays(closeDate, doc.fecha_emision!)
    const daysRemaining = 90 - daysDiff

    let status: DocExpirationStatus['status']
    if (daysRemaining < 0) {
      status = 'vencido'
      hasExpired = true
    } else if (daysRemaining <= 14) {
      status = 'critico'
    } else if (daysRemaining <= 30) {
      status = 'proximo'
    } else {
      status = 'vigente'
    }

    docStatuses.push({
      tipo: doc.tipo,
      daysRemaining,
      status,
    })
  }

  // Dynamic severity: blocker if any expired, warning otherwise
  const severity = hasExpired ? 'blocker' : 'warning'

  const nonVigenteDocs = docStatuses.filter((d) => d.status !== 'vigente')

  if (nonVigenteDocs.length > 0) {
    const details = nonVigenteDocs.map((d) => {
      if (d.status === 'vencido') {
        return `${d.tipo}: Vencido (${Math.abs(d.daysRemaining)} dias excedidos)`
      }
      if (d.status === 'critico') {
        return `${d.tipo}: Vence pronto (${d.daysRemaining} dias restantes)`
      }
      return `${d.tipo}: Proximo a vencer (${d.daysRemaining} dias restantes)`
    })

    return {
      ...base,
      severity,
      status: 'fail',
      message: `${nonVigenteDocs.length} documento(s) vencido(s) o proximo(s) a vencer: ${details.join('; ')}.`,
      details,
      metadata: {
        documents: docStatuses,
      },
    }
  }

  return {
    ...base,
    severity: 'warning',
    status: 'pass',
    message: 'Todos los documentos cargados estan vigentes.',
    metadata: {
      documents: docStatuses,
    },
  }
}
