/**
 * VALD-08: ERPI Eligibility
 * Checks ERPI eligibility based on:
 * - Unexhibited authorized projects (must be < 2)
 * - Submissions this period (must be <= 3)
 * - Project attempts (must be <= 3)
 */
import type { ValidationResult } from '../types'

interface ProyectoPrevioLike {
  titulo: string
  anio: number
  exhibido: boolean
  estatus: 'exhibido' | 'en_produccion' | 'no_exhibido'
  monto_recibido_centavos?: number
}

export function validateErpiEligibility(
  priorProjects: ProyectoPrevioLike[],
  submissionsThisPeriod: number,
  projectAttempts: number,
): ValidationResult {
  const base = {
    ruleId: 'VALD-08',
    ruleName: 'Elegibilidad ERPI',
    severity: 'blocker' as const,
    navigateTo: { screen: 'erpi' as const },
  }

  const issues: string[] = []

  // Count authorized but unexhibited projects
  const unexhibited = priorProjects.filter(
    (p) =>
      p.monto_recibido_centavos !== undefined &&
      p.monto_recibido_centavos > 0 &&
      !p.exhibido &&
      p.estatus !== 'exhibido',
  )

  if (unexhibited.length >= 2) {
    issues.push(
      `${unexhibited.length} proyecto(s) autorizados sin exhibir (maximo permitido: 1).`,
    )
  }

  if (submissionsThisPeriod > 3) {
    issues.push(
      `${submissionsThisPeriod} solicitudes en este periodo (maximo permitido: 3).`,
    )
  }

  if (projectAttempts > 3) {
    issues.push(
      `${projectAttempts} intentos para este proyecto (maximo permitido: 3).`,
    )
  }

  if (issues.length > 0) {
    return {
      ...base,
      status: 'fail',
      message: `La ERPI no es elegible: ${issues.join(' ')}`,
      details: issues,
    }
  }

  return {
    ...base,
    status: 'pass',
    message: 'La ERPI es elegible para esta convocatoria.',
  }
}
