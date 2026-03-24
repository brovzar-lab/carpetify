/**
 * VALD-02: Title Consistency
 * The project title must be character-identical across all documents.
 * Normalizes whitespace and unicode NFC before comparison.
 */
import type { ValidationResult } from '../types'

function normalizeTitle(title: string): string {
  return title.normalize('NFC').replace(/\s+/g, ' ').trim()
}

export function validateTitleConsistency(
  projectTitle: string,
  generatedDocs: Array<{ docId: string; title?: string }>,
  uploadedDocs: Array<{ tipo: string; title?: string }>,
): ValidationResult {
  const base = {
    ruleId: 'VALD-02',
    ruleName: 'Consistencia del titulo',
    severity: 'blocker' as const,
    navigateTo: { screen: 'datos' as const, fieldId: 'titulo_proyecto' },
  }

  if (!projectTitle || projectTitle.trim() === '') {
    return {
      ...base,
      status: 'skip',
      message: 'No se ha definido el titulo del proyecto.',
    }
  }

  const normalizedProject = normalizeTitle(projectTitle)
  const mismatches: string[] = []

  for (const doc of generatedDocs) {
    if (doc.title !== undefined) {
      const normalizedDoc = normalizeTitle(doc.title)
      if (normalizedDoc !== normalizedProject) {
        mismatches.push(`${doc.docId}: "${doc.title}"`)
      }
    }
  }

  for (const doc of uploadedDocs) {
    if (doc.title !== undefined) {
      const normalizedDoc = normalizeTitle(doc.title)
      if (normalizedDoc !== normalizedProject) {
        mismatches.push(`${doc.tipo}: "${doc.title}"`)
      }
    }
  }

  if (mismatches.length > 0) {
    return {
      ...base,
      status: 'fail',
      message: `El titulo no coincide en ${mismatches.length} documento(s): ${mismatches.join(', ')}.`,
      details: mismatches,
    }
  }

  return {
    ...base,
    status: 'pass',
    message: 'El titulo es identico en todos los documentos.',
  }
}
