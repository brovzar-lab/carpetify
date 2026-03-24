/**
 * VALD-05: EFICINE Compliance
 * Wraps existing calculateCompliance from useCompliance.ts.
 * Converts ComplianceResult violations to a single ValidationResult.
 */
import { calculateCompliance } from '@/hooks/useCompliance'
import type { ValidationResult } from '../types'

export function validateEficineCompliance(
  totalBudgetCentavos: number,
  erpiCashCentavos: number,
  erpiInkindCentavos: number,
  thirdPartyCentavos: number,
  eficineCentavos: number,
  otherFederalCentavos: number,
  screenwriterFeeCentavos: number,
  totalInkindHonorariosCentavos: number,
  gestorFeeCentavos: number,
): ValidationResult {
  const base = {
    ruleId: 'VALD-05',
    ruleName: 'Cumplimiento EFICINE',
    severity: 'blocker' as const,
    navigateTo: { screen: 'financiera' as const },
  }

  if (totalBudgetCentavos === 0) {
    return {
      ...base,
      status: 'skip',
      message: 'Completa la estructura financiera para evaluar.',
    }
  }

  const result = calculateCompliance(
    totalBudgetCentavos,
    erpiCashCentavos,
    erpiInkindCentavos,
    thirdPartyCentavos,
    eficineCentavos,
    otherFederalCentavos,
    screenwriterFeeCentavos,
    totalInkindHonorariosCentavos,
    gestorFeeCentavos,
  )

  if (result.violations.length === 0) {
    return {
      ...base,
      status: 'pass',
      message: 'Todos los porcentajes EFICINE cumplen los limites.',
    }
  }

  const details = result.violations.map((v) => v.message)

  return {
    ...base,
    status: 'fail',
    message: `${result.violations.length} regla(s) EFICINE incumplida(s): ${details.join('; ')}.`,
    details,
  }
}
