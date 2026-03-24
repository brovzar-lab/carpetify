/**
 * VALD-06: Document Completeness
 * Checks that every required EFICINE document (sections A-E)
 * is present in either generated or uploaded documents.
 * Conditional docs (E2, E3, E4) only required when conditions are met.
 */
import type { ValidationResult } from '../types'
import { REQUIRED_DOCUMENTS } from '../constants'

export function validateDocumentCompleteness(
  generatedDocIds: string[],
  uploadedDocTypes: string[],
  conditions: Record<string, boolean>,
): ValidationResult {
  const base = {
    ruleId: 'VALD-06',
    ruleName: 'Completitud de documentos',
    severity: 'blocker' as const,
    navigateTo: { screen: 'documentos' as const },
  }

  const allPresentIds = new Set([...generatedDocIds, ...uploadedDocTypes])
  const missing: string[] = []

  for (const [docId, entry] of Object.entries(REQUIRED_DOCUMENTS)) {
    // Skip conditional docs unless condition is met
    if (entry.conditional && entry.conditionField) {
      if (!conditions[entry.conditionField]) {
        continue
      }
    }

    if (!allPresentIds.has(docId)) {
      missing.push(`${docId}: ${entry.label}`)
    }
  }

  if (missing.length > 0) {
    return {
      ...base,
      status: 'fail',
      message: `Faltan ${missing.length} documento(s) requerido(s): ${missing.join(', ')}.`,
      details: missing,
    }
  }

  return {
    ...base,
    status: 'pass',
    message: 'Todos los documentos requeridos (Secciones A-E) estan presentes.',
  }
}
