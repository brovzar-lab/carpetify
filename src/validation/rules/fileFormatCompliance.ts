/**
 * VALD-09: File Format Compliance
 * Validates output files against IMCINE requirements:
 * - PDF format
 * - Max 40 MB
 * - Filename max 15 chars (before .pdf)
 * - ASCII only (no accents, n-tilde, commas, &, spaces)
 * Regex: /^[A-Za-z0-9_]{1,15}\.pdf$/
 */
import type { ValidationResult } from '../types'

const VALID_FILENAME_REGEX = /^[A-Za-z0-9_]{1,15}\.pdf$/
const MAX_SIZE_MB = 40

export function validateFileFormatCompliance(
  outputFiles: Array<{ name: string; format: string; sizeMB: number }>,
): ValidationResult {
  const base = {
    ruleId: 'VALD-09',
    ruleName: 'Formato de archivos',
    severity: 'blocker' as const,
    navigateTo: { screen: 'documentos' as const },
  }

  if (outputFiles.length === 0) {
    return {
      ...base,
      status: 'skip',
      message:
        'No hay archivos de salida para validar. Se evaluara al exportar.',
    }
  }

  const violations: string[] = []

  for (const file of outputFiles) {
    if (!VALID_FILENAME_REGEX.test(file.name)) {
      violations.push(
        `${file.name}: nombre no cumple formato (maximo 15 caracteres, solo A-Z, 0-9, _)`,
      )
    }

    if (file.sizeMB > MAX_SIZE_MB) {
      violations.push(
        `${file.name}: excede ${MAX_SIZE_MB} MB (${file.sizeMB} MB)`,
      )
    }
  }

  if (violations.length > 0) {
    return {
      ...base,
      status: 'fail',
      message: `${violations.length} archivo(s) no cumplen los requisitos de formato: ${violations.join('; ')}.`,
      details: violations,
    }
  }

  return {
    ...base,
    status: 'pass',
    message: 'Todos los archivos cumplen formato PDF, tamano y nomenclatura.',
  }
}
