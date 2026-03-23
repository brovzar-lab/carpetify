/**
 * Cash flow builder for FORMATO 3 (Flujo de Efectivo).
 * Distributes budget amounts across months based on typical
 * film production timeline (pre-production, production, post-production).
 *
 * Golden equation: cash flow grand total MUST equal budget grand total.
 * All arithmetic in centavos (integer).
 */

import type { BudgetOutput } from './budgetComputer.js';
import { formatMonthYearES } from '../shared/formatters.js';

export interface CashFlowRow {
  cuenta: string;
  amounts: number[];
}

export interface CashFlowOutput {
  /** Month labels in Spanish, e.g. ["enero 2026", "febrero 2026", ...] */
  months: string[];
  /** One row per budget account with amounts per month */
  rows: CashFlowRow[];
  /** Sum of each column (total per month) */
  columnTotals: number[];
  /** Grand total -- MUST equal budget.totalCentavos */
  grandTotal: number;
}

/**
 * Distribute budget by account across months using production timeline.
 *
 * ATL accounts (100-400): front-loaded in pre-production months
 * BTL accounts (500-900): concentrated in production months
 * General accounts (1000-1200): spread across all months
 *
 * @param budget - Computed budget output from budgetComputer
 * @param startMonth - Project start date (first month)
 * @param durationMonths - Total project duration in months
 */
export function buildCashFlow(
  budget: BudgetOutput,
  startMonth: Date,
  durationMonths: number,
): CashFlowOutput {
  // Generate month labels
  const months: string[] = [];
  for (let i = 0; i < durationMonths; i++) {
    const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
    months.push(formatMonthYearES(monthDate));
  }

  // Define phase boundaries (as fraction of total duration)
  const preproEnd = Math.max(1, Math.floor(durationMonths * 0.25)); // First 25%
  const prodEnd = Math.max(preproEnd + 1, Math.floor(durationMonths * 0.60)); // Next 35%
  // Post-production: remaining months

  const rows: CashFlowRow[] = [];

  for (const cuenta of budget.cuentas) {
    const amounts = new Array(durationMonths).fill(0) as number[];

    if (cuenta.subtotalCentavos === 0) {
      rows.push({ cuenta: `${cuenta.numeroCuenta} - ${cuenta.nombreCuenta}`, amounts });
      continue;
    }

    // Determine distribution pattern based on account type
    if (cuenta.numeroCuenta <= 400) {
      // ATL: front-loaded in pre-production
      distributeOverRange(amounts, cuenta.subtotalCentavos, 0, preproEnd);
    } else if (cuenta.numeroCuenta <= 800) {
      // BTL production: concentrated in production months
      distributeOverRange(amounts, cuenta.subtotalCentavos, preproEnd, prodEnd);
    } else if (cuenta.numeroCuenta === 900) {
      // Post-production: back-loaded
      distributeOverRange(amounts, cuenta.subtotalCentavos, prodEnd, durationMonths);
    } else {
      // General (1000-1200): spread evenly
      distributeOverRange(amounts, cuenta.subtotalCentavos, 0, durationMonths);
    }

    rows.push({
      cuenta: `${cuenta.numeroCuenta} - ${cuenta.nombreCuenta}`,
      amounts,
    });
  }

  // Calculate column totals
  const columnTotals = new Array(durationMonths).fill(0) as number[];
  for (const row of rows) {
    for (let i = 0; i < durationMonths; i++) {
      columnTotals[i] += row.amounts[i];
    }
  }

  const grandTotal = columnTotals.reduce((sum, v) => sum + v, 0);

  return { months, rows, columnTotals, grandTotal };
}

/**
 * Distribute a total amount evenly across a range of months.
 * Uses integer division with remainder distributed to first months.
 * Guarantees sum of amounts in range equals total exactly.
 */
function distributeOverRange(
  amounts: number[],
  total: number,
  startIdx: number,
  endIdx: number,
): void {
  const monthCount = endIdx - startIdx;
  if (monthCount <= 0) return;

  const perMonth = Math.floor(total / monthCount);
  const remainder = total - perMonth * monthCount;

  for (let i = startIdx; i < endIdx; i++) {
    amounts[i] = perMonth + (i - startIdx < remainder ? 1 : 0);
  }
}
