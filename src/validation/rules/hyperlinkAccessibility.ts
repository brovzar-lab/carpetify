/**
 * VALD-12: Hyperlink Accessibility
 * Warning: Checks cached verification status of URLs in the project.
 * Does NOT make HTTP requests -- reads cached verification results from the UI.
 * Per D-12: verification happens client-side, this rule reads the cached result.
 */
import type { ValidationResult } from '../types'

export interface LinkCheckInput {
  url: string
  label: string
  verified: boolean
  accessible: boolean
}

export function validateHyperlinkAccessibility(
  links: LinkCheckInput[],
): ValidationResult {
  const base = {
    ruleId: 'VALD-12',
    ruleName: 'Accesibilidad de enlaces',
    severity: 'warning' as const,
    navigateTo: { screen: 'equipo' as const },
  }

  if (links.length === 0) {
    return {
      ...base,
      status: 'skip',
      message: 'No hay enlaces registrados para verificar.',
    }
  }

  const issues: string[] = []

  for (const link of links) {
    if (!link.verified) {
      issues.push(`${link.label} (${link.url}): no verificado`)
    } else if (!link.accessible) {
      issues.push(`${link.label} (${link.url}): no accesible`)
    }
  }

  if (issues.length > 0) {
    return {
      ...base,
      status: 'fail',
      message: `${issues.length} enlace(s) no son accesibles: ${issues.join('; ')}.`,
      details: issues,
    }
  }

  return {
    ...base,
    status: 'pass',
    message: 'Todos los enlaces son accesibles publicamente.',
  }
}
