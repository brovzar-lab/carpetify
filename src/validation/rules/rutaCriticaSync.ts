/**
 * VALD-11: Ruta Critica vs Flujo de Efectivo Sync
 * Warning: Checks that ruta critica stages align with cash flow spending periods.
 * For each stage, at least one month must overlap between timeline and spending.
 */
import type { ValidationResult } from '../types'

export interface StageMonths {
  etapa: string
  months: number[]
}

export function validateRutaCriticaSync(
  rutaCriticaStages: StageMonths[],
  cashFlowPeriods: StageMonths[],
): ValidationResult {
  const base = {
    ruleId: 'VALD-11',
    ruleName: 'Ruta critica vs flujo de efectivo',
    severity: 'warning' as const,
    navigateTo: { screen: 'generacion' as const },
  }

  if (rutaCriticaStages.length === 0 || cashFlowPeriods.length === 0) {
    return {
      ...base,
      status: 'skip',
      message:
        'Genera la ruta critica y el flujo de efectivo para evaluar.',
    }
  }

  const mismatches: string[] = []

  for (const stage of rutaCriticaStages) {
    const cashFlowStage = cashFlowPeriods.find(
      (cf) => cf.etapa === stage.etapa,
    )

    if (!cashFlowStage) {
      mismatches.push(
        `${stage.etapa}: no encontrada en flujo de efectivo`,
      )
      continue
    }

    const rutaMonthsSet = new Set(stage.months)
    const hasOverlap = cashFlowStage.months.some((m) =>
      rutaMonthsSet.has(m),
    )

    if (!hasOverlap) {
      mismatches.push(
        `${stage.etapa}: meses ${stage.months.join(', ')} (ruta) vs ${cashFlowStage.months.join(', ')} (flujo)`,
      )
    }
  }

  if (mismatches.length > 0) {
    return {
      ...base,
      status: 'fail',
      message: `${mismatches.length} etapa(s) no coinciden entre ruta critica y flujo: ${mismatches.join('; ')}.`,
      details: mismatches,
    }
  }

  return {
    ...base,
    status: 'pass',
    message: 'La ruta critica y el flujo de efectivo estan alineados.',
  }
}
