/**
 * VALD-03: Fee Cross-Match
 * Producer, director, and screenwriter fees must match across
 * contracts, budget, and cash flow (triple/quadruple match).
 * All comparisons in centavos.
 */
import type { ValidationResult } from '../types'

interface FeeSet {
  producerFeeCentavos?: number
  directorFeeCentavos?: number
  screenwriterFeeCentavos?: number
}

export function validateFeeCrossMatch(
  feesFromContracts: FeeSet | undefined,
  feesFromBudget: FeeSet | undefined,
  feesFromCashFlow: FeeSet | undefined,
): ValidationResult {
  const base = {
    ruleId: 'VALD-03',
    ruleName: 'Honorarios cruzados',
    severity: 'blocker' as const,
    navigateTo: { screen: 'equipo' as const, fieldId: 'honorarios' },
  }

  if (!feesFromContracts && !feesFromBudget && !feesFromCashFlow) {
    return {
      ...base,
      status: 'skip',
      message:
        'Genera los contratos y el presupuesto para evaluar los honorarios.',
    }
  }

  const mismatches: string[] = []

  const checkFee = (
    roleName: string,
    contract: number | undefined,
    budget: number | undefined,
    cashFlow: number | undefined,
  ) => {
    const values = [
      { label: 'contrato', value: contract },
      { label: 'presupuesto', value: budget },
      { label: 'flujo', value: cashFlow },
    ].filter((v) => v.value !== undefined)

    if (values.length < 2) return

    const firstValue = values[0].value!
    for (let i = 1; i < values.length; i++) {
      if (values[i].value !== firstValue) {
        const details = values
          .map((v) => `${v.label}: ${v.value}`)
          .join(', ')
        mismatches.push(`${roleName}: ${details}`)
        return
      }
    }
  }

  checkFee(
    'Productor',
    feesFromContracts?.producerFeeCentavos,
    feesFromBudget?.producerFeeCentavos,
    feesFromCashFlow?.producerFeeCentavos,
  )

  checkFee(
    'Director',
    feesFromContracts?.directorFeeCentavos,
    feesFromBudget?.directorFeeCentavos,
    feesFromCashFlow?.directorFeeCentavos,
  )

  checkFee(
    'Guionista',
    feesFromContracts?.screenwriterFeeCentavos,
    feesFromBudget?.screenwriterFeeCentavos,
    feesFromCashFlow?.screenwriterFeeCentavos,
  )

  if (mismatches.length > 0) {
    return {
      ...base,
      status: 'fail',
      message: `Los honorarios no coinciden: ${mismatches.join('; ')}.`,
      details: mismatches,
    }
  }

  return {
    ...base,
    status: 'pass',
    message:
      'Honorarios de productor, director y guionista coinciden en contratos, presupuesto y flujo.',
  }
}
