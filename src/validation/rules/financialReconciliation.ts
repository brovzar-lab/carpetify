/**
 * VALD-01: Financial Reconciliation
 * The "golden equation": budget total === cash flow total === esquema total.
 * Strict integer centavos comparison -- no tolerance, no rounding.
 */
import type { ValidationResult } from '../types'

export function validateFinancialReconciliation(
  budgetTotalCentavos: number | undefined,
  cashFlowTotalCentavos: number | undefined,
  esquemaTotalCentavos: number | undefined,
): ValidationResult {
  const base = {
    ruleId: 'VALD-01',
    ruleName: 'Conciliacion financiera',
    severity: 'blocker' as const,
    navigateTo: { screen: 'financiera' as const },
  }

  if (
    budgetTotalCentavos === undefined &&
    cashFlowTotalCentavos === undefined &&
    esquemaTotalCentavos === undefined
  ) {
    return {
      ...base,
      status: 'skip',
      message:
        'Genera el presupuesto, flujo de efectivo y esquema financiero para evaluar.',
    }
  }

  const mismatches: string[] = []

  if (
    budgetTotalCentavos !== undefined &&
    cashFlowTotalCentavos !== undefined &&
    budgetTotalCentavos !== cashFlowTotalCentavos
  ) {
    mismatches.push(
      `Presupuesto (${budgetTotalCentavos}) != Flujo de efectivo (${cashFlowTotalCentavos})`,
    )
  }

  if (
    budgetTotalCentavos !== undefined &&
    esquemaTotalCentavos !== undefined &&
    budgetTotalCentavos !== esquemaTotalCentavos
  ) {
    mismatches.push(
      `Presupuesto (${budgetTotalCentavos}) != Esquema financiero (${esquemaTotalCentavos})`,
    )
  }

  if (mismatches.length > 0) {
    return {
      ...base,
      status: 'fail',
      message: `Los totales financieros no coinciden: ${mismatches.join('; ')}.`,
      details: mismatches,
    }
  }

  return {
    ...base,
    status: 'pass',
    message: 'Presupuesto = Flujo de efectivo = Esquema financiero.',
  }
}
