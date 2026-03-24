/**
 * VALD-10: Prohibited Expenditure
 * Scans cash flow line items for EFICINE-sourced funds
 * allocated to prohibited categories.
 * Only EFICINE-sourced funds matter; other sources are allowed.
 */
import type { ValidationResult } from '../types'
import { PROHIBITED_CATEGORIES } from '../constants'

interface CashFlowLineItem {
  category: string
  source: string
  amount: number
}

export function validateProhibitedExpenditure(
  cashFlowLineItems: CashFlowLineItem[] | undefined,
): ValidationResult {
  const base = {
    ruleId: 'VALD-10',
    ruleName: 'Gastos prohibidos',
    severity: 'blocker' as const,
    navigateTo: { screen: 'generacion' as const },
  }

  if (!cashFlowLineItems || cashFlowLineItems.length === 0) {
    return {
      ...base,
      status: 'skip',
      message: 'Genera el flujo de efectivo para evaluar gastos prohibidos.',
    }
  }

  const violations: string[] = []

  for (const item of cashFlowLineItems) {
    if (
      item.source === 'EFICINE' &&
      PROHIBITED_CATEGORIES.includes(item.category)
    ) {
      violations.push(`${item.category}: $${item.amount} con fondos EFICINE`)
    }
  }

  if (violations.length > 0) {
    return {
      ...base,
      status: 'fail',
      message: `Se detectaron gastos prohibidos con fondos EFICINE: ${violations.join('; ')}.`,
      details: violations,
    }
  }

  return {
    ...base,
    status: 'pass',
    message: 'No se detectaron gastos prohibidos con fondos EFICINE.',
  }
}
